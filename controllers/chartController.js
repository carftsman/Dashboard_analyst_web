exports.getChartTypesConfig = async (req, res) => {
  try {
    const charts = [
      {
        type: "KPI",
        title: "KPI Card",
        requiredFields: ["metrics"],
        fields: {
          metrics: { type: "array" }
        }
      },
      {
        type: "BAR",
        title: "Bar Chart",
        requiredFields: ["groupBy", "metrics"],
        fields: {
          groupBy: { type: "string" },
          metrics: { type: "array" }
        }
      },
      {
        type: "LINE",
        title: "Line Chart",
        requiredFields: ["xAxis", "metrics"],
        fields: {
          xAxis: { type: "string" },
          metrics: { type: "array" }
        }
      },
      {
        type: "PIE",
        title: "Pie Chart",
        requiredFields: ["groupBy", "metrics"],
        fields: {
          groupBy: { type: "string" },
          metrics: { type: "array" }
        }
      },
      {
        type: "DONUT",
        title: "Donut Chart",
        requiredFields: ["groupBy", "metrics"],
        fields: {
          groupBy: { type: "string" },
          metrics: { type: "array" }
        }
      },
      {
        type: "AREA",
        title: "Area Chart",
        requiredFields: ["xAxis", "metrics"],
        fields: {
          xAxis: { type: "string" },
          metrics: { type: "array" }
        }
      },
      {
        type: "STACKED_BAR",
        title: "Stacked Bar",
        requiredFields: ["xAxis", "metrics"],
        fields: {
          xAxis: { type: "string" },
          metrics: { type: "array" }
        }
      },
      {
        type: "SCATTER",
        title: "Scatter",
        requiredFields: ["xAxis", "yAxis"],
        fields: {
          xAxis: { type: "string" },
          yAxis: { type: "string" }
        }
      },
      {
        type: "FUNNEL",
        title: "Funnel",
        requiredFields: ["steps"],
        fields: {
          steps: { type: "array" }
        }
      },
      {
        type: "TABLE",
        title: "Table",
        requiredFields: ["columns"],
        fields: {
          columns: { type: "array" }
        }
      }
    ];

    res.json({ total: charts.length, charts });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};