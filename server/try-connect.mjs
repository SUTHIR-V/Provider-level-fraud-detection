import 'dotenv/config';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGO_URI;
const dbName = process.env.DB_NAME || 'ClaimsDB';

if (!uri) {
  console.error('MISSING MONGO_URI');
  process.exit(1);
}

const client = new MongoClient(uri, { tls: true, retryWrites: false });

try {
  await client.connect();
  console.log('Connected OK ✅');
  const names = (await client.db(dbName).listCollections().toArray()).map(c => c.name);
  console.log('Collections:', names);
} catch (e) {
  console.error('Failed ❌', e);
} finally {
  await client.close();
}
