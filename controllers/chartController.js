const prisma = require('../prisma/prismaClient');

//////////////////////////////////////////////////////
// ✅ CHART TYPES CONFIG (STATIC)
//////////////////////////////////////////////////////
exports.getChartTypesConfig = async (req, res) => {
  try {
    const charts = [
      { type: "KPI", title: "KPI Card", requiredFields: ["metrics"], fields: { metrics: { type: "array" } } },
      { type: "BAR", title: "Bar Chart", requiredFields: ["xAxis", "yAxis"], fields: { xAxis: { type: "string" }, yAxis: { type: "number" } } },
      { type: "LINE", title: "Line Chart", requiredFields: ["xAxis", "metrics"], fields: { xAxis: { type: "string" }, metrics: { type: "array" } } },
      { type: "PIE", title: "Pie Chart", requiredFields: ["groupBy", "metric"], fields: { groupBy: { type: "string" }, metric: { type: "number" } } },
      { type: "DONUT", title: "Donut Chart", requiredFields: ["groupBy", "metric"], fields: { groupBy: { type: "string" }, metric: { type: "number" } } },
      { type: "AREA", title: "Area Chart", requiredFields: ["xAxis", "metrics"], fields: { xAxis: { type: "string" }, metrics: { type: "array" } } },
      { type: "STACKED_BAR", title: "Stacked Bar", requiredFields: ["xAxis", "metrics"], fields: { xAxis: { type: "string" }, metrics: { type: "array" } } },
      { type: "COMBO", title: "Combo Chart", requiredFields: ["xAxis", "columns", "lines"], fields: { xAxis: { type: "string" }, columns: { type: "array" }, lines: { type: "array" } } },
      { type: "SCATTER", title: "Scatter", requiredFields: ["xAxis", "yAxis"], fields: { xAxis: { type: "number" }, yAxis: { type: "number" } } },
      { type: "FUNNEL", title: "Funnel", requiredFields: ["steps"], fields: { steps: { type: "array" } } },
      { type: "TABLE", title: "Table", requiredFields: ["columns"], fields: { columns: { type: "array" } } }
    ];

    res.json({ total: charts.length, charts });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

