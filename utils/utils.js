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
    } else if (Number(arg) === 0) {
      id = '0';
    } else { id = undefined; }
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

  // find a file by its parent folder's id
  static async getFileById(parentId) {
    const file = await dbClient.db.collection('files')
      .findOne({ _id: this.getValidId(parentId) });
    return file;
  }

  // find a file by its id and owner's user id
  static async getFileByIdAndUser(fileId, userId) {
    const file = await dbClient.db.collection('files')
      .findOne(
        { _id: this.getValidId(fileId), userId: this.getValidId(userId) },
      );
    return file;
  }

  // insert a new file document
  static async insertFileDoc(doc) {
    const insert = await dbClient.db.collection('files')
      .insertOne(doc);
    return insert;
  }

  // get paginated files by parent id and user id
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

  // find a file and update its fields
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
