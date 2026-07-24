// server/scripts/aggregate.js
import { getDb } from "../lib/mongo.js";

/** Safe numeric helpers */
const n = (x, d = 0) => (Number.isFinite(x) ? x : d);

/**
 * Build the 14-feature vector for the model from all claims of a provider.
 * Order:
 *  1) total_claims
 *  2) total_beneficiaries
 *  3) avg_claim_amount
 *  4) max_claim_amount
 *  5) std_claim_amount
 *  6) avg_length_of_stay_days
 *  7) distinct_diagnoses
 *  8) avg_beneficiary_age
 *  9) pct_male
 * 10) pct_female
 * 11) claims_per_beneficiary
 * 12) inpatient_outpatient_ratio
 * 13) avg_chronic_conditions (per claim)
 * 14) max_to_avg_claim_ratio
 */
async function buildProviderVector(providerId) {
  const db = getDb();
  const col = db.collection("ExistingClaims");

  const claims = await col
    .find({ Provider: providerId })
    .project({
      ClaimID: 1,
      BeneID: 1,
      ClaimStartDt: 1,
      ClaimEndDt: 1,
      DOB: 1,
      AdmissionDt: 1,
      InscClaimAmtReimbursed: 1,
      DiagnosisGroupCode: 1,
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
      ChronicCond_stroke: 1,
    })
    .toArray();

  if (!claims.length) {
    return { vector: Array(14).fill(0), explain: { reason: "No claims for provider" } };
  }

  const toDate = (v) => (v ? new Date(v) : null);
  const daysBetween = (a, b) =>
    a && b ? Math.max(0, Math.round((b - a) / (1000 * 60 * 60 * 24))) : null;

  const amounts = [];
  const beneSet = new Set();
  const dxSet = new Set();

  let inpatient = 0;
  let outpatient = 0;

  let totalStayDays = 0;
  let stayCount = 0;

  let totalAge = 0;
  let ageCount = 0;

  let male = 0;
  let female = 0;

  let sumChronicPerClaim = 0;

  for (const c of claims) {
    // amount
    const amt = Number(c.InscClaimAmtReimbursed);
    if (Number.isFinite(amt)) amounts.push(amt);

    // unique bene / dx
    if (c.BeneID) beneSet.add(String(c.BeneID));
    if (c.DiagnosisGroupCode) dxSet.add(String(c.DiagnosisGroupCode));

    // inpatient vs outpatient
    if (c.AdmissionDt) inpatient++;
    else outpatient++;

    // length of stay
    const start = toDate(c.ClaimStartDt);
    const end = toDate(c.ClaimEndDt);
    const los = daysBetween(start, end);
    if (los != null) {
      totalStayDays += los;
      stayCount++;
    }

    // age at claim start
    const dob = toDate(c.DOB);
    if (dob && start) {
      let age = start.getUTCFullYear() - dob.getUTCFullYear();
      const m = start.getUTCMonth() - dob.getUTCMonth();
      if (m < 0 || (m === 0 && start.getUTCDate() < dob.getUTCDate())) age--;
      if (Number.isFinite(age)) {
        totalAge += age;
        ageCount++;
      }
    }

    // gender (handle M/1 and F/2)
    const g = (c.Gender ?? "").toString().trim().toUpperCase();
    if (g === "M" || g === "1" || g === "MALE") male++;
    else if (g === "F" || g === "2" || g === "FEMALE") female++;

    // chronic conditions per claim (coerce to 0/1)
    const chronics = [
      c.ChronicCond_Alzheimer,
      c.ChronicCond_Heartfailure,
      c.ChronicCond_KidneyDisease,
      c.ChronicCond_Cancer,
      c.ChronicCond_ObstrPulmonary,
      c.ChronicCond_Depression,
      c.ChronicCond_Diabetes,
      c.ChronicCond_IschemicHeart,
      c.ChronicCond_Osteoporasis,
      c.ChronicCond_rheumatoidarthritis,
      c.ChronicCond_stroke,
    ].map((x) => (x === 1 || x === "1" ? 1 : 0));
    sumChronicPerClaim += chronics.reduce((a, b) => a + b, 0);
  }

  // aggregates
  const totalClaims = claims.length;
  const totalBeneficiaries = beneSet.size;
  const avgClaim = amounts.length ? amounts.reduce((a, b) => a + b, 0) / amounts.length : 0;
  const maxClaim = amounts.length ? Math.max(...amounts) : 0;
  const stdClaim = (() => {
    if (!amounts.length) return 0;
    const mean = avgClaim;
    const v = amounts.reduce((s, x) => s + Math.pow(x - mean, 2), 0) / amounts.length;
    return Math.sqrt(v);
  })();

  const avgStay = stayCount ? totalStayDays / stayCount : 0;
  const distinctDx = dxSet.size;
  const avgAge = ageCount ? totalAge / ageCount : 0;

  const totalSex = male + female;
  const pctMale = totalSex ? male / totalSex : 0;
  const pctFemale = totalSex ? female / totalSex : 0;

  const claimsPerBene = totalBeneficiaries ? totalClaims / totalBeneficiaries : 0;

  // Avoid Infinity -> smooth denominator by +1 when 0
  const ioRatio = inpatient / (outpatient + 1);

  const avgChronicPerClaim = totalClaims ? sumChronicPerClaim / totalClaims : 0;
  const maxToAvg = avgClaim ? maxClaim / avgClaim : 0;

  const vector = [
    n(totalClaims),
    n(totalBeneficiaries),
    n(avgClaim),
    n(maxClaim),
    n(stdClaim),
    n(avgStay),
    n(distinctDx),
    n(avgAge),
    n(pctMale),
    n(pctFemale),
    n(claimsPerBene),
    n(ioRatio),
    n(avgChronicPerClaim),
    n(maxToAvg),
  ];

  return {
    vector,
    explain: {
      totalClaims,
      totalBeneficiaries,
      avgClaim,
      maxClaim,
      stdClaim,
      avgStay,
      distinctDx,
      avgAge,
      pctMale,
      pctFemale,
      claimsPerBene,
      ioRatio,
      avgChronicPerClaim,
      maxToAvg,
      inpatient,
      outpatient,
    },
  };
}

/** Build vector for a claim by first finding its provider, then aggregating that provider. */
async function buildVectorForClaimId(claimId) {
  const db = getDb();
  const col = db.collection("NewClaims");
  const rawClaim = await col.findOne({ ClaimID: claimId });

  if (!rawClaim?.Provider) {
    return {
      rawClaim: null,
      vector: Array(14).fill(0),
      explain: { reason: `Claim ${claimId} not found in NewClaims collection` },
    };
  }

  const providerVector = await buildProviderVector(rawClaim.Provider);
  return { rawClaim, ...providerVector };
}

export { buildProviderVector, buildVectorForClaimId };
