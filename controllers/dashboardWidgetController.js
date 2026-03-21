const prisma = require('../prisma/prismaClient');

exports.createWidget = async (req, res) => {
  try {
    const {
      dashboardId,
      title,
      widgetType,
      positionX,
      positionY,
      width,
      height,
      fileId,
      xAxis,
      yAxis,
      groupBy,
      filters
    } = req.body;

    if (!dashboardId || !title || !widgetType || !fileId) {
      return res.status(400).json({
        success: false,
        message: 'dashboardId, title, widgetType and fileId are required'
      });
    }

    const dashboard = await prisma.dashboard.findUnique({
      where: { dashboardId: Number(dashboardId) }
    });

    if (!dashboard) {
      return res.status(404).json({
        success: false,
        message: 'Dashboard not found'
      });
    }

    const uploadedFile = await prisma.uploadedFile.findUnique({
      where: { id: Number(fileId) }
    });

    if (!uploadedFile) {
      return res.status(404).json({
        success: false,
        message: 'Uploaded file not found'
      });
    }

    const widget = await prisma.dashboardWidget.create({
      data: {
        dashboardId: Number(dashboardId),
        title,
        widgetType,
        positionX: Number(positionX) || 0,
        positionY: Number(positionY) || 0,
        width: Number(width) || 6,
        height: Number(height) || 4,
        fileId: Number(fileId),
        config: {
          xAxis: xAxis || null,
          yAxis: yAxis || null,
          groupBy: groupBy || null,
          filters: filters || {}
        }
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Widget created successfully',
      data: widget
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Create widget failed',
      error: error.message
    });
  }
};

const toNumber = (value) => {
  if (value === null || value === undefined || value === '') return 0;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const applyFilters = (rows, filters = {}) => {
  return rows.filter((row) => {
    const rowData = row.rowData || {};

    for (const key in filters) {
      if (
        filters[key] !== undefined &&
        filters[key] !== null &&
        filters[key] !== '' &&
        rowData[key] !== filters[key]
      ) {
        return false;
      }
    }

    return true;
  });
};

exports.getWidgetChartData = async (req, res) => {
  try {
    const widgetId = Number(req.params.id);

    if (Number.isNaN(widgetId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid widget id'
      });
    }

    const widget = await prisma.dashboardWidget.findUnique({
      where: { id: widgetId },
      include: {
        file: {
          include: {
            rows: true
          }
        }
      }
    });

    if (!widget) {
      return res.status(404).json({
        success: false,
        message: 'Widget not found'
      });
    }

    if (!widget.file) {
      return res.status(404).json({
        success: false,
        message: 'File not linked to this widget'
      });
    }

    const config = widget.config || {};
    const xAxis = config.xAxis;
    const yAxis = config.yAxis;
    const groupBy = config.groupBy;
    const filters = config.filters || {};

    const filteredRows = applyFilters(widget.file.rows, filters);
    const groupedData = {};

    filteredRows.forEach((row) => {
      const rowData = row.rowData || {};
      const label = rowData[groupBy] || 'Unknown';
      const value = toNumber(rowData[yAxis]);

      if (!groupedData[label]) {
        groupedData[label] = 0;
      }

      groupedData[label] += value;
    });

    const values = Object.entries(groupedData).map(([label, value]) => ({
      label,
      value
    }));

    return res.status(200).json({
      success: true,
      message: 'Chart data fetched successfully',
      data: {
        widgetId: widget.id,
        title: widget.title,
        widgetType: widget.widgetType,
        xAxis,
        yAxis,
        groupBy,
        values
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Fetch chart data failed',
      error: error.message
    });
  }
};