const prisma = require('../prisma/prismaClient');
const xlsx = require('xlsx');

const SALES_REQUIRED_COLUMNS = [
  'Executive ID',
  'Executive Name',
  'Region',
  'State',
  'City',
  'Vendors Onboarded',
  'Vendors Active',
  'Orders From Vendors',
  'Revenue From Vendors',
  'Visits Per Day',
  'Target Vendors',
  'Achievement Percentage',
  'Month'
];

const validateHeaders = (uploadedHeaders) => {
  const missingColumns = SALES_REQUIRED_COLUMNS.filter(
    (col) => !uploadedHeaders.includes(col)
  );

  const extraColumns = uploadedHeaders.filter(
    (col) => !SALES_REQUIRED_COLUMNS.includes(col)
  );

  return {
    isValid: missingColumns.length === 0,
    missingColumns,
    extraColumns
  };
};

exports.uploadSalesExcel = async (req, res) => {
  try {
    const { dashboardId } = req.body;

    // console.log('req.file:', req.file);
    // console.log('req.body:', req.body);

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    if (!dashboardId) {
      return res.status(400).json({
        success: false,
        message: 'dashboardId is required'
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

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });

    if (!rows.length) {
      return res.status(400).json({
        success: false,
        message: 'Uploaded Excel file is empty'
      });
    }

    const uploadedHeaders = Object.keys(rows[0]);
    const headerValidation = validateHeaders(uploadedHeaders);

    const uploadedFile = await prisma.uploadedFile.create({
      data: {
        fileName: req.file.originalname,
        status: headerValidation.isValid ? 'VALIDATED' : 'FAILED',
        dashboardId: Number(dashboardId),
        uploadedById: req.user.id,
        uploadedColumns: uploadedHeaders,
        extraColumns: headerValidation.extraColumns,
        fileUrl: null
      }
    });

    if (rows.length > 0) {
      await prisma.dataRow.createMany({
        data: rows.map((row) => ({
          fileId: uploadedFile.id,
          rowData: row,
          status: 'VALID'
        }))
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Sales file uploaded successfully',
      data: {
        fileId: uploadedFile.id,
        fileName: uploadedFile.fileName,
        totalRows: rows.length,
        uploadedHeaders,
        missingColumns: headerValidation.missingColumns,
        extraColumns: headerValidation.extraColumns,
        isValid: headerValidation.isValid
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Upload failed',
      error: error.message
    });
  }
};
// controllers/dashboardValidationController.js


exports.getValidationSummary = async (req, res) => {
  console.log('req.params.fileId:', req.params.fileId);
  try {
    const fileId = Number(req.params.fileId);

    if (!fileId || Number.isNaN(fileId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid fileId is required'
      });
    }

    const uploadedFile = await prisma.uploadedFile.findUnique({
      where: { id: fileId },
      include: {
        rows: {
          include: {
            validation: true
          }
        }
      }
    });

    if (!uploadedFile) {
      return res.status(404).json({
        success: false,
        message: 'Uploaded file not found'
      });
    }

    const totalRows = uploadedFile.rows.length;

    const validRows = uploadedFile.rows.filter(
      (row) => row.status === 'VALID'
    ).length;

    const invalidRows = uploadedFile.rows.filter(
      (row) => row.status === 'INVALID'
    ).length;

    const invalidRowDetails = uploadedFile.rows
      .filter((row) => row.status === 'INVALID')
      .map((row) => ({
        rowId: row.id,
        rowData: row.rowData || {},
        errors: row.validationResult?.errors || []
      }));

    return res.status(200).json({
      success: true,
      message: 'Validation summary fetched successfully',
      data: {
        fileId: uploadedFile.id,
        fileName: uploadedFile.fileName,
        status: uploadedFile.status,
        uploadedColumns: uploadedFile.uploadedColumns || [],
        extraColumns: uploadedFile.extraColumns || [],
        totalRows,
        validRows,
        invalidRows,
        invalidRowDetails
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Fetch validation summary failed',
      error: error.message
    });
  }
};