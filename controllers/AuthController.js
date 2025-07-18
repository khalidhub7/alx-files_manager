import sha1 from 'sha1';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AuthController {
  static async getConnect(req, res) {
    // this func expects a header
    // like authorization: Basic <base64>
    let authenticated = false;
    let user;

    const header = req.headers.authorization;
    if (header) {
      const extractBase64 = header.replace('Basic ', '');
      const decodeBase64 = Buffer.from(extractBase64, 'base64')
        .toString('utf-8');
      const [email, password] = decodeBase64.split(':');

      user = await dbClient.db.collection('users')
        .findOne({ email });
      if (user) {
        const hashpwd = sha1(password);
        if (user.password === hashpwd) { authenticated = true; }
      }
    }
    // previously here i handled email/password from body
    // and set authorization header
    if (authenticated) {
      const token = uuidv4();
      const key = `auth_${token}`;
      const userID = user._id.toString();

      await redisClient.set(key, userID, 86400);
      res.status(200).send({ token });
    } else { res.status(401).send({ error: 'Unauthorized' }); }
  }

  static async getDisconnect(req, res) {
    const token = req.headers['x-token'];
    let errMsg = false;
    if (token) {
      const userID = await redisClient.get(`auth_${token}`);
      if (userID) {
        await redisClient.del(`auth_${token}`);
        res.status(204).send();
      } else { errMsg = true; }
    }
    if (!token || errMsg) {
      res.status(401).send({ error: 'Unauthorized' });
    }
  }
}

export default AuthController;
