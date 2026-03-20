const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

router.post(
  '/create',
  verifyToken,
  authorizeRoles('ADMIN'),
  userController.createUser
);

module.exports = router;