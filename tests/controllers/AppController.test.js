import { expect } from 'chai';
import request from 'supertest';
import { it, describe } from 'mocha';

import Sinon from 'sinon';
import app from '../../server';
import dbClient from '../../utils/db';
import redisClient from '../../utils/redis';

// test GET /status

// happy path
describe('GET /status - Redis and MongoDB are up',
  () => {
    it('returns 200 when Redis and MongoDB are up',
      async () => {
        const res = await request(app).get('/status');
        expect(res.status).to.equal(200);
        expect(res.body).to.deep.equal({ redis: true, db: true });
      });
  });

// unhappy path
describe('GET /status - server checks for Redis and MongoDB',
  () => {
    let stubdb;
    let stubredis;

    beforeEach(() => {
      stubdb = Sinon.stub(dbClient, 'isAlive');
      stubredis = Sinon.stub(redisClient, 'isAlive');
    });
    afterEach(() => {
      stubdb.restore(); stubredis.restore();
    });

    it('returns 500 when Redis is down',
      async () => {
        stubdb.returns(true);
        stubredis.returns(false);
        const res = await request(app).get('/status');
        expect(res.status).to.equal(500);
        expect(res.body).to.deep.equal({ redis: false, db: true });
      });
    it('returns 500 when MongoDB is down',
      async () => {
        stubdb.returns(false);
        stubredis.returns(true);
        const res = await request(app).get('/status');
        expect(res.status).to.equal(500);
        expect(res.body).to.deep.equal({ redis: true, db: false });
      });

    it('returns 500 when both Redis and MongoDB are down',
      async () => {
        stubdb.returns(false);
        stubredis.returns(false);
        const res = await request(app).get('/status');
        expect(res.status).to.equal(500);
        expect(res.body).to.deep.equal({ redis: false, db: false });
      });
  });

// test GET /stats

// happy path
describe('GET /stats - returns total users and files',
  () => {
    it('responds with 200 and numeric user/file counts',
      async () => {
        const res = await request(app).get('/stats');
        expect(res.status).to.equal(200);
        expect(res.body).to.have.property('users').that.is.a('number');
        expect(res.body).to.have.property('files').that.is.a('number');
      });
  });

// unhappy path: DB and Redis connection already tested in /status
