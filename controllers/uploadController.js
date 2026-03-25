const azureService = require('../services/azureService');
const prisma = require("../prisma/prismaClient");
const xlsx = require("xlsx");
const mappingService = require("../services/mappingService");
const chartService = require("../services/chartService");


// ✅ helper
const convertExcelDate = (excelDate) => {
  if (!excelDate || isNaN(excelDate)) return excelDate;
  return new Date((excelDate - 25569) * 86400 * 1000)
    .toISOString()
    .split("T")[0];
};

exports.getFiles = async (req, res) => {
  try {
    const { dashboardId } = req.params;

    const files = await prisma.fileUpload.findMany({
      where: { dashboardId: Number(dashboardId) },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        fileName: true,
        createdAt: true
      }
    });

    // ✅ Auto-open logic
    if (files.length === 1) {
      return res.json({
        autoOpen: true,
        fileId: files[0].id
      });
    }

    return res.json(files);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.getFileById = async (req, res) => {
  try {
    const { fileId } = req.params;

    const file = await prisma.fileUpload.findUnique({
      where: { id: fileId }
    });

    if (!file) {
      return res.status(404).json({
        message: "File not found"
      });
    }

    res.json(file);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
exports.setActiveFile = async (req, res) => {
  try {
    const { dashboardId, fileId } = req.body;

    // reset all
    await prisma.fileUpload.updateMany({
      where: { dashboardId },
      data: { isActive: false }
    });

    // set active
    await prisma.fileUpload.update({
      where: { id: fileId },
      data: { isActive: true }
    });

    res.json({ message: "Active file updated" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.uploadFile = async (req, res) => {
  try {
    const { dashboardId } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "File required" });
    }

    ////////////////////////////////////////////////////////
    // ✅ 1. UPLOAD FILE TO AZURE
    ////////////////////////////////////////////////////////

    const fileName = `excel-${Date.now()}-${req.file.originalname}`;
const fileUrl = await azureService.uploadFile(req.file.buffer, fileName);
    ////////////////////////////////////////////////////////
    // ✅ 2. READ EXCEL FROM BUFFER
    ////////////////////////////////////////////////////////

    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);

    if (data.length === 0) {
      return res.status(400).json({ message: "Empty file" });
    }

    const columns = Object.keys(data[0]);

    ////////////////////////////////////////////////////////
    // ✅ 3. SAVE FILE METADATA (WITH URL)
    ////////////////////////////////////////////////////////

    const file = await prisma.fileUpload.create({
      data: {
        fileName: req.file.originalname,
        fileUrl, // 🔥 IMPORTANT (Azure URL)
        dashboardId: Number(dashboardId),
        uploadedById: req.user.id,
        totalRows: data.length,
        status: "PENDING"
      }
    });

    ////////////////////////////////////////////////////////
    // ✅ 4. STORE ROW DATA
    ////////////////////////////////////////////////////////
if (!dashboardId) {
  return res.status(400).json({ message: "dashboardId required" });
}
    await prisma.dynamicData.createMany({
      data: data.map(row => ({
        fileId: file.id,
        dashboardId: Number(dashboardId),
        rowData: row
      }))
    });

    ////////////////////////////////////////////////////////
    // ✅ 5. RESPONSE
    ////////////////////////////////////////////////////////

    res.json({
  message: "File uploaded successfully",
  fileId: file.id,
  fileUrl,
  status: "PENDING", // ✅ NEW
  extractedColumns: columns,
  sampleData: data.slice(0, 5)
});

  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};
exports.getFilterOptions = async (req, res) => {
  try {
    const { dashboardId } = req.params;

    const file = await prisma.fileUpload.findFirst({
      where: { dashboardId: Number(dashboardId) },
      orderBy: { createdAt: "desc" }
    });

    const data = await prisma.dynamicData.findMany({
      where: { fileId: file.id }
    });

let rows = data.map(d => d.rowData);

const mappings = await prisma.mapping.findMany({
  where: { fileId: file.id }
});

rows = mappingService.applyMapping(rows, mappings);
    const filters = {};

    Object.keys(rows[0] || {}).forEach(key => {
      filters[key] = [...new Set(rows.map(r => r[key]))].slice(0, 20);
    });

    res.json(filters);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.analyzeData = async (req, res) => {
  try {
    const {
      dashboardId,
      fileId,
      chartType,
      xAxis,
      yAxis,
      metrics,
      steps,
      filters
    } = req.body;

    const type = chartType?.toUpperCase();

    //////////////////////////////////////////////////////
    // ✅ GET FILE
    //////////////////////////////////////////////////////
    let file;

    if (fileId) {
      file = await prisma.fileUpload.findUnique({
        where: { id: fileId }
      });
    } else {
      file = await prisma.fileUpload.findFirst({
        where: { dashboardId },
        orderBy: { createdAt: "desc" }
      });
    }

    if (!file) {
      return res.json({ type, data: [] });
    }

    //////////////////////////////////////////////////////
    // ✅ GET DATA + MAPPING
    //////////////////////////////////////////////////////
    const mappings = await prisma.mapping.findMany({
      where: { fileId: file.id }
    });

    const data = await prisma.dynamicData.findMany({
      where: { fileId: file.id }
    });

    let rows = data.map(d => d.rowData);

    rows = require('../services/mappingService').applyMapping(rows, mappings);

    //////////////////////////////////////////////////////
    // ✅ APPLY FILTERS
    //////////////////////////////////////////////////////
    if (filters) {
      rows = rows.filter(row =>
        Object.entries(filters).every(([k, v]) => row[k] == v)
      );
    }

    //////////////////////////////////////////////////////
    // ✅ GENERATE CHART
    //////////////////////////////////////////////////////
    let result;

    switch (type) {

      case "KPI":
        result = require('../services/chartService').calculateKPI(
          rows,
          metrics || []
        );
        break;

      case "BAR":
      case "PIE":
        result = require('../services/chartService').groupBy(
          rows,
          xAxis,
          yAxis
        );
        break;

      case "LINE":
        result = require('../services/chartService').lineChart(
          rows,
          xAxis,
          metrics || [yAxis]
        );
        break;

      case "FUNNEL":
        result = require('../services/chartService').funnel(
          rows,
          steps || []
        );
        break;

      case "SCATTER":
        result = require('../services/chartService').scatter(
          rows,
          xAxis,
          yAxis
        );
        break;

      default:
        result = [];
    }

    res.json({
      type: type?.toLowerCase(),
      fileId: file.id,
      data: result
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.exportData = async (req, res) => {
  try {
    const { dashboardId, fileId, filters } = req.body;

    let file;

    if (fileId) {
      file = await prisma.fileUpload.findUnique({
        where: { id: fileId }
      });
    } else {
      file = await prisma.fileUpload.findFirst({
        where: { dashboardId },
        orderBy: { createdAt: "desc" }
      });
    }

    if (!file) {
      return res.status(404).json({ message: "No file found" });
    }

    // ✅ Get mappings
    const mappings = await prisma.mapping.findMany({
      where: { fileId: file.id }
    });

    // ✅ Get data
    const data = await prisma.dynamicData.findMany({
      where: { fileId: file.id }
    });

    let rows = data.map(d => d.rowData);

    // ✅ Apply mapping
    rows = require('../services/mappingService').applyMapping(rows, mappings);

    // ✅ Apply filters
    if (filters) {
      rows = rows.filter(row =>
        Object.entries(filters).every(([k, v]) => row[k] == v)
      );
    }

    // ✅ Convert to Excel
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
exports.getBuilderData = async (req, res) => {
  try {
    const { dashboardId } = req.params;
    const { fileId } = req.query;

    // ✅ select correct file
    let file;

    if (fileId) {
      file = await prisma.fileUpload.findUnique({
        where: { id: fileId }
      });
    } else {
      file = await prisma.fileUpload.findFirst({
        where: { dashboardId: Number(dashboardId) },
        orderBy: { createdAt: "desc" }
      });
    }

    if (!file) {
      return res.json({ columns: [], sampleData: [] });
    }

    // ✅ get mappings
    const mappings = await prisma.mapping.findMany({
      where: { fileId: file.id }
    });

    // ✅ get data
    const data = await prisma.dynamicData.findMany({
      where: { fileId: file.id },
      take: 5
    });

    let rows = data.map(d => d.rowData);

    // ✅ apply mapping
    rows = require('../services/mappingService').applyMapping(rows, mappings);

    const columns = Object.keys(rows[0] || {}).map(key => ({
  key, // ✅ mapped keys only
  type: typeof rows[0][key] === "number" ? "NUMBER" : "STRING"
}));

    res.json({
      dashboardId: Number(dashboardId),
      fileId: file.id,
      columns,
      sampleData: rows
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.getFilesWithAutoSelect = async (req, res) => {
  const { dashboardId } = req.params;

  const files = await prisma.fileUpload.findMany({
    where: { dashboardId: Number(dashboardId) },
    orderBy: { createdAt: "desc" }
  });

  if (files.length === 1) {
    return res.json({
      autoOpen: true,
      fileId: files[0].id
    });
  }

  res.json({
    autoOpen: false,
    files
  });
};
//////////////////////////////////////////////////////
// 🔥 GET MAPPING DATA
//////////////////////////////////////////////////////
exports.getMappingData = async (req, res) => {
  try {
    const { fileId } = req.params;

    const file = await prisma.fileUpload.findUnique({
      where: { id: fileId },
      include: {
        dashboard: { include: { columns: true } }
      }
    });

    const data = await prisma.dynamicData.findMany({
      where: { fileId }
    });

    const fileColumns = Object.keys(data[0]?.rowData || {});

    res.json({
      dashboardColumns: file.dashboard.columns,
      fileColumns
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//////////////////////////////////////////////////////
// 🔗 MAP COLUMNS
//////////////////////////////////////////////////////
exports.mapColumns = async (req, res) => {
  try {
    const { fileId, mappings } = req.body;

    await prisma.mapping.deleteMany({ where: { fileId } });

    await prisma.mapping.createMany({
      data: mappings.map(m => ({
        dashboardId: m.dashboardId,
        fileId,
        templateField: m.templateField,
        fileColumn: m.fileColumn
      }))
    });

    await prisma.fileUpload.update({
      where: { id: fileId },
      data: { status: "MAPPED" }
    });

    const sampleData = await prisma.dynamicData.findMany({
  where: { fileId },
  take: 5
});

let rows = sampleData.map(d => d.rowData);
rows = mappingService.applyMapping(rows, mappings);

res.json({
  message: "Mapping saved successfully",
  status: "MAPPED", // ✅ NEW
  preview: rows[0] || {}
});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//////////////////////////////////////////////////////
// ✅ VALIDATION
//////////////////////////////////////////////////////
exports.getValidation = async (req, res) => {
  try {
    const { fileId } = req.params;

    const data = await prisma.dynamicData.findMany({
      where: { fileId }
    });

    let nullCount = 0;
    let duplicateCount = 0;
    const seen = new Set();

    data.forEach(d => {
      const row = d.rowData;

      Object.values(row).forEach(val => {
        if (val === null || val === "") nullCount++;
      });

      const key = JSON.stringify(row);
      if (seen.has(key)) duplicateCount++;
      seen.add(key);
    });

    res.json({
      totalRows: data.length,
      nullCount,
      duplicateCount
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//////////////////////////////////////////////////////
// 📦 PROCESS DATA (FIXED)
//////////////////////////////////////////////////////
exports.processData = async (req, res) => {
  try {
    const { fileId } = req.body;

    const file = await prisma.fileUpload.findUnique({
      where: { id: fileId }
    });

    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    await prisma.fileUpload.update({
  where: { id: fileId },
  data: { status: "PROCESSED" }
});

res.json({
  message: "Data processed successfully",
  status: "PROCESSED"
});

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//////////////////////////////////////////////////////
// 🔥 FILTER FUNCTION (NEW CORE)
//////////////////////////////////////////////////////
const applyFilters = (rows, filters) => {
  return rows.filter(row => {
    for (let key in filters) {

      if (key === "startDate" && row.date) {
        if (new Date(row.date) < new Date(filters[key])) return false;
      }

      if (key === "endDate" && row.date) {
        if (new Date(row.date) > new Date(filters[key])) return false;
      }

      if (Array.isArray(filters[key])) {
        if (!filters[key].includes(row[key])) return false;
      }

      if (!Array.isArray(filters[key]) && key !== "startDate" && key !== "endDate") {
        if (row[key] != filters[key]) return false;
      }
    }
    return true;
  });
};

exports.getDashboardData = async (req, res) => {
  try {
    const { dashboardId } = req.params;
    const { fileId, platform, startDate, endDate } = req.query;

    //////////////////////////////////////////////////////
    // ✅ 1. GET FILE (ACTIVE FIRST)
    //////////////////////////////////////////////////////
    let file;

    if (fileId) {
      file = await prisma.fileUpload.findUnique({
        where: { id: fileId }
      });
    } else {
      file = await prisma.fileUpload.findFirst({
        where: {
          dashboardId: Number(dashboardId),
          isActive: true
        }
      }) || await prisma.fileUpload.findFirst({
        where: { dashboardId: Number(dashboardId) },
        orderBy: { createdAt: "desc" }
      });
    }

    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    //////////////////////////////////////////////////////
    // ✅ 2. FETCH DATA
    //////////////////////////////////////////////////////
    const rawData = await prisma.dynamicData.findMany({
      where: { fileId: file.id }
    });

    let rows = rawData.map(d => d.rowData || {});

    if (!rows.length) {
      return res.json({
        dashboardId: Number(dashboardId),
        fileId: file.id,
        status: file.status,
        widgets: [],
        charts: []
      });
    }

    //////////////////////////////////////////////////////
    // ✅ 3. APPLY MAPPING
    //////////////////////////////////////////////////////
    const mappings = await prisma.mapping.findMany({
      where: { fileId: file.id }
    });

    if (mappings.length) {
      rows = mappingService.applyMapping(rows, mappings);
    }

    //////////////////////////////////////////////////////
    // ✅ 4. CLEAN DATA
    //////////////////////////////////////////////////////
    rows = rows.map(row => {
      const newRow = {};

      Object.keys(row).forEach(key => {
        let val = row[key];

        if (val !== "" && !isNaN(val)) {
          val = Number(val);
        }

        if (key.toLowerCase().includes("date")) {
          val = convertExcelDate(val);
        }

        newRow[key.toLowerCase()] = val;
      });

      return newRow;
    });

    //////////////////////////////////////////////////////
    // 🔥 5. DERIVED METRICS (VERY IMPORTANT)
    //////////////////////////////////////////////////////
    rows = rows.map(row => {
      const r = { ...row };

      r.orders = r.orders || 0;
      r.leads = r.leads || 0;

      // 👉 Customize based on your logic
      r.revenue = r.revenue || (r.orders * 1000);
      r.cpa = r.cpa || (r.ad_spend / (r.orders || 1));
      r.roas = r.roas || (r.revenue / (r.ad_spend || 1));
      r.conversion_rate =
        r.conversion_rate || ((r.orders / (r.clicks || 1)) * 100);

      return r;
    });

    //////////////////////////////////////////////////////
    // ✅ 6. FILTERS
    //////////////////////////////////////////////////////
    if (platform) {
      rows = rows.filter(r =>
        String(r.platform || "").toLowerCase() === platform.toLowerCase()
      );
    }

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      rows = rows.filter(r => {
        if (!r.date) return false;
        const d = new Date(r.date);
        return d >= start && d <= end;
      });
    }

  const userWidgets = await prisma.widget.findMany({
  where: {
    dashboardId,
    createdById: req.user.id,
    isDefault: false
  }
});

const widgets = userWidgets.length
  ? userWidgets
  : await prisma.widget.findMany({
      where: { dashboardId, isDefault: true }
    });

    //////////////////////////////////////////////////////
    // ✅ 8. BUILD CHARTS
    //////////////////////////////////////////////////////
    const charts = widgets.map(w => {
      try {
        const xKey = w.config?.xAxis?.toLowerCase();
        const yKey = w.config?.yAxis?.toLowerCase();

        switch (w.type) {

          case "KPI":
            return {
              type: "kpi",
              data: chartService.calculateKPI(
                rows,
                (w.config?.metrics || []).map(m => m.toLowerCase())
              )
            };

          case "BAR":
            return {
              type: "bar",
              title: w.name,
              data: chartService.groupBy(rows, xKey, yKey)
            };

          case "PIE":
            return {
              type: "pie",
              data: chartService.groupBy(
                rows,
                w.config?.groupBy?.toLowerCase(),
                w.config?.metric?.toLowerCase()
              )
            };

          case "LINE":
            return {
              type: "line",
              data: chartService.lineChart(
                rows,
                xKey,
                (w.config?.metrics || []).map(m => m.toLowerCase())
              )
            };

          case "FUNNEL":
            return {
              type: "funnel",
              data: chartService.funnel(
                rows,
                (w.config?.steps || []).map(s => s.toLowerCase())
              )
            };

          case "SCATTER":
            return {
              type: "scatter",
              data: chartService.scatter(rows, xKey, yKey)
            };

          //////////////////////////////////////////////////////
          // ✅ COMBO (FIXED)
          //////////////////////////////////////////////////////
          case "COMBO":
            const comboColumns = (w.config?.columns || []).map(c => c.toLowerCase());
            const comboLines = (w.config?.lines || []).map(l => l.toLowerCase());

            return {
              type: "combo",
              data: chartService.lineChart(
                rows,
                xKey,
                [...comboColumns, ...comboLines]
              ),
              columns: comboColumns,
              lines: comboLines
            };

          //////////////////////////////////////////////////////
          // ✅ TABLE (FIXED)
          //////////////////////////////////////////////////////
          case "TABLE":
            const tableColumns = (w.config?.columns || []).map(c => c.toLowerCase());

            return {
              type: "table",
              columns: tableColumns,
              data: rows.slice(0, 50).map(row => {
                const obj = {};
                tableColumns.forEach(col => {
                  obj[col] = row[col] ?? null;
                });
                return obj;
              })
            };

          default:
            return { type: w.type, data: [] };
        }

      } catch (err) {
        console.log("Chart error:", w.name, err.message);
        return { type: w.type, data: [] };
      }
    });

    //////////////////////////////////////////////////////
    // ✅ FINAL RESPONSE
    //////////////////////////////////////////////////////
    res.json({
      dashboardId: Number(dashboardId),
      fileId: file.id,
      status: file.status,
      widgets,
      charts
    });

  } catch (err) {
    console.error("DASHBOARD ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};