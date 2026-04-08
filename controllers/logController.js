const prisma = require('../prisma/prismaClient');
const extractDashboardId = (url, params = {}, query = {}) => {
  const match =
    url.match(/dashboard-data\/(\d+)/) ||
    url.match(/dashboards\/(\d+)/) ||
    url.match(/builder\/(\d+)/);

  if (match) return parseInt(match[1]);

  return params.dashboardId || query.dashboardId || null;
};
const formatAction = (action) => {
  if (!action) return "UNKNOWN";

  // ✅ Keep custom actions intact
  if (["LOGIN", "UPLOAD_FILE", "CUSTOMIZE_WIDGET", "DOWNLOAD_REPORT"].includes(action)) {
    return action;
  }

  // fallback based on HTTP method
  if (action.startsWith("POST")) return "CREATE";
  if (action.startsWith("PUT") || action.startsWith("PATCH")) return "UPDATE";
  if (action.startsWith("DELETE")) return "DELETE";
  if (action.startsWith("GET")) return "VIEW";

  return action;
};

const formatDescription = async (log, dashboardMap = {}) => {
  const userName = log.user?.name || "User";
  const meta = log.metadata || {};
  const url = meta.description || "";
  const action = formatAction(log.action);

const dashboardId =
  extractDashboardId(url, meta.params, meta.query) ||
  meta.dashboardId;

// ✅ FIX (MISSING LINE)
const dashboardName = dashboardMap[dashboardId];

// ✅ SAFE FALLBACK
const dashName = dashboardName || meta.dashboardName;

if (log.action === "CUSTOMIZE_WIDGET") {
  return meta.oldValue && meta.newValue
    ? `${userName} changed chart ${meta.oldValue} → ${meta.newValue} in ${dashName || "dashboard"}`
    : dashName
    ? `${userName} customized widget in ${dashName}`
    : `${userName} customized dashboard widget`;
}

//////////////////////////////////////////////////////
// 📂 UPLOAD (MOVE THIS UP)
//////////////////////////////////////////////////////
if (log.action === "UPLOAD_FILE") {
  return meta.fileName
    ? `${userName} uploaded "${meta.fileName}" to ${dashName || "system"}`
    : dashName
    ? `${userName} uploaded file to ${dashName}`
    : `${userName} uploaded a data file (no dashboard context)`;
}
  //////////////////////////////////////////////////////
  // 📊 DASHBOARD DATA
  //////////////////////////////////////////////////////
if (url.includes("/dashboard-data")) {
  return dashName
    ? `${userName} viewed dashboard data (${dashName})`
    : `${userName} viewed dashboard data`;
}

  //////////////////////////////////////////////////////
  // 📊 DASHBOARDS
  //////////////////////////////////////////////////////
  if (url.includes("/dashboards")) {
    if (action === "CREATE") return `${userName} created dashboard`;
    if (action === "UPDATE")
      return `${userName} updated ${dashboardName || "dashboard"}`;
    if (action === "DELETE")
      return `${userName} deleted ${dashboardName || "dashboard"}`;

    return dashboardName
      ? `${userName} viewed ${dashboardName}`
      : `${userName} viewed dashboards`;
  }



  //////////////////////////////////////////////////////
  // 📂 BUILDER
  //////////////////////////////////////////////////////
  if (url.includes("/upload/builder")) {
    return dashboardName
      ? `${userName} accessed builder for ${dashboardName}`
      : `${userName} accessed data builder`;
  }

  //////////////////////////////////////////////////////
  // 📂 PROCESS
  //////////////////////////////////////////////////////
  if (url.includes("/upload/process")) {
    return dashboardName
      ? `${userName} processed data for ${dashboardName}`
      : `${userName} processed uploaded data`;
  }

  //////////////////////////////////////////////////////
  // 📂 MAPPING
  //////////////////////////////////////////////////////
  if (url.includes("/upload/map")) {
    return dashboardName
      ? `${userName} mapped data for ${dashboardName}`
      : `${userName} mapped file columns`;
  }

  //////////////////////////////////////////////////////
  // 🔁 FALLBACK
  //////////////////////////////////////////////////////
//////////////////////////////////////////////////////
// 👤 USER PROFILE
//////////////////////////////////////////////////////
if (url.includes("/users/profile")) {
  return `${userName} viewed profile`;
}

//////////////////////////////////////////////////////
// 👥 USERS
//////////////////////////////////////////////////////
if (url.includes("/users")) {
  if (action === "CREATE") return `${userName} created user`;
  if (action === "UPDATE") return `${userName} updated user`;
  if (action === "DELETE") return `${userName} deleted user`;
  return `${userName} viewed users`;
}

//////////////////////////////////////////////////////
// 📄 REPORTS
//////////////////////////////////////////////////////
if (url.includes("/reports")) {
  if (url.includes("/all")) return `${userName} viewed all reports`;
  if (url.includes("/preview")) return `${userName} previewed report`;
  if (url.includes("/save")) return `${userName} saved report`;
  return `${userName} viewed reports`;
}

//////////////////////////////////////////////////////
// 📜 LOGS
//////////////////////////////////////////////////////
if (url.includes("/logs")) {
  return `${userName} viewed activity logs`;
}

//////////////////////////////////////////////////////
// 📊 CHART CONFIG
//////////////////////////////////////////////////////
if (url.includes("/chart-types")) {
  return `${userName} viewed chart configurations`;
}
  return "Performed system action";
};
exports.getLogs = async (req, res) => {
  try {
    const user = req.user;

    //////////////////////////////////////////////////////
    // 🔒 ROLE FILTER
    //////////////////////////////////////////////////////
  let allowedRoles = [];

if (user.role === "SUPER_ADMIN") {
}

else if (user.role === "ADMIN") {
  allowedRoles = ["ANALYST", "MANAGER", "SUBUSER"];
}

else if (user.role === "ANALYST") {
  allowedRoles = ["MANAGER", "SUBUSER"];
}

    //////////////////////////////////////////////////////
    // 📄 PAGINATION
    //////////////////////////////////////////////////////
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
     //////////////////////////////////////////////////////
    // ✅ TOTAL COUNT
 const whereCondition =
  user.role === "SUPER_ADMIN"
    ? {}
    : {
        user: {
          role: {
            in: allowedRoles
          }
        }
      };

const total = await prisma.activityLog.count({
  where: whereCondition
});

const logs = await prisma.activityLog.findMany({
  where: whereCondition,
  include: {
    user: {
      select: {
        name: true,
        email: true,
        role: true
      }
    }
  },
  orderBy: [
    { createdAt: "desc" },
    { id: "desc" }
  ],
  skip,
  take: limit
});
// 🔥 COLLECT DASHBOARD IDS
const dashboardIds = logs
  .map(log => {
    const url = log.metadata?.description || "";
    return extractDashboardId(
      url,
      log.metadata?.params,
      log.metadata?.query
    );
  })
  .filter(Boolean);

// 🔥 FETCH ALL DASHBOARDS (ONE QUERY)
const dashboards = await prisma.dashboard.findMany({
  where: {
    id: { in: [...new Set(dashboardIds)] }
  },
  select: { id: true, name: true }
});

// 🔥 CREATE MAP
const dashboardMap = Object.fromEntries(
  dashboards.map(d => [d.id, d.name])
);
    //////////////////////////////////////////////////////
    // ✅ FORMAT RESPONSE
    //////////////////////////////////////////////////////
    const formatted = await Promise.all(
  logs.map(async (log, index) => ({
    sNo: skip + index + 1,
    user: log.user?.name || "Unknown",
    email: log.user?.email || "N/A",
    action: formatAction(log.action),
description: await formatDescription(log, dashboardMap),    time: log.createdAt
  }))
);

    //////////////////////////////////////////////////////
    // ✅ FINAL RESPONSE
    //////////////////////////////////////////////////////
    res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data: formatted
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};