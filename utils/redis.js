import redis from 'redis';
import { promisify } from 'util';

class RedisClient {
  constructor() {
    this.client = redis.createClient();
    this.client.on('error', (err) => {
      console.log(
        `redis connect failed: ${err.message}`,
      );
    });
  }

  isAlive() {
    /* const asyncping = promisify(this.client.ping)
      .bind(this.client);
    return asyncping()
      .then((resp) => resp === 'PONG'); */
    return this.client.connected;
  }

  async get(key) {
    const asyncget = promisify(this.client.get)
      .bind(this.client);
    const value = await asyncget(key);
    return value;
  }

  async set(key, value, time) {
    const asyncset = promisify(this.client.set)
      .bind(this.client);
    await asyncset(key, value, 'ex', time);
  }

  async del(key) {
    const asyncdel = promisify(this.client.del)
      .bind(this.client);
    await asyncdel(key);
  }
}

const redisClient = new RedisClient();
export default redisClient;
