const prisma = require('../prisma/prismaClient');

const activityLogger = async (req, res, next) => {
  const oldSend = res.send;

  res.send = async function (data) {
    try {
      // Only log successful responses
      if (res.statusCode < 400 && req.user) {

        let action = req.method + " " + req.originalUrl;

        //////////////////////////////////////////////////////
        // 🔥 CUSTOM ACTIONS (OPTIONAL CLEAN LABELS)
        //////////////////////////////////////////////////////
        if (req.originalUrl.includes("login")) {
          action = "LOGIN";
        }
        else if (req.originalUrl.includes("upload")) {
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
              body: req.body
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