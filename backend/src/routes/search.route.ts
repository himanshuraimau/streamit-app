import { Router } from 'express';
import { SearchController } from '../controllers/search.controller';

const router = Router();

/**
 * @swagger
 * /api/search:
 *   get:
 *     summary: Search streams, users, and categories
 *     tags: [Search]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [all, streams, users, categories]
 *           default: all
 *       - in: query
 *         name: live
 *         schema:
 *           type: boolean
 *         description: Filter by live status
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category name
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [relevance, viewers, recent]
 *           default: relevance
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 50
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Search results grouped by type
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 streams:
 *                   type: array
 *                   items:
 *                     type: object
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                 categories:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.get('/', SearchController.search);

/**
 * @swagger
 * /api/search/suggestions:
 *   get:
 *     summary: Get autocomplete suggestions for a partial search query
 *     tags: [Search]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *         description: Partial search query (minimum 2 characters)
 *     responses:
 *       200:
 *         description: List of suggestion strings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 suggestions:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.get('/suggestions', SearchController.suggestions);

export default router;
