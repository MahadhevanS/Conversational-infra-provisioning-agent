import React, { useState } from "react";

export default function CreateProjectModal({ isOpen, onClose, onSuccess }) {
  const [projectName, setProjectName] = useState("");
  const [environment, setEnvironment] = useState("Development");
  // 🔥 NEW: Track an array of strings instead of one string
  const [inviteEmails, setInviteEmails] = useState([""]); 
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  // --- Dynamic Input Handlers ---
  const handleEmailChange = (index, value) => {
    const newEmails = [...inviteEmails];
    newEmails[index] = value;
    setInviteEmails(newEmails);
  };

  const addEmailRow = () => {
    setInviteEmails([...inviteEmails, ""]);
  };

  const removeEmailRow = (index) => {
    const newEmails = inviteEmails.filter((_, i) => i !== index);
    setInviteEmails(newEmails);
  };
  // ------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    // 🔥 Filter out any empty boxes before sending to the backend
    const validEmails = inviteEmails.filter(email => email.trim() !== "");

    try {
      const sessionData = JSON.parse(localStorage.getItem("cloudcrafter_session"));
      const token = localStorage.getItem("cloudcrafter_token"); 

const response = await fetch("http://localhost:8000/projects/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          project_name: projectName,
          environment: environment.toLowerCase(),
          // 🔥 Send the array! Our backend is already configured to catch it.
          invite_emails: validEmails 
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to create project");
      }

      const newProject = await response.json();
      
      if (onSuccess) onSuccess(newProject);
      
      // Reset form and close
      setProjectName("");
      setEnvironment("Development");
      setInviteEmails([""]); // Reset to one empty row
      onClose();

    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#151521] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="flex justify-between items-center p-6 border-b border-white/5 shrink-0">
          <h2 className="text-xl font-bold text-white">Create New Project</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Added overflow-y-auto so the modal scrolls if they add 10 architects */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
          
          {errorMsg && (
            <div className="p-3 text-sm text-red-400 bg-red-900/30 border border-red-500/50 rounded-lg shrink-0">
              {errorMsg}
            </div>
          )}

          <div className="space-y-2 shrink-0">
            <label className="block text-sm font-medium text-gray-300">Project Name</label>
            <input
              type="text"
              required
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g., Payment Gateway Core"
              className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="space-y-2 shrink-0">
            <label className="block text-sm font-medium text-gray-300">Environment</label>
            <div className="relative">
              <select
                value={environment}
                onChange={(e) => setEnvironment(e.target.value)}
                className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none focus:border-indigo-500 appearance-none transition-colors"
              >
                <option value="Development">Development</option>
                <option value="Staging">Staging</option>
                <option value="Production">Production</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* 🔥 DYNAMIC ARCHITECT INPUTS */}
          <div className="space-y-3 shrink-0">
            <label className="block text-sm font-medium text-gray-300">
              Invite Team Members <span className="text-gray-500 text-xs font-normal">(Optional)</span>
            </label>
            
            <div className="space-y-2">
              {inviteEmails.map((email, index) => (
                <div key={index} className="flex items-center gap-2 group animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="relative flex-1">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-indigo-400 transition-colors">
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => handleEmailChange(index, e.target.value)}
                      placeholder="colleague@company.com"
                      className="w-full pl-10 p-2.5 rounded-lg bg-black/40 border border-white/10 text-white outline-none focus:border-indigo-500 transition-colors text-sm"
                    />
                  </div>
                  
                  {/* Only show delete button if there's more than one row, or if the single row has text */}
                  {(inviteEmails.length > 1 || email.length > 0) && (
                    <button
                      type="button"
                      onClick={() => removeEmailRow(index)}
                      className="p-2.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                      title="Remove"
                    >
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add Another Button */}
            <button
              type="button"
              onClick={addEmailRow}
              className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors py-1 font-medium"
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Add another
            </button>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-white/5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 py-3 px-4 rounded-xl font-medium text-white bg-white/5 hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                isLoading 
                  ? "bg-indigo-500/50 text-white/50 cursor-not-allowed" 
                  : "bg-indigo-500 text-white hover:bg-indigo-600"
              }`}
            >
              {isLoading ? "Creating..." : "Create Project"}
            </button>
          </div>
          
        </form>
      </div>
    </div>
  );
}