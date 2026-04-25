const prisma = require('../prisma/prismaClient');
const logger = require("../utils/logger");

const activityLogger = (req, res, next) => {
  const user = req.user; // ✅ FIX

  res.on("finish", () => {
    if (res.statusCode >= 400 || !user) return;

    setImmediate(() => {
      (async () => {
        try {
          let action =
            res.locals.action ||
            req.method + " " + req.originalUrl;

          if (req.method === "POST" && req.originalUrl.includes("/login")) {
            action = "LOGIN";
          } else if (req.originalUrl.includes("/upload/upload")) {
            action = "UPLOAD_FILE";
          } else if (req.originalUrl.includes("reports/dashboard/pdf")) {
            action = "DOWNLOAD_REPORT";
          } else if (req.originalUrl.includes("widgets")) {
            action = "CUSTOMIZE_WIDGET";
          }

          const savedLog = await prisma.activityLog.create({
            data: {
              userId: user.id, // ✅ FIX
              action,
              metadata: {
                description: `${req.method} ${req.originalUrl}`,
                dashboardId:
                  req.body?.dashboardId ||
                  req.params?.dashboardId ||
                  req.query?.dashboardId ||
                  null,

                dashboardName: req.body?.dashboardName || null,
                reportId: req.body?.reportId || req.params?.reportId || null,
                reportName: req.body?.reportName || req.body?.name || null,
                widgetId: req.params?.widgetId || null,
                fileId: req.body?.fileId || null,
                fileName: req.body?.fileName || req.file?.originalname || null,

                targetUserName:
                  res.locals?.targetUserName ||
                  req.body?.name ||
                  req.body?.username ||
                  req.body?.email ||
                  null,

                oldValue: res.locals?.oldValue || null,
                newValue: res.locals?.newValue || null,

                ip: req.ip,
                userAgent: req.headers["user-agent"]
              }
            },
            include: {
              user: {
                select: { name: true, email: true }
              }
            }
          });

          try {
            const { emitNewLog } = require("../socket");

            emitNewLog({
              user: savedLog.user.name,
              email: savedLog.user.email,
              action: savedLog.action,
              description: savedLog.metadata.description,
              time: savedLog.createdAt
            });
          } catch {}

        } catch (err) {

logger.error("Activity logging failed", {
  error: err.message,
  stack: err.stack
});        }
      })();
    });
  });

  next();
};

module.exports = activityLogger;