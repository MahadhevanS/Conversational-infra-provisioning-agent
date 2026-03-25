import React, { useState, useEffect } from "react";
import { apiFetch } from "../utils/api";

const Sidebar = ({ isOpen, onClose, onToggleTheme, currentTheme, activeProjectId, onSelectProject }) => {
  const isDark = currentTheme === "dark";

  const bgClass = isDark ? "bg-[#141417]/95 border-white/10" : "bg-zinc-100/95 border-black/10";
  const textMain = isDark ? "text-white" : "text-zinc-900";
  const textMuted = isDark ? "text-zinc-500" : "text-zinc-500";
  const hoverItem = isDark ? "hover:bg-white/5 hover:text-white" : "hover:bg-black/5 hover:text-black";
  const borderClass = isDark ? "border-white/10" : "border-black/10";

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);

  // 🔥 NEW: Helper to get the user's role securely from local storage
  const getSessionRole = () => {
    try {
      const session = JSON.parse(localStorage.getItem("cloudcrafter_session") || "{}");
      return session.role || "admin"; 
    } catch {
      return "admin";
    }
  };
  
  const userRole = getSessionRole();

  // Fetch in the background immediately! Don't wait for the sidebar to open.
  useEffect(() => {
    fetchProjects();
  }, [activeProjectId]);

  const fetchProjects = async () => {
    if (projects.length === 0) {
      setLoading(true);
    }
    
    try {
      const data = await apiFetch("/projects", { method: "GET" });
      const fetchedProjects = data.projects || [];
      setProjects(fetchedProjects);

      if (activeProjectId) {
        const currentProj = fetchedProjects.find(p => p.project_id === activeProjectId);
        if (currentProj) {
          onSelectProject(activeProjectId, currentProj.project_name, true); 
        } else {
          onSelectProject(null, "New Conversation", true);
        }
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    onSelectProject(null, "New Conversation");
  };

  return (
    <>
      <aside className={`fixed top-[60px] left-0 w-[280px] h-[calc(100vh-60px)] backdrop-blur-xl border-r z-50 transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] flex flex-col px-4 py-6 ${bgClass} ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
        
        {/* 🔥 NEW: Role-Based Button Rendering */}
        {userRole === "admin" ? (
          <button 
            onClick={handleCreateNew} 
            className="w-full flex items-center justify-center gap-2 mb-6 p-3 rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-all font-semibold text-sm"
          >
            + New Chat
          </button>
        ) : (
          <div 
            className="w-full flex flex-col items-center justify-center gap-1 mb-6 p-3 rounded-xl border border-white/5 bg-black/20 text-zinc-500 cursor-not-allowed text-center"
            title="Only Admins can create new projects"
          >
            <span className="text-xs font-semibold flex items-center gap-1.5">
               <svg className="w-3.5 h-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
               Creation Disabled
            </span>
            <span className="text-[10px] opacity-70 leading-tight px-2">Need Admin role to create projects</span>
          </div>
        )}

        <div className="flex justify-between items-center mb-4 px-1">
          <h3 className={`text-xs font-bold tracking-[0.18em] ${textMuted}`}>CONVERSATIONS</h3>
          <button onClick={onClose} className={`text-xl leading-none ${textMuted} hover:${textMain} transition-colors`}>×</button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 pr-1">
          {loading ? (
            <p className={`text-xs p-2 ${textMuted}`}>Loading projects...</p>
          ) : projects.length > 0 ? (
            projects.map((proj) => (
              <div 
                key={proj.project_id} 
                onClick={() => onSelectProject(proj.project_id, proj.project_name)}
                className={`group flex items-center gap-3 p-3 rounded-lg text-sm font-medium cursor-pointer transition-all ${proj.project_id === activeProjectId ? 'bg-indigo-500/20 text-indigo-400' : `${textMuted} ${hoverItem}`}`}
              >
                <span className="text-xs opacity-70">💬</span>
                <span className="truncate flex-1">{proj.project_name}</span>
                
                {/* Optional: Add a subtle badge so Cloud Architects know which projects they are a guest in */}
                {proj.access_level === "cloud_architect" && (
                  <span className="text-[9px] uppercase tracking-wider bg-white/5 px-1.5 py-0.5 rounded text-zinc-500">Guest</span>
                )}
              </div>
            ))
          ) : (
            <p className={`text-xs p-2 ${textMuted}`}>No projects found.</p>
          )}
        </div>

        <div className={`mt-auto pt-6 border-t ${borderClass}`}>
          <button onClick={onToggleTheme} className={`w-full flex items-center justify-center gap-3 p-3 rounded-xl border transition-all ${isDark ? "bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:bg-white/10" : "bg-black/5 border-black/10 text-zinc-600 hover:text-black hover:bg-black/10"}`}>
            <span className="text-lg">{isDark ? "☀" : "☾"}</span>
            <span className="text-sm font-semibold">{isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}</span>
          </button>
        </div>
      </aside>
      {isOpen && <div className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" onClick={onClose} />}
    </>
  );
};

export default Sidebar;