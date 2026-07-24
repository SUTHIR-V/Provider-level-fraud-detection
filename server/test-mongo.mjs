import { MongoClient } from "mongodb";

const uri = process.env.MONGO_URI;

const client = new MongoClient(uri);

try {
  await client.connect();
  console.log("Connected OK ✅");
  const collections = await client.db("ClaimsDB").listCollections().toArray();
  console.log("Collections:", collections.map(c => c.name));
} catch (err) {
  console.error("Failed ❌", err);
} finally {
  await client.close();
}
