const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');

router.post('/uploaded-file', fileController.createUploadedFile);
router.get('/uploaded-file', fileController.getUploadedFiles);
router.post('/data-row', fileController.createDataRow);
router.post('/validation-result', fileController.createValidationResult);
router.get('/validation-results/:fileId', fileController.getValidationResultsByFile);

module.exports = router;