import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { upload, handleUploadError } from '../middleware/upload.middleware';
import { CreatorController } from '../controllers/creator.controller';

const router = Router();

/**
 * @swagger
 * /api/creator/application:
 *   get:
 *     summary: Get the authenticated user's creator application
 *     tags: [Creator]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     responses:
 *       200:
 *         description: Creator application object
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *   post:
 *     summary: Submit a new creator application
 *     tags: [Creator]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [legalName, bio]
 *             properties:
 *               legalName:
 *                 type: string
 *               bio:
 *                 type: string
 *               contentCategory:
 *                 type: string
 *               socialLinks:
 *                 type: object
 *     responses:
 *       201:
 *         description: Application created
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *   put:
 *     summary: Update an existing creator application
 *     tags: [Creator]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Application updated
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/application', requireAuth, CreatorController.getApplication);
router.post('/application', requireAuth, CreatorController.createApplication);
router.put('/application', requireAuth, CreatorController.updateApplication);

/**
 * @swagger
 * /api/creator/application/status:
 *   get:
 *     summary: Get the status of the creator application (pending / approved / rejected)
 *     tags: [Creator]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     responses:
 *       200:
 *         description: Application status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [pending, approved, rejected]
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/application/status', requireAuth, CreatorController.getApplicationStatus);

/**
 * @swagger
 * /api/creator/upload:
 *   post:
 *     summary: Upload a file for the creator application (e.g., ID document)
 *     tags: [Creator]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: File URL after upload
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post(
  '/upload',
  requireAuth,
  upload.single('file'),
  handleUploadError,
  CreatorController.uploadFile
);

/**
 * @swagger
 * /api/creator/presigned-url:
 *   post:
 *     summary: Get a presigned S3 URL for direct client-side upload
 *     tags: [Creator]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fileName, contentType]
 *             properties:
 *               fileName:
 *                 type: string
 *               contentType:
 *                 type: string
 *     responses:
 *       200:
 *         description: Presigned URL and final file key
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/presigned-url', requireAuth, CreatorController.getPresignedUrl);

/**
 * @swagger
 * /api/creator/file:
 *   delete:
 *     summary: Delete an uploaded file from storage
 *     tags: [Creator]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fileKey]
 *             properties:
 *               fileKey:
 *                 type: string
 *     responses:
 *       200:
 *         description: File deleted
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.delete('/file', requireAuth, CreatorController.deleteFile);

/**
 * @swagger
 * /api/creator/files/stats:
 *   get:
 *     summary: Get storage usage statistics for the creator
 *     tags: [Creator]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     responses:
 *       200:
 *         description: File count and total bytes used
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/files/stats', requireAuth, CreatorController.getFileStats);

export default router;
