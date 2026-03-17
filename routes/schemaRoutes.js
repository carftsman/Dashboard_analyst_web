const express = require('express');
const router = express.Router();
const schemaController = require('../controllers/schemaController');

router.post('/', schemaController.createSchema);
router.get('/', schemaController.getSchemas);
router.put('/:id', schemaController.updateSchema);
router.delete('/:id', schemaController.deleteSchema);

module.exports = router;