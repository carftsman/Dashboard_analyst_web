const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

const width = 800;
const height = 400;

const canvas = new ChartJSNodeCanvas({ width, height });

exports.generateChartImage = async (type, data) => {

  if (!data || data.length === 0) return null;

  let config;

  if (type === "bar") {
    config = {
      type: 'bar',
      data: {
        labels: data.map(d => d.name),
        datasets: [{
          label: "Value",
          data: data.map(d => Object.values(d)[1])
        }]
      }
    };
  }

  else if (type === "line") {
    config = {
      type: 'line',
      data: {
        labels: data.map(d => d.x),
        datasets: [{
          label: "Value",
          data: data.map(d => Object.values(d)[1])
        }]
      }
    };
  }

  else if (type === "pie") {
    config = {
      type: 'pie',
      data: {
        labels: data.map(d => d.name),
        datasets: [{
          data: data.map(d => Object.values(d)[1])
        }]
      }
    };
  }

  else if (type === "scatter") {
    config = {
      type: 'scatter',
      data: {
        datasets: [{
          label: "Scatter",
          data
        }]
      }
    };
  }

  else {
    return null;
  }

  return await canvas.renderToDataURL(config);
};