// optional helper functions only
import { ObjectId } from 'mongodb';
import dbClient from './db';
import redisClient from './redis';

class UtilsHelper {
  static async getUserByToken(req) {
    let user = null;
    const { 'x-token': token } = req.headers;

    if (token) {
      const userID = await redisClient.get(`auth_${token}`);
      if (userID) {
        user = await dbClient.db.collection('users')
          .findOne({ _id: new ObjectId(userID) });
      }
    }
    return user;
  }

  static async getFileByParentId(parentId) {
    const file = await dbClient.db.collection('files')
      .findOne({ _id: new ObjectId(parentId) });
    return file;
  }

  static async insertFileDoc(doc) {
    const insert = await dbClient.db.collection('files')
      .insertOne(doc);
    return insert;
  }
}
export default UtilsHelper;
