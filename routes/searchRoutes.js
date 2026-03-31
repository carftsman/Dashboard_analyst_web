const express = require('express');
const router = express.Router();

const searchController = require('../controllers/searchController');
const { verifyToken } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Search
 *   description: Global Search APIs
 */

/**
 * @swagger
 * /api/search:
 *   get:
 *     summary: Global search across dashboards, files, reports, and users
 *     description: Returns ranked and categorized search results with pagination and highlights.
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search keyword
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Search results fetched successfully
 *       400:
 *         description: Missing query
 *       500:
 *         description: Server error
 */
router.get('/', verifyToken, searchController.globalSearch);

module.exports = router;