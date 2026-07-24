// server/lib/mongo.js
import dotenv from "dotenv";
import { MongoClient } from "mongodb";
dotenv.config();

const uri = process.env.MONGO_URI;
const dbName = process.env.DB_NAME || "ClaimsDB";

if (!uri) {
  throw new Error("Missing MONGO_URI in .env");
}

let client;
let db;

/** Connect once and reuse */
export async function connectMongo() {
  if (db) return db;

  // Use the same minimal setup that worked in try-connect.mjs
  client = new MongoClient(uri, {
    // Important for Cosmos Mongo API:
    // don't set serverApi, don't add handshake-tweaking options
  });
  await client.connect();
  db = client.db(dbName);
  await ensureIndexes(db);
  return db;
}

export function getDb() {
  if (!db) throw new Error("Mongo not connected yet. Call connectMongo() first.");
  return db;
}

async function ensureIndexes(db) {
  // Create idempotent indexes. Adjust if you changed names.
  await db.collection("Users").createIndex({ email: 1 }, { unique: true }).catch(() => {});
  await db.collection("ExistingClaims").createIndex({ ClaimID: 1 }, { unique: false }).catch(() => {});
  await db.collection("NewClaims").createIndex({ ClaimID: 1 }, { unique: false }).catch(() => {});
}
