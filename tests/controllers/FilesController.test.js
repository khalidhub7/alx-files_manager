import { describe, it } from 'mocha';
import request from 'supertest';

import { expect } from 'chai';
import sinon from 'sinon';
import { promises as fsPromises } from 'fs';
import app from '../../server';
import dbClient from '../../utils/db';
import redisClient from '../../utils/redis';
import UtilsHelper from '../../utils/utils';

const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);
const path = require('path');

process.removeAllListeners('warning');
// test POST /users
// happy path
let xToken; // used for auth
let parentId; // parent folder
let randomFileId; // a file _id
let randomImageId;
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

    sinon.stub(console, 'log');
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
      randomImageId = parsedRes.body.id;

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
            parentId: randomFileId,
            name: 'testfile2',
            type: 'file',
            data: base64DataFile2,
          },
        );
      expect(res.status).to.equal(400);
      expect(res.body).to.deep.equal({ error: 'Parent is not a folder' });
    });
});

describe('GET /files/:id - fetch user\'s file by ID',
  () => {
    // happy path
    it('should return 200 and the file if it exists and belongs to the user',
      async () => {
        const res = await request(app).get(`/files/${randomFileId}`)
          .set('x-token', xToken);
        expect(res.status).to.equal(200);

        if (['file', 'image'].includes(res.body.type)) {
          expect(res.body).to.have.all.keys(
            '_id', 'userId', 'name', 'type', 'isPublic', 'parentId', 'localPath',
          );
        } else if (res.body.type === 'folder') {
          expect(res.body).to.have.all.keys(
            '_id', 'userId', 'name', 'type', 'isPublic', 'parentId',
          );
        }
      });
    // unhappy path
    it('should return 401 if no auth token is provided',
      async () => {
        const res = await request(app).get(`/files/${randomFileId}`)
          .set({});
        expect(res.status).to.equal(401);
        expect(res.body).to.deep.equal({ error: 'Unauthorized' });
      });

    it('should return 404 if the file does not exist or doesn’t belong to the user',
      async () => {
        const res = await request(app).get(`/files/${randomFileId}44`)
          .set('x-token', xToken);
        expect(res.status).to.equal(404);
        expect(res.body).to.deep.equal({ error: 'Not found' });
      });
  });

describe('GET /files - list files with pagination', () => {
  // happy path
  let stub;
  before(() => {
    // mock db because the db is empty now
    const fakeFiles = 'thisfakefilesfortest'.split('')
      .map((c) => ({ id: c }));
    stub = sinon.stub(UtilsHelper, 'paginateFiles').resolves(fakeFiles);
  });
  after(() => { stub.restore(); });
  it('should list files in root without parentId or page',
    async () => {
      const res = await request(app).get('/files')
        .set('x-token', xToken);
      expect(res.status).to.equal(200);
      expect(res.body.length).to.be.at.most(20);
    });
  it('should list files by parentId (default page 0)',
    async () => {
      const res = await request(app).get(`/files?parentId=${parentId}`)
        .set('x-token', xToken);
      expect(res.status).to.equal(200);
      expect(res.body.length).to.be.at.most(20);
    });

  it('should list files by parentId and page',
    async () => {
      const res = await request(app).get(`/files?parentId=${parentId}&page=5`)
        .set('x-token', xToken);
      expect(res.status).to.equal(200);
      expect(res.body.length).to.be.at.most(20);
    });
  it('should list files in root by page number',
    async () => {
      const res = await request(app).get('/files?page=5')
        .set('x-token', xToken);
      expect(res.status).to.equal(200);
      expect(res.body.length).to.be.at.most(20);
    });

  // unhappy path
  it('should return 401 if no auth token',
    async () => {
      const res = await request(app)
        .get(`/files?parentId=${parentId}&page=5`).set({});
      expect(res.status).to.equal(401);
      expect(res.body).to.deep.equal({ error: 'Unauthorized' });
    });
});

describe('PUT /files/:id/publish - publish file (set isPublic: true)',
  () => {
  // happy path
    it('should successfully publish the file', async () => {
      const res = await request(app).put(`/files/${randomFileId}/publish`)
        .set('x-token', xToken);
      expect(res.status).to.equal(200);
      expect(res.body.isPublic).to.equal(true);
    });
    // unhappy path
    it('should return 401 if auth token is missing',
      async () => {
        const res = await request(app).put(`/files/${randomFileId}/publish`)
          .set({});
        expect(res.status).to.equal(401);
        expect(res.body).to.deep.equal({ error: 'Unauthorized' });
      });
    it('should return 404 if file is not found', async () => {
      const res = await request(app).put(`/files/${randomFileId}44/publish`)
        .set('x-token', xToken);
      expect(res.status).to.equal(404);
      expect(res.body).to.deep.equal({ error: 'Not found' });
    });
  });

describe('PUT /files/:id/unpublish - unpublish file (set isPublic: false)',
  () => {
    it('should successfully unpublish the file', async () => {
      const res = await request(app).put(`/files/${randomFileId}/unpublish`)
        .set('x-token', xToken);
      expect(res.status).to.equal(200);
      expect(res.body.isPublic).to.equal(false);
    });
  // unhappy path
  // already handled in PUT /files/:id/publish
  });

describe('GET /files/:id/data - return file for guest or authenticated user',
  () => {
    before(() => sinon.stub(console, 'log'));
    after(() => console.log.restore());
    // happy path
    it('should returns file for authenticated user (public or private)',
      async () => {
        const res = await request(app)
          .get(`/files/${randomFileId}/data`)
          .set('x-token', xToken);

        expect(res.status).to.equal(200);
        expect(res.text).to.equal('Hello Webstack! from testfile1');
      });

    it('should returns original image for authenticated user (public or private)',
      async () => {
        const res = await request(app)
          .get(`/files/${randomImageId}/data`)
          .set('x-token', xToken);

        expect(res.status).to.equal(200);
      });

    it('should returns resized image for authenticated user (public or private)',
      async () => {
        const res = await request(app)
          .get(`/files/${randomImageId}/data?size=100`)
          .set('x-token', xToken);

        expect(res.status).to.equal(200);
      });

    it('should returns public file/image for guest (unauthenticated)',
      async () => {
        // image was uploaded with ispublic = true using a python script,
        // so it's publicly accessible regardless of authentication.
        const res = await request(app)
          .get(`/files/${randomImageId}/data?size=100`);

        expect(res.status).to.equal(200);
      });
    // unhappy path

    it('should return 404 if file ID is invalid',
      async () => {
        const res = await request(app)
          .get(`/files/${randomImageId}66/data`);

        expect(res.status).to.equal(404);
        expect(res.body).to.deep.equal({ error: 'Not found' });
      });
    it('should return 404 if file is private and user is not owner',
      async () => {
        const res = await request(app)
          .get(`/files/${randomFileId}/data`)
          .set('x-token', `${xToken}44`);

        expect(res.status).to.equal(404);
        expect(res.body).to.deep.equal({ error: 'Not found' });
      });

    it('should return 400 if file is a folder (no data)',
      async () => {
        const res = await request(app)
          .get(`/files/${parentId}/data`)
          .set('x-token', `${xToken}`);

        expect(res.status).to.equal(400);
        expect(res.body).to.deep.equal({ error: "A folder doesn't have content" });
      });

    it('should return 404 if file has no local path',
      async () => {
        // by default, fs.promises.readFile
        // throws an error if the file is not found.
        sinon.stub(fsPromises, 'readFile').rejects(new Error());

        const res = await request(app)
          .get(`/files/${randomFileId}/data`)
          .set('x-token', `${xToken}`);

        expect(res.body).to.deep.equal({ error: 'Not found' });
        expect(res.status).to.equal(404);
        fsPromises.readFile.restore();
      });
  });
