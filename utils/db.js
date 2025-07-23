import { MongoClient } from 'mongodb';

const port = process.env.DB_PORT || '27017';
const host = process.env.DB_HOST || 'localhost';
const database = process.env.DB_DATABASE || 'files_manager';

class DBClient {
  constructor() {
    // start connection and save Promise to await later
    this.ready = this.connect();
  }

  connect() {
    // return promise to track connection
    const client = new MongoClient(
      `mongodb://${host}:${port}`, { useUnifiedTopology: true },
    );
    return client.connect()
      .then(() => {
        this.db = client.db(database);
        this._isalive = true;
      })
      .catch((err) => {
        this._isalive = false;
        console.log(`mongo connection failed: ${err.message}`);
      });
  }

  isAlive() { return this._isalive === true; }

  async nbUsers() {
    await this.ready; // wait for connection before running
    return this.db.collection('users').countDocuments({});
  }

  async nbFiles() {
    await this.ready; // wait for connection before running
    return this.db.collection('files').countDocuments({});
  }
}

const dbClient = new DBClient();
export default dbClient;
