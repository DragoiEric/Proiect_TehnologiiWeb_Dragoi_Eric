import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "../../styles/ProfessorStart.css";

const API = "http://localhost:3000";

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  const ct = res.headers.get("content-type") || "";
  const body = ct.includes("application/json") ? await res.json() : await res.text();
  if (!res.ok) {
    const msg = typeof body === "string" ? body : (body.error || res.statusText);
    throw new Error(msg);
  }
  return body;
}

function normalizeArray(x) {
  return Array.isArray(x) ? x : (x ? [x] : []);
}

function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return String(iso || "");
  }
}

export default function StudentJuryPage() {
  const token = localStorage.getItem("token");

  const [assignments, setAssignments] = useState([]);
  const [myGrades, setMyGrades] = useState([]);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");

  const [openId, setOpenId] = useState(null);
  const [form, setForm] = useState({ score: "", comment: "" });

  const gradedDeliverableIds = useMemo(() => {
    const s = new Set();
    for (const g of normalizeArray(myGrades)) {
      const id = g?.deliverableId;
      if (id != null) s.add(Number(id));
    }
    return s;
  }, [myGrades]);

  const load = async () => {
    setErr("");
    setSuccess("");
    setBusy(true);

    try {
      if (!token) throw new Error("Missing token. Please login again.");

      const a = await fetchJson(`${API}/jury/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAssignments(normalizeArray(a));

      const g = await fetchJson(`${API}/grades/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMyGrades(normalizeArray(g));
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openGrade = (deliverableId) => {
    setSuccess("");
    setErr("");
    setOpenId(deliverableId);
    setForm({ score: "", comment: "" });
  };

  const closeGrade = () => {
    setOpenId(null);
    setForm({ score: "", comment: "" });
  };

  const submit = async (deliverableId) => {
    try {
      setErr("");
      setSuccess("");
      setBusy(true);

      const scoreNum = Number(form.score);
      if (!Number.isFinite(scoreNum) || scoreNum < 1 || scoreNum > 10) {
        throw new Error("Score must be a number between 1 and 10");
      }

      await fetchJson(`${API}/grades/deliverables/${deliverableId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          score: scoreNum,
          comment: form.comment || null,
        }),
      });

      setSuccess("Grade submitted ✅");
      closeGrade();
      await load();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="prof-container">
      <div className="prof-card wide">
        <div className="prof-header">
          <div>
            <h2>Jury assignments</h2>
            <p className="prof-subtitle">Deliverables you must grade (anonymous)</p>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button className="prof-btn secondary" onClick={load} disabled={busy}>
              Refresh
            </button>
            <Link className="prof-btn secondary" to="/dashboard">
              Back
            </Link>
          </div>
        </div>

        {err && <div className="prof-error" style={{ marginTop: 12 }}>{err}</div>}
        {success && (
          <div
            style={{
              marginTop: 12,
              padding: 12,
              borderRadius: 12,
              background: "#ecfdf5",
              border: "1px solid #bbf7d0",
              color: "#065f46",
              fontWeight: 800,
            }}
          >
            {success}
          </div>
        )}

        <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
          {assignments.length === 0 ? (
            <div style={{ color: "#6b7280", fontWeight: 800 }}>
              No jury assignments.
            </div>
          ) : (
            assignments.map((a) => {
              const deliverableId = Number(a.deliverableId);
              const already = gradedDeliverableIds.has(deliverableId);
              const isOpen = openId === deliverableId;

              return (
                <div key={a.id} className="offering" style={{ background: "#fff" }}>
                  <div
                    className="offering-title"
                    style={{ display: "flex", justifyContent: "space-between", gap: 12 }}
                  >
                    <span>Deliverable #{deliverableId}</span>
                    <span style={{ fontWeight: 900, color: already ? "#065f46" : "#991b1b" }}>
                      {already ? "graded" : "ungraded"}
                    </span>
                  </div>

                  <div className="offering-meta" style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                    <span><b>assignmentId:</b> {a.id}</span>
                    <span><b>assignedAt:</b> {fmtDate(a.assignedAt)}</span>
                    {"grade" in a && (
                      <span><b>assignment.grade:</b> {a.grade == null ? "—" : String(a.grade)}</span>
                    )}
                  </div>

                  {!already ? (
                    !isOpen ? (
                      <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
                        <button className="prof-btn" type="button" onClick={() => openGrade(deliverableId)} disabled={busy}>
                          Grade
                        </button>
                      </div>
                    ) : (
                      <div style={{ marginTop: 10, display: "grid", gap: 10, maxWidth: 520 }}>
                        <input
                          value={form.score}
                          onChange={(e) => setForm((p) => ({ ...p, score: e.target.value }))}
                          placeholder="Score (1-10)"
                          style={{ padding: 10, borderRadius: 10, border: "1px solid #e5e7eb" }}
                        />
                        <textarea
                          value={form.comment}
                          onChange={(e) => setForm((p) => ({ ...p, comment: e.target.value }))}
                          placeholder="Comment (optional)"
                          style={{ padding: 10, borderRadius: 10, border: "1px solid #e5e7eb", minHeight: 90 }}
                        />

                        <div style={{ display: "flex", gap: 10 }}>
                          <button className="prof-btn" type="button" onClick={() => submit(deliverableId)} disabled={busy}>
                            Submit
                          </button>
                          <button className="prof-btn secondary" type="button" onClick={closeGrade} disabled={busy}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    )
                  ) : (
                    <div style={{ marginTop: 10, color: "#6b7280", fontWeight: 800 }}>
                      You already graded this deliverable.
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div style={{ marginTop: 14, color: "#6b7280", fontWeight: 700 }}>
          Notes: grading uses <code>POST /grades/deliverables/:deliverableId</code>. If you want, we can also show deliverable details by calling <code>GET /deliverables/:id</code>.
        </div>
      </div>
    </div>
  );
}
