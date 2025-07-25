import mime from 'mime-types';
import { Buffer } from 'buffer';
import { v4 as uuidv4 } from 'uuid';
import { promises as fsPromises } from 'fs';
import UtilsHelper from '../utils/utils';
import fileQueue from '../worker';

class FilesController {
  static async postUpload(req, res) {
    const user = await UtilsHelper.getUserByToken(req);
    if (!user) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    // get file info from request body
    const {
      name, type, parentId = 0, isPublic = false, data = undefined,
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
      const parentFolderDoc = await UtilsHelper.getFileById(parentId);
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
      try {
        // console.log(`***  ${JSON.stringify(newFileOrFolder)}  ***`);
        await UtilsHelper.insertFileDoc(newFileOrFolder);
        // console.log(`***  ${JSON.stringify(newFileOrFolder)}  ***`);

        const { _id, ...rest } = newFileOrFolder;
        const updatedFolder = { id: _id, ...rest };
        console.log('_> folder created');
        return res.status(201).send(updatedFolder);
      } catch (err) {
        console.log(`_> folder create failed: ${err.message}`);
      }
    } else if (['file', 'image'].includes(type)) {
      // handle file/image: save metadata in db
      // and store file locally
      try {
        console.log('_> saving file');
        const path = process.env.FOLDER_PATH || '/tmp/files_manager';
        await fsPromises.mkdir(path, { recursive: true });

        const fileName = uuidv4();
        const fileData = {
          ...newFileOrFolder, localPath: `${path}/${fileName}`,
        };

        const insert = await UtilsHelper.insertFileDoc(fileData);
        newFileOrFolder = {
          id: insert.insertedId, ...newFileOrFolder,
        };

        await fsPromises.writeFile(
          fileData.localPath, Buffer.from(data, 'base64'),
        );

        if (insert.result.ok === 1 && type === 'image') {
          const jobData = {
            userId: fileData.userId.toString(),
            fileId: newFileOrFolder.id.toString(),
          };
          await fileQueue.add(jobData);
          console.log('_> thumbnail job added');
        }

        console.log('_> file saved');
        return res.status(201).send(newFileOrFolder);
      } catch (err) {
        console.log(`_> file save failed: ${err.message}`);
      }
    }

    return undefined;
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

    const { parentId = '0', page = '0' } = req.query;
    const paginate = await UtilsHelper.paginateFiles(
      parentId, user._id, page,
    );
    /* return res.send(paginate); */
    // return id instead of _id
    // this fucking error took 2 days to fix

    return res.send(paginate.map((file) => ({
      id: file._id,
      name: file.name,
      type: file.type,
      parentId: file.parentId,
    })));
  }

  static async putPublish(req, res) {
    await FilesController.togglePublicStatus(req, res, true);
  }

  static async putUnpublish(req, res) {
    await FilesController.togglePublicStatus(req, res, false);
  }

  static async togglePublicStatus(req, res, status) {
    const user = await UtilsHelper.getUserByToken(req);
    if (!user) {
      return res.status(401).send({ error: 'Unauthorized' });
    }
    const { id } = req.params;
    const fileId = id;
    // search file by user_id and file_id
    const userId = UtilsHelper.getValidId(user._id);
    const _id = UtilsHelper.getValidId(fileId);
    const update = await UtilsHelper.findAndUpdateFile(
      { userId, _id },
      { isPublic: status },
      { returnOriginal: false },
    );

    if (!update) {
      return res.status(404).send({ error: 'Not found' });
    }

    return res.send(update);
  }

  // return file data if public or user has access
  static async getFile(req, res) {
    const { id } = req.params; // file _id
    const { size } = req.query;

    const file = await UtilsHelper.getFileById(id);
    const user = await UtilsHelper.getUserByToken(req);

    if (!file) {
      return res.status(404).send({ error: 'Not found' });
    }
    if (file.isPublic === false) {
      if (!user || !(user._id.toString() === file.userId.toString())) {
        return res.status(404).send({ error: 'Not found' });
      }
    }
    if (file.type === 'folder') {
      return res.status(400).send({ error: "A folder doesn't have content" });
    }
    if (!file.localPath) {
      return res.status(404).send({ error: 'Not found' });
    }

    // else return file
    let mimeType;
    let base64Data;
    let filePath;
    try {
      console.log('_> reading file');
      mimeType = mime.lookup(file.localPath);

      if (size && ['100', '250', '500'].includes(size)) {
        filePath = `${file.localPath}_${size}`;
      } else {
        filePath = `${file.localPath}`;
      }

      base64Data = await fsPromises.readFile(filePath);
      res.setHeader('Content-Type', mimeType);

      console.log('_> file read');
      return res.end(base64Data);
    } catch (err) {
      console.log(`_> file read failed: ${err.message}`);
      return res.status(404).send({ error: 'Not found' });
    }
  }
}

export default FilesController;
export { fileQueue };
