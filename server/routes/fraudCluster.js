// routes/fraudCluster.js
import express from 'express';
import { MongoClient } from 'mongodb';

const router = express.Router();

let client, db;
async function getDb() {
  if (!client) {
    client = new MongoClient(process.env.MONGO_URI, { maxPoolSize: 10 });
    await client.connect();
    db = client.db(process.env.MONGO_DB || 'ClaimsDB');
  }
  return db;
}

const edgeKey = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`);

router.get('/fraud-cluster/:providerId', async (req, res) => {
  const providerId = String(req.params.providerId || '').trim();
  const daysWindow = Number(req.query.daysWindow ?? 30);
  if (!providerId) return res.status(400).json({ error: 'providerId required' });

  try {
    const db = await getDb();
    const col = db.collection(process.env.MONGO_COLLECTION || 'FilteredDataset');

    const cursor = col.find(
      { Provider: { $ne: null }, BeneID: { $ne: null }, ClaimStartDt: { $ne: null } },
      { projection: { Provider: 1, BeneID: 1, ClaimStartDt: 1, ClaimEndDt: 1, _id: 0 } }
    );

    const records = await cursor.toArray();
    records.forEach(r => {
      r.ClaimStartDt = new Date(r.ClaimStartDt);
      r.ClaimEndDt = new Date(r.ClaimEndDt);
    });

    const byBene = new Map();
    for (const r of records) {
      if (!byBene.has(r.BeneID)) byBene.set(r.BeneID, []);
      byBene.get(r.BeneID).push({ provider: r.Provider, start: r.ClaimStartDt });
    }

    const edges = new Map();
    const maxDiffMs = daysWindow * 24 * 60 * 60 * 1000;

    for (const visits of byBene.values()) {
      visits.sort((a, b) => a.start - b.start);
      for (let i = 0; i < visits.length; i++) {
        for (let j = i + 1; j < visits.length; j++) {
          const v1 = visits[i], v2 = visits[j];
          if (v1.provider === v2.provider) continue;
          if (Math.abs(v1.start - v2.start) <= maxDiffMs) {
            const k = edgeKey(v1.provider, v2.provider);
            const e = edges.get(k) || { p1: v1.provider, p2: v2.provider, sharedCount: 0 };
            e.sharedCount++;
            edges.set(k, e);
          }
        }
      }
    }

    const adj = new Map();
    for (const { p1, p2, sharedCount } of edges.values()) {
      if (!adj.has(p1)) adj.set(p1, []);
      if (!adj.has(p2)) adj.set(p2, []);
      adj.get(p1).push({ neighbor: p2, w: sharedCount });
      adj.get(p2).push({ neighbor: p1, w: sharedCount });
    }

    if (!adj.has(providerId)) {
      return res.json({ providerId, inRing: false, reason: 'Provider not in suspicious clusters' });
    }

    const visited = new Set([providerId]);
    const queue = [providerId];
    while (queue.length) {
      const u = queue.shift();
      for (const { neighbor } of adj.get(u) || []) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }

    const component = [...visited];
    const compEdges = [...edges.values()]
      .filter(e => component.includes(e.p1) && component.includes(e.p2))
      .map(e => ({ provider1: e.p1, provider2: e.p2, sharedCount: e.sharedCount }));

    res.json({
      providerId,
      inRing: true,
      clusterSize: component.length,
      providersInCluster: component,
      suspiciousLinks: compEdges
    });
  } catch (err) {
    console.error('fraud-cluster error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

