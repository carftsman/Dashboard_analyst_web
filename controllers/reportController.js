const prisma = require("../prisma/prismaClient");

const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");

const ejs = require("ejs");
const path = require("path");
const xlsx = require("xlsx");

const templatePath = path.join(__dirname, "../views/dashboard.ejs");

const azureService = require("../services/azureService");
const chartService = require("../services/chartService");
const mappingService = require("../services/mappingService");

//////////////////////////////////////////////////////
// 📄 EXPORT DASHBOARD PDF
//////////////////////////////////////////////////////
exports.exportDashboardPDF = async (req, res) => {
  try {
    const { reportId, dashboardId, fileId, widgets, name } = req.body || {};

    let finalDashboardId = dashboardId;
    let finalFileId = fileId;
    let finalWidgets = widgets || [];

    //////////////////////////////////////////////////////
    // SUPPORT SAVED REPORT
    //////////////////////////////////////////////////////
    if (reportId) {
      const report = await prisma.report.findUnique({
        where: { id: reportId }
      });

      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }

      finalDashboardId = report.dashboardId;
      finalFileId = report.fileId;
      finalWidgets = report.config;
    }

    if (!finalDashboardId || !finalFileId) {
      return res.status(400).json({
        message: "dashboardId and fileId required"
      });
    }

    //////////////////////////////////////////////////////
    // FETCH DATA
    //////////////////////////////////////////////////////
    const rawData = await prisma.dynamicData.findMany({
      where: { fileId: finalFileId }
    });

    let rows = rawData.map(d => d.rowData);

    if (!rows.length) {
      return res.status(400).json({ message: "No data available" });
    }

    //////////////////////////////////////////////////////
    // APPLY MAPPING (SAFE MERGE)
    //////////////////////////////////////////////////////
    const mappings = await prisma.mapping.findMany({
      where: { fileId: finalFileId }
    });

    if (mappings.length) {
      const mappedRows = mappingService.applyMapping(rows, mappings);

      rows = rows.map((r, i) => ({
        ...r,              // keep original (Date safe)
        ...mappedRows[i]   // mapped fields
      }));
    }

    //////////////////////////////////////////////////////
    // NORMALIZE KEYS
    //////////////////////////////////////////////////////
    rows = rows.map(row => {
      const r = {};
      Object.keys(row).forEach(k => {
        r[k.toLowerCase().replace(/\s+/g, "_").trim()] = row[k];
      });
      return r;
    });

    //////////////////////////////////////////////////////
    // ENRICH (FORMULAS)
    //////////////////////////////////////////////////////
    rows = await chartService.enrichData(rows, prisma, finalDashboardId);

    //////////////////////////////////////////////////////
    // GET WIDGETS
    //////////////////////////////////////////////////////
    if (!finalWidgets.length) {
      finalWidgets = await prisma.widget.findMany({
        where: { dashboardId: finalDashboardId }
      });
    }

    const { generateChartImage } = require("../utils/chartImage");

    //////////////////////////////////////////////////////
    // BUILD CHARTS
    //////////////////////////////////////////////////////
    const charts = await Promise.all(
      finalWidgets.map(async (w) => {

        const type = w.type?.toUpperCase();
        const config = w.config || w;

        let data = [];

        switch (type) {

          case "KPI":
            data = chartService.calculateKPI(
              rows,
              (config.metrics || []).map(m => m.toLowerCase())
            );
            break;

          case "BAR":
          case "PIE":
          case "DONUT":
            data = chartService.groupBy(
              rows,
              (config.groupBy || config.xAxis)?.toLowerCase(),
              (config.metrics || []).map(m => m.toLowerCase())
            );
            break;

          case "LINE":
            data = chartService.lineChart(
              rows,
              "date", // 🔥 always correct
              (config.metrics || []).map(m => m.toLowerCase())
            );
            break;

          case "SCATTER":
            data = chartService.scatter(
              rows,
              config.xAxis?.toLowerCase(),
              config.yAxis?.toLowerCase()
            );
            break;

          case "FUNNEL":
            data = chartService.funnel(
              rows,
              (config.steps || []).map(s => s.toLowerCase())
            );

            data = data.filter(d => d.value > 0);
            break;
        }

let image = null;

if (type !== "KPI") {
  image = await generateChartImage(type.toLowerCase(), data);
}
        return {
          type,
          title: w.name,
          data,
          image
        };
      })
    );

    //////////////////////////////////////////////////////
    // HTML → PDF
    //////////////////////////////////////////////////////
    const html = await ejs.renderFile(templatePath, { charts });

    //////////////////////////////////////////////////////
    // PUPPETEER (RENDER SAFE)
    //////////////////////////////////////////////////////
    let browser;

    if (process.env.NODE_ENV === "production") {
      browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(), // ✅ FIXED
        headless: chromium.headless,
      });
    } else {
      const puppeteerFull = require("puppeteer");

      browser = await puppeteerFull.launch({
        headless: true,
      });
    }

    const page = await browser.newPage();

    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true
    });

    await browser.close();

    //////////////////////////////////////////////////////
    // UPLOAD TO AZURE
    //////////////////////////////////////////////////////
    const fileName = `report-${Date.now()}.pdf`;
    const fileUrl = await azureService.uploadFile(pdfBuffer, fileName);

    //////////////////////////////////////////////////////
    // SAVE REPORT
    //////////////////////////////////////////////////////
    const reportName =
      name || `Dashboard-${finalDashboardId}-${Date.now()}`;

    await prisma.report.create({
      data: {
        name: reportName,
        dashboardId: finalDashboardId,
        fileId: finalFileId,
        generatedBy: req.user.id,
        fileUrl,
        config: finalWidgets,
        snapshot: charts
      }
    });

    //////////////////////////////////////////////////////
    // RESPONSE
    //////////////////////////////////////////////////////
    res.json({
      message: "PDF generated successfully",
      fileUrl
    });

  } catch (err) {
    console.error(err);
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
      return res.status(400).json({
        message: "No data found"
      });
    }

    const xlsx = require("xlsx");

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
exports.getAllReports = async (req, res) => {
  try {
    const reports = await prisma.report.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        dashboard: {
          select: {
            id: true,
            name: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    //////////////////////////////////////////////////////
    // ✅ FORMAT RESPONSE
    //////////////////////////////////////////////////////
    const formatted = reports.map((r, index) => ({
      sNo: index + 1,
      reportId: r.id,
      reportName: r.name,
      dashboardName: r.dashboard?.name || "N/A",
      userName: r.user?.name || "Unknown",
      email: r.user?.email || "N/A",
      fileUrl: r.fileUrl,
      generatedAt: r.createdAt
    }));

    res.json(formatted);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.getMyReports = async (req, res) => {
  try {
    const { dashboardId } = req.query;

    // ✅ enforce dashboard selection
    if (!dashboardId) {
      return res.status(400).json({
        message: "dashboardId is required"
      });
    }

    const reports = await prisma.report.findMany({
      where: {
        generatedBy: req.user.id,
        dashboardId: Number(dashboardId)
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        createdAt: true,
        fileUrl: true,
        dashboardId: true,
        fileId: true
      }
    });

    res.json(reports);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.getReport = async (req, res) => {
  const report = await prisma.report.findUnique({
    where: { id: req.params.reportId }
  });

  res.json(report);
};
exports.deleteReport = async (req, res) => {
  await prisma.report.delete({
    where: { id: req.params.reportId }
  });

  res.json({ message: "Deleted" });
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


// controllers/reportController.js

exports.generateReportPreview = async (req, res) => {
  try {
    const { dashboardId, fileId, widgets } = req.body;

    // 🔥 use user widgets instead of DB widgets
    const rawData = await prisma.dynamicData.findMany({
      where: { fileId }
    });

    let rows = rawData.map(d => d.rowData);

    const chartService = require('../services/chartService');

    const charts = widgets.map(w => {
      switch (w.type) {

        case "BAR":
          return {
            type: "bar",
            title: w.name,
            data: chartService.groupBy(
  rows,
  w.xAxis?.toLowerCase(),
  [w.yAxis?.toLowerCase()]
)
          };

        case "LINE":
          return {
            type: "line",
            data: chartService.lineChart(rows, w.xAxis, [w.yAxis])
          };

        case "TABLE":
          return {
            type: "table",
            data: rows.slice(0, 50)
          };

        default:
          return { type: w.type, data: [] };
      }
    });

    res.json({ charts });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.saveReport = async (req, res) => {
  try {
    const { name, dashboardId, fileId, widgets } = req.body;

    const report = await prisma.report.create({
      data: {
        dashboardId,
        fileId,
        generatedBy: req.user.id, // ✅ FIXED
        config: widgets,
        snapshot: {}
      }
    });

    res.json({
      message: "Report saved",
      reportId: report.id
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};