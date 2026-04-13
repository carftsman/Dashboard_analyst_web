const prisma = require('../prisma/prismaClient');
const extractDashboardId = (url, params = {}, query = {}, body = {}) => {
  const match =
    url.match(/dashboard-data\/(\d+)/) ||
    url.match(/dashboards\/(\d+)/) ||
    url.match(/builder\/(\d+)/);

  if (match) return parseInt(match[1]);

  return (
    params.dashboardId ||
    query.dashboardId ||
    body.dashboardId ||   // 🔥 ADD THIS
    null
  );
};
const formatAction = (action) => {
  if (!action) return "UNKNOWN";

  if (["LOGIN", "UPLOAD_FILE", "CUSTOMIZE_WIDGET", "DOWNLOAD_REPORT"].includes(action)) {
    return action;
  }

  if (action.startsWith("POST")) {
    if (action.includes("/upload/map")) return "MAP";
    if (action.includes("/upload/process")) return "PROCESS";
    return "CREATE";
  }
  if (action.startsWith("PUT") || action.startsWith("PATCH")) return "UPDATE";
  if (action.startsWith("DELETE")) return "DELETE";
  if (action.startsWith("GET")) return "VIEW";

  return action;
};

const formatDescription = (log, dashboardMap = {}, reportMap = {}) => {
  const userName = log.user?.name || "User";
  const meta = log.metadata || {};
  const url = meta.description || "";
const clean = (str) => {
  if (!str) return str;
  return str
    .replace(/\\+/g, "")   // remove backslashes
    .replace(/,+$/, "")    // remove trailing comma
    .replace(/"+$/, "")    // remove extra ending quotes
    .trim();
};

  // 🚫 SKIP NOISY LOGS (FINAL FIX)
  if (
    url.includes("/api/search")||
    url.includes("/chart-types") ||
    url.includes("/upload/filters") ||
    url.includes("/upload/validation") ||
    url.includes("/files")
  ) {
    return;
  } const action = formatAction(log.action);
  const dashboardId =
    extractDashboardId(
      url,
      meta.params,
      meta.query,
      meta.body
    ) || meta.dashboardId;

const dashboardName =
  clean(dashboardMap[dashboardId]) ||
  clean(meta.dashboardName);

const reportName =
  clean(reportMap[meta.reportId]) ||
  clean(meta.reportName);

  if (url.includes("/dashboard-data")) {
    if (!dashboardName) return;
    return `${userName} viewed dashboard "${dashboardName}"`;
  }

  //////////////////////////////////////////////////////
  // 📊 DASHBOARD CRUD
  //////////////////////////////////////////////////////
  if (url.includes("/dashboards")) {
    if (action === "CREATE")
      return `${userName} created dashboard "${meta.dashboardName}"`;

    if (action === "UPDATE")
      return dashboardName
        ? `${userName} updated dashboard "${dashboardName}"`
        : `${userName} updated dashboard`;
    if (action === "DELETE")
      return `${userName} deleted dashboard "${dashboardName}"`;

    if (!dashboardName) return; // 🔥 skip list logs

    return `${userName} viewed dashboard "${dashboardName}"`;
  }

  //////////////////////////////////////////////////////
  // 📊 WIDGET ACTIONS
  //////////////////////////////////////////////////////
if (url.includes("/widgets")) {

  if (action === "CREATE") {
    return `${userName} added chart to "${dashboardName}"`;
  }

  if (action === "UPDATE") {
    return `${userName} updated chart in "${dashboardName}"`;
  }

  if (action === "DELETE") {
    return `${userName} deleted chart from "${dashboardName}"`;
  }

  return `${userName} customized dashboard "${dashboardName}"`;
}
  //////////////////////////////////////////////////////
  // 📂 FILE UPLOAD
  //////////////////////////////////////////////////////
  if (log.action === "UPLOAD_FILE") {
    return meta.fileName
      ? `${userName} uploaded "${meta.fileName}" to "${dashboardName || "dashboard"}"`
      : `${userName} uploaded a file`;
  }
if (url.includes("/reports")) {

  const safeReportName = reportName || "Report";

  if (action === "CREATE") {
    return `${userName} created report "${safeReportName}"`;
  }

  if (action === "UPDATE") {
    return `${userName} updated report "${safeReportName}"`;
  }

  if (action === "DELETE") {
    return `${userName} deleted report "${safeReportName}"`;
  }

  if (url.includes("/dashboard/pdf")) {
    return `${userName} downloaded report "${safeReportName}"`;
  }

  if (url.includes("/save")) {
    return `${userName} saved report "${safeReportName}"`;
  }

  if (url.includes("/preview")) {
    return `${userName} previewed report "${dashboardName}"`;
  }

  if (url.includes("/all")) {
    return `${userName} viewed all reports`;
  }

  return `${userName} opened report "${safeReportName}"`;
}

  if (url.includes("/users/profile")) {
    if (action === "UPDATE") {
      return meta.targetUserName
        ? `${userName} updated user "${meta.targetUserName}"`
        : `${userName} updated a user`;
    }
    return `${userName} viewed profile`;
  }

  //////////////////////////////////////////////////////
  // 👥 ADMIN USER ACTIONS
  //////////////////////////////////////////////////////
  if (url.includes("/users")) {
    if (action === "CREATE")
      return `${userName} created user "${meta.targetUserName}"`;

    if (action === "UPDATE")
return meta.targetUserName
  ? `${userName} updated user "${meta.targetUserName}"`
  : `${userName} updated a user`;
    if (action === "DELETE")
      return meta.targetUserName
  ? `${userName} deleted user "${meta.targetUserName}"`
  : `${userName} deleted a user`;
    return `${userName} viewed users`;
  }

  if (url.includes("/upload/builder")) {
    return dashboardName
      ? `${userName} opened builder for "${dashboardName}"`
      : `${userName} opened builder`;
  }
if (url.includes("/upload/process") && action === "PROCESS") {
      return dashboardName
      ? `${userName} processed data for "${dashboardName}"`
      : dashboardId
        ? `${userName} processed data for dashboard ${dashboardId}`
        : `${userName} processed data`;
  }

if (url.includes("/upload/map") && action === "MAP") {
    return dashboardName
    ? `${userName} mapped file to "${dashboardName}"`
    : dashboardId
      ? `${userName} mapped file to dashboard ${dashboardId}`
      : `${userName} mapped file`;
}


  if (url.includes("/logs")) {
    return `${userName} viewed activity logs`;
  }

  return `${userName} accessed ${url}`;
};
exports.getLogs = async (req, res) => {
  try {
    const user = req.user;
    const { user: userFilter, action: actionFilter, dashboard: dashboardFilter, dateFrom, dateTo } = req.query;

    ////////////////////////////////////////////////////////
    // 🔒 ROLE FILTER
    ////////////////////////////////////////////////////////
    let allowedRoles = [];

    if (user.role === "ADMIN") {
      allowedRoles = ["ANALYST", "MANAGER", "SUBUSER"];
    } else if (user.role === "ANALYST") {
      allowedRoles = ["MANAGER", "SUBUSER"];
    }

    ////////////////////////////////////////////////////////
    // ✅ WHERE CONDITION
    ////////////////////////////////////////////////////////
    let whereCondition =
      user.role === "SUPER_ADMIN"
        ? {}
        : {
            user: {
              role: {
                in: allowedRoles
              }
            }
          };

    ////////////////////////////////////////////////////////
    // 🔥 FILTERS
    ////////////////////////////////////////////////////////
    if (userFilter) {
      whereCondition.user = {
        ...whereCondition.user,
        name: {
          contains: userFilter,
          mode: "insensitive"
        }
      };
    }

    if (actionFilter) {
      whereCondition.action = {
        contains: actionFilter.toUpperCase()
      };
    }

    if (dateFrom || dateTo) {
      whereCondition.createdAt = {};

      if (dateFrom) {
        whereCondition.createdAt.gte = new Date(dateFrom);
      }

      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        whereCondition.createdAt.lte = end;
      }
    }

    ////////////////////////////////////////////////////////
    // 🔥 FETCH ALL LOGS (NO PAGINATION)
    ////////////////////////////////////////////////////////
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
      ]
    });

    ////////////////////////////////////////////////////////
    // 🔥 DASHBOARD & REPORT IDS
    ////////////////////////////////////////////////////////
    const dashboardIds = [...new Set(
      logs
        .map(log => Number(log.metadata?.dashboardId))
        .filter(id => !isNaN(id))
    )];

  const reportIds = [...new Set(
  logs
    .map(l => String(l.metadata?.reportId)) // 🔥 FIX
    .filter(id => id && id !== "undefined" && id !== "null")
)];

    const dashboards = await prisma.dashboard.findMany({
      where: { id: { in: dashboardIds } },
      select: { id: true, name: true }
    });

    const reports = await prisma.report.findMany({
      where: { id: { in: reportIds } },
      select: { id: true, name: true }
    });

    const dashboardMap = Object.fromEntries(dashboards.map(d => [d.id, d.name]));
    const reportMap = Object.fromEntries(reports.map(r => [r.id, r.name]));

    ////////////////////////////////////////////////////////
    // 🔥 FORMAT DATA
    ////////////////////////////////////////////////////////
    let formatted = logs.map((log, index) => ({
      sNo: index + 1,
      user: log.user?.name || "Unknown",
      email: log.user?.email || "N/A",
      action: formatAction(log.action),
      description: formatDescription(log, dashboardMap, reportMap),
      time: log.createdAt
    }));

    ////////////////////////////////////////////////////////
    // 🔥 APPLY FILTERS
    ////////////////////////////////////////////////////////
    if (dashboardFilter) {
      formatted = formatted.filter(log =>
        log.description?.toLowerCase().includes(dashboardFilter.toLowerCase())
      );
    }

    ////////////////////////////////////////////////////////
    // 🔥 REMOVE DUPLICATES
    ////////////////////////////////////////////////////////
    const seen = new Set();

    const finalLogs = formatted.filter(log => {
      if (!log.description) return false;

      const key = `${log.user}-${log.description}-${new Date(log.time).getMinutes()}`;
      if (seen.has(key)) return false;

      seen.add(key);
      return true;
    });

    ////////////////////////////////////////////////////////
    // ✅ RESPONSE (NO PAGINATION)
    ////////////////////////////////////////////////////////
    res.json({
      total: finalLogs.length,
      data: finalLogs
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};