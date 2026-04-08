const prisma = require('../prisma/prismaClient');

const activityLogger = async (req, res, next) => {
  const oldSend = res.send;

  res.send = async function (data) {
    try {
      if (res.statusCode < 400 && req.user) {

        let action = req.method + " " + req.originalUrl;

        //////////////////////////////////////////////////////
        // 🔥 CUSTOM ACTIONS
        //////////////////////////////////////////////////////
        if (req.originalUrl.includes("login")) {
          action = "LOGIN";
        }
        else if (req.originalUrl.includes("/upload/upload")){
          action = "UPLOAD_FILE";
        }
        else if (req.originalUrl.includes("reports/dashboard/pdf")) {
          action = "DOWNLOAD_REPORT";
        }
        else if (req.originalUrl.includes("widgets")) {
          action = "CUSTOMIZE_WIDGET";
        }

        await prisma.activityLog.create({
          data: {
            userId: req.user.id,
            action,
            metadata: {
  description: `${req.method} ${req.originalUrl}`,

  // 🔥 ADD THIS (CRITICAL FIX)
  dashboardId:
    req.body?.dashboardId ||
    req.params?.dashboardId ||
    req.query?.dashboardId ||
    null,

  fileName: req.body?.fileName || req.file?.originalname || null,

  entity:
    req.body?.name ||
    req.body?.username ||
    req.body?.fullName ||
    null,

  oldValue: req.body?.oldValue || null,
  newValue: req.body?.newValue || null,

  body: req.body,
  query: req.query,
  params: req.params,
  ip: req.ip,
  userAgent: req.headers["user-agent"]
}
          }
        });
      }
    } catch (err) {
      console.error("Logging failed:", err.message);
    }

    oldSend.call(this, data);
  };

  next();
};

module.exports = activityLogger;