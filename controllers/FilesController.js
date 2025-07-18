import { promises as fsPromises } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { ObjectId } from 'mongodb';
import UtilsHelper from '../utils/utils';
import dbClient from '../utils/db';

class FilesController {
  static async postUpload(req, res) {
    const user = UtilsHelper.getUserByToken(req);
    if (!user) {
      return res.status(401).send({ error: 'Unauthorized' });
    }
    // get file info from request body
    const {
      name, type, parentId = 0, isPublic = false, data,
    } = req.body;

    // validate input & parent folder
    if (!name) {
      return res.status(400).send({ error: 'Missing name' });
    }
    if (!type || !['folder', 'file', 'image'].includes(type)) {
      return res.status(400).send({ error: 'Missing type' });
    }
    if (['file', 'image'].includes(type) && !data) {
      return res.status(400).send({ error: 'Missing data' });
    }
    if (parentId !== '0') {
      const file = await dbClient.db.collection('files')
        .findOne({ _id: new ObjectId(parentId) });
      if (!file) {
        return res.status(400).send({ error: 'Parent not found' });
      }
      if (file && file.type !== 'folder') {
        return res.status(400).send({ error: 'Parent is not a folder' });
      }
    }

    // insert new folder to db
    const userID = user._id.toString();
    if (type === 'folder') {
      const file = {
        userId: userID, name, type, parentId, isPublic,
      };
      const insert = await dbClient.db.collection('files')
        .insertOne(file);
      file.id = insert.insertedId.toString();
      return res.status(201).send(file);
    }

    // otherwise store file locally
    const path = process.env.FOLDER_PATH || '/tmp/files_manager';
    // create folder if not exists
    await fsPromises.mkdir(path, { recursive: true });

    const fileName = uuidv4();
    const fileData = {
      userId: userID, name, type, parentId, isPublic, localPath: `${path}/${fileName}`,
    };
    await fsPromises.writeFile(
      fileData.localPath, Buffer.from(data, 'base64'),
    );
    return res.status(201).send(fileData);
  }
}

export default FilesController;
