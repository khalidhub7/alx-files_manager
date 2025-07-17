import express from 'express';
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';

const router = express.Router();

// load AppController routes at '/'
router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);
router.post('/users', UsersController.postNew);

module.exports = router;
