// server/db.js
const { MongoClient } = require("mongodb");

let client;
let db;

async function connect() {
  if (db) return db;
  const uri = process.env.MONGO_URL || "mongodb://localhost:27017/claims";
  client = new MongoClient(uri, { ignoreUndefined: true });
  await client.connect();
  const dbName =
    process.env.MONGO_DB ||
    (uri.includes("/") ? uri.split("/").pop().split("?")[0] : "claims");
  db = client.db(dbName);
  return db;
}

function getDb() {
  if (!db) throw new Error("DB not connected yet");
  return db;
}

module.exports = { connect, getDb };
