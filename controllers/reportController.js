const prisma = require('../prisma/prismaClient');
const puppeteer = require("puppeteer");
const ejs = require("ejs");
const path = require("path");
const azureService = require('../services/azureService');
const chartService = require('../services/chartService');
const mappingService = require('../services/mappingService');

exports.exportDashboardPDF = async (req, res) => {
  try {
    const { dashboardId, fileId } = req.query;
    const { widgets: userWidgets } = req.body; // 🔥 NEW

    //////////////////////////////////////////////////////
    // 1. FETCH DATA
    //////////////////////////////////////////////////////
    const rawData = await prisma.dynamicData.findMany({
      where: { fileId }
    });

    let rows = rawData.map(d => d.rowData);

    if (!rows.length) {
      return res.status(400).json({ message: "No data available" });
    }

    //////////////////////////////////////////////////////
    // 2. APPLY MAPPING
    //////////////////////////////////////////////////////
    const mappings = await prisma.mapping.findMany({
      where: { fileId }
    });

    rows = require('../services/mappingService').applyMapping(rows, mappings);

    //////////////////////////////////////////////////////
    // 3. USE USER MODIFIED WIDGETS (IMPORTANT 🔥)
    //////////////////////////////////////////////////////
    let widgets;

    if (userWidgets && userWidgets.length > 0) {
      widgets = userWidgets; // ✅ USER VERSION
    } else {
      widgets = await prisma.widget.findMany({
        where: { dashboardId: Number(dashboardId) }
      });
    }

    //////////////////////////////////////////////////////
    // 4. BUILD CHARTS
    //////////////////////////////////////////////////////
    const charts = widgets.map(w => {
      let data = [];

      switch (w.type?.toUpperCase()) {

        case "KPI":
          data = chartService.calculateKPI(rows, w.config?.metrics || []);
          break;

        case "BAR":
        case "PIE":
          data = chartService.groupBy(
            rows,
            w.config?.xAxis,
            w.config?.yAxis
          );
          break;

        case "LINE":
          data = chartService.lineChart(
            rows,
            w.config?.xAxis,
            w.config?.metrics || []
          );
          break;

        case "TABLE":
          data = rows; // 🔥 TABLE SUPPORT
          break;

        default:
          data = [];
      }

      return {
        type: w.type,
        title: w.name,
        data
      };
    });

    //////////////////////////////////////////////////////
    // 5. SAVE SNAPSHOT (VERY IMPORTANT)
    //////////////////////////////////////////////////////
    await prisma.report.create({
      data: {
        dashboardId: Number(dashboardId),
        fileId,
        generatedBy: req.user.id,
        config: { widgets: userWidgets || [] },
        snapshot: charts
      }
    });

    //////////////////////////////////////////////////////
    // 6. RESPONSE
    //////////////////////////////////////////////////////
    res.json({
      message: "Report generated",
      charts
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.exportData = async (req, res) => {
  try {
    const { fileId } = req.body;

    const data = await prisma.dynamicData.findMany({
      where: { fileId }
    });

    const rows = data.map(d => d.rowData);

    if (!rows.length) {
      return res.status(400).json({ message: "No data found" });
    }

    const worksheet = xlsx.utils.json_to_sheet(rows);
    const workbook = xlsx.utils.book_new();

    xlsx.utils.book_append_sheet(workbook, worksheet, "Report");

    const buffer = xlsx.write(workbook, {
      type: "buffer",
      bookType: "xlsx"
    });

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=report.xlsx"
    );

    res.send(buffer);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getReports = async (req, res) => {
  const { dashboardId } = req.params;

  const reports = await prisma.report.findMany({
    where: {
      dashboardId: Number(dashboardId),
      ...(req.user.role !== "ADMIN" && {
        generatedBy: req.user.id
      })
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      fileUrl: true,
      createdAt: true,
      user: {
        select: {
          name: true,
          role: true
        }
      }
    }
  });

  res.json(reports);
};