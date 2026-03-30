const prisma = require("../prisma/prismaClient");

exports.globalSearch = async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({
        message: "Search query (q) is required"
      });
    }

    const skip = (page - 1) * limit;
    const searchTerm = q.trim();

    //////////////////////////////////////////////////////
    // 🔍 DASHBOARDS
    //////////////////////////////////////////////////////
    const dashboards = await prisma.dashboard.findMany({
      where: {
        name: { contains: searchTerm, mode: "insensitive" }
      },
      select: {
        id: true,
        name: true,
        createdAt: true
      },
      take: Number(limit),
      orderBy: { createdAt: "desc" }
    });

    //////////////////////////////////////////////////////
    // 🔍 FILES
    //////////////////////////////////////////////////////
    const files = await prisma.fileUpload.findMany({
      where: {
        fileName: { contains: searchTerm, mode: "insensitive" }
      },
      select: {
        id: true,
        fileName: true,
        createdAt: true
      },
      take: Number(limit),
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
        dashboard: {
          select: { name: true }
        }
      },
      take: Number(limit),
      orderBy: { createdAt: "desc" }
    });

    //////////////////////////////////////////////////////
    // 🔍 USERS (ADMIN ONLY)
    //////////////////////////////////////////////////////
    let users = [];

    if (req.user.role === "ADMIN") {
      users = await prisma.user.findMany({
  where: {
    OR: [
      {
        name: {
          contains: searchTerm,
          mode: "insensitive"
        }
      },
      {
        email: {
          startsWith: searchTerm,
          mode: "insensitive"
        }
      }
    ]
  },
  select: {
    id: true,
    name: true,
    email: true
  }
});
    }
  
    res.json({
      query: searchTerm,
      page: Number(page),
      limit: Number(limit),
      results: {
        dashboards,
        files,
        reports,
        users      }
    });

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
};