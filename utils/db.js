import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const host = process.env.DB_HOST || 'localhost';
const port = process.env.DB_PORT || '27017';
const database = process.env.DB_DATABASE || 'files_manager';

class DBClient {
  constructor() {
    this._isalive = false;
    this.db = undefined;
    this.connect();
  }

  connect() {
    MongoClient.connect(
      `mongodb://${host}:${port}`, { useUnifiedTopology: true },
    )
      .then((client) => {
        this._isalive = true;
        this.db = client.db(database);
      })
      .catch((err) => {
        console.log(`mongo connection failed ${err}`);
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
