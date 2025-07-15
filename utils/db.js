import { MongoClient } from 'mongodb';

require('dotenv').config();

const host = process.env.DB_HOST || 'localhost';
const port = process.env.DB_PORT || 27017;
const database = process.env.DB_DATABASE || 'files_manager';

class DBClient {
  constructor() {
    this._isalive = false; // default
    this.client = new MongoClient(
      `mongodb://${host}:${port}`, { useUnifiedTopology: true },
    );
    this.client.connect()
      .then(() => {
        this._isalive = true;
        this.db = this.client.db(database);
      }).catch(() => {
        this.db = undefined;
        this._isalive = false;
      });
  }

  isAlive() { return this._isalive; }

  async nbUsers() {
    const countDocs = await this.db.collection('users')
      .countDocuments({});
    return countDocs;
  }

  async nbFiles() {
    const countDocs = await this.db.collection('files')
      .countDocuments({});
    return countDocs;
  }
}

const dbClient = new DBClient();
export default dbClient;
