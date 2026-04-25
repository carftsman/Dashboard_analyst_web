const prisma = require("../prisma/prismaClient");
const azureService = require("../services/azureService");
const logger = require("../utils/logger");

const deleteOldReports = async () => {
  try {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const oldReports = await prisma.report.findMany({
      where: {
        createdAt: {
          lt: threeMonthsAgo
        }
      }
    });

    logger.info("Old reports found", { count: oldReports.length });

    for (const report of oldReports) {
      try {
        if (report.fileUrl) {
          await azureService.deleteFile(report.fileUrl);
        }
      } catch (err) {
        logger.warn("Azure delete failed", {
          error: err.message
        });
      }
    }

    await prisma.report.deleteMany({
      where: {
        createdAt: {
          lt: threeMonthsAgo
        }
      }
    });

    logger.info("Old reports deleted successfully");

  } catch (err) {
    logger.error("Cleanup failed", {
      error: err.message,
      stack: err.stack
    });
  }
};

module.exports = deleteOldReports;