import { connectMongo, getDb } from './lib/mongo.js';

async function testClaims() {
  try {
    await connectMongo();
    const db = getDb();
    
    console.log('Testing database connection...');
    
    const newClaimsCount = await db.collection('NewClaims').countDocuments();
    console.log(`NewClaims collection has ${newClaimsCount} documents`);
    
    if (newClaimsCount > 0) {
      const sampleClaims = await db.collection('NewClaims').find({}).limit(3).toArray();
      console.log('Sample claim IDs:', sampleClaims.map(c => c.ClaimID));
      
      // Test the scoring endpoint with the first claim
      if (sampleClaims.length > 0) {
        const testClaimId = sampleClaims[0].ClaimID;
        console.log(`\nTesting scoring for claim: ${testClaimId}`);
        
        // Import and test the aggregation function
        const { buildVectorForClaimId } = await import('./scripts/aggregate.js');
        const result = await buildVectorForClaimId(testClaimId);
        
        console.log('Aggregation result:');
        console.log('- Raw claim found:', !!result.rawClaim);
        console.log('- Provider:', result.rawClaim?.Provider);
        console.log('- Vector length:', result.vector?.length);
        console.log('- Vector sample:', result.vector?.slice(0, 5));
        console.log('- Explanation keys:', Object.keys(result.explain || {}));
      }
    }
    
    const existingClaimsCount = await db.collection('ExistingClaims').countDocuments();
    console.log(`ExistingClaims collection has ${existingClaimsCount} documents`);
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

testClaims();
