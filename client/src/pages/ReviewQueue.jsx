// ReviewQueue.jsx code here
import { useEffect, useState } from 'react';
import api from '../api';

export default function ReviewQueue() {
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);

  async function load() {
    const { data } = await api.get('/claims/pending');
    setItems(data);
  }

  async function review(id, decision) {
    setBusy(true);
    try {
      await api.post(`/claims/${id}/review`, { decision });
      await load();
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="admin-theme">
      <h2>Pending Claims</h2>
      <table className="card">
        <thead>
          <tr><th>ClaimID</th><th>Provider</th><th>Start</th><th>Amt</th><th>Dx</th><th>Action</th></tr>
        </thead>
        <tbody>
          {items.map(it => (
            <tr key={it._id}>
              <td>{it.ClaimID}</td>
              <td>{it.Provider}</td>
              <td>{it.ClaimStartDt ? new Date(it.ClaimStartDt).toLocaleDateString() : ''}</td>
              <td>{it.InscClaimAmtReimbursed}</td>
              <td>{it.DiagnosisGroupCode}</td>
              <td>
                <button disabled={busy} onClick={()=>review(it.ClaimID, 'Approved')}>Approve</button>
                <button disabled={busy} onClick={()=>review(it.ClaimID, 'Rejected')}>Reject</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
