import bcrypt from 'bcryptjs';
import 'dotenv/config';
import { MongoClient } from 'mongodb';

async function createAdmin() {
  const client = new MongoClient(process.env.MONGO_URI);
  await client.connect();
  const db = client.db(process.env.DB_NAME || 'ClaimsDB');
  const users = db.collection('Users');
  
  const email = 'admin@example.com';
  const password = 'Admin@12345';
  
  const exists = await users.findOne({ email });
  if (exists) {
    console.log('Admin user already exists');
    await client.close();
    return;
  }
  
  const passwordHash = await bcrypt.hash(password, 10);
  await users.insertOne({
    _id: email,
    email,
    passwordHash,
    role: 'admin',
    providerId: null,
    createdAt: new Date()
  });
  
  console.log('Admin user created successfully');
  await client.close();
}

createAdmin().catch(console.error);
