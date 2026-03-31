const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User Management APIs
 */
/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Get logged-in user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile fetched successfully
 */
router.get('/profile', verifyToken, userController.getProfile);
/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Update logged-in user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Surya
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.put('/profile', verifyToken, userController.updateProfile);

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create new user (Admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: 123456
 *               role:
 *                 type: string
 *                 enum: [ADMIN, MANAGER, ANALYST, SUBUSER]
 *                 example: MANAGER
 *     responses:
 *       200:
 *         description: User created successfully
 *       400:
 *         description: Email already exists
 *       500:
 *         description: Server error
 */
router.post('/', verifyToken, authorizeRoles('ADMIN'), userController.createUser);



/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get users list with optional filters
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE]
 *         required: false
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [ADMIN, MANAGER, ANALYST, SUBUSER]
 *         required: false
 *     responses:
 *       200:
 *         description: List of users
 *       500:
 *         description: Server error
 */
router.get('/', verifyToken, authorizeRoles('ADMIN'), userController.getUsers);



/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user details
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Updated Name
 *               role:
 *                 type: string
 *                 enum: [ADMIN, MANAGER, ANALYST, SUBUSER]
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE]
 *     responses:
 *       200:
 *         description: User updated successfully
 *       500:
 *         description: Server error
 */
router.put('/:id', verifyToken, authorizeRoles('ADMIN'), userController.updateUser);


/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       500:
 *         description: Server error
 */
router.delete('/:id', verifyToken, authorizeRoles('ADMIN'), userController.deleteUser);



/**
 * @swagger
 * /api/users/{id}/status:
 *   patch:
 *     summary: Change user status (ACTIVE / INACTIVE)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE]
 *                 example: ACTIVE
 *     responses:
 *       200:
 *         description: Status updated successfully
 *       500:
 *         description: Server error
 */
router.patch('/:id/status', verifyToken, authorizeRoles('ADMIN'), userController.changeStatus);

module.exports = router;