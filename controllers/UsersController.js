import sha1 from 'sha1';
import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class UsersController {
  static async postNew(req, res) {
    let errMsg = '';
    const { email = '', password = '' } = req.body;

    if (!password) { errMsg = 'Missing password'; }
    if (!email) { errMsg = 'Missing email'; }
    if (errMsg !== '') { return res.status(400).send({ error: errMsg }); }

    const user = await dbClient.db.collection('users')
      .findOne({ email });

    if (user) {
      errMsg = 'Already exist';
      return res.status(400).send({ error: errMsg });
    }

    const pwd = sha1(password);
    const insert = await dbClient.db.collection('users')
      .insertOne({ email, password: pwd });

    if (insert.result.ok === 1) {
      const id = insert.insertedId;
      return res.status(201).send({ id, email });
    }
    return undefined;
  }

  static async getMe(req, res) {
    const token = req.headers['x-token'];
    let authenticated = false;
    if (token) {
      const userID = await redisClient.get(`auth_${token}`);
      if (userID) {
        authenticated = true;
        const user = await dbClient.db.collection('users')
          .findOne({ _id: new ObjectId(userID) });
        res.status(200).send({ id: userID, email: user.email });
      }
    }
    if (!authenticated) {
      res.status(401).send({ error: 'Unauthorized' });
    }
  }
}

export default UsersController;
