import { Router } from 'express';
import { storageController } from '../controllers/storage.controller';
import { authenticate } from '../middleware/auth';
import { uploadMiddleware } from '../middleware/upload.middleware';

const router = Router();

// All storage routes require JWT authentication
router.use(authenticate);

// POST /api/v1/storage/upload
router.post('/upload', uploadMiddleware.single('file'), storageController.uploadFile);

// GET /api/v1/storage/signed-url
router.get('/signed-url', storageController.getSignedUrl);

// DELETE /api/v1/storage/file
router.delete('/file', storageController.deleteFile);

export default router;
