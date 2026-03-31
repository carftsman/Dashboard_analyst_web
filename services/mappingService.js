//////////////////////////////////////////////////////
// 🔥 DYNAMIC FORMULAS (ADD ANYTIME - NO CODE CHANGE)
//////////////////////////////////////////////////////
const formulas = [
  { field: "leads", formula: "clicks * 0.1" },
  { field: "orders", formula: "clicks * 0.05" },
  { field: "revenue", formula: "orders * 1000 || ad_spend * 2" },

  { field: "roas", formula: "ad_spend ? revenue / ad_spend : 0" },
  { field: "cpa", formula: "leads ? ad_spend / leads : 0" },
  { field: "conversion_rate", formula: "clicks ? leads / clicks : 0" },

  // future ready
  { field: "profit", formula: "revenue - ad_spend" },
  { field: "margin", formula: "revenue ? profit / revenue : 0" }
];

//////////////////////////////////////////////////////
// 🔥 SAFE FORMULA EXECUTOR
//////////////////////////////////////////////////////
const safeEval = (formula, row) => {
  try {
    const allowed = /^[0-9+\-*/().?:<>=!&| \w]+$/;

    if (!allowed.test(formula)) return undefined;

    let expr = formula;

    Object.keys(row).forEach(key => {
      const value = row[key] ?? 0;
      const regex = new RegExp(`\\b${key}\\b`, "g");
      expr = expr.replace(regex, Number(value) || 0);
    });

    return new Function(`return (${expr})`)(); // still controlled
  } catch {
    return undefined;
  }
};

//////////////////////////////////////////////////////
// ✅ KPI (FIXED - NO HARD ZERO)
//////////////////////////////////////////////////////
exports.calculateKPI = (data, metrics = []) => {
  const result = {};

  metrics.forEach(metric => {
    result[metric] = data.reduce((sum, row) => {
      const val = row?.[metric];
      return sum + (val !== undefined && val !== null && !isNaN(val) ? Number(val) : 0);
    }, 0);
  });

  return result;
};

//////////////////////////////////////////////////////
// ✅ GROUP BY (FIXED)
//////////////////////////////////////////////////////
exports.groupBy = (data, key, metric) => {
  const map = {};

  data.forEach(row => {
    let group = row?.[key];

    if (!group || group === "undefined") {
      group = "Unknown";
    }

    const val = row?.[metric];
    const value =
      val !== undefined && val !== null && !isNaN(val)
        ? Number(val)
        : 0;

    if (!map[group]) map[group] = 0;
    map[group] += value;
  });

  return Object.entries(map).map(([name, value]) => ({
    name,
    value
  }));
};

//////////////////////////////////////////////////////
// ✅ LINE CHART (FIXED)
//////////////////////////////////////////////////////
exports.lineChart = (data, xAxis, metrics = []) => {
  const map = {};

  data.forEach(row => {
    const x = row?.[xAxis] ?? "Unknown";

    if (!map[x]) {
      map[x] = { x };
      metrics.forEach(m => (map[x][m] = 0));
    }

    metrics.forEach(m => {
      const val = row?.[m];
      if (val !== undefined && !isNaN(val)) {
        map[x][m] += Number(val);
      }
    });
  });

  return Object.values(map);
};

//////////////////////////////////////////////////////
// ✅ FUNNEL (FIXED)
//////////////////////////////////////////////////////
exports.funnel = (data, steps = []) => {
  return steps.map(step => ({
    name: step,
    value: data.reduce((sum, row) => {
      const val = row?.[step];
      return sum + (val !== undefined && !isNaN(val) ? Number(val) : 0);
    }, 0)
  }));
};

//////////////////////////////////////////////////////
// ✅ SCATTER (FIXED)
//////////////////////////////////////////////////////
exports.scatter = (data, xAxis, yAxis) => {
  return data.map(row => {
    const x = row?.[xAxis];
    const y = row?.[yAxis];

    return {
      x: x !== undefined && !isNaN(x) ? Number(x) : 0,
      y: y !== undefined && !isNaN(y) ? Number(y) : 0
    };
  });
};
//////////////////////////////////////////////////////
// 🔥 APPLY MAPPING (FINAL FIX)
//////////////////////////////////////////////////////
const applyMapping = (rows, mappings) => {
  if (!Array.isArray(rows) || !Array.isArray(mappings)) return [];

  return rows.map(row => {
    const newRow = {};

    mappings.forEach(m => {
      newRow[m.templateField] =
        row[m.fileColumn] !== undefined ? row[m.fileColumn] : null;
    });

    return newRow;
  });
};

//////////////////////////////////////////////////////
// ✅ EXPORT (CRITICAL FIX)
//////////////////////////////////////////////////////
module.exports = {
  applyMapping
};
//////////////////////////////////////////////////////
// 🔥 FULLY DYNAMIC ENRICH (NO HARDCODING)
//////////////////////////////////////////////////////
exports.enrichData = (rows, requiredFields = []) => {
  return rows.map(row => {
    const r = { ...row };

    const need = (field) =>
      requiredFields.length === 0 || requiredFields.includes(field);

    //////////////////////////////////////////////////////
    // 🔥 APPLY FORMULAS (MULTI PASS FOR DEPENDENCY)
    //////////////////////////////////////////////////////
    for (let i = 0; i < 2; i++) {
      formulas.forEach(f => {
        if (!need(f.field)) return;

        // ✅ DO NOT OVERRIDE REAL DATA
        if (r[f.field] !== undefined && r[f.field] !== null) return;

        const val = safeEval(f.formula, r);

        if (val !== undefined && !isNaN(val)) {
          r[f.field] = val;
        }
      });
    }

    //////////////////////////////////////////////////////
    // ✅ DEFAULT SAFE VALUES (OPTIONAL)
    //////////////////////////////////////////////////////
    Object.keys(r).forEach(key => {
      if (r[key] === undefined) r[key] = null;
    });

    return r;
  });
};