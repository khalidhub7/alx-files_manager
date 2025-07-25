import thumbnail from 'image-thumbnail';
import { promises as fsPromises } from 'fs';
import Bull from 'bull';
import UtilsHelper from './utils/utils';

const fileQueue = new Bull('image_resizer');

fileQueue.process(async (job) => {
  try {
    const { fileId, userId } = job.data;

    if (!fileId) { throw new Error('Missing fileId'); }
    if (!userId) { throw new Error('Missing userId'); }

    const fileDoc = await UtilsHelper
      .getFileByIdAndUser(fileId, userId);

    if (!fileDoc) { throw new Error('File not found'); }

    const supportedWidths = [100, 250, 500];

    await Promise.all(supportedWidths.map(async (width) => {
      try {
        const resizedBuffer = await thumbnail(
          fileDoc.localPath, { width },
        );
        await fsPromises.writeFile(
          `${fileDoc.localPath}_${width}`, resizedBuffer,
        );
        console.log(`thumbnail ${width} generated`);
      } catch (err) {
        console.log(`thumbnail ${width} failed: ${err.message}`);
      }
    }));
  } catch (err) {
    console.log(`job failed: ${err.message}`);
  }
});

export default fileQueue;
