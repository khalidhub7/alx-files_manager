// optional helper functions only
import { ObjectId } from 'mongodb';
import dbClient from './db';
import redisClient from './redis';

class UtilsHelper {
  // returns objectid or '0'; throws if invalid
  static getValidId(arg) {
    let id;
    if (arg instanceof ObjectId) {
      id = arg;
    } else if (ObjectId.isValid(arg)) {
      id = new ObjectId(arg);
    } else {
      id = 0;
    }
    return id;
  }

  // gets user by token from redis and db
  // returns user or null
  static async getUserByToken(req) {
    let user = null;
    const { 'x-token': token } = req.headers;

    if (token) {
      const userID = await redisClient.get(`auth_${token}`);
      if (userID) {
        user = await dbClient.db.collection('users')
          .findOne({ _id: this.getValidId(userID) });
      }
    }
    return user;
  }

  // find one file by _id
  static async getFileByParentId(parentId) {
    const file = await dbClient.db.collection('files')
      .findOne({ _id: this.getValidId(parentId) });
    return file;
  }

  // find file by _id and userId
  static async getFileByIdAndUser(fileId, userId) {
    const file = await dbClient.db.collection('files')
      .findOne(
        { _id: this.getValidId(fileId), userId: this.getValidId(userId) },
      );
    return file;
  }

  // insert one file
  static async insertFileDoc(doc) {
    const insert = await dbClient.db.collection('files')
      .insertOne(doc);
    return insert;
  }

  static async paginateFiles(parentId, userId, page) {
    const startIndex = 20 * Number(page);
    const files = await dbClient.db.collection('files')
      .aggregate([
        {
          $match:
          {
            parentId: this.getValidId(parentId),
            userId: this.getValidId(userId),
          },
        },
        { $skip: startIndex }, { $limit: 20 },
      ]).toArray();
    return files;
  }

  static async findAndUpdateFile(where, obj, options) {
    const result = await dbClient.db.collection('files')
      .findOneAndUpdate(
        where, // filter
        { $set: obj }, // update
        options, // option: return updated doc
      );
    return result.value;
  }
}
export default UtilsHelper;
