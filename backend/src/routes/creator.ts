import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { upload, handleUploadError } from '../middleware/upload';
import { CreatorController } from '../controllers/creator.controller';

const router = Router();

// Application routes
router.get('/application', requireAuth, CreatorController.getApplication);
router.post('/application', requireAuth, CreatorController.createApplication);
router.put('/application', requireAuth, CreatorController.updateApplication);
router.get('/application/status', requireAuth, CreatorController.getApplicationStatus);

// File management routes
router.post('/upload', requireAuth, upload.single('file'), handleUploadError, CreatorController.uploadFile);
router.post('/presigned-url', requireAuth, CreatorController.getPresignedUrl);
router.delete('/file', requireAuth, CreatorController.deleteFile);
router.get('/files/stats', requireAuth, CreatorController.getFileStats);

export default router;