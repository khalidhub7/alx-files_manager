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
    const startIndex = 20 * Number(page);

    let parent = parentId;
    // Convert valid parentId to ObjectId
    if (ObjectId.isValid(parentId)) {
      parent = new ObjectId(parentId);
    }

    const files = await dbClient.db.collection('files')
      .aggregate([
        { $match: { parentId: parent, userId } },
        { $skip: startIndex }, { $limit: 20 },
      ]).toArray();
    return files;
  }

  static async updateFileDoc(where, obj) {
    const update = await dbClient.db.collection('files')
      .findOneAndUpdate(
        where, { $set: obj }, { returnOriginal: false },
      );
    return update.value;
  }
}
export default UtilsHelper;
