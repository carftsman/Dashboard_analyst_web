exports.calculateKPI = (data, metrics = []) => {
  const result = {};

  metrics.forEach(metric => {
    result[metric] = data.reduce((sum, row) => {
      return sum + (Number(row?.[metric]) || 0);
    }, 0);
  });

  return result;
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
  return steps.map(step => ({
    name: step,
    value: data.reduce((sum, row) => {
      const val = Number(row?.[step]);
      return sum + (isNaN(val) ? 0 : val);
    }, 0)
  }));
};

exports.scatter = (data, xAxis, yAxis) => {
  return data.map(row => ({
    x: Number(row?.[xAxis]) || 0,
    y: Number(row?.[yAxis]) || 0
  }));
};