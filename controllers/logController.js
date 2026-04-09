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
    if (action === "UPDATE")
      return dashboardName
        ? `${userName} updated dashboard "${dashboardName}"`
        : `${userName} updated dashboard`;
    if (action === "DELETE")
      return `${userName} deleted chart from "${dashboardName}"`;

    return dashboardName
      ? `${userName} customized dashboard "${dashboardName}"`
      : `${userName} customized dashboard`;
  }

  //////////////////////////////////////////////////////
  // 📂 FILE UPLOAD
  //////////////////////////////////////////////////////
  if (log.action === "UPLOAD_FILE") {
    return meta.fileName
      ? `${userName} uploaded "${meta.fileName}" to "${dashboardName || "dashboard"}"`
      : `${userName} uploaded a file`;
  }

  //////////////////////////////////////////////////////
  // 📄 REPORTS
  //////////////////////////////////////////////////////
  if (url.includes("/reports")) {

    if (url.includes("/dashboard/pdf")) {
      return `${userName} downloaded report "${reportName || dashboardName}"`;
    }

    if (url.includes("/save")) {
      return `${userName} saved report "${reportName}"`;
    }

    if (url.includes("/preview")) {
      return `${userName} previewed report "${dashboardName}"`;
    }

    if (url.includes("/all")) {
      return `${userName} viewed all reports`;
    }

  return reportName
  ? `${userName} opened report "${reportName}"`
  : `${userName} opened report`;
  }
  //////////////////////////////////////////////////////
  // 👤 PROFILE
  //////////////////////////////////////////////////////
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
      return `${userName} updated user "${meta.targetUserName}"`;

    if (action === "DELETE")
      return `${userName} deleted user "${meta.targetUserName}"`;

    return `${userName} viewed users`;
  }

  if (url.includes("/upload/builder")) {
    return dashboardName
      ? `${userName} opened builder for "${dashboardName}"`
      : `${userName} opened builder`;
  }
  if (url.includes("/upload/process")) {
    return dashboardName
      ? `${userName} processed data for "${dashboardName}"`
      : dashboardId
        ? `${userName} processed data for dashboard ${dashboardId}`
        : `${userName} processed data`;
  }

if (url.includes("/upload/map")) {
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
      take: limit * 3
    });
    const dashboardIds = [...new Set(
  logs
    .map(log => {
      const meta = log.metadata || {};
      const url = meta.description || "";

      const id =
        extractDashboardId(
          url,
          meta.params,
          meta.query,
          meta.body
        ) ||
        meta.dashboardId;

      return id ? Number(id) : null;
    })
    .filter(Boolean)
)];

 const reportIds = [...new Set(
  logs
    .map(l => l.metadata?.reportId)
    .filter(Boolean)
    .map(id => Number(id))
)];
    // 🔥 FETCH NAMES
    const dashboards = await prisma.dashboard.findMany({
      where: { id: { in: dashboardIds } },
      select: { id: true, name: true }
    });

    const reports = await prisma.report.findMany({
      where: { id: { in: reportIds } },
      select: { id: true, name: true }
    });

    // 🔥 MAP
    const dashboardMap = Object.fromEntries(dashboards.map(d => [d.id, d.name]));
    const reportMap = Object.fromEntries(reports.map(r => [r.id, r.name]));
    //////////////////////////////////////////////////////
    // ✅ FORMAT RESPONSE
    //////////////////////////////////////////////////////
    const formattedRaw = await Promise.all(
      logs.map(async (log, index) => ({
        sNo: skip + index + 1,
        user: log.user?.name || "Unknown",
        email: log.user?.email || "N/A",
        action: formatAction(log.action),
        description: await formatDescription(log, dashboardMap, reportMap),
        time: log.createdAt
      }))
    );

    const seen = new Set();

    const formatted = formattedRaw
      .filter(log => {
        if (!log.description) return false;

        const key = `${log.user}-${log.description}-${new Date(log.time).getMinutes()}`;
        if (seen.has(key)) return false;

        seen.add(key);
        return true;
      })
      .slice(0, limit)
      .map((log, index) => ({
        ...log,
        sNo: skip + index + 1
      }));
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