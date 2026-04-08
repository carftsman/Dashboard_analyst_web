exports.getChartTypesConfig = async (req, res) => {
  try {

    ////////////////////////////////////////////////////////
    // 🔥 CENTRAL CONFIG (REUSABLE)
    ////////////////////////////////////////////////////////
    const charts = [
      { type: "KPI", title: "KPI Card", fields: ["metrics"] },

      { type: "BAR", title: "Bar Chart", fields: ["groupBy", "metrics"] },
      { type: "HORIZONTAL_BAR", title: "Horizontal Bar", fields: ["groupBy", "metrics"] },

      { type: "LINE", title: "Line Chart", fields: ["xAxis", "metrics"] },
      { type: "MULTI_LINE", title: "Multi Line", fields: ["xAxis", "metrics"] },
      { type: "AREA", title: "Area Chart", fields: ["xAxis", "metrics"] },

      { type: "STACKED_BAR", title: "Stacked Bar", fields: ["xAxis", "metrics"] },
      { type: "STACKED_AREA", title: "Stacked Area", fields: ["xAxis", "metrics"] },

      { type: "PIE", title: "Pie Chart", fields: ["groupBy", "metrics"] },
      { type: "DONUT", title: "Donut Chart", fields: ["groupBy", "metrics"] },

      { type: "SCATTER", title: "Scatter", fields: ["xAxis", "yAxis"] },
      { type: "BUBBLE", title: "Bubble Chart", fields: ["xAxis", "yAxis", "metrics"] },

      { type: "HEATMAP", title: "Heatmap", fields: ["xAxis", "yAxis", "metrics"] },

      { type: "RADAR", title: "Radar", fields: ["groupBy", "metrics"] },

      { type: "FUNNEL", title: "Funnel", fields: ["steps"] },
      { type: "GAUGE", title: "Gauge", fields: ["metrics"] },

      { type: "HISTOGRAM", title: "Histogram", fields: ["xAxis"] },
      { type: "WATERFALL", title: "Waterfall", fields: ["metrics"] },

      { type: "TABLE", title: "Table", fields: ["columns"] }
    ];

    ////////////////////////////////////////////////////////
    // 🔥 AUTO-GENERATE FIELD STRUCTURE (DYNAMIC)
    ////////////////////////////////////////////////////////
    const fieldTypes = {
      xAxis: { type: "string" },
      yAxis: { type: "string" },
      groupBy: { type: "string" },
      metrics: { type: "array" },
      steps: { type: "array" },
      columns: { type: "array" }
    };

    const finalCharts = charts.map(chart => ({
      type: chart.type,
      title: chart.title,
      requiredFields: chart.fields,
      fields: chart.fields.reduce((acc, field) => {
        acc[field] = fieldTypes[field] || { type: "string" };
        return acc;
      }, {})
    }));

    ////////////////////////////////////////////////////////
    // ✅ RESPONSE
    ////////////////////////////////////////////////////////
    res.json({
      total: finalCharts.length,
      charts: finalCharts
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};