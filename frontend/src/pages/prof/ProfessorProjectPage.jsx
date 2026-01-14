import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
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

function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return String(iso || "");
  }
}

function gradeLabel(v) {
  if (v === 0 || v === "0") return "0";
  if (v == null || v === "") return "ungraded";
  return String(v);
}

function normalizeArray(x) {
  return Array.isArray(x) ? x : (x ? [x] : []);
}

export default function ProfessorProjectPage() {
  const { projectId } = useParams();
  const token = localStorage.getItem("token");

  const [project, setProject] = useState(null);

  const [deliverables, setDeliverables] = useState([]);
  const [deliverableFilesById, setDeliverableFilesById] = useState({});

  const [grades, setGrades] = useState([]);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");

  const gradeByDeliverableId = useMemo(() => {
    const m = new Map();
    for (const g of normalizeArray(grades)) {
      if (g?.deliverableId != null) m.set(Number(g.deliverableId), g);
    }
    return m;
  }, [grades]);

  const overall = useMemo(() => {
    const vals = [];
    for (const g of normalizeArray(grades)) {
      const v = g?.finalScore;
      if (v === 0 || v === "0") vals.push(0);
      else if (v != null && v !== "") vals.push(Number(v));
    }
    if (vals.length === 0) return null;
    const sum = vals.reduce((a, b) => a + b, 0);
    return Math.round((sum / vals.length) * 100) / 100;
  }, [grades]);

  const loadGradesOnly = async () => {
    let gArr = [];
    try {
      // ✅ ruta corecta: /final
      const gs = await fetchJson(`${API}/grades/projects/${projectId}/final`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      gArr = normalizeArray(gs);
    } catch {
      gArr = [];
    }
    setGrades(gArr);
  };

  const load = async () => {
    setErr("");
    setSuccess("");
    setBusy(true);

    try {
      if (!token) throw new Error("Missing token. Please login again.");

      const p = await fetchJson(`${API}/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProject(p);

      const ds = await fetchJson(`${API}/deliverables/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const dArr = normalizeArray(ds);
      setDeliverables(dArr);

      await loadGradesOnly();

      const filesMap = {};
      await Promise.all(
        dArr.map(async (d) => {
          try {
            const fs = await fetchJson(`${API}/deliverables/${d.id}/files`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            filesMap[d.id] = normalizeArray(fs);
          } catch {
            filesMap[d.id] = [];
          }
        })
      );
      setDeliverableFilesById(filesMap);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    load();
  }, [projectId]);

  const recalcOne = async (deliverableId) => {
    setErr("");
    setSuccess("");
    setBusy(true);
    try {
      await fetchJson(`${API}/grades/deliverables/${deliverableId}/recalculate-final`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      await loadGradesOnly();
      setSuccess(`Recalculated deliverable #${deliverableId} ✅`);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const recalcAll = async () => {
    setErr("");
    setSuccess("");
    setBusy(true);

    try {
      if (deliverables.length === 0) throw new Error("No deliverables to recalculate");

      let ok = 0;
      let failed = 0;

      for (const d of deliverables) {
        try {
          await fetchJson(`${API}/grades/deliverables/${d.id}/recalculate-final`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          });
          ok += 1;
        } catch {
          failed += 1;
        }
      }

      await loadGradesOnly();
      setSuccess(`Recalculate finished: ok=${ok}, failed=${failed}`);
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
            <h2>
              Project #{projectId} {project?.title ? `• ${project.title}` : ""}
            </h2>
            <p className="prof-subtitle">
              Offering: {project?.courseOfferingId ?? "—"} • Group: {project?.groupId ?? "—"} • Created{" "}
              {fmtDate(project?.createdAt)}
            </p>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button className="prof-btn secondary" onClick={load} disabled={busy}>
              Refresh
            </button>
            <Link
              className="prof-btn secondary"
              to={project?.courseOfferingId ? `/prof/offerings/${project.courseOfferingId}` : "/prof"}
            >
              Back
            </Link>
          </div>
        </div>

        {err && (
          <div className="prof-error" style={{ marginTop: 12 }}>
            {err}
          </div>
        )}

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

        <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
          <div className="offering" style={{ background: "#fff" }}>
            <div className="offering-title">
              Overall: {overall == null ? "ungraded" : String(overall)}
            </div>
            <div className="offering-meta">
              <span>Deliverables: {deliverables.length}</span>
              <span> • Grades rows: {normalizeArray(grades).length}</span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              alignItems: "center",
              marginTop: 6,
            }}
          >
            <div style={{ fontWeight: 900, fontSize: 16 }}>
              Deliverables (all attributes) + grade
            </div>

            <button className="prof-btn" onClick={recalcAll} disabled={busy || deliverables.length === 0}>
              {busy ? "Working..." : "Recalculate all"}
            </button>
          </div>

          {deliverables.length === 0 ? (
            <div style={{ color: "#6b7280", fontWeight: 700 }}>
              No deliverables for this project.
            </div>
          ) : (
            deliverables.map((d) => {
              const g = gradeByDeliverableId.get(Number(d.id));
              const files = deliverableFilesById?.[d.id] || [];

              return (
                <div key={d.id} className="offering" style={{ background: "#fff" }}>
                  <div
                    className="offering-title"
                    style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}
                  >
                    <span>
                      {d.title} (Deliverable #{d.id})
                    </span>

                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <span style={{ fontWeight: 900 }}>
                        {gradeLabel(g?.finalScore ?? null)}
                      </span>

                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => recalcOne(d.id)}
                        style={{
                          padding: "8px 10px",
                          borderRadius: 10,
                          border: "1px solid #dbeafe",
                          background: "#eff6ff",
                          color: "#1d4ed8",
                          fontWeight: 800,
                          cursor: busy ? "not-allowed" : "pointer",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Recalculate
                      </button>
                    </div>
                  </div>

                  <div className="offering-meta" style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                    <span><b>projectId:</b> {d.projectId}</span>
                    <span><b>dueDate:</b> {fmtDate(d.dueDate)}</span>
                    <span><b>createdAt:</b> {fmtDate(d.createdAt)}</span>
                    {g?.calculatedAt && <span><b>calculatedAt:</b> {fmtDate(g.calculatedAt)}</span>}
                  </div>

                  <div style={{ marginTop: 8, display: "grid", gap: 6 }}>
                    <div style={{ color: "#374151", fontWeight: 700 }}>
                      <b>description:</b>{" "}
                      <span style={{ fontWeight: 600 }}>{d.description || "—"}</span>
                    </div>

                    <div style={{ color: "#374151", fontWeight: 700 }}>
                      <b>videoUrl:</b>{" "}
                      {d.videoUrl ? (
                        <a href={d.videoUrl} target="_blank" rel="noreferrer">
                          {d.videoUrl}
                        </a>
                      ) : (
                        <span style={{ fontWeight: 600 }}>—</span>
                      )}
                    </div>

                    <div style={{ color: "#374151", fontWeight: 700 }}>
                      <b>serverUrl:</b>{" "}
                      {d.serverUrl ? (
                        <a href={d.serverUrl} target="_blank" rel="noreferrer">
                          {d.serverUrl}
                        </a>
                      ) : (
                        <span style={{ fontWeight: 600 }}>—</span>
                      )}
                    </div>

                    <div style={{ color: "#374151", fontWeight: 700 }}>
                      <b>files:</b>{" "}
                      <span style={{ fontWeight: 600 }}>{files.length}</span>
                    </div>

                    {files.length > 0 && (
                      <div style={{ marginTop: 6, display: "grid", gap: 6 }}>
                        {files.map((f, idx) => (
                          <div
                            key={`${d.id}-${idx}`}
                            style={{
                              padding: 10,
                              borderRadius: 10,
                              border: "1px solid #e5e7eb",
                              background: "#fafafa",
                              fontWeight: 600,
                              color: "#374151",
                            }}
                          >
                            {typeof f === "string" ? f : JSON.stringify(f)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
