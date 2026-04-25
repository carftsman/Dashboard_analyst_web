const safeEval = require("../utils/safeEval");

//////////////////////////////////////////////////////
// 🔥 ENRICH (SAFE DEFAULT)
//////////////////////////////////////////////////////
exports.enrichData = async (rows, prisma, dashboardId = null) => {
  return rows;
};

//////////////////////////////////////////////////////
// 🔥 HELPERS
//////////////////////////////////////////////////////
const parseNumber = (val) => {
  if (val === null || val === undefined) return 0;
  return Number(String(val).replace(/,/g, "")) || 0;
};

//////////////////////////////////////////////////////
// 🔥 CORE FUNCTIONS (MOVED HERE)
//////////////////////////////////////////////////////
const calculateKPI = (data, metrics = []) => {
  return metrics.map(metric => ({
    name: metric,
    value: data.reduce((sum, row) => {
      const val = parseNumber(row?.[metric]);
      return sum + val;
    }, 0)
  }));
};

const groupByFn = (data, key, metrics = []) => {
  const map = {};

  data.forEach(row => {
    const group = row?.[key] || "Unknown";

    if (!map[group]) {
      map[group] = { name: group, value: 0 };
      metrics.forEach(m => (map[group][m] = 0));
    }

    metrics.forEach(m => {
      const val = parseNumber(row?.[m]);
      map[group][m] += val;
      map[group].value += val;
    });
  });

  return Object.values(map);
};

const lineChart = (data, xAxis, metrics = []) => {
  const map = {};

  data.forEach(row => {
    const x = row?.[xAxis] || "Unknown";

    if (!map[x]) {
      map[x] = { x, value: 0 };
      metrics.forEach(m => (map[x][m] = 0));
    }

    metrics.forEach(m => {
      const val = parseNumber(row?.[m]);
      map[x][m] += val;
      map[x].value += val;
    });
  });

  return Object.values(map);
};

const funnel = (data, steps = []) => {
  if (!Array.isArray(steps) || steps.length === 0) return [];

  return steps.map(step => ({
    name: step,
    value: data.reduce((sum, row) => {
      const val = parseNumber(row?.[step]);
      return sum + val;
    }, 0)
  }));
};

const scatter = (data, xAxis, yAxis) => {
  return data
    .map(row => {
      const x = parseNumber(row?.[xAxis]);
      const y = parseNumber(row?.[yAxis]);

      if (isNaN(x) || isNaN(y)) return null;

      return { x, y };
    })
    .filter(Boolean);
};

//////////////////////////////////////////////////////
// 🔥 SAFE FALLBACK (for missing charts)
//////////////////////////////////////////////////////
const safe = (fn) => (...args) => {
  try {
    return typeof fn === "function" ? fn(...args) : [];
  } catch {
    return [];
  }
};

//////////////////////////////////////////////////////
// 🔥 HANDLERS
//////////////////////////////////////////////////////
const chartHandlers = {
  KPI: (rows, { metrics }) => calculateKPI(rows, metrics),

  BAR: (rows, { groupBy, metrics }) =>
    groupByFn(rows, groupBy, metrics),

  PIE: (rows, { groupBy, metrics }) =>
    groupByFn(rows, groupBy, metrics),

  DONUT: (rows, { groupBy, metrics }) =>
    groupByFn(rows, groupBy, metrics),

  LINE: (rows, { xAxis, metrics }) =>
    lineChart(rows, xAxis, metrics),

  AREA: (rows, { xAxis, metrics }) =>
    lineChart(rows, xAxis, metrics),

  MULTI_LINE: (rows, { xAxis, metrics }) =>
    lineChart(rows, xAxis, metrics),

  HORIZONTAL_BAR: (rows, { groupBy, metrics }) =>
    groupByFn(rows, groupBy, metrics),

  SCATTER: (rows, { xAxis, yAxis }) =>
    scatter(rows, xAxis, yAxis),

  FUNNEL: (rows, { steps }) =>
    funnel(rows, steps),

  TABLE: (rows) => rows,

  // 🔥 SAFE placeholders
  STACKED_BAR: safe(() => []),
  STACKED_AREA: safe(() => []),
  BUBBLE: safe(() => []),
  HEATMAP: safe(() => []),
  RADAR: safe(() => []),
  GAUGE: safe(() => []),
  HISTOGRAM: safe(() => []),
  WATERFALL: safe(() => [])
};

//////////////////////////////////////////////////////
// 🔥 MAIN GENERATOR
//////////////////////////////////////////////////////
exports.generateChart = (type, rows, config = {}) => {
  const handler = chartHandlers[type?.toUpperCase()];
  if (!handler) return [];

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

  if (
    ["HEATMAP", "BUBBLE"].includes(type) &&
    !normalizedConfig.metrics.length
  ) {
    return [];
  }

  return handler(rows, normalizedConfig);
};