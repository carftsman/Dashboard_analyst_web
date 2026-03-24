const prisma = require('../prisma/prismaClient');

exports.createDashboard = async (req, res) => {
  try {
    // 🔒 Only admin
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        message: "Only ADMIN can create dashboards"
      });
    }

    const { name, description, image, columns, widgets } = req.body;

    // 1️⃣ Create dashboard
    const dashboard = await prisma.dashboard.create({
      data: {
        name,
        description,
        image,
        createdById: req.user.id
      }
    });

    // 2️⃣ Insert columns (template schema)
    if (columns && columns.length > 0) {
      await prisma.dashboardColumn.createMany({
        data: columns.map(col => ({
          dashboardId: dashboard.id,
          columnKey: col.columnKey,
          displayName: col.displayName,
          dataType: col.dataType,
          required: col.required || false
        }))
      });
    }

    // 3️⃣ Insert widgets (charts config)
    if (widgets && widgets.length > 0) {
      await prisma.widget.createMany({
        data: widgets.map(w => ({
          dashboardId: dashboard.id,
          name: w.title || "Widget",
          type: w.type.toUpperCase(),
          config: w
        }))
      });
    }

    res.json({
      message: "Dashboard created successfully",
      dashboardId: dashboard.id
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getDashboards = async (req, res) => {
  try {
    const dashboards = await prisma.dashboard.findMany({
      include: {
        columns: true,
        widgets: true
      },
      orderBy: { createdAt: "desc" }
    });

    res.json(dashboards);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getDashboardById = async (req, res) => {
  try {
    const { id } = req.params;

    const dashboard = await prisma.dashboard.findUnique({
      where: { id: Number(id) },
      include: {
        columns: true,
        widgets: true
      }
    });

    res.json(dashboard);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteDashboard = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        message: "Only ADMIN can delete dashboards"
      });
    }

    const { id } = req.params;

    await prisma.dashboard.delete({
      where: { id: Number(id) }
    });

    res.json({ message: "Dashboard deleted" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
