import Bull from 'bull';
import thumbnail from 'image-thumbnail';
import { promises as fsPromises } from 'fs';
import dbClient from './utils/db';
import UtilsHelper from './utils/utils';

const fileQueue = new Bull('image_resizer');
const userQueue = new Bull('welcome_email');

fileQueue.process(async (job) => {
  const { fileId, userId } = job.data;

  if (!fileId) throw new Error('Missing fileId');
  if (!userId) throw new Error('Missing userId');

  const fileDoc = await UtilsHelper
    .getFileByIdAndUser(fileId, userId);
  if (!fileDoc) throw new Error('File not found');

  const supportedWidths = [100, 250, 500];

  await Promise.all(supportedWidths.map(async (width) => {
    const resizedBuffer = await thumbnail(
      fileDoc.localPath, { width },
    );
    await fsPromises.writeFile(
      `${fileDoc.localPath}_${width}`, resizedBuffer,
    );
    console.log(`_> thumbnail ${width} generated`);
  }));
});

fileQueue.on('completed', (job) => {
  console.log(`_> Job ${job.id} completed`);
});

fileQueue.on('failed', (job, err) => {
  console.log(`_> Job ${job.id} failed: ${err.message}`);
});

userQueue.process(async (job) => {
  try {
    if (!job.data.userId) { throw new Error('Missing userId'); }
    // let's retrieve user email
    const user = await dbClient.db.collection('users')
      .findOne({ _id: UtilsHelper.getValidId(job.data.userId) });
    if (!user) { throw new Error('User not found'); }

    console.log(`Welcome ${user.email}!`);
  } catch (err) {
    return err;
  }
  return undefined;
});

export default fileQueue;
export { userQueue };
