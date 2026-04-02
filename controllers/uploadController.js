const mergeMapping = (rows, mappings) => {
  if (!mappings?.length) return rows;

  const mappedRows = mappingService.applyMapping(rows, mappings);

  return rows.map((r, i) => ({
    ...r,              // original data
    ...mappedRows[i]   // mapped fields
  }));
};
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

rows = mergeMapping(rows, mappings);
rows = await chartService.enrichData(rows, prisma);
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
    // 🔍 GET FILE
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
    // 🔍 GET DATA + MAPPING
    //////////////////////////////////////////////////////
    const mappings = await prisma.mapping.findMany({
      where: { fileId: file.id }
    });

    const data = await prisma.dynamicData.findMany({
      where: { fileId: file.id }
    });

    let rows = data.map(d => d.rowData || {});

   if (mappings.length) {
  rows = mergeMapping(rows, mappings);
  rows = await chartService.enrichData(rows, prisma);
}
    //////////////////////////////////////////////////////
    // 🔥 NORMALIZE KEYS
    //////////////////////////////////////////////////////
    rows = rows.map(row => {
      const newRow = {};
      Object.keys(row).forEach(k => {
        newRow[k.toLowerCase().replace(/\s+/g, "_").trim()] = row[k];
      });
      return newRow;
    });

    //////////////////////////////////////////////////////
    // 🔥 APPLY FILTERS
    //////////////////////////////////////////////////////
    if (filters) {
      rows = rows.filter(row =>
        Object.entries(filters).every(([k, v]) =>
          String(row[k?.toLowerCase()]) === String(v)
        )
      );
    }

const normalize = v =>
  v?.toLowerCase().replace(/\s+/g, "_").trim();

const xKey = normalize(xAxis);
const yKey = normalize(yAxis);
const safeMetrics = (metrics || []).map(normalize).filter(Boolean);

    let result = [];

    //////////////////////////////////////////////////////
    // 🔥 CHART SWITCH (SAFE)
    //////////////////////////////////////////////////////
    switch (type) {

      case "KPI":
        if (!safeMetrics.length) {
          return res.json({ type, data: [] });
        }

        result = chartService.calculateKPI(rows, safeMetrics);
        break;

      case "BAR":
case "PIE":
case "DONUT":
  if (!xKey || !safeMetrics.length) {
    return res.json({ type, data: [] });
  }

  result = chartService.groupBy(rows, xKey, safeMetrics);
  break;

      case "LINE":
        if (!xKey || !safeMetrics.length) {
          return res.json({ type, data: [] });
        }

        result = chartService.lineChart(rows, xKey, safeMetrics);
        break;

      case "FUNNEL":
        if (!steps || !steps.length) {
          return res.json({ type, data: [] });
        }

        result = chartService.funnel(
          rows,
          steps.map(s => s.toLowerCase())
        );
        break;

      case "SCATTER":
        if (!xKey || !yKey) {
          return res.json({ type, data: [] });
        }

        result = chartService.scatter(rows, xKey, yKey);
        break;

      default:
        result = [];
    }

    //////////////////////////////////////////////////////
    // ✅ RESPONSE
    //////////////////////////////////////////////////////
    res.json({
      type: type?.toLowerCase(),
      fileId: file.id,
      data: result || []
    });

  } catch (err) {
    console.error("❌ analyzeData error:", err);
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

rows = mergeMapping(rows, mappings);
rows = await chartService.enrichData(rows);
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

    const mappings = await prisma.mapping.findMany({
      where: { fileId: file.id }
    });

    const data = await prisma.dynamicData.findMany({
      where: { fileId: file.id },
      take: 5
    });

    let rows = data.map(d => d.rowData || {});
if (mappings.length) {
  rows = mergeMapping(rows, mappings);
}

    // ✅ normalize keys
    rows = rows.map(row => {
      const newRow = {};
      Object.keys(row).forEach(k => {
newRow[k.toLowerCase().replace(/\s+/g, "_").trim()] = row[k];
      });
      return newRow;
    });

    const columns = Object.keys(rows[0] || {}).map(key => ({
      key,
      type: key.includes("date")
        ? "DATE"
        : typeof rows[0][key] === "number"
        ? "NUMBER"
        : "STRING"
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

exports.mapColumns = async (req, res) => {
  try {
    const { fileId, mappings } = req.body;

    //////////////////////////////////////////////////////
    // FETCH FILE (GET dashboardId)
    //////////////////////////////////////////////////////
    const file = await prisma.fileUpload.findUnique({
      where: { id: fileId }
    });

    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    const dashboardId = file.dashboardId; // 🔥 FIX

    //////////////////////////////////////////////////////
    // DELETE OLD MAPPINGS
    //////////////////////////////////////////////////////
    await prisma.mapping.deleteMany({
      where: { fileId }
    });

    //////////////////////////////////////////////////////
    // CREATE NEW MAPPINGS
    //////////////////////////////////////////////////////
    const data = mappings.map(m => ({
      dashboardId,              // ✅ FIXED
      fileId,
      templateField: m.templateField,
      fileColumn: m.fileColumn
    }));

    await prisma.mapping.createMany({ data });

    //////////////////////////////////////////////////////
    // RESPONSE
    //////////////////////////////////////////////////////
    res.json({
      message: "Mapping saved successfully"
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getValidation = async (req, res) => {
  try {
    const { fileId } = req.params;

    const file = await prisma.fileUpload.findUnique({
      where: { id: fileId }
    });

    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    const data = await prisma.dynamicData.findMany({
      where: { fileId }
    });

    const mappings = await prisma.mapping.findMany({
      where: { fileId }
    });

    const columns = await prisma.dashboardColumn.findMany({
      where: { dashboardId: file.dashboardId }
    });

    const mappingService = require('../services/mappingService');

    let rows = data.map(d => d.rowData);
//////////////////////////////////////////////////////
// 🔥 APPLY MAPPING (AUTO + DB)
//////////////////////////////////////////////////////

if (mappings.length) {
  rows = mergeMapping(rows, mappings);

} else if (rows.length) {
  const sample = rows[0];

  const dashboardColumns = await prisma.dashboardColumn.findMany({
    where: { dashboardId: file.dashboardId }
  });

 const normalize = str =>
  str
    ?.toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .trim();

  const autoMappings = [];

  dashboardColumns.forEach(dc => {
    const match = Object.keys(sample).find(fc => {
  const f = normalize(fc);
  const c = normalize(dc.columnKey);
  const d = normalize(dc.displayName);

  return (
    f === c ||
    f === d ||
    f.includes(c) ||
    f.includes(d) ||
    c.includes(f)
  );
});

    if (match) {
      autoMappings.push({
        templateField: dc.columnKey,
        fileColumn: match
      });
    }
  });

  if (!autoMappings.length) {
    return res.status(400).json({
      message: "Mapping required. No matching columns found."
    });
  }

  rows = mergeMapping(rows, autoMappings);
}
    //////////////////////////////////////////////////////
    // 🔥 VALIDATION
    //////////////////////////////////////////////////////
    let missingData = 0;
    let dataTypeErrors = 0;
    let formatErrors = 0;
    let duplicateRows = 0;

    const seen = new Set();

    rows.forEach((row, index) => {

      columns.forEach(col => {
        const value = row[col.columnKey];

        // ❌ Missing
        if (
  col.required &&
  (value === null ||
   value === undefined ||
   (typeof value === "string" && value.trim() === ""))
) {
  missingData++;
}

        // ❌ Number type
        if (col.dataType === "NUMBER" && value && isNaN(value)) {
          dataTypeErrors++;
        }

        // ❌ Date format
        if (col.dataType === "DATE" && value && isNaN(new Date(value))) {
          formatErrors++;
        }
      });

      // ❌ Duplicate rows
      const key = JSON.stringify(row);
      if (seen.has(key)) duplicateRows++;
      seen.add(key);
    });

    //////////////////////////////////////////////////////
    // RESPONSE
    //////////////////////////////////////////////////////
    res.json({
      totalRows: rows.length,
      summary: {
        criticalErrors: {
          missingData,
          dataTypeErrors,
          formatErrors
        },
        warnings: {
          duplicateRows
        }
      }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.processData = async (req, res) => {
  try {
    const { fileId } = req.body;

    const file = await prisma.fileUpload.findUnique({
      where: { id: fileId }
    });

    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    //////////////////////////////////////////////////////
    // GET DATA
    //////////////////////////////////////////////////////
    const data = await prisma.dynamicData.findMany({
      where: { fileId }
    });

    const mappings = await prisma.mapping.findMany({
      where: { fileId }
    });

    const columns = await prisma.dashboardColumn.findMany({
      where: { dashboardId: file.dashboardId }
    });

    const mappingService = require('../services/mappingService');

    let rows = data.map(d => d.rowData);
//////////////////////////////////////////////////////
// 🔥 APPLY MAPPING (AUTO + DB)
//////////////////////////////////////////////////////

if (mappings.length) {
  rows = mergeMapping(rows, mappings);

} else if (rows.length) {
  const sample = rows[0];

  const dashboardColumns = await prisma.dashboardColumn.findMany({
    where: { dashboardId: file.dashboardId }
  });

const normalize = str =>
  str
    ?.toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .trim();
  const autoMappings = [];

  dashboardColumns.forEach(dc => {
    const match = Object.keys(sample).find(fc => {
  const f = normalize(fc);
  const c = normalize(dc.columnKey);
  const d = normalize(dc.displayName);

  return (
    f === c ||
    f === d ||
    f.includes(c) ||
    f.includes(d) ||
    c.includes(f)
  );
});

    if (match) {
      autoMappings.push({
        templateField: dc.columnKey,
        fileColumn: match
      });
    }
  });

  if (!autoMappings.length) {
    return res.status(400).json({
      message: "Mapping required. No matching columns found."
    });
  }

  rows = mergeMapping(rows, autoMappings);
}
    //////////////////////////////////////////////////////
    // 🔥 AUTO CLEAN (IMPORTANT)
    //////////////////////////////////////////////////////
    rows = rows.map(row => {
      const cleaned = { ...row };

      columns.forEach(col => {
        let value = cleaned[col.columnKey];

        // Fix missing
if (value === undefined || value === null || value === "") {
  cleaned[col.columnKey] = null;
}
        // Fix number
        if (col.dataType === "NUMBER") {
          cleaned[col.columnKey] = Number(value) || 0;
        }

        // Fix date
        if (col.dataType === "DATE") {
          const d = new Date(value);
          cleaned[col.columnKey] = isNaN(d) ? null : d;
        }
      });

      return cleaned;
    });

    //////////////////////////////////////////////////////
    // 🔥 VALIDATION SUMMARY
    //////////////////////////////////////////////////////
    let missingData = 0;

    rows.forEach(row => {
      columns.forEach(col => {
        if (col.required && (!row[col.columnKey] || row[col.columnKey] === "")) {
          missingData++;
        }
      });
    });

    const totalCells =
      rows.length * columns.filter(c => c.required).length;

    const errorPercentage =
      totalCells === 0 ? 0 : (missingData / totalCells) * 100;

    //////////////////////////////////////////////////////
    // 🔥 SMART RULE
    //////////////////////////////////////////////////////
    if (errorPercentage > 20) {
      await prisma.fileUpload.update({
        where: { id: fileId },
        data: { status: "FAILED" }
      });

      return res.status(400).json({
        message: "Too many missing required values",
        status: "FAILED",
        errorPercentage
      });
    }

    //////////////////////////////////////////////////////
    // ✅ PROCESS SUCCESS
    //////////////////////////////////////////////////////
    await prisma.fileUpload.update({
      where: { id: fileId },
      data: { status: "PROCESSED" }
    });

    res.json({
      message: "Data processed successfully",
      status: "PROCESSED",
      warning: missingData > 0
        ? `${missingData} missing values auto-handled`
        : null
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
    const dashboardId = Number(req.params.dashboardId);
    const { fileId } = req.query;

    //////////////////////////////////////////////////////
    // 1. GET WIDGETS
    //////////////////////////////////////////////////////
    const defaultWidgets = await prisma.widget.findMany({
      where: { dashboardId, isDefault: true },
      orderBy: { id: "asc" }
    });

    const userWidgets = await prisma.widget.findMany({
      where: {
        dashboardId,
        createdById: req.user?.id,
        isDefault: false
      }
    });

    const widgets = defaultWidgets.map(def => {
      const override = userWidgets.find(
        uw => uw.originalWidgetId === def.id
      );
      return override || def;
    });

    const extraWidgets = userWidgets.filter(
      uw => !uw.originalWidgetId
    );

    const finalWidgets = [...widgets, ...extraWidgets];

    //////////////////////////////////////////////////////
    // 2. GET DATA
    //////////////////////////////////////////////////////
    const dataRows = await prisma.dynamicData.findMany({
      where: {
        dashboardId,
        ...(fileId && { fileId })
      }
    });

    let rows = dataRows.map(r => r.rowData || {});

    //////////////////////////////////////////////////////
    // 3. SMART AUTO MAPPING (FINAL FIX)
    //////////////////////////////////////////////////////
    const mappings = await prisma.mapping.findMany({
      where: { fileId }
    });

    const normalize = str =>
      str
        ?.toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "")
        .trim();

    if (mappings.length) {
      rows = mergeMapping(rows, mappings);

    } else if (rows.length) {
      const sample = rows[0];

      const dashboardColumns = await prisma.dashboardColumn.findMany({
        where: { dashboardId }
      });

      const autoMappings = [];

      dashboardColumns.forEach(dc => {
        const match = Object.keys(sample).find(fc => {
          const f = normalize(fc);
          const c = normalize(dc.columnKey);
          const d = normalize(dc.displayName);

          return (
  f === c ||
  f === d ||
  f.includes(c) ||
  f.includes(d) ||
  c.includes(f)
);
        });

        if (match) {
          autoMappings.push({
            templateField: dc.columnKey,
            fileColumn: match
          });
        }
      });

      if (!autoMappings.length) {
        return res.status(400).json({
          message: "Mapping required. No matching columns found."
        });
      }

      rows = mergeMapping(rows, autoMappings);
    }

    //////////////////////////////////////////////////////
    // 4. ENRICH
    //////////////////////////////////////////////////////
    const enriched = await chartService.enrichData(rows, prisma, dashboardId);

    //////////////////////////////////////////////////////
    // 5. NORMALIZE DATA
    //////////////////////////////////////////////////////
    const normalizedData = enriched.map(row => {
      const r = {};
      Object.keys(row).forEach(k => {
        const key = k.toLowerCase().replace(/\s+/g, "_").trim();
        r[key] = row[k];
      });
      return r;
    });

    //////////////////////////////////////////////////////
    // HELPER
    //////////////////////////////////////////////////////
    const toArray = val => {
      if (!val) return [];
      if (Array.isArray(val)) return val;
      return [val];
    };

    //////////////////////////////////////////////////////
    // 6. BUILD CHARTS
    //////////////////////////////////////////////////////
    const charts = finalWidgets.map(w => {
      const config = w.config?.config || w.config || {};
      if (!normalizedData.length) return null;

      const validColumns = Object.keys(normalizedData[0]);

      //////////////////////////////////////////////////////
      // CONFIG SAFE EXTRACTION
      //////////////////////////////////////////////////////
      let xAxis = normalize(
        Array.isArray(config.xAxis) ? config.xAxis[0] : config.xAxis
      );

      const groupBy = normalize(
        Array.isArray(config.groupBy)
          ? config.groupBy[0]
          : config.groupBy || config.xAxis
      );

      const rawMetrics =
        config.metrics?.length
          ? config.metrics
          : config.metric?.length
          ? config.metric
          : toArray(config.yAxis);

      const metrics = rawMetrics.map(normalize).filter(Boolean);

      const yAxis = normalize(
        Array.isArray(config.yAxis) ? config.yAxis[0] : config.yAxis
      );

      //////////////////////////////////////////////////////
      // FILTER ACTIVE
      //////////////////////////////////////////////////////
      const filteredData = normalizedData.filter(r =>
        !r.active_status || r.active_status.toLowerCase() === "active"
      );

      //////////////////////////////////////////////////////
      // VALIDATION
      //////////////////////////////////////////////////////
      if (groupBy && !validColumns.includes(groupBy)) return null;

      if (metrics.length) {
        const validMetrics = metrics.filter(m =>
          validColumns.includes(m)
        );
        if (!validMetrics.length) return null;
      }

      //////////////////////////////////////////////////////
      // NORMALIZE BAR/PIE
      //////////////////////////////////////////////////////
      const normalizeChartData = (data, type, metrics) => {
        if (!Array.isArray(data)) return data;

        if (["bar", "pie", "donut"].includes(type)) {
          const metricKey = metrics?.[0];
          return data.map(d => ({
            name: d.name,
            value: Number(d[metricKey]) || 0
          }));
        }
        return data;
      };

      //////////////////////////////////////////////////////
      // SWITCH
      //////////////////////////////////////////////////////
      switch (w.type) {

        case "KPI":
          return {
            type: "kpi",
            data: chartService.calculateKPI(filteredData, metrics)
          };

        case "BAR":
        case "PIE":
        case "DONUT":
          if (!groupBy || !metrics.length) return null;

          const rawData = chartService.groupBy(filteredData, groupBy, metrics);

          return {
            type: w.type.toLowerCase(),
            data: normalizeChartData(rawData, w.type.toLowerCase(), metrics)
          };

        case "LINE":
        case "AREA":
        case "STACKED":
          if (!xAxis || !metrics.length) return null;

          return {
            type: w.type.toLowerCase(),
            data: chartService.lineChart(filteredData, xAxis, metrics)
          };

        case "SCATTER":
          if (!xAxis || !yAxis) return null;

          return {
            type: "scatter",
            data: chartService.scatter(filteredData, xAxis, yAxis)
          };

        case "FUNNEL":
          if (!config.steps?.length) return null;

          let funnelData = chartService.funnel(
            filteredData,
            config.steps.map(normalize)
          );

          return {
            type: "funnel",
            data: funnelData.filter(f => f.value > 0)
          };

        default:
          return null;
      }

    }).filter(Boolean);

    //////////////////////////////////////////////////////
    // RESPONSE
    //////////////////////////////////////////////////////
    res.json({
      dashboardId,
      fileId,
      charts
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};