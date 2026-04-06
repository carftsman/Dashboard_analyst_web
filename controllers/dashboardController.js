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
// ✏️ UPDATE DASHBOARD
//////////////////////////////////////////////////////
exports.updateDashboard = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        message: "Only ADMIN can update dashboard"
      });
    }

    const dashboardId = Number(req.params.id);
    const { name, description, image } = req.body;

    const dashboard = await prisma.dashboard.findUnique({
      where: { id: dashboardId }
    });

    if (!dashboard) {
      return res.status(404).json({
        message: "Dashboard not found"
      });
    }

    const updated = await prisma.dashboard.update({
      where: { id: dashboardId },
      data: {
        name: name ?? dashboard.name,
        description: description ?? dashboard.description,
        image: image ?? dashboard.image
      }
    });

    res.json({
      message: "Dashboard updated successfully",
      dashboard: updated
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
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
// 📊 GET WIDGETS (CHARTS) BY DASHBOARD
//////////////////////////////////////////////////////
exports.getWidgets = async (req, res) => {
  try {
    const dashboardId = Number(req.params.id);

    //////////////////////////////////////////////////////
    // ✅ CHECK DASHBOARD EXISTS
    //////////////////////////////////////////////////////
    const dashboard = await prisma.dashboard.findUnique({
      where: { id: dashboardId }
    });

    if (!dashboard) {
      return res.status(404).json({
        message: "Dashboard not found"
      });
    }

    //////////////////////////////////////////////////////
    // 🔥 FETCH WIDGETS
    //////////////////////////////////////////////////////
    const widgets = await prisma.widget.findMany({
      where: { dashboardId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        type: true,
        config: true,
        createdAt: true
      }
    });

    //////////////////////////////////////////////////////
    // ✅ RESPONSE
    //////////////////////////////////////////////////////
    res.json({
      dashboardId,
      total: widgets.length,
      charts: widgets
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.updateWidget = async (req, res) => {
  try {
    const widgetId = Number(req.params.widgetId);
    const { name, type, config } = req.body;

    const widget = await prisma.widget.findUnique({
      where: { id: widgetId }
    });

    if (!widget) {
      return res.status(404).json({
        message: "Widget not found"
      });
    }

    //////////////////////////////////////////////////////
    // 🔥 VALIDATE TYPE
    //////////////////////////////////////////////////////
    const updatedType = type ? type.toUpperCase() : widget.type;

    //////////////////////////////////////////////////////
    // 🔥 MERGE CONFIG
    //////////////////////////////////////////////////////
    const updatedConfig = {
      ...(widget.config || {}),
      ...(config || {})
    };

    const updated = await prisma.widget.update({
      where: { id: widgetId },
      data: {
        name: name ?? widget.name,
        type: updatedType,
        config: updatedConfig
      }
    });

    res.json({
      message: "Widget updated successfully",
      widget: updated
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
//////////////////////////////////////////////////////
// ❌ DELETE WIDGET
//////////////////////////////////////////////////////
exports.deleteWidget = async (req, res) => {
  try {
    const widgetId = Number(req.params.widgetId);

    const widget = await prisma.widget.findUnique({
      where: { id: widgetId }
    });

    if (!widget) {
      return res.status(404).json({
        message: "Widget not found"
      });
    }

    await prisma.widget.delete({
      where: { id: widgetId }
    });

    res.json({
      message: "Widget deleted successfully"
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
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
exports.updateColumn = async (req, res) => {
  try {
    const columnId = Number(req.params.columnId);
    const { columnKey, displayName, dataType, required } = req.body;

    //////////////////////////////////////////////////////
    // ✅ FIND COLUMN
    //////////////////////////////////////////////////////
    const column = await prisma.dashboardColumn.findUnique({
      where: { id: columnId }
    });

    if (!column) {
      return res.status(404).json({ message: "Column not found" });
    }

    //////////////////////////////////////////////////////
    // 🔒 PREVENT DUPLICATE COLUMN KEY
    //////////////////////////////////////////////////////
    if (columnKey && columnKey !== column.columnKey) {
      const exists = await prisma.dashboardColumn.findFirst({
        where: {
          dashboardId: column.dashboardId,
          columnKey
        }
      });

      if (exists) {
        return res.status(400).json({
          message: "Column key already exists"
        });
      }
    }

    //////////////////////////////////////////////////////
    // 🔥 AUTO UPDATE WIDGET CONFIG (VERY IMPORTANT)
    //////////////////////////////////////////////////////
    if (columnKey && columnKey !== column.columnKey) {
      const widgets = await prisma.widget.findMany({
        where: { dashboardId: column.dashboardId }
      });

      for (const w of widgets) {
        let config = w.config || {};

        if (config.xAxis === column.columnKey) config.xAxis = columnKey;
        if (config.yAxis === column.columnKey) config.yAxis = columnKey;

        config.groupBy = config.groupBy === column.columnKey ? columnKey : config.groupBy;
        config.metric = config.metric === column.columnKey ? columnKey : config.metric;

        config.metrics = (config.metrics || []).map(m =>
          m === column.columnKey ? columnKey : m
        );

        config.columns = (config.columns || []).map(c =>
          c === column.columnKey ? columnKey : c
        );

        config.lines = (config.lines || []).map(l =>
          l === column.columnKey ? columnKey : l
        );

        await prisma.widget.update({
          where: { id: w.id },
          data: { config }
        });
      }
    }

    //////////////////////////////////////////////////////
    // ✅ SAFE UPDATE
    //////////////////////////////////////////////////////
    const updated = await prisma.dashboardColumn.update({
      where: { id: columnId },
      data: {
        columnKey: columnKey ?? column.columnKey,
        displayName: displayName ?? column.displayName,
        dataType: dataType ?? column.dataType,
        required: required ?? column.required
      }
    });

    res.json({
      message: "Column updated successfully",
      column: updated
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.deleteColumn = async (req, res) => {
  try {
    const columnId = Number(req.params.columnId);

    //////////////////////////////////////////////////////
    // ✅ FIND COLUMN
    //////////////////////////////////////////////////////
    const column = await prisma.dashboardColumn.findUnique({
      where: { id: columnId }
    });

    if (!column) {
      return res.status(404).json({ message: "Column not found" });
    }

    //////////////////////////////////////////////////////
    // 🔥 CLEAN WIDGET CONFIG (IMPORTANT)
    //////////////////////////////////////////////////////
    const widgets = await prisma.widget.findMany({
      where: { dashboardId: column.dashboardId }
    });

    for (const w of widgets) {
      let config = w.config || {};

      // remove usage
      if (config.xAxis === column.columnKey) config.xAxis = null;
      if (config.yAxis === column.columnKey) config.yAxis = null;

      if (config.groupBy === column.columnKey) config.groupBy = null;
      if (config.metric === column.columnKey) config.metric = null;

      config.metrics = (config.metrics || []).filter(
        m => m !== column.columnKey
      );

      config.columns = (config.columns || []).filter(
        c => c !== column.columnKey
      );

      config.lines = (config.lines || []).filter(
        l => l !== column.columnKey
      );

      await prisma.widget.update({
        where: { id: w.id },
        data: { config }
      });
    }

    //////////////////////////////////////////////////////
    // ✅ DELETE COLUMN
    //////////////////////////////////////////////////////
    await prisma.dashboardColumn.delete({
      where: { id: columnId }
    });

    res.json({
      message: "Column deleted and widgets auto-updated"
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};