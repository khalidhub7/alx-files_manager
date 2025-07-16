import express from 'express';
import AppController from '../controllers/AppController';

const router = express.Router();

// load AppController routes at '/'
router.use('/', AppController);

export default router;
