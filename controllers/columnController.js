const prisma = require('../prisma/prismaClient');

exports.createColumn = async (req, res) => {
  try {
    const dashboardId = Number(req.params.dashboardId);
    const { columnName, dataType } = req.body;

    if (Number.isNaN(dashboardId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid dashboard id'
      });
    }

    if (!columnName || !dataType) {
      return res.status(400).json({
        success: false,
        message: 'Column name and data type are required'
      });
    }

    const allowedDataTypes = ['STRING', 'NUMBER', 'BOOLEAN', 'DATE'];

    if (!allowedDataTypes.includes(dataType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid data type. Allowed values are: ${allowedDataTypes.join(', ')}`
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

    const existingColumn = await prisma.dataSchema.findFirst({
      where: {
        dashboardId,
        columnName: {
          equals: columnName.trim(),
          mode: 'insensitive'
        },
        isActive: true
      }
    });

    if (existingColumn) {
      return res.status(400).json({
        success: false,
        message: 'Column already exists in this dashboard'
      });
    }

    const dataSchema = await prisma.dataSchema.create({
      data: {
        dashboardId,
        schemaName: dashboard.dashboardName.trim(),
        columnName: columnName.trim(),
        dataType,
        isRequired: false,
        defaultValue: null,
        description: null,
        updatedById: req.user.id
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Column created successfully',
      data: dataSchema
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'Column already exists in this dashboard'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Create column failed',
      error: error.message
    });
  }
};
exports.getDataTypes = async (req, res) => {
  try {
    const dataTypes = ['STRING', 'NUMBER', 'BOOLEAN', 'DATE'];

    return res.status(200).json({
      success: true,
      message: 'Data types fetched successfully',
      data: dataTypes
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Fetch data types failed',
      error: error.message
    });
  }
};
exports.getColumns = async (req, res) => {
  try {
    const dataSchemas = await prisma.dataSchema.findMany({
      where: {
        isActive: true
      },
      select: {
        columnName: true,
        dataType: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Data schemas fetched successfully',
      data: dataSchemas
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Fetch data schemas failed',
      error: error.message
    });
  }
};