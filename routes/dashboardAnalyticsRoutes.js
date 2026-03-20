const express = require('express');
const router = express.Router();

const uploadExcel = require('../middleware/uploadExcelMiddleware');
const { uploadSalesExcel } = require('../controllers/dashboardAnalyticsController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post(
  '/upload/sales',
  verifyToken,
  uploadExcel.single('file'),
  uploadSalesExcel
);

module.exports = router;