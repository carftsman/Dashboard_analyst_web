const prisma = require('../prisma/prismaClient');

const toNumber = (value) => {
  if (value === null || value === undefined || value === '') return 0;

  if (typeof value === 'string') {
    const cleaned = value.replace(/,/g, '').replace('%', '').trim();
    const parsed = Number(cleaned);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const normalizeMonth = (value) => {
  const monthMap = {
    jan: 'jan',
    january: 'jan',
    feb: 'feb',
    february: 'feb',
    mar: 'mar',
    march: 'mar',
    apr: 'apr',
    april: 'apr',
    may: 'may',
    jun: 'jun',
    june: 'jun',
    jul: 'jul',
    july: 'jul',
    aug: 'aug',
    august: 'aug',
    sep: 'sep',
    sept: 'sep',
    september: 'sep',
    oct: 'oct',
    october: 'oct',
    nov: 'nov',
    november: 'nov',
    dec: 'dec',
    december: 'dec'
  };

  const key = String(value || '').trim().toLowerCase();
  return monthMap[key] || key;
};

const applyFilters = (rows, filters = {}) => {
  return rows.filter((row) => {
    const rowData = row.rowData || {};

    for (const key in filters) {
      const filterValue = filters[key];
      const rowValue = rowData[key];

      if (
        filterValue === undefined ||
        filterValue === null ||
        String(filterValue).trim() === ''
      ) {
        continue;
      }

      if (key.toLowerCase() === 'month') {
        if (normalizeMonth(rowValue) !== normalizeMonth(filterValue)) {
          return false;
        }
      } else {
        if (
          String(rowValue ?? '').trim().toLowerCase() !==
          String(filterValue).trim().toLowerCase()
        ) {
          return false;
        }
      }
    }

    return true;
  });
};

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
    const xAxis = config.xAxis || null;
    const yAxis = config.yAxis || null;
    const groupBy = config.groupBy || null;
    const filters = config.filters || {};

    if (!groupBy || !yAxis) {
      return res.status(400).json({
        success: false,
        message: 'Widget config is missing groupBy or yAxis'
      });
    }

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

// exports.getWidgetsByDashboardId = async (req, res) => {
//   try {
//     const dashboardId = Number(req.params.dashboardId);

//     if (Number.isNaN(dashboardId)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid dashboard id'
//       });
//     }

//     const widgets = await prisma.dashboardWidget.findMany({
//       where: { dashboardId },
//       orderBy: { createdAt: 'desc' }
//     });

//     return res.status(200).json({
//       success: true,
//       message: 'Widgets fetched successfully',
//       data: widgets
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: 'Fetch widgets failed',
//       error: error.message
//     });
//   }
// };

// exports.getWidgetById = async (req, res) => {
//   try {
//     const widgetId = Number(req.params.id);

//     if (Number.isNaN(widgetId)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid widget id'
//       });
//     }

//     const widget = await prisma.dashboardWidget.findUnique({
//       where: { id: widgetId },
//       include: {
//         file: true
//       }
//     });

//     if (!widget) {
//       return res.status(404).json({
//         success: false,
//         message: 'Widget not found'
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: 'Widget fetched successfully',
//       data: widget
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: 'Fetch widget failed',
//       error: error.message
//     });
//   }
// };

// exports.deleteWidget = async (req, res) => {
//   try {
//     const widgetId = Number(req.params.id);

//     if (Number.isNaN(widgetId)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid widget id'
//       });
//     }

//     const widget = await prisma.dashboardWidget.findUnique({
//       where: { id: widgetId }
//     });

//     if (!widget) {
//       return res.status(404).json({
//         success: false,
//         message: 'Widget not found'
//       });
//     }

//     await prisma.dashboardWidget.delete({
//       where: { id: widgetId }
//     });

//     return res.status(200).json({
//       success: true,
//       message: 'Widget deleted successfully'
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: 'Delete widget failed',
//       error: error.message
//     });
//   }
// };