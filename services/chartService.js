exports.calculateKPI = (data, metrics = []) => {
  const result = {};
  metrics.forEach(metric => {
    result[metric] = data.reduce((sum, row) => {
      return sum + (Number(row[metric]) || 0);
    }, 0);
  });
  return result;
};

exports.groupBy = (data, key, metric) => {
  const map = {};

  data.forEach(row => {
    const group = row[key] || "Unknown";
    const value = Number(row[metric]) || 0;

    if (!map[group]) map[group] = 0;
    map[group] += value;
  });

  return Object.entries(map).map(([name, value]) => ({
    name,
    value
  }));
};

exports.lineChart = (data, xAxis, metrics = []) => {
  const map = {};

  data.forEach(row => {
    const x = row[xAxis];

    if (!map[x]) {
      map[x] = { x };
      metrics.forEach(m => map[x][m] = 0);
    }

    metrics.forEach(m => {
      map[x][m] += Number(row[m]) || 0;
    });
  });

  return Object.values(map);
};

exports.funnel = (data, steps = []) => {
  return steps.map(step => ({
    name: step,
    value: data.reduce((sum, row) => sum + (Number(row[step]) || 0), 0)
  }));
};

exports.scatter = (data, xAxis, yAxis) => {
  return data.map(row => ({
    x: Number(row[xAxis]) || 0,
    y: Number(row[yAxis]) || 0
  }));
};
exports.groupBy = (data, key, metric) => {
  const map = {};

  data.forEach(row => {
    let group = row?.[key];

    if (!group || group === "undefined") {
      group = "Unknown";
    }

    const value = Number(row?.[metric]) || 0;

    if (!map[group]) map[group] = 0;
    map[group] += value;
  });

  return Object.entries(map).map(([name, value]) => ({
    name,
    value
  }));
};
exports.lineChart = (data, xAxis, metrics = []) => {
  const map = {};

  data.forEach(row => {
    const x = row?.[xAxis] ?? "Unknown";

    if (!map[x]) {
      map[x] = { x };

      metrics.forEach(m => {
        map[x][m] = 0;
      });
    }

    metrics.forEach(m => {
      const val = Number(row?.[m]);
      map[x][m] += isNaN(val) ? 0 : val;
    });
  });

  return Object.values(map);
};

//////////////////////////////////////////////////////
// 📉 FUNNEL (CONVERT TO STANDARD FORMAT)
//////////////////////////////////////////////////////
exports.funnel = (data, steps = []) => {
  return steps.map(step => {
    const total = data.reduce((sum, row) => {
      const val = Number(row?.[step]);
      return sum + (isNaN(val) ? 0 : val);
    }, 0);

    return {
      name: step,   // ✅ FIXED (was 'step')
      value: total
    };
  });
};

//////////////////////////////////////////////////////
// 🔵 SCATTER (SAFE FORMAT)
//////////////////////////////////////////////////////
exports.scatter = (data, xAxis, yAxis) => {
  return data.map(row => ({
    x: Number(row?.[xAxis]) || 0,
    y: Number(row?.[yAxis]) || 0
  }));
};

exports.normalizeChartData = (type, data, config = {}) => {
  if (!Array.isArray(data) && type !== "KPI") return [];

  switch (type) {

    ////////////////////////////////////////////
    // BAR / PIE
    ////////////////////////////////////////////
    case "BAR":
    case "PIE":
      return data.map(d => ({
        name: d?.name ?? "Unknown",
        value: Number(d?.value) || 0
      }));

    ////////////////////////////////////////////
    // LINE ✅ FIXED
    ////////////////////////////////////////////
    case "LINE":
      return data.map(d => ({
        x: d?.x ?? "Unknown",
        ...d   // ✅ KEEP ALL METRICS (IMPORTANT)
      }));

    ////////////////////////////////////////////
    // SCATTER
    ////////////////////////////////////////////
    case "SCATTER":
      return data.map(d => ({
        x: Number(d?.x) || 0,
        y: Number(d?.y) || 0
      }));

    ////////////////////////////////////////////
    // FUNNEL
    ////////////////////////////////////////////
    case "FUNNEL":
      return data.map(d => ({
        name: d?.name ?? "Step",
        value: Number(d?.value) || 0
      }));

    ////////////////////////////////////////////
    // COMBO ✅ DO NOT MODIFY
    ////////////////////////////////////////////
    case "COMBO":
      return data;

    ////////////////////////////////////////////
    // TABLE
    ////////////////////////////////////////////
    case "TABLE":
      return data;

    ////////////////////////////////////////////
    // KPI
    ////////////////////////////////////////////
    case "KPI":
      return data;

    default:
      return [];
  }
};