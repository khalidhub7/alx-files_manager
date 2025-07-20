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
    // find one file by _id
    const file = await dbClient.db.collection('files')
      .findOne({ _id: new ObjectId(parentId) });
    return file;
  }

  static async getFilesByIdAndUser(fileId, userId) {
    // find files by _id and userId
    const files = await dbClient.db.collection('files')
      .find({ _id: new ObjectId(fileId), userId })
      .toArray();
    return files;
  }

  static async insertFileDoc(doc) {
    const insert = await dbClient.db.collection('files')
      .insertOne(doc);
    return insert;
  }

  static async paginateFiles(parentId, page) {
    const startIndex = 20 * ((page + 1) - 1);

    const files = await dbClient.db.collection('files')
      .aggregate([
        { $match: { parentId: new ObjectId(parentId) } },
        { $limit: startIndex + 20 },
        { $skip: startIndex },
      ]).toArray();
    return files;
  }
}
export default UtilsHelper;
