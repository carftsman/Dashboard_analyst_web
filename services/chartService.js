const parseNumber = (val) => {
  if (val === null || val === undefined) return 0;
  return Number(String(val).replace(/,/g, "")) || 0;
};
//////////////////////////////////////////////////////
// ✅ SAFE EVAL (PUT AT TOP)
//////////////////////////////////////////////////////
const safeEval = (formula, row) => {
  try {
    if (!formula) return undefined;

    const allowed = /^[0-9+\-*/().\s\w]+$/;
    if (!allowed.test(formula)) return undefined;

    const tokens = formula.match(/[a-zA-Z_]\w*/g) || [];

    let expr = formula;

    tokens.forEach(token => {
      const val = Number(row[token]) || 0;
      expr = expr.replace(new RegExp(`\\b${token}\\b`, "g"), val);
    });

    return Function(`"use strict"; return (${expr})`)();

  } catch {
    return undefined;
  }
};
exports.calculateKPI = (data = [], metrics = []) => {
  return metrics.map(metric => ({
    name: metric,
    value: data.reduce((sum, row) => {
      return sum + parseNumber(row?.[metric]);
    }, 0)
  }));
};
exports.groupBy = (data = [], key, metrics = []) => {
  if (!key || !Array.isArray(metrics) || metrics.length === 0) return [];

  const map = {};

  data.forEach(row => {
    let group = row?.[key];

    if (!group || group === "undefined") {
      group = "Unknown";
    }

    if (!map[group]) {
  map[group] = { name: group, value: 0 }; // ✅ ADD
  metrics.forEach(m => (map[group][m] = 0));
}

metrics.forEach(m => {
  const val = parseNumber(row?.[m]);
  map[group][m] += val;
  map[group].value += val; // ✅ ADD
});
  });

  return Object.values(map);
};
exports.lineChart = (data = [], xAxis, metrics = []) => {
  if (!xAxis || !Array.isArray(metrics) || metrics.length === 0) return [];

  const map = {};

  //////////////////////////////////////////////////////
  // ✅ STRICT DATE FORMATTER
  //////////////////////////////////////////////////////
 const formatDate = (val) => {
  if (!val) return null;

  //////////////////////////////////////////////////////
  // ONLY handle numbers if it's ACTUAL number
  //////////////////////////////////////////////////////
  if (typeof val === "number") {
    const date = new Date((val - 25569) * 86400 * 1000);
    return date.toISOString().split("T")[0];
  }

  //////////////////////////////////////////////////////
  // HANDLE STRING PROPERLY
  //////////////////////////////////////////////////////
  if (typeof val === "string") {
    const clean = val.replace(/,/g, "").trim();

    // Try native parser
    const native = new Date(clean);
    if (!isNaN(native)) {
      return native.toISOString().split("T")[0];
    }

    // Custom parse: 1-Mar-26
    const parts = clean.split("-");
    if (parts.length === 3) {
      let [day, mon, year] = parts;

      const months = {
        jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
        jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
      };

      const m = months[mon.toLowerCase()];
      if (m === undefined) return null;

      if (year.length === 2) year = "20" + year;

      const d = new Date(Number(year), m, Number(day));

      if (!isNaN(d)) {
        return d.toISOString().split("T")[0];
      }
    }
  }

  return null;
};

  //////////////////////////////////////////////////////
  // 🔥 ONLY ACCEPT VALID DATES
  //////////////////////////////////////////////////////
  data.forEach(row => {

  // 🔥 SAFETY CHECK (ADD HERE)
  if (
    typeof row?.[xAxis] !== "string" &&
    typeof row?.[xAxis] !== "number"
  ) {
    return;
  }

  const x = formatDate(row?.[xAxis]);

  if (!x) return;

  if (!map[x]) {
    map[x] = { x, value: 0 }; // ✅ ADD THIS
    metrics.forEach(m => (map[x][m] = 0));
  }

  metrics.forEach(m => {
  const val = parseNumber(row?.[m]);
  map[x][m] += val;
  map[x].value += val; // ✅ ADD THIS
});
});
  //////////////////////////////////////////////////////
  // 🔥 SORT BY DATE
  //////////////////////////////////////////////////////
  return Object.values(map).sort((a, b) => new Date(a.x) - new Date(b.x));
};
exports.funnel = (data = [], steps = []) => {
  if (!Array.isArray(steps) || steps.length === 0) return [];

  return steps.map(step => ({
    name: step,
    value: data.reduce((sum, row) => {
const val = parseNumber(row?.[step]);
      return sum + (isNaN(val) ? 0 : val);
    }, 0)
  }));
};
exports.scatter = (data = [], xAxis, yAxis) => {
  if (!xAxis || !yAxis) return [];

  return data
    .map(row => {
      const x = parseNumber(row?.[xAxis]);
      const y = parseNumber(row?.[yAxis]);

      if (isNaN(x) || isNaN(y)) return null;

      return { x, y };
    })
    .filter(Boolean);
};
exports.bubble = (data = [], xAxis, yAxis, sizeKey) => {
  if (!xAxis || !yAxis || !sizeKey) return [];

  return data
    .map(row => {
      const x = parseNumber(row?.[xAxis]);
      const y = parseNumber(row?.[yAxis]);
      const size = parseNumber(row?.[sizeKey]);

      if (isNaN(x) || isNaN(y) || isNaN(size)) return null;

      return { x, y, size };
    })
    .filter(Boolean);
};exports.heatmap = (data = [], xAxis, yAxis, valueKey) => {
  if (!xAxis || !yAxis || !valueKey) return [];

  const map = {};

  data.forEach(row => {
    const x = row?.[xAxis];
    const y = row?.[yAxis];
    const value = parseNumber(row?.[valueKey]);

    if (!x || !y) return;

    const key = `${x}_${y}`;

    if (!map[key]) {
      map[key] = { x, y, value: 0 };
    }

    map[key].value += value;
  });

  return Object.values(map);
};exports.stacked = (data = [], xAxis, metrics = []) => {
  if (!xAxis || !metrics.length) return [];

  const map = {};

  data.forEach(row => {
    const x = row?.[xAxis] || "Unknown";

    if (!map[x]) {
      map[x] = { x, value: 0 }; // ✅ ADD THIS
      metrics.forEach(m => (map[x][m] = 0));
    }

    metrics.forEach(m => {
  const val = parseNumber(row?.[m]);
  map[x][m] += val;
  map[x].value += val; // ✅ ADD THIS
});
  });

  return Object.values(map);
};exports.treemap = (data = [], groupBy, metrics = []) => {
  if (!groupBy || !metrics.length) return [];

  return data.map(row => ({
    name: row[groupBy],
    value: parseNumber(row[metrics[0]])
  }));
};
exports.radar = (data, groupBy, metrics = []) => {
  return data.map(row => ({
    name: row[groupBy],
    value: Number(row[metrics[0]]) || 0
  }));
};
exports.gauge = (data = [], metrics = []) => {
  if (!metrics.length) return [];

  const total = data.reduce((sum, row) => {
    return sum + parseNumber(row[metrics[0]]);
  }, 0);

  return [{ value: total }];
};exports.histogram = (data = [], key) => {
  if (!key) return [];

  const bins = {};

  data.forEach(row => {
    const val = parseNumber(row[key]);
    const bucket = Math.floor(val / 10) * 10;

    bins[bucket] = (bins[bucket] || 0) + 1;
  });

return Object.entries(bins).map(([range, count]) => ({
  name: range,
  value: count
}));
};
exports.waterfall = (data, metrics = []) => {
  let cumulative = 0;

  return data.map(row => {
    const value = Number(row[metrics[0]]) || 0;
    const start = cumulative;
    cumulative += value;

    return {
      name: row.label || "Step",
      value,
      start,
      cumulative
    };
  });
};
exports.enrichData = async (rows, prisma, dashboardId) => {

  if (!prisma || !prisma.formula) return rows;

  const formulas = await prisma.formula.findMany({
    where: {
      isActive: true,
      ...(dashboardId && { dashboardId })
    }
  });

  return rows.map(row => {
    const r = { ...row };

    formulas.forEach(f => {
      const val = safeEval(f.formula, r);
      if (val !== undefined && !isNaN(val)) {
        r[f.field] = val;
      }
    });

    return r;
  });
};