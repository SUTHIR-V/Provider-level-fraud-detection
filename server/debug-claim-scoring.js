import 'dotenv/config';
import { MongoClient } from 'mongodb';

async function debugClaimScoring() {
  const client = new MongoClient(process.env.MONGO_URI);
  await client.connect();
  const db = client.db(process.env.DB_NAME || 'ClaimsDB');
  
  const newCol = db.collection('NewClaims');
  const oldCol = db.collection('ExistingClaims');

  // Get a sample claim
  const claim = await newCol.findOne({});
  if (!claim) {
    console.log('No claims found in NewClaims collection');
    await client.close();
    return;
  }

  console.log('Sample Claim:');
  console.log(JSON.stringify(claim, null, 2));

  const providerId = claim.Provider;
  console.log('\nProvider ID:', providerId);

  // Get provider history
  const docs = await oldCol
    .find(
      { Provider: providerId },
      {
        projection: {
          BeneID: 1,
          InscClaimAmtReimbursed: 1,
          DiagnosisGroupCode: 1,
          ClaimStartDt: 1,
          ClaimEndDt: 1,
          DOB: 1,
          AdmissionDt: 1,
          Gender: 1,
          ChronicCond_Alzheimer: 1,
          ChronicCond_Heartfailure: 1,
          ChronicCond_KidneyDisease: 1,
          ChronicCond_Cancer: 1,
          ChronicCond_ObstrPulmonary: 1,
          ChronicCond_Depression: 1,
          ChronicCond_Diabetes: 1,
          ChronicCond_IschemicHeart: 1,
          ChronicCond_Osteoporasis: 1,
          ChronicCond_rheumatoidarthritis: 1,
          ChronicCond_stroke: 1
        }
      }
    )
    .toArray();

  console.log(`\nFound ${docs.length} historical claims for provider ${providerId}`);
  
  if (docs.length > 0) {
    console.log('\nSample historical claim:');
    console.log(JSON.stringify(docs[0], null, 2));
  }

  // Compute features like in the actual code
  const MS_DAY = 86400000;
  const MS_YEAR = 365 * MS_DAY;
  const toNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
  const toDate = (v) => {
    if (!v) return null;
    const d = new Date(v);
    return Number.isFinite(d.getTime()) ? d : null;
  };
  const isMale = (g) => g === 1 || g === '1' || g === 'M' || g === 'm';
  const isFemale = (g) => g === 2 || g === '2' || g === 'F' || g === 'f';

  let n = 0;
  let sumAmt = 0, sumAmtSq = 0, maxAmt = 0;
  let sumLoS = 0, sumAge = 0;
  let male = 0, female = 0, inpatient = 0, outpatient = 0;
  const beneSet = new Set();
  const dxSet = new Set();

  const chronicKeys = [
    'ChronicCond_Alzheimer',
    'ChronicCond_Heartfailure',
    'ChronicCond_KidneyDisease',
    'ChronicCond_Cancer',
    'ChronicCond_ObstrPulmonary',
    'ChronicCond_Depression',
    'ChronicCond_Diabetes',
    'ChronicCond_IschemicHeart',
    'ChronicCond_Osteoporasis',
    'ChronicCond_rheumatoidarthritis',
    'ChronicCond_stroke'
  ];
  const chronicSums = Object.fromEntries(chronicKeys.map((k) => [k, 0]));

  for (const d of docs) {
    n += 1;
    const amt = toNum(d.InscClaimAmtReimbursed);
    sumAmt += amt;
    sumAmtSq += amt * amt;
    if (amt > maxAmt) maxAmt = amt;

    if (d.BeneID != null) beneSet.add(String(d.BeneID));
    if (d.DiagnosisGroupCode != null) dxSet.add(String(d.DiagnosisGroupCode));

    const start = toDate(d.ClaimStartDt);
    const end = toDate(d.ClaimEndDt);
    const dob = toDate(d.DOB);
    if (start && end) sumLoS += (end - start) / MS_DAY;
    if (start && dob) sumAge += (start - dob) / MS_YEAR;

    if (isMale(d.Gender)) male += 1;
    else if (isFemale(d.Gender)) female += 1;

    const adm = toDate(d.AdmissionDt);
    if (adm) inpatient += 1;
    else outpatient += 1;

    for (const k of chronicKeys) chronicSums[k] += toNum(d[k]);
  }

  const total_claims = n;
  const total_beneficiaries = beneSet.size;
  const avg_claim_amount = sumAmt / (n || 1);
  const variance = Math.max(sumAmtSq / (n || 1) - avg_claim_amount * avg_claim_amount, 0);
  const std_claim_amount = Math.sqrt(variance);
  const avg_length_of_stay = sumLoS / (n || 1);
  const distinct_diagnoses = dxSet.size;
  const avg_beneficiary_age = sumAge / (n || 1);
  const totalGender = male + female;
  const pct_male = totalGender ? male / totalGender : 0;
  const pct_female = 1 - pct_male;
  const chronicMeans = chronicKeys.map((k) => chronicSums[k] / (n || 1));
  const avg_chronic_conditions = chronicMeans.reduce((a, b) => a + b, 0) / chronicMeans.length;
  const inpatient_outpatient_ratio = inpatient / (outpatient + 1);
  const claims_per_beneficiary = total_claims / (total_beneficiaries + 1);
  const max_to_avg_claim_ratio = maxAmt / (avg_claim_amount + 1);

  const featuresArray = [
    total_claims,
    total_beneficiaries,
    avg_claim_amount,
    maxAmt,
    std_claim_amount,
    avg_length_of_stay,
    distinct_diagnoses,
    avg_beneficiary_age,
    pct_male,
    pct_female,
    avg_chronic_conditions,
    inpatient_outpatient_ratio,
    claims_per_beneficiary,
    max_to_avg_claim_ratio
  ];

  console.log('\nComputed Features:');
  console.log('total_claims:', total_claims);
  console.log('total_beneficiaries:', total_beneficiaries);
  console.log('avg_claim_amount:', avg_claim_amount);
  console.log('maxAmt:', maxAmt);
  console.log('std_claim_amount:', std_claim_amount);
  console.log('avg_length_of_stay:', avg_length_of_stay);
  console.log('distinct_diagnoses:', distinct_diagnoses);
  console.log('avg_beneficiary_age:', avg_beneficiary_age);
  console.log('pct_male:', pct_male);
  console.log('pct_female:', pct_female);
  console.log('avg_chronic_conditions:', avg_chronic_conditions);
  console.log('inpatient_outpatient_ratio:', inpatient_outpatient_ratio);
  console.log('claims_per_beneficiary:', claims_per_beneficiary);
  console.log('max_to_avg_claim_ratio:', max_to_avg_claim_ratio);

  console.log('\nFeatures Array:');
  console.log(JSON.stringify(featuresArray, null, 2));

  // Check for any NaN or invalid values
  const hasInvalidValues = featuresArray.some(val => !Number.isFinite(val));
  console.log('\nHas invalid values (NaN/Infinity):', hasInvalidValues);

  await client.close();
}

debugClaimScoring().catch(console.error);
