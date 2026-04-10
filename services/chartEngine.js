const chartService = require("./chartService");

const chartHandlers = {
    
  KPI: (rows, { metrics }) =>
    chartService.calculateKPI(rows, metrics),

  BAR: (rows, { groupBy, metrics }) =>
    chartService.groupBy(rows, groupBy, metrics),

  PIE: (rows, { groupBy, metrics }) =>
    chartService.groupBy(rows, groupBy, metrics),

  DONUT: (rows, { groupBy, metrics }) =>
    chartService.groupBy(rows, groupBy, metrics),

  LINE: (rows, { xAxis, metrics }) =>
    chartService.lineChart(rows, xAxis, metrics),

  AREA: (rows, { xAxis, metrics }) =>
    chartService.lineChart(rows, xAxis, metrics),

  MULTI_LINE: (rows, { xAxis, metrics }) =>
    chartService.lineChart(rows, xAxis, metrics),

  STACKED_BAR: (rows, { xAxis, metrics }) =>
    chartService.stacked(rows, xAxis, metrics),

  STACKED_AREA: (rows, { xAxis, metrics }) =>
    chartService.stacked(rows, xAxis, metrics),

  HORIZONTAL_BAR: (rows, { groupBy, metrics }) =>
    chartService.groupBy(rows, groupBy, metrics),

  SCATTER: (rows, { xAxis, yAxis }) =>
    chartService.scatter(rows, xAxis, yAxis),

  BUBBLE: (rows, { xAxis, yAxis, metrics }) =>
    chartService.bubble(rows, xAxis, yAxis, metrics?.[0]),

  HEATMAP: (rows, { xAxis, yAxis, metrics }) =>
    chartService.heatmap(rows, xAxis, yAxis, metrics?.[0]),

  RADAR: (rows, { groupBy, metrics }) =>
    chartService.radar(rows, groupBy, metrics),

  GAUGE: (rows, { metrics }) =>
    chartService.gauge(rows, metrics),

  HISTOGRAM: (rows, { xAxis }) =>
    chartService.histogram(rows, xAxis),

  WATERFALL: (rows, { metrics }) =>
    chartService.waterfall(rows, metrics),

  TABLE: (rows) => rows,

  FUNNEL: (rows, { steps }) =>
    chartService.funnel(rows, steps)
  
};

exports.generateChart = (type, rows, config = {}) => {
const handler = chartHandlers[type?.toUpperCase()];
  if (!handler) return [];

  //////////////////////////////////////////////////////
  // 🔥 NORMALIZE CONFIG (MAIN FIX)
  //////////////////////////////////////////////////////

  const normalize = (val) =>
    Array.isArray(val) ? val[0] : val;

  const normalizedConfig = {
    ...config,
    groupBy: normalize(config.groupBy),
    xAxis: normalize(config.xAxis),
    yAxis: normalize(config.yAxis),
    metrics: Array.isArray(config.metrics)
      ? config.metrics
      : config.metrics
      ? [config.metrics]
      : []
  };

  //////////////////////////////////////////////////////
  // 🔥 SPECIAL CASE (already you added)
  //////////////////////////////////////////////////////
  if (["HEATMAP", "BUBBLE"].includes(type) && !normalizedConfig.metrics.length) {
    return [];
  }

  return handler(rows, normalizedConfig);
};