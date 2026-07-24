import axios from 'axios';
import 'dotenv/config';

async function testRealData() {
  const config = {
    mlUrl: process.env.ML_URL,
    mlKey: process.env.ML_KEY
  };

  console.log('Testing ML Endpoint with Real Claim Data...');

  // Use the exact features from the real claim
  const realFeaturesArray = [
    1,                        // total_claims
    1,                        // total_beneficiaries
    38940,                    // avg_claim_amount
    38940,                    // maxAmt
    0,                        // std_claim_amount
    9,                        // avg_length_of_stay
    1,                        // distinct_diagnoses
    76.3013698630137,         // avg_beneficiary_age
    1,                        // pct_male
    0,                        // pct_female
    0.18181818181818182,      // avg_chronic_conditions
    1,                        // inpatient_outpatient_ratio
    0.5,                      // claims_per_beneficiary
    0.9999743201253178        // max_to_avg_claim_ratio
  ];

  const payload = { data: [realFeaturesArray] };

  console.log('\nSending real claim payload:');
  console.log(JSON.stringify(payload, null, 2));

  try {
    const response = await axios.post(config.mlUrl, payload, {
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

testRealData().catch(console.error);
