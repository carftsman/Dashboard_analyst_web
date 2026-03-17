const prisma = require('../prisma/prismaClient');

exports.createUploadedFile = async (req, res) => {
  try {
    const { fileName, fileUrl, uploadedById, status } = req.body;

    const uploadedFile = await prisma.uploadedFile.create({
      data: {
        fileName,
        fileUrl,
        uploadedById,
        status: status || 'UPLOADED'
      }
    });

    return res.status(201).json({
      success: true,
      message: 'File record created successfully',
      data: uploadedFile
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Create uploaded file failed',
      error: error.message
    });
  }
};

exports.getUploadedFiles = async (req, res) => {
  try {
    const files = await prisma.uploadedFile.findMany({
      include: {
        uploadedBy: true,
        rows: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Files fetched successfully',
      data: files
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Fetch files failed',
      error: error.message
    });
  }
};

exports.createDataRow = async (req, res) => {
  try {
    const { fileId, rowData, status } = req.body;

    const dataRow = await prisma.dataRow.create({
      data: {
        fileId,
        rowData,
        status
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Data row created successfully',
      data: dataRow
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Create data row failed',
      error: error.message
    });
  }
};

exports.createValidationResult = async (req, res) => {
  try {
    const { rowId, errors, isValid } = req.body;

    const validationResult = await prisma.validationResult.create({
      data: {
        rowId,
        errors,
        isValid
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Validation result created successfully',
      data: validationResult
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Create validation result failed',
      error: error.message
    });
  }
};

exports.getValidationResultsByFile = async (req, res) => {
  try {
    const fileId = Number(req.params.fileId);

    const rows = await prisma.dataRow.findMany({
      where: { fileId },
      include: {
        validation: true
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Validation results fetched successfully',
      data: rows
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Fetch validation results failed',
      error: error.message
    });
  }
};