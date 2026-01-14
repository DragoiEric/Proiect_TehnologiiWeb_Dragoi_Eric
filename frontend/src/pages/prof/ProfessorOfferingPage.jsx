import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import "../../styles/ProfessorStart.css";

const API = "http://localhost:3000";

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  const ct = res.headers.get("content-type") || "";
  const body = ct.includes("application/json") ? await res.json() : await res.text();
  if (!res.ok) {
    const msg = typeof body === "string" ? body : body?.error || res.statusText;
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

function toIsoFromDatetimeLocal(v) {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString();
}

export default function ProfessorOfferingPage() {
  const { offeringId } = useParams();
  const token = localStorage.getItem("token");
  const me = JSON.parse(localStorage.getItem("me") || "null");

  const [offering, setOffering] = useState(null);
  const [groups, setGroups] = useState([]);
  const [projects, setProjects] = useState([]);

  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  const [createForm, setCreateForm] = useState({
    title: "",
    description: "",
    leaderMode: "self",
  });

  const [delForm, setDelForm] = useState({
    targetProjectTitle: "",
    title: "",
    description: "",
    dueDateLocal: "",
    videoUrl: "",
    serverUrl: "",
  });

  const totalStudents = useMemo(() => {
    let sum = 0;
    for (const g of groups) {
      const members = Array.isArray(g.members) ? g.members : [];
      sum += members.length;
    }
    return sum;
  }, [groups]);

  const projectBatches = useMemo(() => {
    const m = new Map();
    for (const p of projects) {
      const key = String(p.title || "").trim();
      if (!key) continue;
      m.set(key, (m.get(key) || 0) + 1);
    }
    return [...m.entries()].map(([title, count]) => ({ title, count }));
  }, [projects]);

  const loadAll = async () => {
    setErr("");
    setSuccess("");
    setBusy(true);
    try {
      if (!token) throw new Error("Missing token. Please login again.");

      const off = await fetchJson(`${API}/courses/offerings/${offeringId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOffering(off);

      const gs = await fetchJson(`${API}/groups/by-offering/${offeringId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const groupsArr = Array.isArray(gs) ? gs : gs ? [gs] : [];
      const fullGroups = await Promise.all(
        groupsArr.map(async (g) => {
          try {
            const details = await fetchJson(`${API}/groups/${g.id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            return details;
          } catch {
            return g;
          }
        })
      );
      setGroups(fullGroups);

      const ps = await fetchJson(`${API}/projects/by-offering/${offeringId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProjects(Array.isArray(ps) ? ps : ps ? [ps] : []);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [offeringId]);

  const createProjectsForAllStudents = async (e) => {
    e.preventDefault();
    setErr("");
    setSuccess("");
    setBusy(true);

    try {
      if (!createForm.title.trim()) throw new Error("Title is required");
      if (!me?.id) throw new Error("Missing me.id (login again)");

      const students = [];
      for (const g of groups) {
        const members = Array.isArray(g.members) ? g.members : [];
        for (const u of members) {
          const role = String(u.role || "").toLowerCase();
          if (role === "student") students.push({ userId: u.id, groupId: g.id });
          if (!u.role) students.push({ userId: u.id, groupId: g.id });
        }
      }

      const uniq = new Map();
      for (const s of students) uniq.set(String(s.userId), s);
      const uniqStudents = [...uniq.values()];

      if (uniqStudents.length === 0) {
        throw new Error("No students found in groups. Ensure /groups/:id returns members.");
      }

      const createdProjects = [];

      for (const s of uniqStudents) {
        const proj = await fetchJson(`${API}/projects`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: createForm.title,
            description: createForm.description || null,
            createdById: Number(me.id),
            courseOfferingId: Number(offeringId),
            groupId: Number(s.groupId),
          }),
        });

        createdProjects.push(proj);

        await fetchJson(`${API}/projects/${proj.id}/members`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            userId: Number(s.userId),
            isLeader: createForm.leaderMode === "self",
          }),
        });

        await fetchJson(`${API}/projects/${proj.id}/members`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            userId: Number(me.id),
            isLeader: false,
          }),
        });
      }

      setSuccess(
        `Created ${createdProjects.length} projects + assigned student + added professor ✅`
      );

      await loadAll();

      setCreateForm((p) => ({ ...p, title: "", description: "" }));
      setDelForm((p) => ({
        ...p,
        targetProjectTitle: createForm.title.trim(),
      }));
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  };

  const createDeliverablesForBatch = async (e) => {
    e.preventDefault();
    setErr("");
    setSuccess("");
    setBusy(true);

    try {
      const targetTitle = String(delForm.targetProjectTitle || "").trim();
      if (!targetTitle) throw new Error("Select project batch (project title) first");
      if (!delForm.title.trim()) throw new Error("Deliverable title is required");
      if (!delForm.dueDateLocal) throw new Error("Due date is required");

      const dueIso = toIsoFromDatetimeLocal(delForm.dueDateLocal);
      if (!dueIso) throw new Error("Invalid due date format");

      const batchProjects = projects.filter(
        (p) => String(p.title || "").trim() === targetTitle
      );
      if (batchProjects.length === 0) throw new Error("No projects found for selected batch title");

      const payload = {
        title: delForm.title.trim(),
        description: delForm.description?.trim() || null,
        dueDate: dueIso,
        videoUrl: delForm.videoUrl?.trim() || null,
        serverUrl: delForm.serverUrl?.trim() || null,
      };

      let totalCreated = 0;
      let totalJury = 0;

      for (const p of batchProjects) {
        const resp = await fetchJson(`${API}/deliverables/projects/${p.id}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        const d = resp?.deliverable || resp;
        if (d?.id) totalCreated += 1;

        const juryAssigned = Number(resp?.juryAssigned ?? 0);
        if (Number.isFinite(juryAssigned)) totalJury += juryAssigned;
      }

setSuccess(
  `Created deliverable "${payload.title}" for ${totalCreated} projects in batch "${targetTitle}" ✅ (jury assigned: ${totalJury})`
);

await loadAll();


      setSuccess(
        `Created deliverable "${payload.title}" for ${batchProjects.length} projects in batch "${targetTitle}" ✅`
      );

      setDelForm({
        targetProjectTitle: targetTitle,
        title: "",
        description: "",
        dueDateLocal: "",
        videoUrl: "",
        serverUrl: "",
      });
    } catch (e2) {
      setErr(e2.message);
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
              {groups.length > 0 ? ` • Groups: ${groups.map((g) => g.id).join(", ")}` : ""}
              {totalStudents ? ` • Students: ${totalStudents}` : ""}
            </p>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button className="prof-btn secondary" onClick={loadAll} disabled={busy}>
              Refresh
            </button>
            <Link className="prof-btn secondary" to="/prof">
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

        <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              alignItems: "center",
            }}
          >
            <div style={{ fontWeight: 900, fontSize: 16 }}>Projects</div>
            <div style={{ color: "#6b7280", fontWeight: 700 }}>{projects.length} total</div>
          </div>

          {projects.length === 0 ? (
            <div style={{ color: "#6b7280", fontWeight: 700 }}>No projects yet for this offering.</div>
          ) : (
            projects.map((p) => (
            <Link to={`/prof/projects/${p.id}`} className="offering" style={{ background: "#fff", textDecoration: "none", color: "inherit" }}>


              <div key={p.id} className="offering" style={{ background: "#fff" }}>
                <div className="offering-title">
                  {p.title} (#{p.id})
                </div>
                <div className="offering-meta">
                  <span>Group: {p.groupId ?? "—"}</span>
                  <span> • Created: {fmtDate(p.createdAt)}</span>
                  <span> • CreatedBy: {p.createdById}</span>
                </div>
              </div>
            </Link>
            ))
          )}
        </div>

        <div style={{ marginTop: 18, borderTop: "1px solid #eee", paddingTop: 14 }}>
          <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 10 }}>
            Create projects for all students in offering
          </div>

          <form onSubmit={createProjectsForAllStudents} style={{ display: "grid", gap: 10, maxWidth: 720 }}>
            <input
              placeholder="Project title"
              value={createForm.title}
              onChange={(e) => setCreateForm((p) => ({ ...p, title: e.target.value }))}
              style={{ padding: 10, borderRadius: 10, border: "1px solid #e5e7eb" }}
              required
            />

            <textarea
              placeholder="Description (optional)"
              value={createForm.description}
              onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))}
              style={{ padding: 10, borderRadius: 10, border: "1px solid #e5e7eb", minHeight: 90 }}
            />

            <select
              value={createForm.leaderMode}
              onChange={(e) => setCreateForm((p) => ({ ...p, leaderMode: e.target.value }))}
              style={{ padding: 10, borderRadius: 10, border: "1px solid #e5e7eb" }}
            >
              <option value="self">Student is leader for own project</option>
              <option value="none">No leader</option>
            </select>

            <button className="prof-btn" type="submit" disabled={busy}>
              {busy ? "Creating..." : `Create ${totalStudents || ""} projects`}
            </button>
          </form>
        </div>

        <div style={{ marginTop: 18, borderTop: "1px solid #eee", paddingTop: 14 }}>
          <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 10 }}>
            Create deliverable for a project batch (same project title)
          </div>

          <form onSubmit={createDeliverablesForBatch} style={{ display: "grid", gap: 10, maxWidth: 720 }}>
            <select
              value={delForm.targetProjectTitle}
              onChange={(e) => setDelForm((p) => ({ ...p, targetProjectTitle: e.target.value }))}
              style={{ padding: 10, borderRadius: 10, border: "1px solid #e5e7eb" }}
              required
            >
              <option value="" disabled>Select project title (batch)</option>
              {projectBatches.map((b) => (
                <option key={b.title} value={b.title}>
                  {b.title} — {b.count} projects
                </option>
              ))}
            </select>

            <input
              placeholder="Deliverable title"
              value={delForm.title}
              onChange={(e) => setDelForm((p) => ({ ...p, title: e.target.value }))}
              style={{ padding: 10, borderRadius: 10, border: "1px solid #e5e7eb" }}
              required
            />

            <textarea
              placeholder="Description (optional)"
              value={delForm.description}
              onChange={(e) => setDelForm((p) => ({ ...p, description: e.target.value }))}
              style={{ padding: 10, borderRadius: 10, border: "1px solid #e5e7eb", minHeight: 90 }}
            />

            <input
              type="datetime-local"
              value={delForm.dueDateLocal}
              onChange={(e) => setDelForm((p) => ({ ...p, dueDateLocal: e.target.value }))}
              style={{ padding: 10, borderRadius: 10, border: "1px solid #e5e7eb" }}
              required
            />

            <input
              placeholder="Video URL (optional)"
              value={delForm.videoUrl}
              onChange={(e) => setDelForm((p) => ({ ...p, videoUrl: e.target.value }))}
              style={{ padding: 10, borderRadius: 10, border: "1px solid #e5e7eb" }}
            />

            <input
              placeholder="Server URL (optional)"
              value={delForm.serverUrl}
              onChange={(e) => setDelForm((p) => ({ ...p, serverUrl: e.target.value }))}
              style={{ padding: 10, borderRadius: 10, border: "1px solid #e5e7eb" }}
            />

            <button className="prof-btn" type="submit" disabled={busy || projectBatches.length === 0}>
              {busy ? "Creating..." : "Create deliverable for selected batch"}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}
