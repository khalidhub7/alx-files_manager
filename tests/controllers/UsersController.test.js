import { expect } from 'chai';
import { describe, it } from 'mocha';
import request from 'supertest';
import app from '../../server';
import dbClient from '../../utils/db';

// test POST /users
describe('POST /users - user registration tests',
  () => {
    before(async () => {
      await dbClient.ready;
      await dbClient.db.collection('users').deleteMany({});
    });

    // happy path
    it('registers a new user successfully',
      async () => {
        const res = await request(app).post('/users')
          .send({ email: 'testuser@ex.com', password: 'aitluser123' });
        expect(res.status).to.equal(201);
        expect(Object.keys(res.body).length).to.equal(2);
        expect(res.body).to.have.property('id');
        expect(res.body).to.have.property('email');
      });

    // unhappy path
    it('fails when email already exists',
      async () => {
        const res = await request(app).post('/users')
          .send({ email: 'testuser@ex.com', password: 'aitluser123' });
        expect(res.status).to.equal(400);
        expect(res.body).to.deep.equal({ error: 'Already exist' });
      });

    it('fails when email is missing',
      async () => {
        const res = await request(app).post('/users')
          .send({ password: 'aitluser123' });
        expect(res.status).to.equal(400);
        expect(res.body).to.deep.equal({ error: 'Missing email' });
      });

    it('fails when password is missing',
      async () => {
        const res = await request(app).post('/users')
          .send({ email: 'testuser@ex.com' });
        expect(res.status).to.equal(400);
        expect(res.body).to.deep.equal({ error: 'Missing password' });
      });

    it('fails when both email and password are missing',
      async () => {
        const res = await request(app).post('/users')
          .send({ });
        expect(res.status).to.equal(400);
        expect(res.body).to.deep.equal({ error: 'Missing email' });
      });
  });
