const prisma = require("../prisma/prismaClient");

exports.globalSearch = async (req, res) => {
  try {
    // ✅ FIX: extract query params
    const { q, page = 1, limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({
        message: "Search query (q) is required"
      });
    }

    const pageNum = Number(page) || 1;
    const limitNum = Math.min(Number(limit) || 10, 50);
    const skip = (pageNum - 1) * limitNum;
    const searchTerm = q.trim();

    //////////////////////////////////////////////////////
    // 🔍 DASHBOARDS
    //////////////////////////////////////////////////////
    const dashboards = await prisma.dashboard.findMany({
      where: {
        name: { contains: searchTerm, mode: "insensitive" }
      },
      select: { id: true, name: true, createdAt: true },
      take: limitNum,
      skip,
      orderBy: { createdAt: "desc" }
    });

    //////////////////////////////////////////////////////
    // 🔍 FILES
    //////////////////////////////////////////////////////
    const files = await prisma.fileUpload.findMany({
      where: {
        fileName: { contains: searchTerm, mode: "insensitive" }
      },
      select: { id: true, fileName: true, createdAt: true },
      take: limitNum,   // ✅ FIX
      skip,
      orderBy: { createdAt: "desc" }
    });

    //////////////////////////////////////////////////////
    // 🔍 REPORTS
    //////////////////////////////////////////////////////
    const reports = await prisma.report.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm, mode: "insensitive" } },
          {
            file: {
              fileName: { contains: searchTerm, mode: "insensitive" }
            }
          }
        ]
      },
      select: {
        id: true,
        name: true,
        fileUrl: true,
        createdAt: true,
        dashboard: { select: { name: true } }
      },
      take: limitNum,   // ✅ FIX
      skip,
      orderBy: { createdAt: "desc" }
    });

    //////////////////////////////////////////////////////
    // 🔍 USERS
    //////////////////////////////////////////////////////
    let users = [];

    if (["SUPER_ADMIN", "ADMIN", "ANALYST", "MANAGER", "SUBUSER"].includes(req.user?.role)) {
      users = await prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: "insensitive" } },
            { email: { contains: searchTerm, mode: "insensitive" } }
          ]
        },
        select: { id: true, name: true, email: true },
        take: limitNum,   // ✅ FIX
        skip,
        orderBy: { name: "asc" }
      });
    }

    //////////////////////////////////////////////////////
    // ✅ RESPONSE
    //////////////////////////////////////////////////////
    res.json({
      query: searchTerm,
      page: pageNum,
      limit: limitNum,
      results: {
        dashboards,
        files,
        reports,
        users
      }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};