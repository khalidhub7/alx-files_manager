import { MongoClient } from 'mongodb';

const host = process.env.DB_HOST || 'localhost';
const port = process.env.DB_PORT || '27017';
const database = process.env.DB_DATABASE || 'files_manager';

class DBClient {
  constructor() {
    this.ready = this.connect();
  }

  connect() {
    return MongoClient.connect(`mongodb://${host}:${port}`, {
      useUnifiedTopology: true,
    })
      .then((client) => {
        this.db = client.db(database);
        this._isalive = true;
      })
      .catch((err) => {
        console.log(`mongo connection failed: ${err.message}`);
      });
  }

  isAlive() {
    return this._isalive === true;
  }

  async nbUsers() {
    await this.ready;
    return this.db.collection('users').countDocuments({});
  }

  async nbFiles() {
    await this.ready;
    return this.db.collection('files').countDocuments({});
  }
}

const dbClient = new DBClient();
export default dbClient;
