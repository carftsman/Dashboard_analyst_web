const prisma = require('../prisma/prismaClient');

//////////////////////////////////////////////////////
// ➕ CREATE DASHBOARD
//////////////////////////////////////////////////////
exports.createDashboard = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        message: "Only ADMIN can create dashboards"
      });
    }

    const { name, description, image } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "Dashboard name is required"
      });
    }

    const dashboard = await prisma.dashboard.create({
      data: {
        name,
        description,
        image,
        createdById: req.user.id
      }
    });

    res.json({
      message: "Dashboard created successfully",
      dashboardId: dashboard.id
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//////////////////////////////////////////////////////
// ➕ ADD COLUMNS
//////////////////////////////////////////////////////
exports.addColumns = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        message: "Only ADMIN can add columns"
      });
    }

    const dashboardId = Number(req.params.id);
    const { columns } = req.body;

    if (!columns || columns.length === 0) {
      return res.status(400).json({
        message: "Columns are required"
      });
    }

    // 🔒 Validate fields
    for (const col of columns) {
      if (!col.columnKey || !col.displayName || !col.dataType) {
        return res.status(400).json({
          message: "columnKey, displayName, dataType are required"
        });
      }
    }

    // 🔒 Duplicate check
    const keys = columns.map(c => c.columnKey);
    const unique = new Set(keys);

    if (keys.length !== unique.size) {
      return res.status(400).json({
        message: "Duplicate columnKey not allowed"
      });
    }

    // 🔒 Check dashboard exists
    const dashboard = await prisma.dashboard.findUnique({
      where: { id: dashboardId }
    });

    if (!dashboard) {
      return res.status(404).json({
        message: "Dashboard not found"
      });
    }

    await prisma.dashboardColumn.createMany({
      data: columns.map(col => ({
        dashboardId,
        columnKey: col.columnKey,
        displayName: col.displayName,
        dataType: col.dataType,
        required: col.required || false
      }))
    });

    res.json({ message: "Columns added successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//////////////////////////////////////////////////////
// 📄 GET COLUMNS
//////////////////////////////////////////////////////
exports.getColumns = async (req, res) => {
  try {
    const dashboardId = Number(req.params.id);

    const dashboard = await prisma.dashboard.findUnique({
      where: { id: dashboardId }
    });

    if (!dashboard) {
      return res.status(404).json({
        message: "Dashboard not found"
      });
    }

    const columns = await prisma.dashboardColumn.findMany({
      where: { dashboardId },
      orderBy: { id: "asc" }
    });

    res.json(columns);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//////////////////////////////////////////////////////
// ➕ ADD WIDGETS
//////////////////////////////////////////////////////
exports.addWidgets = async (req, res) => {
  try {
    const dashboardId = Number(req.params.id);
    const { widgets } = req.body;

    if (!widgets || widgets.length === 0) {
      return res.status(400).json({ message: "Widgets required" });
    }

    const columns = await prisma.dashboardColumn.findMany({
      where: { dashboardId }
    });

    const columnKeys = columns.map(c => c.columnKey);

    for (const w of widgets) {
      const type = w.type?.toUpperCase();

      if (!type) {
        return res.status(400).json({ message: "Widget type required" });
      }

      if (w.xAxis && !columnKeys.includes(w.xAxis)) {
        return res.status(400).json({ message: `Invalid xAxis: ${w.xAxis}` });
      }

      if (w.yAxis && !columnKeys.includes(w.yAxis)) {
        return res.status(400).json({ message: `Invalid yAxis: ${w.yAxis}` });
      }

      if (w.metrics) {
        for (const m of w.metrics) {
          if (!columnKeys.includes(m)) {
            return res.status(400).json({ message: `Invalid metric: ${m}` });
          }
        }
      }
    }

    await prisma.widget.createMany({
      data: widgets.map(w => ({
        dashboardId,
        name: w.title || "Widget",
        type: w.type.toUpperCase(),
        config: w,
        createdById: req.user.id,
        isDefault: true
      }))
    });

    res.json({ message: "Widgets added successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
//////////////////////////////////////////////////////
// 📄 GET DASHBOARDS
//////////////////////////////////////////////////////
exports.getDashboards = async (req, res) => {
  try {
    const dashboards = await prisma.dashboard.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        image: true,
      },
      orderBy: { createdAt: "desc" }
    });

    res.json(dashboards);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
//////////////////////////////////////////////////////
// 📄 GET DASHBOARD BY ID
//////////////////////////////////////////////////////
exports.getDashboardById = async (req, res) => {
  try {
    const dashboard = await prisma.dashboard.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        columns: true,
        widgets: true
      }
    });

    if (!dashboard) {
      return res.status(404).json({
        message: "Dashboard not found"
      });
    }

    res.json(dashboard);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//////////////////////////////////////////////////////
// ❌ DELETE DASHBOARD
//////////////////////////////////////////////////////
exports.deleteDashboard = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        message: "Only ADMIN can delete dashboards"
      });
    }

    const dashboardId = Number(req.params.id);

    await prisma.dashboardColumn.deleteMany({ where: { dashboardId } });
    await prisma.widget.deleteMany({ where: { dashboardId } });

    await prisma.dashboard.delete({
      where: { id: dashboardId }
    });

    res.json({ message: "Dashboard deleted" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};