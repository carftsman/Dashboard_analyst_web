const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');
/**
 * @swagger
 * api/users/create:
 *   post:
 *     summary: Create a new user
 *     description: Creates a new user with a system-generated password. Only ADMIN users can access this API.
 *     tags:
 *       - Users Create
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - email
 *               - role
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: Ravi Kumar
 *               email:
 *                 type: string
 *                 format: email
 *                 example: ravi@gmail.com
 *               role:
 *                 type: string
 *                 enum: [ADMIN, MANAGER, ANALYST, SUB_USER, USER]
 *                 example: ANALYST
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: User created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 5
 *                     fullName:
 *                       type: string
 *                       example: Ravi Kumar
 *                     email:
 *                       type: string
 *                       example: ravi@gmail.com
 *                     role:
 *                       type: string
 *                       example: ANALYST
 *                     status:
 *                       type: string
 *                       example: ACTIVE
 *                     generatedPassword:
 *                       type: string
 *                       example: Ra@vi12#X
 *       400:
 *         description: Bad request or user already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Full name, email, and role are required
 *       403:
 *         description: Access denied. Admin only.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Access denied. Admin only.
 *       500:
 *         description: Create user failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Create user failed
 *                 error:
 *                   type: string
 *                   example: Internal server error
 */
router.post(
  '/create',
  verifyToken,
  authorizeRoles('ADMIN'),
  userController.createUser
);

module.exports = router;