import express from 'express';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

const router = express.Router();

router.get('/status', (_, res) => {
  const isRedisAlive = redisClient.isAlive();
  const isDbAlive = dbClient.isAlive();

  // .send() auto adds Content-Type: application/json
  const statusCode = (isRedisAlive && isDbAlive)
    ? 200 : 500;
  res.status(statusCode)
    .send({ redis: isRedisAlive, db: isDbAlive });
});

router.get('/stats', async (_, res) => {
  const files = await dbClient.nbFiles();
  const users = await dbClient.nbUsers();

  res.status(200).send({ users, files });
});

export default router;
