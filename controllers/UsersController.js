import sha1 from 'sha1';
import dbClient from '../utils/db';

class UsersController {
  static async postNew(req, res) {
    let errMsg = '';
    const { email } = req.body;
    let { password } = req.body;

    if (!password) { errMsg = 'Missing password'; }
    if (!email) { errMsg = 'Missing email'; }
    if (errMsg !== '') { return res.status(400).send({ error: errMsg }); }

    const user = await dbClient.db.collection('users')
      .findOne({ email });

    if (user) {
      errMsg = 'Already exist';
      return res.status(400).send({ error: errMsg });
    }
    password = sha1(password);
    const insert = await dbClient.db.collection('users')
      .insertOne({ email, password });

    if (insert.result.ok === 1) {
      const id = insert.insertedId;
      return res.status(201).send({ id, email });
    }
    return undefined;
  }
}

export default UsersController;
