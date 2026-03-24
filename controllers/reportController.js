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

    rows = mappingService.applyMapping(rows, mappings);

    //////////////////////////////////////////////////////
    // 3. FETCH WIDGETS (ADMIN CREATED)
    //////////////////////////////////////////////////////
    const widgets = await prisma.widget.findMany({
      where: { dashboardId: Number(dashboardId) },
      orderBy: { id: "asc" }
    });

    //////////////////////////////////////////////////////
    // 4. BUILD CHARTS
    //////////////////////////////////////////////////////
    const charts = widgets.map(w => {
      let data = [];

      switch (w.type.toUpperCase()) {

        case "KPI":
          data = chartService.calculateKPI(rows, w.config?.metrics || []);
          break;

        case "BAR":
        case "PIE":
          data = chartService.groupBy(
            rows,
            w.config?.xAxis || w.config?.groupBy,
            w.config?.yAxis || w.config?.metric
          );
          break;

        case "LINE":
          data = chartService.lineChart(
            rows,
            w.config?.xAxis,
            w.config?.metrics || []
          );
          break;

        case "FUNNEL":
          data = chartService.funnel(rows, w.config?.steps || []);
          break;

        case "SCATTER":
          data = chartService.scatter(
            rows,
            w.config?.xAxis,
            w.config?.yAxis
          );
          break;

        case "COMBO":
          data = rows.map(r => ({
            name: r[w.config?.xAxis],
            bar: Number(r[w.config?.columns?.[0]]) || 0,
            line: Number(r[w.config?.lines?.[0]]) || 0
          }));
          break;

        default:
          data = [];
      }

      return {
        type: w.type.toUpperCase(),
        title: w.name,
        data
      };
    });

    //////////////////////////////////////////////////////
    // 5. RENDER HTML
    //////////////////////////////////////////////////////
    const html = await ejs.renderFile(
      path.join(__dirname, "../views/dashboard.ejs"),
      { charts, rows }
    );

    //////////////////////////////////////////////////////
    // 6. GENERATE PDF
    //////////////////////////////////////////////////////
    const browser = await puppeteer.launch({
      args: ["--no-sandbox"],
      headless: true
    });

    const page = await browser.newPage();

    await page.setContent(html, { waitUntil: "networkidle0" });

    // wait charts render
await page.waitForFunction(() => window.chartRendered === true, {
  timeout: 10000
});
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true
    });

    await browser.close();

//////////////////////////////////////////////////////
// 7. UPLOAD TO AZURE
//////////////////////////////////////////////////////

//////////////////////////////////////////////////////
// 7. UPLOAD TO AZURE
//////////////////////////////////////////////////////

const fileName = `dashboard-${dashboardId}-${Date.now()}.pdf`;

const fileUrl = await azureService.uploadFile(pdf, fileName);
//////////////////////////////////////////////////////
// 8. SAVE REPORT
//////////////////////////////////////////////////////

await prisma.report.create({
  data: {
    fileUrl, // ✅ store Azure URL

    config: {},
    snapshot: charts,

    dashboard: {
      connect: { id: Number(dashboardId) }
    },

    file: {
      connect: { id: fileId }
    },

    user: {
      connect: { id: req.user.id }
    }
  }
});

//////////////////////////////////////////////////////
// 9. SEND RESPONSE
//////////////////////////////////////////////////////

res.json({
  message: "PDF generated successfully",
  fileUrl
});
    //////////////////////////////////////////////////////
    // 8. SEND PDF
    //////////////////////////////////////////////////////
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=dashboard-${dashboardId}.pdf`
    });

    res.send(pdf);

  } catch (err) {
    console.error("PDF ERROR:", err);
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