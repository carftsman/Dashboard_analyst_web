const prisma = require('../prisma/prismaClient');

//////////////////////////////////////////////////////
// ✅ HELPER FUNCTIONS
//////////////////////////////////////////////////////

const formatAction = (action) => {
  if (!action) return "UNKNOWN";

  // 🔥 Specific first
  if (action.includes("/upload")) return "UPLOAD";
  if (action.includes("/dashboard/pdf")) return "EXPORT";

  if (action.startsWith("POST")) return "CREATE";
  if (action.startsWith("PUT") || action.startsWith("PATCH")) return "UPDATE";
  if (action.startsWith("DELETE")) return "DELETE";
  if (action.startsWith("GET")) return "VIEW";

  return action;
};

const formatDescription = (log) => {
  const action = log.action || "";

  //////////////////////////////////////////////////////
  // 🔐 AUTH
  //////////////////////////////////////////////////////
  if (action.includes("/auth/login")) {
    return "User logged into the system successfully";
  }

  //////////////////////////////////////////////////////
  // 📊 DASHBOARD
  //////////////////////////////////////////////////////
  if (action.includes("/dashboards")) {
    return "Accessed and viewed dashboard analytics data";
  }

  //////////////////////////////////////////////////////
  // 📂 UPLOAD FLOW (VERY IMPORTANT FIX)
  //////////////////////////////////////////////////////
  if (action.includes("/upload/process")) {
    return "Processed uploaded file and stored structured data";
  }

  if (action.includes("/upload/validation")) {
    return "Validated uploaded file for errors and duplicates";
  }

  if (action.includes("/upload/mapping")) {
    return "Viewed column mapping configuration";
  }

  if (action.includes("/upload/map")) {
    return "Mapped uploaded file columns to dashboard fields";
  }

  if (action.includes("/upload/upload")) {
    return "Uploaded a new data file to the dashboard";
  }

  //////////////////////////////////////////////////////
  // 📈 REPORTS
  //////////////////////////////////////////////////////
  if (action.includes("/dashboard/pdf")) {
    return "Generated and downloaded dashboard report as PDF";
  }

  if (action.includes("/reports")) {
    return "Accessed or downloaded reports";
  }

  //////////////////////////////////////////////////////
  // 👤 USERS
  //////////////////////////////////////////////////////
  if (action.includes("/users")) {
    return "Updated user profile or settings";
  }

  //////////////////////////////////////////////////////
  // 📜 LOGS
  //////////////////////////////////////////////////////
  if (action.includes("/logs")) {
    return "Viewed system activity logs";
  }

  //////////////////////////////////////////////////////
  // 🔁 FALLBACK (SAFE)
  //////////////////////////////////////////////////////
  if (action.startsWith("GET")) return "Viewed data from system";
  if (action.startsWith("POST")) return "Created new data";
  if (action.startsWith("PUT") || action.startsWith("PATCH")) return "Updated existing data";
  if (action.startsWith("DELETE")) return "Deleted data";

  return log.metadata?.description || "Performed an operation";
};

//////////////////////////////////////////////////////
// ✅ MAIN CONTROLLER WITH PAGINATION + SORT FIX
//////////////////////////////////////////////////////

exports.getLogs = async (req, res) => {
  try {
    const user = req.user;

    //////////////////////////////////////////////////////
    // 🔒 ROLE FILTER
    //////////////////////////////////////////////////////
    let excludeRoles = [];

    if (user.role === "ADMIN") {
      excludeRoles = ["ADMIN"];
    }

    if (user.role === "ANALYST") {
      excludeRoles = ["ADMIN", "ANALYST"];
    }

    //////////////////////////////////////////////////////
    // 📄 PAGINATION
    //////////////////////////////////////////////////////
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    //////////////////////////////////////////////////////
    // ✅ TOTAL COUNT
    //////////////////////////////////////////////////////
    const total = await prisma.activityLog.count({
      where: {
        user: {
          role: {
            notIn: excludeRoles
          }
        }
      }
    });

    //////////////////////////////////////////////////////
    // ✅ FETCH LOGS (LATEST → OLDEST FIXED)
    //////////////////////////////////////////////////////
    const logs = await prisma.activityLog.findMany({
      where: {
        user: {
          role: {
            notIn: excludeRoles
          }
        }
      },
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
        { createdAt: "desc" }, // latest first
        { id: "desc" }         // 🔥 fix for same timestamps
      ],
      skip,
      take: limit
    });

    //////////////////////////////////////////////////////
    // ✅ FORMAT RESPONSE
    //////////////////////////////////////////////////////
    const formatted = logs.map((log, index) => ({
      sNo: skip + index + 1,
      user: log.user?.name || "Unknown",
      email: log.user?.email || "N/A",
      action: formatAction(log.action),
      description: formatDescription(log),
      time: log.createdAt
    }));

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