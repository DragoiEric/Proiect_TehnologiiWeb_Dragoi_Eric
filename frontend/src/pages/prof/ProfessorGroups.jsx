import { useEffect, useState } from "react";
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

export default function ProfessorGroups() {
  const token = localStorage.getItem("token");
  const me = JSON.parse(localStorage.getItem("me") || "null");
  const mainProfessorId = me?.id;

  const [offerings, setOfferings] = useState([]);
  const [groupsByOffering, setGroupsByOffering] = useState({});

  const [openCreateForOffering, setOpenCreateForOffering] = useState(null);
  const [openMembersFor, setOpenMembersFor] = useState(null);

  const [createOfferingName, setCreateOfferingName] = useState("");
  const [createOfferingDesc, setCreateOfferingDesc] = useState("");

  const [showUnlinkedCreate, setShowUnlinkedCreate] = useState(false);
  const [createUnlinkedName, setCreateUnlinkedName] = useState("");
  const [createUnlinkedDesc, setCreateUnlinkedDesc] = useState("");

  const [addMemberUserId, setAddMemberUserId] = useState("");

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");

  const loadOfferingsAndGroups = async () => {
    setErr("");
    setSuccess("");

    if (!mainProfessorId) throw new Error("Missing me.id. Re-login to refresh /auth/me.");

    const offs = await fetchJson(`${API}/courses/offerings/teacher/${mainProfessorId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const offList = normalizeArray(offs);
    setOfferings(offList);

    const entries = await Promise.all(
      offList.map(async (o) => {
        try {
          const gr = await fetchJson(`${API}/groups/by-offering/${o.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          return [o.id, normalizeArray(gr)];
        } catch {
          return [o.id, []];
        }
      })
    );

    const map = {};
    for (const [offId, list] of entries) map[offId] = list;
    setGroupsByOffering(map);
  };

  useEffect(() => {
    (async () => {
      try {
        await loadOfferingsAndGroups();
      } catch (e) {
        setErr(e.message);
      }
    })();
  }, []);

  const createGroupBase = async ({ name, description }) => {
    const nm = String(name || "").trim();
    if (!nm) throw new Error("Group name is required");

    const created = await fetchJson(`${API}/groups`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: nm,
        description: String(description || "").trim() || null,
      }),
    });

    const group = created?.group ?? created?.data?.group ?? created;
    if (!group?.id) throw new Error("Create group did not return group.id");
    return group;
  };

  const createUnlinkedGroup = async () => {
    try {
      setErr("");
      setSuccess("");
      setBusy(true);

      const group = await createGroupBase({
        name: createUnlinkedName,
        description: createUnlinkedDesc,
      });

      setCreateUnlinkedName("");
      setCreateUnlinkedDesc("");
      setShowUnlinkedCreate(false);

      setSuccess(`Unlinked group #${group.id} created ✅ (not listed unless you add GET /groups)`);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const createGroupForOffering = async (offeringId) => {
    try {
      setErr("");
      setSuccess("");
      setBusy(true);

      const group = await createGroupBase({
        name: createOfferingName,
        description: createOfferingDesc,
      });

      await fetchJson(`${API}/groups/${group.id}/course-offerings/${offeringId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      setGroupsByOffering((prev) => {
        const next = { ...prev };
        next[offeringId] = [group, ...(next[offeringId] || [])];
        return next;
      });

      setCreateOfferingName("");
      setCreateOfferingDesc("");
      setOpenCreateForOffering(null);

      setSuccess(`Group #${group.id} created and linked to offering #${offeringId} ✅`);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const addMemberToGroup = async (groupId) => {
    try {
      setErr("");
      setSuccess("");
      setBusy(true);

      const uid = Number(addMemberUserId);
      if (!Number.isInteger(uid) || uid <= 0) throw new Error("Invalid member userId");

      await fetchJson(`${API}/groups/${groupId}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: uid }),
      });

      setAddMemberUserId("");
      setSuccess(`User ${uid} added to group #${groupId} ✅`);
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
            <h2>Manage Groups</h2>
            <p className="prof-subtitle">Offerings → groups → members</p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              className="prof-btn"
              disabled={busy}
              onClick={() => {
                setShowUnlinkedCreate(true);
                setCreateUnlinkedName("");
                setCreateUnlinkedDesc("");
              }}
            >
              Create Unlinked Group
            </button>
            <button className="prof-btn secondary" disabled={busy} onClick={loadOfferingsAndGroups}>
              Refresh
            </button>
            <Link className="prof-btn secondary" to="/prof">
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

        {showUnlinkedCreate && (
          <div className="offering" style={{ background: "#fff", marginTop: 14 }}>
            <div className="offering-title">Create Unlinked Group</div>
            <div style={{ marginTop: 10, display: "grid", gap: 10, maxWidth: 640 }}>
              <input
                placeholder="Group name (required)"
                value={createUnlinkedName}
                onChange={(e) => setCreateUnlinkedName(e.target.value)}
                style={{ padding: 10, borderRadius: 10, border: "1px solid #e5e7eb" }}
              />
              <textarea
                placeholder="Description (optional)"
                value={createUnlinkedDesc}
                onChange={(e) => setCreateUnlinkedDesc(e.target.value)}
                style={{ padding: 10, borderRadius: 10, border: "1px solid #e5e7eb", minHeight: 80 }}
              />
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button className="prof-btn" disabled={busy} onClick={createUnlinkedGroup}>
                  {busy ? "Working..." : "Create"}
                </button>
                <button className="prof-btn secondary" disabled={busy} onClick={() => setShowUnlinkedCreate(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
          {offerings.map((o) => {
            const groups = groupsByOffering[o.id] || [];
            return (
              <div key={o.id} className="offering" style={{ background: "#fff" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <div className="offering-title">
                      Offering #{o.id} • {o.academicYear} • {o.semester}
                    </div>
                    <div className="offering-meta">
                      <span>Course ID: {o.courseId}</span>
                      <span> • Main professor ID: {o.mainProfessorId}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="prof-btn"
                    disabled={busy}
                    onClick={() => {
                      setOpenCreateForOffering(o.id);
                      setCreateOfferingName("");
                      setCreateOfferingDesc("");
                    }}
                    style={{ height: "fit-content" }}
                  >
                    Create + Link Group
                  </button>
                </div>

                {openCreateForOffering === o.id && (
                  <div style={{ marginTop: 12, display: "grid", gap: 10, maxWidth: 640 }}>
                    <input
                      placeholder="Group name (required)"
                      value={createOfferingName}
                      onChange={(e) => setCreateOfferingName(e.target.value)}
                      style={{ padding: 10, borderRadius: 10, border: "1px solid #e5e7eb" }}
                    />
                    <textarea
                      placeholder="Description (optional)"
                      value={createOfferingDesc}
                      onChange={(e) => setCreateOfferingDesc(e.target.value)}
                      style={{ padding: 10, borderRadius: 10, border: "1px solid #e5e7eb", minHeight: 80 }}
                    />
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button
                        type="button"
                        className="prof-btn"
                        disabled={busy}
                        onClick={() => createGroupForOffering(o.id)}
                      >
                        {busy ? "Working..." : "Create + Link"}
                      </button>
                      <button
                        type="button"
                        className="prof-btn secondary"
                        disabled={busy}
                        onClick={() => setOpenCreateForOffering(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                  {groups.length === 0 ? (
                    <div style={{ color: "#6b7280", fontWeight: 700 }}>No groups linked.</div>
                  ) : (
                    groups.map((g) => (
                      <div
                        key={g.id}
                        style={{
                          border: "1px solid #eee",
                          borderRadius: 12,
                          padding: 12,
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 12,
                          alignItems: "center",
                          flexWrap: "wrap",
                        }}
                      >
                        <div style={{ fontWeight: 800 }}>
                          Group #{g.id}{g.name ? ` • ${g.name}` : ""}
                        </div>

                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                          <button
                            type="button"
                            className="prof-btn secondary"
                            disabled={busy}
                            onClick={() => {
                              setOpenMembersFor((prev) => (prev === g.id ? null : g.id));
                              setAddMemberUserId("");
                            }}
                          >
                            Add member
                          </button>

                          <Link className="prof-btn secondary" to={`/prof/groups/${g.id}`}>
                            Open
                          </Link>
                        </div>

                        {openMembersFor === g.id && (
                          <div style={{ width: "100%", marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                            <input
                              placeholder="userId"
                              value={addMemberUserId}
                              onChange={(e) => setAddMemberUserId(e.target.value)}
                              style={{
                                padding: 10,
                                borderRadius: 10,
                                border: "1px solid #e5e7eb",
                                minWidth: 220,
                              }}
                            />
                            <button
                              type="button"
                              className="prof-btn"
                              disabled={busy}
                              onClick={() => addMemberToGroup(g.id)}
                            >
                              {busy ? "Working..." : "Add"}
                            </button>
                            <button
                              type="button"
                              className="prof-btn secondary"
                              disabled={busy}
                              onClick={() => setOpenMembersFor(null)}
                            >
                              Close
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
