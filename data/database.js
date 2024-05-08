const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;
let database;
let monogUrl = 'mongodb://localhost:27017';

if (process.env.MONGO_URL) {
    monogUrl = process.env.MONGO_URL;
}

async function connect() {
    const client = await MongoClient.connect(monogUrl);
    database = client.db('campus-sphere');
}

function getDb() {
    if (!database) {
        throw {
            message: "Database connection failed!"
        };
    }
    return database;
}

module.exports = {
    connectToDatabase: connect,
    getDb: getDb
};