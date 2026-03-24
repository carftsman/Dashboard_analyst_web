const prisma = require('../prisma/prismaClient');
const { getWidgetDefinitions, widgetRules } = require('../utils/widgetDefinitions');

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


exports.getWidgetBuilder = async (req, res) => {
  try {
    const dashboardId = Number(req.params.dashboardId);

    if (Number.isNaN(dashboardId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid dashboard id'
      });
    }

    const dashboard = await prisma.dashboard.findUnique({
      where: { dashboardId },
      include: {
        dataSchemas: {
          where: { isActive: true },
          select: {
            id: true,
            columnName: true,
            dataType: true,
            isRequired: true
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    });

    if (!dashboard) {
      return res.status(404).json({
        success: false,
        message: 'Dashboard not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Widget builder fetched successfully',
      data: {
        dashboardId: dashboard.dashboardId,
        dashboardName: dashboard.dashboardName,
        columns: dashboard.dataSchemas,
        widgets: getWidgetDefinitions()
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Fetch widget builder failed',
      error: error.message
    });
  }
};
exports.createWidget = async (req, res) => {
  try {
    const dashboardId = Number(req.params.dashboardId);

    const {
      title,
      widgetType,
      positionX,
      positionY,
      width,
      height,
      config
    } = req.body;

    if (Number.isNaN(dashboardId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid dashboard id'
      });
    }

    if (!title || !widgetType) {
      return res.status(400).json({
        success: false,
        message: 'title and widgetType are required'
      });
    }

    const dashboard = await prisma.dashboard.findUnique({
      where: { dashboardId }
    });

    if (!dashboard) {
      return res.status(404).json({
        success: false,
        message: 'Dashboard not found'
      });
    }

    const requiredFields = widgetRules[widgetType];

    if (!requiredFields) {
      return res.status(400).json({
        success: false,
        message: 'Invalid widget type'
      });
    }

    if (!config || typeof config !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'config is required'
      });
    }

    for (const field of requiredFields) {
      if (
        config[field] === undefined ||
        config[field] === null ||
        config[field] === '' ||
        (Array.isArray(config[field]) && config[field].length === 0)
      ) {
        return res.status(400).json({
          success: false,
          message: `${field} is required for ${widgetType}`
        });
      }
    }

    const widget = await prisma.dashboardWidget.create({
      data: {
        dashboardId,
        title,
        widgetType,
        positionX: Number(positionX) || 0,
        positionY: Number(positionY) || 0,
        width: Number(width) || 6,
        height: Number(height) || 4,
        fileId: null,
        config: {
          ...config,
          filters: config.filters || {}
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
    const filters = config.filters || {};
    const filteredRows = applyFilters(widget.file.rows, filters);

    if (widget.widgetType === 'BAR_CHART' || widget.widgetType === 'LINE_CHART') {
      const xAxis = config.xAxis;
      const yAxis = config.yAxis;

      if (!xAxis || !yAxis) {
        return res.status(400).json({
          success: false,
          message: 'Widget config is missing xAxis or yAxis'
        });
      }

      const groupedData = {};

      filteredRows.forEach((row) => {
        const rowData = row.rowData || {};
        const label = rowData[xAxis] || 'Unknown';
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
          values
        }
      });
    }

    if (widget.widgetType === 'PIE_CHART') {
      const groupBy = config.groupBy;
      const metric = config.metric;

      if (!groupBy || !metric) {
        return res.status(400).json({
          success: false,
          message: 'Widget config is missing groupBy or metric'
        });
      }

      const groupedData = {};

      filteredRows.forEach((row) => {
        const rowData = row.rowData || {};
        const label = rowData[groupBy] || 'Unknown';
        const value = toNumber(rowData[metric]);

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
          groupBy,
          metric,
          values
        }
      });
    }

    if (widget.widgetType === 'KPI_CARDS') {
      const metric = config.metric;

      if (!metric) {
        return res.status(400).json({
          success: false,
          message: 'Widget config is missing metric'
        });
      }

      const total = filteredRows.reduce((sum, row) => {
        const rowData = row.rowData || {};
        return sum + toNumber(rowData[metric]);
      }, 0);

      return res.status(200).json({
        success: true,
        message: 'KPI data fetched successfully',
        data: {
          widgetId: widget.id,
          title: widget.title,
          widgetType: widget.widgetType,
          metric,
          value: total
        }
      });
    }

    if (widget.widgetType === 'TABLE') {
      const columns = config.columns || [];

      const values = filteredRows.map((row) => {
        const rowData = row.rowData || {};
        const tableRow = {};

        columns.forEach((column) => {
          tableRow[column] = rowData[column] ?? null;
        });

        return tableRow;
      });

      return res.status(200).json({
        success: true,
        message: 'Table data fetched successfully',
        data: {
          widgetId: widget.id,
          title: widget.title,
          widgetType: widget.widgetType,
          columns,
          values
        }
      });
    }

    return res.status(400).json({
      success: false,
      message: `Chart data handler not implemented for ${widget.widgetType}`
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Fetch chart data failed',
      error: error.message
    });
  }
};