const prisma = require("../prisma/prismaClient");

const puppeteer = require("puppeteer");
const PDFDocument = require("pdfkit");

const ejs = require("ejs");
const path = require("path");
const xlsx = require("xlsx");
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
    // LOAD SAVED REPORT
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

    let rows = rawData.map(d => d.rowData || {});

    if (!rows.length) {
      return res.status(400).json({ message: "No data available" });
    }

    //////////////////////////////////////////////////////
    // APPLY MAPPING
    //////////////////////////////////////////////////////
    const mappings = await prisma.mapping.findMany({
      where: { fileId: finalFileId }
    });

    if (mappings.length) {
      const mappedRows = mappingService.applyMapping(rows, mappings);

      rows = rows.map((r, i) => ({
        ...r,
        ...mappedRows[i]
      }));
    }

    //////////////////////////////////////////////////////
    // NORMALIZE KEYS
    //////////////////////////////////////////////////////
    rows = rows.map(row => {
      const r = {};
      Object.keys(row).forEach(k => {
        const key = k.toLowerCase().replace(/\s+/g, "_").trim();
        r[key] = row[k];
      });
      return r;
    });

    //////////////////////////////////////////////////////
    // ENRICH DATA
    //////////////////////////////////////////////////////
    rows = await chartService.enrichData(rows, prisma, finalDashboardId);

    //////////////////////////////////////////////////////
// 🔥 LOAD WIDGETS (FINAL FIX)
//////////////////////////////////////////////////////

if (!finalWidgets.length) {

  const defaultWidgets = await prisma.widget.findMany({
    where: {
      dashboardId: finalDashboardId,
      isDefault: true
    },
    orderBy: { id: "asc" }
  });

  const userWidgets = await prisma.widget.findMany({
    where: {
      dashboardId: finalDashboardId,
      createdById: req.user.id,
      isDefault: false,
      fileId: finalFileId   // ✅ FILE BASED
    }
  });

  //////////////////////////////////////////////////////
  // APPLY OVERRIDE
  //////////////////////////////////////////////////////
  const mergedWidgets = defaultWidgets.map(def => {
    const override = userWidgets.find(
      uw => uw.originalWidgetId === def.id
    );
    return override || def;
  });

  //////////////////////////////////////////////////////
  // EXTRA USER WIDGETS
  //////////////////////////////////////////////////////
  const extraWidgets = userWidgets.filter(
    uw => !uw.originalWidgetId
  );

  finalWidgets = [...mergedWidgets, ...extraWidgets];
}

    const { generateChartImage } = require("../utils/chartImage");

    //////////////////////////////////////////////////////
    // 🔥 CHART ENGINE (FIXED)
    //////////////////////////////////////////////////////
 //////////////////////////////////////////////////////
// 🔥 CHART ENGINE (FINAL FIX)
//////////////////////////////////////////////////////
const charts = await Promise.all(
  finalWidgets.map(async (w) => {
    try {
      const config = w.config?.config || w.config || {};
      const chartType = (config.chartType || w.type || "").toLowerCase();

      const normalize = (v) => {
        if (!v) return null;
        if (Array.isArray(v)) v = v[0];
        if (typeof v !== "string") v = String(v);
        return v.toLowerCase().replace(/\s+/g, "_").trim();
      };

      //////////////////////////////////////////////////////
      // 🔥 NEW: BACKWARD COMPATIBLE CONFIG
      //////////////////////////////////////////////////////
      const groupBy = normalize(
        config.groupBy || config.xAxis?.[0]
      );

      const metrics = (
  config.metrics?.length
    ? config.metrics
    : config.metric?.length
    ? config.metric
    : Array.isArray(config.yAxis)
    ? config.yAxis
    : config.yAxis
    ? [config.yAxis]
    : []
)
  .map(normalize)
  .filter(Boolean);

      let data = [];

      //////////////////////////////////////////////////////
      // KPI
      //////////////////////////////////////////////////////
      if (chartType === "kpi") {
        data = chartService.calculateKPI(rows, metrics);
      }

      //////////////////////////////////////////////////////
      // BAR / PIE / DONUT
      //////////////////////////////////////////////////////
      else if (["bar", "pie", "donut"].includes(chartType)) {
        if (!groupBy || !metrics.length) return {
  type: chartType.toUpperCase(),
  title: w?.name || "Invalid Chart",
  data: [],
  image: null
};

        data = chartService.groupBy(rows, groupBy, metrics);
      }

      //////////////////////////////////////////////////////
      // LINE
      //////////////////////////////////////////////////////
      else if (chartType === "line") {
        const xAxis = normalize(config.xAxis);

if (!xAxis || !metrics.length) {
  return {
    type: chartType.toUpperCase(),
    title: w?.name || "Invalid Chart",
    data: [],
    image: null
  };
}
        data = chartService.lineChart(rows, xAxis, metrics);
      }

      //////////////////////////////////////////////////////
      // SCATTER
      //////////////////////////////////////////////////////
      else if (chartType === "scatter") {
        const xAxis = normalize(config.xAxis);
        const yAxis = normalize(Array.isArray(config.yAxis)
  ? config.yAxis
  : config.yAxis
  ? [config.yAxis]
  : []);

        if (!xAxis || !yAxis) return null;

        data = chartService.scatter(rows, xAxis, yAxis);
      }

      //////////////////////////////////////////////////////
      // FUNNEL
      //////////////////////////////////////////////////////
      else if (chartType === "funnel") {
        if (!config.steps?.length) return null;

        data = chartService.funnel(
          rows,
          config.steps.map(normalize)
        );
      }

     if (!data) data = [];

if (!Array.isArray(data)) {
  if (typeof data === "object" && data !== null) {
    data = [data];
  } else {
    data = [];
  }
}
      let image = null;

     if (
  chartType !== "kpi" &&
  Array.isArray(data) &&
  data.length > 0
) {
  image = await generateChartImage(chartType, data);
}
      return {
        type: chartType.toUpperCase(),
title: w?.name || chartType || "Chart",
        data,
        image
      };
console.log("👉 Dashboard:", dashboardId);
console.log("👉 FileId:", fileId);
    } catch (err) {
      console.log("❌ Chart error:", err.message);
      return {
        type: "ERROR",
        title: w?.name || "Error",
        data: [],
        image: null
      };
    }
  })
);

    //////////////////////////////////////////////////////
    // PDF GENERATION
    //////////////////////////////////////////////////////
    //////////////////////////////////////////////////////
// ✅ PDF GENERATION (FIXED GRID + NO BLANK PAGES)
//////////////////////////////////////////////////////
const PDFDocument = require("pdfkit");
const doc = new PDFDocument({ size: "A4", margin: 40 });

const buffers = [];
doc.on("data", buffers.push.bind(buffers));

let pageNumber = 1;

const addHeader = () => {
  doc.fontSize(18).text("Dashboard Report", { align: "center" });
  doc.moveDown(1);
};

const addFooter = () => {
  doc.fontSize(9).text(
    `Page ${pageNumber}`,
    50,
    doc.page.height - 30,
    { align: "center" }
  );
};

const pdfBuffer = await new Promise((resolve) => {
  doc.on("end", () => resolve(Buffer.concat(buffers)));

  addHeader();

  //////////////////////////////////////////////////////
  // 🔥 GRID SYSTEM (2 charts per row)
  //////////////////////////////////////////////////////
  const chartWidth = 250;
  const chartHeight = 160;

  const marginX = 50;
  const marginY = 100;
  const gapX = 20;
  const gapY = 60;

  let col = 0;
  let row = 0;
let itemsInPage = 0;
const maxItemsPerPage = 4;

charts
  .filter(c =>
    c &&
    c.title &&
    (
      (Array.isArray(c.data) && c.data.length > 0) ||
      c.type === "KPI"
    )
  )
  .forEach((chart, index) => {

    //////////////////////////////////////////////////////
    // ✅ MOVE PAGE BREAK TO TOP (FIX)
    //////////////////////////////////////////////////////
    if (itemsInPage >= maxItemsPerPage) {
  addFooter();
  doc.addPage();
  pageNumber++;

  addHeader();

  col = 0;
  row = 0;
  itemsInPage = 0;
}

    let x = marginX + col * (chartWidth + gapX);
    let y = marginY + row * (chartHeight + gapY);

    //////////////////////////////////////////////////////
    // TITLE
    //////////////////////////////////////////////////////
    doc.fontSize(11).text(`${index + 1}. ${chart.title}`, x, y - 15);

    //////////////////////////////////////////////////////
    // IMAGE
    //////////////////////////////////////////////////////
    if (chart.image) {
      const imgBuffer = Buffer.from(
        chart.image.replace(/^data:image\/png;base64,/, ""),
        "base64"
      );

      doc.image(imgBuffer, x, y, {
        width: chartWidth,
        height: chartHeight
      });
    }

    //////////////////////////////////////////////////////
    // KPI
    //////////////////////////////////////////////////////
    else if (chart.type === "KPI") {
      let offsetY = y;

      Object.entries(chart.data?.[0] || {}).forEach(([k, v]) => {
        doc.fontSize(9).text(k.toUpperCase(), x, offsetY);
        doc.fontSize(13).text(String(v), x, offsetY + 12);
        offsetY += 26;
      });
    }

    //////////////////////////////////////////////////////
    // TABLE
    //////////////////////////////////////////////////////
    else if (chart.data?.length) {
      let tableY = y;

      chart.data.slice(0, 5).forEach(row => {
        doc.fontSize(8).text(
          Object.entries(row)
            .map(([k, v]) => `${k}:${v}`)
            .join(" | "),
          x,
          tableY
        );
        tableY += 12;
      });
    }

    //////////////////////////////////////////////////////
    // GRID MOVE
    //////////////////////////////////////////////////////
    col++;
    itemsInPage++;

    if (col >= 2) {
      col = 0;
      row++;
    }
  });

addFooter();
doc.end();
});
    //////////////////////////////////////////////////////
    // UPLOAD
    //////////////////////////////////////////////////////
    const fileName = `report-${Date.now()}.pdf`;
    const fileUrl = await azureService.uploadFile(pdfBuffer, fileName);

    //////////////////////////////////////////////////////
    // SAVE
    //////////////////////////////////////////////////////
    await prisma.report.create({
      data: {
        name: name || `Dashboard-${Date.now()}`,
        dashboardId: finalDashboardId,
        fileId: finalFileId,
        generatedBy: req.user.id,
        fileUrl,
        config: finalWidgets,
        snapshot: charts
      }
    });

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