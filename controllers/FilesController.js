import { promises as fsPromises } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import UtilsHelper from '../utils/utils';

class FilesController {
  static async postUpload(req, res) {
    const user = await UtilsHelper.getUserByToken(req);
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
      // data must be in base64
      return res.status(400).send({ error: 'Missing data' });
    }
    if (Number(parentId) !== 0) {
      const parentFolderDoc = await UtilsHelper.getFileByParentId(parentId);
      if (!parentFolderDoc) {
        return res.status(400).send({ error: 'Parent not found' });
      }
      if (parentFolderDoc.type !== 'folder') {
        return res.status(400).send({ error: 'Parent is not a folder' });
      }
    }

    // insert new folder or file to db
    const userID = user._id;

    // shared metadata for both files and folders
    let newFileOrFolder = {
      userId: userID, name, type, isPublic, parentId,
    };

    // handle folder creation
    if (type === 'folder') {
      // console.log(`***  ${JSON.stringify(newFileOrFolder)}  ***`);
      await UtilsHelper.insertFileDoc(newFileOrFolder);
      // console.log(`***  ${JSON.stringify(newFileOrFolder)}  ***`);
      const { _id, ...rest } = newFileOrFolder;
      const updatedFolder = { id: _id, ...rest };
      return res.status(201).send(updatedFolder);
    }

    // handle file/image: save metadata and store file locally
    const path = process.env.FOLDER_PATH || '/tmp/files_manager';
    await fsPromises.mkdir(path, { recursive: true });

    const fileName = uuidv4();
    const fileData = {
      ...newFileOrFolder, localPath: `${path}/${fileName}`,
    };

    const insert = await UtilsHelper.insertFileDoc(fileData);
    newFileOrFolder = {
      id: insert.insertedId.toString(),
      ...newFileOrFolder,
    };

    await fsPromises.writeFile(
      fileData.localPath, Buffer.from(data, 'base64'),
    );
    return res.status(201).send(newFileOrFolder);
  }

  static async getShow(req, res) {
    const user = await UtilsHelper.getUserByToken(req);
    if (!user) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    // find file by _id and userId
    const fileId = req.params.id;
    if (fileId) {
      const file = await UtilsHelper.getFileByIdAndUser(fileId, user._id);
      if (file) { return res.status(200).send(file); }
    }
    return res.status(404).send({ error: 'Not found' });
  }

  static async getIndex(req, res) {
    const user = await UtilsHelper.getUserByToken(req);
    if (!user) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    const { parentId, page = '0' } = req.query;
    const paginate = await UtilsHelper.paginateFiles(
      parentId, user._id, page,
    );
    return res.send(paginate);
  }
}

export default FilesController;
