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

  static async getFileByIdAndUser(fileId, userId) {
    // find file by _id and userId
    const file = await dbClient.db.collection('files')
      .findOne({ _id: new ObjectId(fileId), userId });
    return file;
  }

  static async insertFileDoc(doc) {
    const insert = await dbClient.db.collection('files')
      .insertOne(doc);
    return insert;
  }

  static async paginateFiles(parentId, userId, page) {
    const startIndex = 20 * ((page + 1) - 1);

    let parent;
    if (Number.isNaN(Number(parentId))) {
      parent = new ObjectId(parentId);
    } else { parent = Number(parentId); }

    const files = await dbClient.db.collection('files')
      .aggregate([
        { $match: { parentId: parent, userId } },
        { $skip: startIndex },
        { $limit: 20 },
      ]).toArray();
    return files;
  }
}
export default UtilsHelper;
