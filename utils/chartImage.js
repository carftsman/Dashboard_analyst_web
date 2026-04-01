const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

const width = 800;
const height = 400;

const canvas = new ChartJSNodeCanvas({
  width,
  height,
  backgroundColour: 'white'
});

// ✅ SAFE NUMBER PARSER
const parseNumber = (val) => {
  if (val === null || val === undefined) return 0;
  return Number(String(val).replace(/,/g, "")) || 0;
};

// ✅ GENERIC DATA EXTRACTOR
const extractKeys = (data, exclude = []) => {
  return Object.keys(data[0] || {}).filter(k => !exclude.includes(k));
};

exports.generateChartImage = async (type, data = []) => {

  if (!data || data.length === 0) return null;

  let config;
  const chartType = type.toLowerCase();

  //////////////////////////////////////////////////////
  // COMMON HELPERS
  //////////////////////////////////////////////////////
  const labelsName = data.map(d => d.name || d.x || "Unknown");
let keysName = extractKeys(data, ["name", "x"]);

if (keysName.length === 0) {
  keysName = ["value"]; // fallback
}
  const buildDatasets = (keys) =>
    keys.map((k, i) => ({
      label: k,
      data: data.map(d => parseNumber(d[k])),
      borderWidth: 2
    }));

  //////////////////////////////////////////////////////
  // 1. BAR / STACKED BAR
  //////////////////////////////////////////////////////
  if (chartType === "bar" || chartType === "stacked_bar") {
    config = {
      type: 'bar',
      data: {
        labels: labelsName,
        datasets: buildDatasets(keysName)
      },
      options: chartType === "stacked_bar" ? {
        scales: { x: { stacked: true }, y: { stacked: true } }
      } : {}
    };
  }

  //////////////////////////////////////////////////////
  // 2. LINE / AREA
  //////////////////////////////////////////////////////
  else if (chartType === "line" || chartType === "area") {
    config = {
      type: 'line',
      data: {
        labels: labelsName,
        datasets: buildDatasets(keysName).map(ds => ({
          ...ds,
          fill: chartType === "area"
        }))
      }
    };
  }

  //////////////////////////////////////////////////////
  // 3. PIE / DONUT
  //////////////////////////////////////////////////////
  else if (chartType === "pie" || chartType === "donut") {
    config = {
      type: chartType === "donut" ? 'doughnut' : 'pie',
      data: {
        labels: labelsName,
        datasets: [{
          data: data.map(d => parseNumber(d[keysName[0]]))
        }]
      }
    };
  }

  //////////////////////////////////////////////////////
  // 4. SCATTER
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
  // 5. RADAR
  //////////////////////////////////////////////////////
  else if (chartType === "radar") {
    config = {
      type: 'radar',
      data: {
        labels: labelsName,
        datasets: buildDatasets(keysName)
      }
    };
  }

  //////////////////////////////////////////////////////
  // 6. POLAR AREA
  //////////////////////////////////////////////////////
  else if (chartType === "polar") {
    config = {
      type: 'polarArea',
      data: {
        labels: labelsName,
        datasets: [{
          data: data.map(d => parseNumber(Object.values(d)[1]))
        }]
      }
    };
  }

  //////////////////////////////////////////////////////
  // 7. BUBBLE
  //////////////////////////////////////////////////////
  else if (chartType === "bubble") {
    config = {
      type: 'bubble',
      data: {
        datasets: [{
          label: "Bubble",
          data: data.map(d => ({
            x: parseNumber(d.x),
            y: parseNumber(d.y),
            r: parseNumber(d.r || 5)
          }))
        }]
      }
    };
  }

  //////////////////////////////////////////////////////
  // 8. HORIZONTAL BAR
  //////////////////////////////////////////////////////
  else if (chartType === "horizontal_bar") {
    config = {
      type: 'bar',
      data: {
        labels: labelsName,
        datasets: buildDatasets(keysName)
      },
      options: {
        indexAxis: 'y'
      }
    };
  }

  //////////////////////////////////////////////////////
  // 9. MULTI-LINE
  //////////////////////////////////////////////////////
  else if (chartType === "multi_line") {
    config = {
      type: 'line',
      data: {
        labels: labelsName,
        datasets: buildDatasets(keysName)
      }
    };
  }

  //////////////////////////////////////////////////////
  // 10. MIXED (BAR + LINE)
  //////////////////////////////////////////////////////
  else if (chartType === "combo") {
    config = {
      data: {
        labels: labelsName,
        datasets: keysName.map((k, i) => ({
          type: i % 2 === 0 ? 'bar' : 'line',
          label: k,
          data: data.map(d => parseNumber(d[k]))
        }))
      }
    };
  }

  //////////////////////////////////////////////////////
  // 11. SIMPLE KPI BAR (fallback)
  //////////////////////////////////////////////////////
  else if (chartType === "kpi_bar") {
    config = {
      type: 'bar',
      data: {
        labels: Object.keys(data[0] || {}),
        datasets: [{
          label: "KPI",
          data: Object.values(data[0] || {}).map(parseNumber)
        }]
      }
    };
  }

  //////////////////////////////////////////////////////
  // DEFAULT FALLBACK
  //////////////////////////////////////////////////////
  else {
    config = {
      type: 'bar',
      data: {
        labels: labelsName,
        datasets: buildDatasets(keysName)
      }
    };
  }
console.log("CHART TYPE:", chartType);
console.log("DATA:", data);
  //////////////////////////////////////////////////////
  // RENDER
  //////////////////////////////////////////////////////
  return await canvas.renderToDataURL(config);
};