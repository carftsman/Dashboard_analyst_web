const prisma = require('../prisma/prismaClient');

exports.createSchema = async (req, res) => {
  try {
    const {
      schemaName,
      tableName,
      columnName,
      dataType,
      isRequired,
      defaultValue,
      description,
      updatedById
    } = req.body;

    const schema = await prisma.dataSchema.create({
      data: {
        schemaName,
        tableName,
        columnName,
        dataType,
        isRequired,
        defaultValue,
        description,
        updatedById
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Schema created successfully',
      data: schema
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Create schema failed',
      error: error.message
    });
  }
};

exports.getSchemas = async (req, res) => {
  try {
    const schemas = await prisma.dataSchema.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Schemas fetched successfully',
      data: schemas
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Fetch schemas failed',
      error: error.message
    });
  }
};

exports.updateSchema = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const {
      schemaName,
      tableName,
      columnName,
      dataType,
      isRequired,
      defaultValue,
      description,
      isActive,
      updatedById
    } = req.body;

    const schema = await prisma.dataSchema.update({
      where: { id },
      data: {
        schemaName,
        tableName,
        columnName,
        dataType,
        isRequired,
        defaultValue,
        description,
        isActive,
        updatedById
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Schema updated successfully',
      data: schema
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Update schema failed',
      error: error.message
    });
  }
};

exports.deleteSchema = async (req, res) => {
  try {
    const id = Number(req.params.id);

    await prisma.dataSchema.delete({
      where: { id }
    });

    return res.status(200).json({
      success: true,
      message: 'Schema deleted successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Delete schema failed',
      error: error.message
    });
  }
};