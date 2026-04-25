async function processRows(fileId, callback) {
  const BATCH = 1000;
  let lastId = null;

  while (true) {
    const chunk = await prisma.dynamicData.findMany({
      where: {
        fileId,
        ...(lastId && { id: { gt: lastId } })
      },
      take: BATCH,
      orderBy: { id: "asc" }
    });

    if (!chunk.length) break;

    lastId = chunk[chunk.length - 1].id;

    await callback(chunk.map(d => d.rowData || {}));
  }
}

const mergeMapping = (rows, mappings) => {
  if (!mappings?.length) return rows;

  const mappedRows = mappingService.applyMapping(rows, mappings);

  return rows.map((r, i) => ({
    ...r,              // original data
    ...mappedRows[i]   // mapped fields
  }));
};
const ExcelJS = require("exceljs");

const azureService = require('../services/azureService');
const prisma = require("../prisma/prismaClient");
const xlsx = require("xlsx");
const mappingService = require("../services/mappingService");
const chartEngine = require("../services/chartEngine");

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
    logger.error("Upload frontend PDF failed", {
  error: err.message,
  stack: err.stack
});
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
const path = require("path");
const ext = path.extname(req.file.originalname);
const fileName = `excel-${Date.now()}${ext}`;
    const fileUrl = await azureService.uploadFileFromPath(req.file.path, fileName);

    ////////////////////////////////////////////////////////
    // ✅ 2. Create DB record
    ////////////////////////////////////////////////////////
    const file = await prisma.fileUpload.create({
      data: {
        fileName: req.file.originalname,
        fileUrl,
        dashboardId: Number(dashboardId),
        uploadedById: req.user?.id,
        status: "PENDING"
      }
    });

    ////////////////////////////////////////////////////////
    // ✅ 3. TRUE STREAMING (FIXED)
    ////////////////////////////////////////////////////////
    const fs = require("fs");

const tempPath = req.file.path;
    const workbook = new ExcelJS.stream.xlsx.WorkbookReader(tempPath);

    const BATCH_SIZE = 1000;
    let batch = [];
    let headers = [];
    let columnsSet = new Set();

    for await (const worksheet of workbook) {
      for await (const row of worksheet) {

        const values = row.values;

        // HEADER
        if (!headers.length) {
          headers = values.slice(1);
          headers.forEach(h => columnsSet.add(String(h).trim()));
          continue;
        }

        const rowObj = {};
        headers.forEach((header, i) => {
          rowObj[header] = values[i + 1] ?? null;
        });

        batch.push({
          fileId: file.id,
          dashboardId: Number(dashboardId),
          rowData: rowObj
        });

        //////////////////////////////////////////////////////
        // ✅ BATCH INSERT (FIXED)
        //////////////////////////////////////////////////////
        if (batch.length === BATCH_SIZE) {
await prisma.dynamicData.createMany({
  data: batch,
  skipDuplicates: true
});          batch = [];
        }
      }
    }

if (batch.length) {
  await prisma.dynamicData.createMany({
    data: batch,
    skipDuplicates: true
  });
}
if (fs.existsSync(tempPath)) {
fs.unlink(tempPath, () => {});
}
    //////////////////////////////////////////////////////
    // UPDATE STATUS
    //////////////////////////////////////////////////////
    await prisma.fileUpload.update({
      where: { id: file.id },
      data: { status: "PENDING" }
    });

    //////////////////////////////////////////////////////
    // RESPONSE
    //////////////////////////////////////////////////////
    res.json({
      message: "File uploaded successfully",
      fileId: file.id,
      fileUrl,
      extractedColumns: Array.from(columnsSet)
    });

  } catch (err) {
logger.error("Upload failed", {
  error: err.message,
  stack: err.stack
});  
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

let rows = await prisma.dynamicData.findMany({
  where: { fileId: file.id },
  take: 5000   // limit for safety
});

const mappings = await prisma.mapping.findMany({
  where: { fileId: file.id }
});

rows = mergeMapping(rows, mappings);
rows = await chartEngine.enrichData(rows, prisma);
const filters = {};

    Object.keys(rows[0] || {}).forEach(key => {
      filters[key] = [...new Set(rows.map(r => r[key]))].slice(0, 20);
    });

    res.json(filters);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
function generateChartBatch(widgets, rows) {
  const { generateChart } = require("../services/chartEngine");

  return widgets.map(w => ({
    id: w.id,
    type: w.type,
    config: w.config,
    data: generateChart(w.type.toUpperCase(), rows, w.config || {})
  }));
}
function mergeCharts(global, partial) {
  partial.forEach((p, index) => {
    if (!global[index]) {
      global[index] = {
        id: p.id,
        type: p.type,
        config: p.config,
        data: {}
      };
    }

    (p.data || []).forEach(item => {
      const key = item.name || item.x || item.label;

      if (!global[index].data[key]) {
        global[index].data[key] = { ...item };
      } else {
        Object.keys(item).forEach(k => {
          if (typeof item[k] === "number") {
            global[index].data[key][k] =
              (global[index].data[key][k] || 0) + item[k];
          }
        });
      }
    });
  });
}
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
    // 🔍 GET MAPPINGS
    //////////////////////////////////////////////////////
    const mappings = await prisma.mapping.findMany({
      where: { fileId: file.id }
    });

    //////////////////////////////////////////////////////
    // 🔧 HELPERS
    //////////////////////////////////////////////////////
    const { generateChart } = require("../services/chartEngine");

    const normalize = v =>
      String(v ?? "")
        .toLowerCase()
        .replace(/\s+/g, "_")
        .trim();

    const xKey = normalize(xAxis);
    const yKey = normalize(yAxis);

    const safeMetrics = [
      ...(metrics || []),
      ...(yAxis ? [yAxis] : [])
    ]
      .map(normalize)
      .filter(Boolean);

let aggregated = {};
    await processRows(file.id, async (rows) => {

      // 🔁 Apply mapping
      if (mappings.length) {
        rows = mergeMapping(rows, mappings);
        rows = await chartEngine.enrichData(rows, prisma);
      }

      // 🔤 Normalize keys
      rows = rows.map(row => {
        const r = {};
        Object.keys(row).forEach(k => {
          r[normalize(k)] = row[k];
        });
        return r;
      });

      // 🔍 Apply filters
      if (filters) {
        rows = rows.filter(row =>
          Object.entries(filters).every(([k, v]) =>
            String(row[normalize(k)]) === String(v)
          )
        );
      }

      // 📊 Generate partial chart
      const partial = generateChart(type, rows, {
        xAxis: xKey,
        yAxis: yKey,
        groupBy: xKey,
        metrics: safeMetrics,
        steps
      });

      if (Array.isArray(partial)) {
        mergeChartData(aggregated, partial);
      }
    });

res.json({
  type: type?.toLowerCase(),
  fileId: file.id,
  data: Object.values(aggregated)
});

  } catch (err) {
logger.error("Analyze data failed", {
  error: err.message,
  stack: err.stack
});
    res.status(500).json({ error: err.message });
  }
};
function mergeChartData(global, partial) {
  partial.forEach(item => {
    const key = item.name || item.x || item.label;

    if (!global[key]) {
      global[key] = { ...item };
    } else {
      Object.keys(item).forEach(k => {
        if (typeof item[k] === "number") {
          global[key][k] = (global[key][k] || 0) + item[k];
        }
      });
    }
  });
}
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

    //////////////////////////////////////////////////////
    // 🔍 GET MAPPINGS
    //////////////////////////////////////////////////////
    const mappings = await prisma.mapping.findMany({
      where: { fileId: file.id }
    });

    //////////////////////////////////////////////////////
    // 📤 SET RESPONSE HEADERS (IMPORTANT)
    //////////////////////////////////////////////////////
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=report.xlsx"
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    //////////////////////////////////////////////////////
    // 🚀 STREAMING WORKBOOK
    //////////////////////////////////////////////////////
    const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
      stream: res
    });

    const worksheet = workbook.addWorksheet("Report");

    let headersWritten = false;

    //////////////////////////////////////////////////////
    // 🔄 PROCESS IN BATCHES
    //////////////////////////////////////////////////////
    await processRows(file.id, async (rows) => {

      // 🔁 mapping + enrich
      if (mappings.length) {
        rows = mergeMapping(rows, mappings);
        rows = await chartEngine.enrichData(rows, prisma);
      }

      // 🔍 filters
      if (filters) {
        rows = rows.filter(row =>
          Object.entries(filters).every(([k, v]) => row[k] == v)
        );
      }

      if (!rows.length) return;

      //////////////////////////////////////////////////////
      // 🧾 WRITE HEADERS (ONLY ONCE)
      //////////////////////////////////////////////////////
      if (!headersWritten) {
        worksheet.columns = Object.keys(rows[0]).map(key => ({
          header: key,
          key: key
        }));
        headersWritten = true;
      }

      //////////////////////////////////////////////////////
      // ✍️ WRITE ROWS (STREAM)
      //////////////////////////////////////////////////////
      rows.forEach(row => {
        worksheet.addRow(row).commit();
      });
    });

    //////////////////////////////////////////////////////
    // ✅ FINALIZE
    //////////////////////////////////////////////////////
    await workbook.commit();

  } catch (err) {
logger.error("Export data failed", {
  error: err.message,
  stack: err.stack
});
    res.status(500).json({ error: err.message });
  }
};
exports.getBuilderData = async (req, res) => {
  try {
    const { dashboardId } = req.params;
const { fileId, ...filters } = req.query;
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


    const mappings = await prisma.mapping.findMany({
      where: { fileId }
    });

    const columns = await prisma.dashboardColumn.findMany({
      where: { dashboardId: file.dashboardId }
    });

    const mappingService = require('../services/mappingService');

let missingData = 0;
let dataTypeErrors = 0;
let formatErrors = 0;
let duplicateRows = 0;

const seen = new Set();

let totalRows = 0;

await processRows(fileId, async (rows) => {
  totalRows += rows.length;
  if (mappings.length) {
    rows = mergeMapping(rows, mappings);
  }

  rows.forEach(row => {

    columns.forEach(col => {
      const value = row[col.columnKey];

      if (col.required && (!value || value === "")) {
        missingData++;
      }

      if (col.dataType === "NUMBER" && value && isNaN(value)) {
        dataTypeErrors++;
      }

      if (col.dataType === "DATE" && value && isNaN(new Date(value))) {
        formatErrors++;
      }
    });

    const key = JSON.stringify(row);
    if (seen.has(key)) duplicateRows++;
    seen.add(key);
  });
});
    res.json({
      totalRows,
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


    const mappings = await prisma.mapping.findMany({
      where: { fileId }
    });

    const columns = await prisma.dashboardColumn.findMany({
      where: { dashboardId: file.dashboardId }
    });

    const mappingService = require('../services/mappingService');
  
let missingData = 0;
const seen = new Set();
let totalCells = 0;

await processRows(fileId, async (rows) => {

  if (mappings.length) {
    rows = mergeMapping(rows, mappings);
  }

  rows = rows.map(row => {
    const cleaned = { ...row };

    columns.forEach(col => {
      let value = cleaned[col.columnKey];

      if (value === undefined || value === null || value === "") {
        cleaned[col.columnKey] = null;
      }

      if (col.dataType === "NUMBER") {
        cleaned[col.columnKey] = Number(value) || 0;
      }

      if (col.dataType === "DATE") {
        const d = new Date(value);
        cleaned[col.columnKey] = isNaN(d) ? null : d;
      }
    });

    return cleaned;
  });

  rows.forEach(row => {
    columns.forEach(col => {
      if (col.required && (!row[col.columnKey] || row[col.columnKey] === "")) {
        missingData++;
      }
    });
  });

  totalCells += rows.length * columns.filter(c => c.required).length;
});

const errorPercentage =
  totalCells === 0 ? 0 : (missingData / totalCells) * 100;
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
    const { fileId, ...filters } = req.query;

    //////////////////////////////////////////////////////
    // 🔍 1. GET FILE
    //////////////////////////////////////////////////////
    let finalFileId = fileId;

    if (!finalFileId) {
      const activeFile = await prisma.fileUpload.findFirst({
        where: { dashboardId, isActive: true }
      });

      if (!activeFile) {
        return res.status(400).json({
          message: "fileId required or no active file set"
        });
      }

      finalFileId = activeFile.id;
    }

    //////////////////////////////////////////////////////
    // 🔍 2. GET WIDGETS
    //////////////////////////////////////////////////////
    const defaultWidgets = await prisma.widget.findMany({
      where: { dashboardId, isDefault: true },
      orderBy: { id: "asc" }
    });

    const userWidgets = await prisma.widget.findMany({
      where: {
        dashboardId,
        createdById: req.user?.id,
        isDefault: false,
        fileId: finalFileId
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
    // 🔍 3. GET MAPPINGS
    //////////////////////////////////////////////////////
    const mappings = await prisma.mapping.findMany({
      where: { fileId: finalFileId }
    });

    //////////////////////////////////////////////////////
    // 🚀 4. STREAM PROCESSING
    //////////////////////////////////////////////////////
    let chartResults = [];

    await processRows(finalFileId, async (rows) => {

      // 🔁 mapping
      if (mappings.length) {
        rows = mergeMapping(rows, mappings);
      }

      // 🔄 enrich
      rows = await chartEngine.enrichData(rows, prisma, dashboardId);

      // 🔤 normalize keys
      const normalize = (str) =>
        String(str ?? "")
          .toLowerCase()
          .replace(/\s+/g, "_")
          .replace(/[^a-z0-9_]/g, "")
          .trim();

      rows = rows.map(row => {
        const r = {};
        Object.keys(row).forEach(k => {
          r[normalize(k)] = row[k];
        });
        return r;
      });

      // 🔍 filters
      rows = applyFilters(rows, filters);

      // 📊 batch chart generation
      const partialCharts = generateChartBatch(finalWidgets, rows);

      // 🔗 merge results
      mergeCharts(chartResults, partialCharts);
    });

    //////////////////////////////////////////////////////
    // ✅ RESPONSE
    //////////////////////////////////////////////////////
    res.json({
      dashboardId,
      fileId: finalFileId,
charts: chartResults.map(c => ({
  id: c.id,
  type: c.type,
  config: c.config,
  data: Object.values(c.data)
}))
    });

  } catch (err) {
    logger.error("Upload frontend PDF failed", {
  error: err.message,
  stack: err.stack
});
    res.status(500).json({ error: err.message });
  }
};