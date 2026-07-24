import axios from 'axios';
import 'dotenv/config';

async function testMLEndpoint() {
  const config = {
    mlUrl: process.env.ML_URL,
    mlKey: process.env.ML_KEY
  };

  console.log('Testing ML Endpoint...');
  console.log('URL:', config.mlUrl);
  console.log('Key:', config.mlKey ? 'Present' : 'Missing');

  // Test with sample data that matches expected format
  const testPayload = {
    data: [[
      10,      // total_claims
      5,       // total_beneficiaries  
      5000,    // avg_claim_amount
      15000,   // max_claim_amount
      3000,    // std_claim_amount
      3.5,     // avg_length_of_stay
      8,       // distinct_diagnoses
      65.5,    // avg_beneficiary_age
      0.6,     // pct_male
      0.4,     // pct_female
      0.3,     // avg_chronic_conditions
      0.2,     // inpatient_outpatient_ratio
      2.0,     // claims_per_beneficiary
      3.0      // max_to_avg_claim_ratio
    ]]
  };

  console.log('\nSending payload:');
  console.log(JSON.stringify(testPayload, null, 2));

  try {
    const response = await axios.post(config.mlUrl, testPayload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.mlKey}`
      },
      timeout: 15000
    });

    console.log('\n✅ ML Endpoint Response:');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('\n❌ ML Endpoint Error:');
    console.log('Status:', error.response?.status);
    console.log('Status Text:', error.response?.statusText);
    console.log('Headers:', error.response?.headers);
    console.log('Data:', error.response?.data);
    console.log('Error Message:', error.message);
    
    if (error.code) {
      console.log('Error Code:', error.code);
    }
  }
}

testMLEndpoint().catch(console.error);
