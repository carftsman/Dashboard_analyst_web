const safeEval = require("../utils/safeEval");

exports.applyMapping = (rows = [], mappings = []) => {
  if (!Array.isArray(mappings) || mappings.length === 0) return rows;

  return rows.map(row => {
    const mapped = {};

    mappings.forEach(m => {
      const templateKey = m.templateField;
      const fileKey = m.fileColumn;

      //////////////////////////////////////////////////////
      // 🔥 SAFE KEY MATCH (IMPORTANT FIX)
      //////////////////////////////////////////////////////
      const normalizedFileKey = fileKey
        ?.toLowerCase()
        .replace(/\s+/g, "_")
        .trim();

      const matchedKey = Object.keys(row).find(k =>
        k.toLowerCase().replace(/\s+/g, "_").trim() === normalizedFileKey
      );

const normalizedTemplateKey = templateKey
  ?.toLowerCase()
  .replace(/\s+/g, "_")
  .trim();

//////////////////////////////////////////////////////
// 🔥 FINAL FIX (NO MORE NULL DATA)
//////////////////////////////////////////////////////

mapped[normalizedTemplateKey] =
  matchedKey !== undefined
    ? row[matchedKey]
    : row[fileKey] !== undefined
    ? row[fileKey]
    : row[normalizedFileKey] !== undefined
    ? row[normalizedFileKey]
    : null; });

    return mapped;
  });
};
exports.calculateKPI = (data, metrics = []) => {
  return metrics.map(metric => ({
    name: metric,
    value: data.reduce((sum, row) => {
      const val = Number(row?.[metric]) || 0;
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
      const val = Number(row?.[m]) || 0;
      map[group][m] += val;
      map[group].value += val;
    });
  });

  return Object.values(map);
};
exports.lineChart = (data, xAxis, metrics = []) => {
  const map = {};

  data.forEach(row => {
    const x = row?.[xAxis] || "Unknown";

    if (!map[x]) {
      map[x] = { x, value: 0 }; // ✅ FIX
      metrics.forEach(m => (map[x][m] = 0));
    }

    metrics.forEach(m => {
      const val = Number(row?.[m]) || 0;
      map[x][m] += val;
      map[x].value += val; // ✅ FIX (CRITICAL)
    });
  });

  return Object.values(map);
};
exports.funnel = (data, steps = []) => {
  if (!Array.isArray(steps) || steps.length === 0) return [];

  return steps.map(step => ({
    name: step,
    value: data.reduce((sum, row) => {
      const val = Number(row?.[step]);
      return sum + (isNaN(val) ? 0 : val);
    }, 0)
  }));
};
exports.scatter = (data, xAxis, yAxis) => {
  return data
    .map(row => {
      const x = Number(row?.[xAxis]);
      const y = Number(row?.[yAxis]);

      if (isNaN(x) || isNaN(y)) return null;

      return { x, y };
    })
    .filter(Boolean);
};