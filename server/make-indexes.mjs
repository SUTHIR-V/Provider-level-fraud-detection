import 'dotenv/config';
import { MongoClient } from 'mongodb';
import { config } from './config.js';

const client = new MongoClient(config.mongoUri);
await client.connect();
const db = client.db(config.dbName);

console.log('Creating indexes...');

// ExistingClaims
await db.collection(config.collections.existingClaims).createIndex({ Provider: 1, ClaimStartDt: -1 });
await db.collection(config.collections.existingClaims).createIndex({ status: 1, ClaimStartDt: -1 });
await db.collection(config.collections.existingClaims).createIndex({ ClaimID: 1 });

// NewClaims
await db.collection(config.collections.newClaims).createIndex({ status: 1, ClaimStartDt: -1 });
await db.collection(config.collections.newClaims).createIndex({ Provider: 1, status: 1 });
await db.collection(config.collections.newClaims).createIndex({ ClaimID: 1 });

// Users helper index (non-unique; _id=email is unique by design if you use that)
await db.collection(config.collections.users).createIndex({ email: 1 });

console.log('Done.');
await client.close();
