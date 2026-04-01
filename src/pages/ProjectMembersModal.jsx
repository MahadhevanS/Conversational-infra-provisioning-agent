import React, { useEffect, useState } from "react";
import { apiFetch } from "../utils/api";

export default function ProjectMembersModal({ isOpen, onClose, projectId }) {
  const [members, setMembers] = useState([]);
  const [emails, setEmails] = useState([""]);
  const [loading, setLoading] = useState(false);

  const loadMembers = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await apiFetch(`/projects/${projectId}/members`);
      setMembers(res.members || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) loadMembers();
  }, [isOpen, projectId]);

  const handleInvite = async () => {
    const validEmails = emails.filter(e => e.trim() !== "");
    if (validEmails.length === 0) return;

    await apiFetch(`/projects/${projectId}/members/invite`, {
      method: "POST",
      body: JSON.stringify({ emails: validEmails }),
    });

    setEmails([""]);
    alert("Invites sent!");
  };

  const handleRemove = async (id) => {
    try {
      await apiFetch(`/projects/${projectId}/members/${id}`, {
        method: "DELETE",
      });

      loadMembers();

    } catch (err) {
      console.error("Remove failed:", err);
      alert("Failed to remove member");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] bg-black/70 flex items-center justify-center p-4 overflow-y-auto">
       <div className="w-full max-w-lg bg-[#151521] border border-white/10 rounded-2xl p-6 text-white shadow-xl max-h-[90vh] overflow-y-auto">

        <h2 className="text-lg mb-4">Manage Members</h2>

        {/* Invite */}
        {emails.map((e, i) => (
          <input
            key={i}
            value={e}
            onChange={(ev) => {
              const copy = [...emails];
              copy[i] = ev.target.value;
              setEmails(copy);
            }}
            className="w-full mb-2 p-2 bg-black border"
            placeholder="email"
          />
        ))}

        <button onClick={() => setEmails([...emails, ""])}>+ Add</button>

        <button onClick={handleInvite} className="block mt-2 bg-indigo-500 px-3 py-2">
          Send Invites
        </button>

        {/* Members */}
        <div className="mt-4">
          {loading ? "Loading..." : members.map(m => (
            <div key={m.user_id} className="flex justify-between items-center p-2 bg-white/5 rounded-lg border border-white/10">
              <div>
                <p className="text-sm font-medium">
                  {m.name || "Unknown User"}
                </p>
                <p className="text-xs text-zinc-400">
                  {m.email}
                </p>
              </div>

              <button
                onClick={() => handleRemove(m.user_id)}
                className="text-xs text-rose-400 hover:text-rose-300"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <button onClick={onClose} className="mt-4">Close</button>
      </div>
    </div>
  );
}