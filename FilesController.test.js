import { describe, it } from 'mocha';
import request from 'supertest';

import { expect } from 'chai';
import Sinon from 'sinon';
import app from '../../server';
import dbClient from '../../utils/db';
import redisClient from '../../utils/redis';

const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);
const path = require('path');

// test POST /users
// happy path
let xToken; // used for auth
let parentId; // parent folder
let randomFileId;
const base64DataFile1 = 'SGVsbG8gV2Vic3RhY2shIGZyb20gdGVzdGZpbGUx';
const base64DataFile2 = 'SGVsbG8gV2Vic3RhY2shIGZyb20gdGVzdGZpbGUy';

describe('POST /files - create files and folders', () => {
  before(async () => {
    await dbClient.ready;
    await dbClient.db.collection('files').deleteMany({});
    const res = await request(app).get('/connect').set(
      'authorization', 'Basic dGVzdHVzZXJAZXguY29tOmFpdGx1c2VyMTIz',
    );
    xToken = res.body.token;

    Sinon.stub(console, 'log');
  });
  after(() => { console.log.restore(); });
  // happy path -----------------------------------------------------------
  it('should create a new folder at the root level',
    async () => {
      const res = await request(app).post('/files')
        .set('x-token', xToken).send(
          { name: 'testfolder1', type: 'folder' },
        );
      expect(res.status).to.equal(201);
      expect(res.body).to.have.all.keys(
        'id', 'userId', 'name', 'type', 'isPublic', 'parentId',
      );
      parentId = res.body.id;
    });

  it('should create a new folder inside an existing folder',
    async () => {
      const res = await request(app).post('/files')
        .set('x-token', xToken).send(
          { name: 'testfolder2', type: 'folder', parentId },
        );
      expect(res.status).to.equal(201);
      expect(res.body).to.have.all.keys(
        'id', 'userId', 'name', 'type', 'isPublic', 'parentId',
      );
      parentId = res.body.id;
    });

  it('should create a new file with base64 data', async () => {
    const res = await request(app).post('/files')
      .set('x-token', xToken).send(
        {
          parentId,
          name: 'testfile1',
          type: 'file',
          data: base64DataFile1,
        },
      );
    expect(res.status).to.equal(201);
    expect(res.body).to.have.all.keys(
      'id', 'userId', 'name', 'type', 'isPublic', 'parentId',
    );
    randomFileId = res.body.id; // used in next checks
  });

  it('should create a new image and add thumbnail job',
    async () => {
    // post script path
      const postScript = path.join(__dirname, '../image_upload.py');
      // image path
      const imagePath = path.join(__dirname, '../tosaveindb.jpeg');

      // clearing completed jobs before test
      await redisClient.del('bull:image_resizer:completed');
      // running upload via python script
      const res = await execFileAsync(
        'python3', [postScript, imagePath, xToken, parentId],
      );
      // parsing response and checking status/body
      const parsedRes = JSON.parse(res.stdout);

      expect(parsedRes.status).to.equal(201);
      expect(parsedRes.body).to.have.all.keys(
        'id', 'userId', 'name', 'type', 'isPublic', 'parentId',
      );

      // check jobs creations
      const zrangeAsync = promisify(redisClient.client.zrange)
        .bind(redisClient.client);
      // polling redis for completed jobs (up to 5 tries)
      const waitForJob = async (retries = 5) => {
        const jobs = await zrangeAsync(
          'bull:image_resizer:completed', 0, -1,
        );
        if (jobs.length > 0 || retries <= 1) return jobs;
        await new Promise((r) => setTimeout(r, 10));
        return waitForJob(retries - 1);
      };

      const completedJobs = await waitForJob();
      // console.log(`*** ${completedJobs} ***`);
      // expecting exactly 1 completed job
      expect(completedJobs.length).to.equal(1);
    });
  // let's move to handle unhappy path ------------------------------------

  it('should return 401 if no authentication token is provided',
    async () => {
      const res = await request(app).post('/files').set({})
        .send(
          {
            parentId,
            name: 'testfile2',
            type: 'file',
            data: base64DataFile2,
          },
        );
      expect(res.status).to.equal(401);
      expect(res.body).to.deep.equal({ error: 'Unauthorized' });
    });

  it('should return 400 if name field is missing',
    async () => {
      const res = await request(app).post('/files')
        .set('x-token', xToken).send(
          { parentId, type: 'file', data: base64DataFile2 },
        );
      expect(res.status).to.equal(400);
      expect(res.body).to.deep.equal({ error: 'Missing name' });
    });

  it('should return 400 if type field is missing',
    async () => {
      const res = await request(app).post('/files')
        .set('x-token', xToken).send(
          { parentId, name: 'testfile2', data: base64DataFile2 },
        );
      expect(res.status).to.equal(400);
      expect(res.body).to.deep.equal({ error: 'Missing type' });
    });

  it('should return 400 if type value is invalid (not folder, file, or image)',
    async () => {
      const res = await request(app).post('/files')
        .set('x-token', xToken).send(
          {
            parentId,
            name: 'testfile2',
            type: 'exe',
            data: base64DataFile2,
          },
        );
      expect(res.status).to.equal(400);
      expect(res.body).to.deep.equal({ error: 'Missing type' });
    });

  it('should return 400 if data field is missing for file or image upload',
    async () => {
      const res = await request(app).post('/files')
        .set('x-token', xToken).send(
          {
            parentId, name: 'testfile2', type: 'file',
          },
        );
      expect(res.status).to.equal(400);
      expect(res.body).to.deep.equal({ error: 'Missing data' });
    });

  it('should return 400 if parentId does not reference an existing file',
    async () => {
      const res = await request(app).post('/files')
        .set('x-token', xToken).send(
          {
            parentId: `${parentId}889`,
            name: 'testfile2',
            type: 'file',
            data: base64DataFile2,
          },
        );
      expect(res.status).to.equal(400);
      expect(res.body).to.deep.equal({ error: 'Parent not found' });
    });

  it('should return 400 if parentId references a file that is not a folder',
    async () => {
      const res = await request(app).post('/files')
        .set('x-token', xToken).send(
          {
            parentId: randomFileId, name: 'testfile2', type: 'file', data: base64DataFile2,
          },
        );
      expect(res.status).to.equal(400);
      expect(res.body).to.deep.equal({ error: 'Parent is not a folder' });
    });
});
