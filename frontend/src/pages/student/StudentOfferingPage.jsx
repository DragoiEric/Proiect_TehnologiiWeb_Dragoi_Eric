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

export default function StudentOfferingPage() {
  const { offeringId } = useParams();
  const token = localStorage.getItem("token");
  const me = JSON.parse(localStorage.getItem("me") || "null");

  const [offering, setOffering] = useState(null);
  const [myProject, setMyProject] = useState(null);

  const [deliverables, setDeliverables] = useState([]);
  const [grades, setGrades] = useState([]);

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    videoUrl: "",
    serverUrl: "",
  });

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

  const load = async () => {
    setErr("");
    setSuccess("");
    setBusy(true);

    try {
      if (!token) throw new Error("Missing token. Please login again.");
      if (!me?.id) throw new Error("Missing me.id. Please login again.");

      const off = await fetchJson(`${API}/courses/offerings/${offeringId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOffering(off);

      const my = await fetchJson(`${API}/projects/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const myArr = normalizeArray(my);

      const p = myArr.find((x) => Number(x.courseOfferingId) === Number(offeringId));
      if (!p) {
        setMyProject(null);
        setDeliverables([]);
        setGrades([]);
        return;
      }
      setMyProject(p);

      const ds = await fetchJson(`${API}/deliverables/projects/${p.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDeliverables(normalizeArray(ds));

      let gArr = [];
      try {
        const gs = await fetchJson(`${API}/grades/projects/${p.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        gArr = normalizeArray(gs);
      } catch {
        gArr = [];
      }
      setGrades(gArr);

      setEditingId(null);
      setEditForm({ title: "", description: "", videoUrl: "", serverUrl: "" });
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    load();
  }, [offeringId]);

  const startEdit = (d) => {
    setSuccess("");
    setErr("");
    setEditingId(d.id);
    setEditForm({
      title: d.title || "",
      description: d.description || "",
      videoUrl: d.videoUrl || "",
      serverUrl: d.serverUrl || "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ title: "", description: "", videoUrl: "", serverUrl: "" });
  };

  const saveEdit = async () => {
    try {
      setErr("");
      setSuccess("");
      setBusy(true);

      const id = editingId;
      if (!id) return;

      const updated = await fetchJson(`${API}/deliverables/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: editForm.title,
          description: editForm.description,
          videoUrl: editForm.videoUrl,
          serverUrl: editForm.serverUrl,
        }),
      });

      setDeliverables((prev) => prev.map((x) => (x.id === id ? updated : x)));
      setSuccess("Deliverable updated ✅");
      cancelEdit();
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
              Offering #{offeringId} {offering?.course?.name ? `• ${offering.course.name}` : ""}
            </h2>
            <p className="prof-subtitle">
              {offering?.academicYear ? `${offering.academicYear} • ${offering.semester}` : ""}
            </p>
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

        {!myProject ? (
          <div style={{ marginTop: 14, color: "#6b7280", fontWeight: 800 }}>
            No project assigned to you for this offering.
          </div>
        ) : (
          <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
            <div className="offering" style={{ background: "#fff" }}>
              <div className="offering-title">
                Your project: {myProject.title} (#{myProject.id})
              </div>
              <div className="offering-meta">
                <span>Group: {myProject.groupId ?? "—"}</span>
                <span> • Created: {fmtDate(myProject.createdAt)}</span>
              </div>
            </div>

            <div style={{ fontWeight: 900, fontSize: 16, marginTop: 6 }}>
              Deliverables
            </div>

            {deliverables.length === 0 ? (
              <div style={{ color: "#6b7280", fontWeight: 700 }}>
                No deliverables for your project.
              </div>
            ) : (
              deliverables.map((d) => {
                const g = gradeByDeliverableId.get(Number(d.id));
                const isEditing = editingId === d.id;

                return (
                  <div key={d.id} className="offering" style={{ background: "#fff" }}>
                    <div
                      className="offering-title"
                      style={{ display: "flex", justifyContent: "space-between", gap: 12 }}
                    >
                      <span>
                        {d.title} (#{d.id})
                      </span>
                      <span style={{ fontWeight: 900 }}>
                        {gradeLabel(g?.finalScore ?? null)}
                      </span>
                    </div>

                    <div className="offering-meta" style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                      <span><b>projectId:</b> {d.projectId}</span>
                      <span><b>dueDate:</b> {fmtDate(d.dueDate)}</span>
                      <span><b>createdAt:</b> {fmtDate(d.createdAt)}</span>
                      {g?.calculatedAt && <span><b>calculatedAt:</b> {fmtDate(g.calculatedAt)}</span>}
                    </div>

                    {!isEditing ? (
                      <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                        <div style={{ color: "#374151", fontWeight: 700 }}>
                          <b>description:</b> <span style={{ fontWeight: 600 }}>{d.description || "—"}</span>
                        </div>
                        <div style={{ color: "#374151", fontWeight: 700 }}>
                          <b>videoUrl:</b>{" "}
                          {d.videoUrl ? (
                            <a href={d.videoUrl} target="_blank" rel="noreferrer">{d.videoUrl}</a>
                          ) : (
                            <span style={{ fontWeight: 600 }}>—</span>
                          )}
                        </div>
                        <div style={{ color: "#374151", fontWeight: 700 }}>
                          <b>serverUrl:</b>{" "}
                          {d.serverUrl ? (
                            <a href={d.serverUrl} target="_blank" rel="noreferrer">{d.serverUrl}</a>
                          ) : (
                            <span style={{ fontWeight: 600 }}>—</span>
                          )}
                        </div>

                        <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
                          <button className="prof-btn" type="button" onClick={() => startEdit(d)} disabled={busy}>
                            Edit
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
                        <input
                          value={editForm.title}
                          onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))}
                          style={{ padding: 10, borderRadius: 10, border: "1px solid #e5e7eb" }}
                          placeholder="Title"
                        />
                        <textarea
                          value={editForm.description}
                          onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                          style={{ padding: 10, borderRadius: 10, border: "1px solid #e5e7eb", minHeight: 90 }}
                          placeholder="Description"
                        />
                        <input
                          value={editForm.videoUrl}
                          onChange={(e) => setEditForm((p) => ({ ...p, videoUrl: e.target.value }))}
                          style={{ padding: 10, borderRadius: 10, border: "1px solid #e5e7eb" }}
                          placeholder="Video URL"
                        />
                        <input
                          value={editForm.serverUrl}
                          onChange={(e) => setEditForm((p) => ({ ...p, serverUrl: e.target.value }))}
                          style={{ padding: 10, borderRadius: 10, border: "1px solid #e5e7eb" }}
                          placeholder="Server URL"
                        />

                        <div style={{ display: "flex", gap: 10 }}>
                          <button className="prof-btn" type="button" onClick={saveEdit} disabled={busy}>
                            Save
                          </button>
                          <button className="prof-btn secondary" type="button" onClick={cancelEdit} disabled={busy}>
                            Cancel
                          </button>
                        </div>

                        <div style={{ color: "#6b7280", fontWeight: 700 }}>
                          
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
