const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

exports.generateChartImage = async (type, data = []) => {

if (!data || !Array.isArray(data) || data.length === 0) {
logger.warn("Skipping empty chart - no data");
  return null;
}
  const canvas = new ChartJSNodeCanvas({
    width: 800,
    height: 400,
    backgroundColour: 'white'
  });

  const chartType = type.toLowerCase();

  const parseNumber = (val) => {
    const num = Number(String(val).replace(/,/g, ""));
    return isNaN(num) ? 0 : num;
  };

  //////////////////////////////////////////////////////
  // 🔥 SAFE LABEL GENERATION
  //////////////////////////////////////////////////////
  const labels = data.map((d, i) => {
    return d.name || d.x || `Item ${i + 1}`;
  });

  //////////////////////////////////////////////////////
  // 🔥 SAFE KEYS
  //////////////////////////////////////////////////////
  let keys = Object.keys(data[0] || {}).filter(k => !["name", "x"].includes(k));

  if (!keys.length) {
    keys = ["value"];
    data = data.map(d => ({ value: Object.values(d)[0] || 0 }));
  }

  const datasets = keys.map((k) => ({
    label: k,
    data: data.map(d => parseNumber(d[k])),
    borderWidth: 2
  }));

  let config;

  //////////////////////////////////////////////////////
  // BAR / LINE
  //////////////////////////////////////////////////////
  if (["bar", "line"].includes(chartType)) {
    config = {
      type: chartType,
      data: { labels, datasets }
    };
  }

  //////////////////////////////////////////////////////
  // PIE / DONUT
  //////////////////////////////////////////////////////
  else if (["pie", "donut"].includes(chartType)) {
    config = {
      type: chartType === "donut" ? "doughnut" : "pie",
      data: {
        labels,
        datasets: [{
          data: data.map(d => parseNumber(d[keys[0]])),
          backgroundColor: labels.map((_, i) =>
            `hsl(${(i * 360) / labels.length}, 70%, 60%)`
          )
        }]
      }
    };
  }

  //////////////////////////////////////////////////////
  // SCATTER
  //////////////////////////////////////////////////////
  else if (chartType === "scatter") {
    config = {
      type: 'scatter',
      data: {
        datasets: [{
          label: "Scatter",
          data: data.map(d => ({
            x: parseNumber(d.x),
            y: parseNumber(d.y)
          }))
        }]
      }
    };
  }

  //////////////////////////////////////////////////////
  // FUNNEL
  //////////////////////////////////////////////////////
  else if (chartType === "funnel") {

    const values = data.map(d => parseNumber(d.value));
    const max = Math.max(...values, 1);

    config = {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: "Funnel",
          data: values.map(v => (v / max) * 100)
        }]
      },
      options: {
        indexAxis: 'y'
      }
    };
  }

  //////////////////////////////////////////////////////
  // DEFAULT
  //////////////////////////////////////////////////////
  else {
    config = {
      type: 'bar',
      data: { labels, datasets }
    };
  }

  try {
logger.info("Rendering chart", { type: chartType });
    return await canvas.renderToDataURL(config);
  } catch (err) {
logger.error("Chart render failed", {
  type: chartType,
  error: err.message
});    return null;
  }
};