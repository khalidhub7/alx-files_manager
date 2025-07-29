import { describe, it } from 'mocha';
import request from 'supertest';
import { expect } from 'chai';
import app from '../../server';

// test GET /connect
let token;
describe('GET /connect - login',
  () => {
  // happy path
    it('logs in with valid credentials',
      async () => {
        const res = await request(app).get('/connect').set(
          'authorization', 'Basic dGVzdHVzZXJAZXguY29tOmFpdGx1c2VyMTIz',
        );
        expect(res.status).to.equal(200);
        expect(res.body).to.have.property('token');
        token = res.body.token;
      });
    // unhappy path
    it('fails with invalid credentials',
      async () => {
        const res = await request(app).get('/connect').set(
          'authorization', 'Basic dGVzdHVzZXJAZXguY29tOmFpdGx1c2VyMTIzNDU=',
        );
        expect(res.status).to.equal(401);
        expect(res.body).to.deep.equal({ error: 'Unauthorized' });
      });
  });

describe('GET /users/me - return user',
  () => {
  // happy path
    it('returns the current user with valid token',
      async () => {
        const res = await request(app).get('/users/me')
          .set('x-token', token);
        expect(res.status).to.equal(200);
        expect(res.body).to.have.property('email');
        expect(res.body).to.have.property('id');
      });
    // unhappy path
    it('fails with invalid token',
      async () => {
        const res = await request(app).get('/users/me')
          .set('x-token', `***${token}`);
        expect(res.status).to.equal(401);
        expect(res.body).to.deep.equal({ error: 'Unauthorized' });
      });
  });

describe('GET /disconnect - logout',
  () => {
    it('logs out with valid token',
      async () => {
        const res = await request(app).get('/disconnect')
          .set('x-token', token);
        expect(res.status).to.equal(204);
        expect(res.body).to.deep.equal({});
      });
    it('fails to log out with invalid token',
      async () => {
        const res = await request(app).get('/disconnect')
          .set('x-token', `***${token}`);
        expect(res.status).to.equal(401);
        expect(res.body).to.deep.equal({ error: 'Unauthorized' });
      });
  });
