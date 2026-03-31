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
exports.enrichData = (rows, requiredFields = []) => {
  return rows.map(row => {
    const r = { ...row };

const need = (field) =>
  requiredFields.length === 0 || requiredFields.includes(field);
    const clicks = Number(r.clicks || 0);
    const adSpend = Number(r.ad_spend || 0);

    //////////////////////////////////////////////////////
    // ✅ BASE CALCULATIONS (DEPENDENCIES FIRST)
    //////////////////////////////////////////////////////

    // Leads (needed by CPA, conversion_rate)
    if (need("leads") || need("cpa") || need("conversion_rate")) {
      r.leads = Number(r.leads) || Math.round(clicks * 0.1);
    }

    // Orders (needed by revenue)
    if (need("orders") || need("revenue")) {
      r.orders = Number(r.orders) || Math.round(clicks * 0.05);
    }

    // Revenue (needed by roas)
    if (need("revenue") || need("roas")) {
      r.revenue =
        Number(r.revenue) ||
        (r.orders ? r.orders * 1000 : adSpend * 1.8);
    }

    //////////////////////////////////////////////////////
    // ✅ FINAL METRICS
    //////////////////////////////////////////////////////

    if (need("roas")) {
      r.roas = adSpend ? r.revenue / adSpend : 0;
    }

    if (need("cpa")) {
      r.cpa = r.leads ? adSpend / r.leads : 0;
    }

    if (need("conversion_rate")) {
      r.conversion_rate = clicks ? r.leads / clicks : 0;
    }

    if (need("platform")) {
      r.platform = r.platform || "Meta Ads";
    }

    return r;
  });
};