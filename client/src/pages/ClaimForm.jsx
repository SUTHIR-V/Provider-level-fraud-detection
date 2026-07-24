import Papa from "papaparse";
import { useState } from "react";
import api from "../lib/api";

const CHRONIC_FIELDS = [
  "ChronicCond_Alzheimer",
  "ChronicCond_Heartfailure",
  "ChronicCond_KidneyDisease",
  "ChronicCond_Cancer",
  "ChronicCond_ObstrPulmonary",
  "ChronicCond_Depression",
  "ChronicCond_Diabetes",
  "ChronicCond_IschemicHeart",
  "ChronicCond_Osteoporasis",
  "ChronicCond_rheumatoidarthritis",
  "ChronicCond_stroke",
];

const DATE_FIELDS = ["ClaimStartDt", "ClaimEndDt", "DOB", "AdmissionDt"];

function normalize(doc) {
  const d = { ...doc };
  for (const k in d) {
    if (typeof d[k] === "string") d[k] = d[k].trim();
    if (d[k] === "") d[k] = null;
  }
  CHRONIC_FIELDS.forEach((k) => {
    if (["1", 1, true, "Yes"].includes(d[k])) d[k] = 1;
    else if (["0", 0, false, "No"].includes(d[k])) d[k] = 0;
    else if (d[k] == null) d[k] = null;
  });
  if (d.Gender) {
    const g = String(d.Gender).toUpperCase();
    if (["M", "MALE", "1"].includes(g)) d.Gender = "M";
    else if (["F", "FEMALE", "2"].includes(g)) d.Gender = "F";
  }
  if (d.InscClaimAmtReimbursed != null) {
    const n = Number(d.InscClaimAmtReimbursed);
    if (!Number.isNaN(n)) d.InscClaimAmtReimbursed = n;
  }
  return d;
}

export default function ClaimForm() {
  const [tab, setTab] = useState("single"); // single | csv
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const [form, setForm] = useState({
    ClaimID: "",
    BeneID: "",
    DiagnosisGroupCode: "",
    Gender: "",
    InscClaimAmtReimbursed: "",
    ClaimStartDt: "",
    ClaimEndDt: "",
    DOB: "",
    AdmissionDt: "",
    ...Object.fromEntries(CHRONIC_FIELDS.map((k) => [k, ""])),
  });

  const [csvRows, setCsvRows] = useState([]);
  const [csvInfo, setCsvInfo] = useState({ rows: 0, filename: "" });

  const onChange = (e) => setForm((s) => ({ ...s, [e.target.name]: e.target.value }));

  function validateClient(d) {
    const miss = [];
    if (!d.ClaimID) miss.push("ClaimID");
    if (!d.BeneID) miss.push("BeneID");
    return miss.length ? `Missing required: ${miss.join(", ")}` : null;
  }

  async function submitSingle(e) {
    e.preventDefault();
    setMsg("");
    const payload = normalize(form);
    const err = validateClient(payload);
    if (err) return setMsg(`❌ ${err}`);
    setBusy(true);
    try {
      await api.post("/claims/submit", payload);
      setMsg(`✅ Submitted claim ${payload.ClaimID}`);
      setForm((s) => ({ ...s, ClaimID: "", BeneID: "", InscClaimAmtReimbursed: "", DiagnosisGroupCode: "" }));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e2) {
      setMsg(`❌ ${e2?.response?.data?.error || e2.message}`);
    } finally {
      setBusy(false);
    }
  }

  function handleCsv(file) {
    if (!file) return;
    setMsg("");
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete: (res) => {
        const rows = (res.data || []).map(normalize);
        setCsvRows(rows);
        setCsvInfo({ rows: rows.length, filename: file.name });
        if (!rows.length) setMsg("❌ CSV had no rows.");
      },
      error: (err) => setMsg(`❌ CSV error: ${err.message}`),
    });
  }

  async function submitCsv() {
    if (!csvRows.length) return setMsg("❌ No CSV rows parsed.");
    setBusy(true);
    setMsg("");
    try {
      const size = 1000;
      let inserted = 0;
      for (let i = 0; i < csvRows.length; i += size) {
        const chunk = csvRows.slice(i, i + size);
        const { data } = await api.post("/claims/submit-bulk", { items: chunk });
        inserted += data?.inserted || 0;
      }
      setMsg(`✅ Bulk inserted ${inserted} documents`);
      setCsvRows([]);
      setCsvInfo({ rows: 0, filename: "" });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setMsg(`❌ ${e?.response?.data?.error || e.message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="title">Submit Claims</h2>
          <div className="muted">Single claim or CSV bulk upload.</div>
        </div>
        <div className="btn-group">
          <button className={`btn ${tab === "single" ? "" : "btn-ghost"}`} onClick={() => setTab("single")}>Single</button>
          <button className={`btn ${tab === "csv" ? "" : "btn-ghost"}`} onClick={() => setTab("csv")}>CSV</button>
        </div>
      </div>

      <div className="panel-lg">
        {tab === "single" ? (
          <form onSubmit={submitSingle}>
            {/* BASICS */}
            <div className="section">
              <div className="section-head">
                <h4>Basics</h4>
                <p className="muted small">Required fields are marked with *</p>
              </div>
              <div className="grid-2">
                <div className="field">
                  <label>ClaimID <span className="req">*</span></label>
                  <input className="control" name="ClaimID" value={form.ClaimID} onChange={onChange} placeholder="e.g. CLM0001" />
                  <div className="hint">Unique claim identifier</div>
                </div>
                <div className="field">
                  <label>BeneID <span className="req">*</span></label>
                  <input className="control" name="BeneID" value={form.BeneID} onChange={onChange} placeholder="e.g. BEN0001" />
                  <div className="hint">Beneficiary ID</div>
                </div>
                <div className="field">
                  <label>DiagnosisGroupCode</label>
                  <input className="control" name="DiagnosisGroupCode" value={form.DiagnosisGroupCode || ""} onChange={onChange} placeholder="e.g. D077" />
                </div>
                <div className="field">
                  <label>Gender</label>
                  <select className="control" name="Gender" value={form.Gender || ""} onChange={onChange}>
                    <option value="">— Select —</option>
                    <option value="M">Male (M)</option>
                    <option value="F">Female (F)</option>
                  </select>
                </div>
                <div className="field">
                  <label>InscClaimAmtReimbursed</label>
                  <input type="number" className="control" name="InscClaimAmtReimbursed" value={form.InscClaimAmtReimbursed || ""} onChange={onChange} placeholder="e.g. 12345" />
                  <div className="hint">Amount requested (numeric)</div>
                </div>
              </div>
            </div>

            {/* DATES */}
            <div className="section">
              <div className="section-head"><h4>Dates</h4></div>
              <div className="grid-2">
                {DATE_FIELDS.map((k) => (
                  <div key={k} className="field">
                    <label>{k}</label>
                    <input type="date" className="control" name={k} value={form[k] || ""} onChange={onChange} />
                  </div>
                ))}
              </div>
            </div>

            {/* CHRONIC */}
            <div className="section">
              <div className="section-head"><h4>Chronic Conditions</h4></div>
              <div className="grid-2">
                {CHRONIC_FIELDS.map((k) => (
                  <div key={k} className="field">
                    <label>{k}</label>
                    <select className="control" name={k} value={form[k] || ""} onChange={onChange}>
                      <option value="">— Select —</option>
                      <option value="1">Yes (1)</option>
                      <option value="0">No (0)</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <div className="footer-bar">
              <div className="muted small">
                Provider is set server-side. <b>Required:</b> ClaimID, BeneID.
              </div>
              <button className="btn btn-primary" disabled={busy}>Submit</button>
            </div>
          </form>
        ) : (
          <div className="section">
            <div className="section-head"><h4>CSV Upload</h4></div>
            <input type="file" accept=".csv" onChange={(e) => handleCsv(e.target.files?.[0])} />
            <div className="hint" style={{ marginTop: 6 }}>
              CSV headers: ClaimID,BeneID,ClaimStartDt,ClaimEndDt,DOB,AdmissionDt,InscClaimAmtReimbursed,DiagnosisGroupCode,Gender,ChronicCond_*
            </div>
            {csvInfo.rows > 0 && (
              <div className="pill pill-info" style={{ marginTop: 10 }}>
                {csvInfo.filename} • {csvInfo.rows} rows parsed
              </div>
            )}
            <div className="footer-bar" style={{ marginTop: 16 }}>
              <div />
              <button className="btn btn-primary" disabled={busy || !csvRows.length} onClick={submitCsv}>
                Upload
              </button>
            </div>
          </div>
        )}
      </div>

      {msg && (
        <div style={{ marginTop: 12 }} className={msg.startsWith("✅") ? "pill pill-good" : "pill pill-danger"}>
          {msg}
        </div>
      )}
    </div>
  );
}
