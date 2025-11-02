import { Router } from 'express';
import { SearchController } from '../controllers/search.controller';

const router = Router();
const searchController = new SearchController();

/**
 * @route   GET /api/search
 * @desc    Search streams, users, and categories
 * @access  Public
 * @query   q - search query (required)
 * @query   type - all|streams|users|categories (optional, default: all)
 * @query   live - true|false (optional, filter by live status)
 * @query   category - category name (optional)
 * @query   sort - relevance|viewers|recent (optional, default: relevance)
 * @query   limit - number of results per type (optional, default: 20, max: 50)
 * @query   offset - pagination offset (optional, default: 0)
 */
router.get('/', searchController.search.bind(searchController));

/**
 * @route   GET /api/search/suggestions
 * @desc    Get search suggestions for autocomplete
 * @access  Public
 * @query   q - partial search query (required, min 2 chars)
 */
router.get('/suggestions', searchController.suggestions.bind(searchController));

export default router;
