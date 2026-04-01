const safeEval = (formula, row) => {
  try {
    if (!formula) return undefined;

    // Only allow math + variables
    const allowed = /^[0-9+\-*/().\s\w]+$/;
    if (!allowed.test(formula)) return undefined;

    // Replace variables safely
    const tokens = formula.match(/[a-zA-Z_]\w*/g) || [];

    let expr = formula;

    tokens.forEach(token => {
      const val = Number(row[token]) || 0;
      expr = expr.replace(new RegExp(`\\b${token}\\b`, "g"), val);
    });

    // Evaluate safely using Function but strict input
    return Function(`"use strict"; return (${expr})`)();

  } catch {
    return undefined;
  }
};

exports.applyMapping = (rows = [], mappings = []) => {
  if (!Array.isArray(mappings) || mappings.length === 0) return rows;

  return rows.map(row => {
    const mapped = {};

    mappings.forEach(m => {
      const templateKey = m.templateField;
      const fileKey = m.fileColumn;

      mapped[templateKey] = row[fileKey];
    });

    return mapped;
  });
};
//////////////////////////////////////////////////////
// ✅ KPI
//////////////////////////////////////////////////////
exports.calculateKPI = (data, metrics = []) => {
  return metrics.reduce((acc, metric) => {
    acc[metric] = data.reduce((sum, row) => {
      const val = Number(row?.[metric]);
      return sum + (isNaN(val) ? 0 : val);
    }, 0);
    return acc;
  }, {});
};

exports.groupBy = (data, key, metrics = []) => {
  const map = {};

  data.forEach(row => {
    const group = row?.[key] || "Unknown";

    if (!map[group]) {
      map[group] = { name: group };
      metrics.forEach(m => (map[group][m] = 0));
    }

    metrics.forEach(m => {
      const val = Number(row?.[m]);
      map[group][m] += isNaN(val) ? 0 : val;
    });
  });

  return Object.values(map);
};

//////////////////////////////////////////////////////
// ✅ LINE / AREA / STACKED
//////////////////////////////////////////////////////
exports.lineChart = (data, xAxis, metrics = []) => {
  const map = {};

  data.forEach(row => {
    const x = row?.[xAxis] || "Unknown";

    if (!map[x]) {
      map[x] = { x };
      metrics.forEach(m => (map[x][m] = 0));
    }

    metrics.forEach(m => {
      const val = Number(row?.[m]);
      map[x][m] += isNaN(val) ? 0 : val;
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