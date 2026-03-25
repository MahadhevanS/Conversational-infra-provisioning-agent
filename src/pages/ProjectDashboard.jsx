import React from "react";

export default function ProjectDashboard({ projects, userRole, onSelectProject, onCreateClick, isLoading }) {
  return (
    <div className="min-h-screen bg-[#050505] text-white p-8 md:p-12 w-full flex flex-col items-center animate-in fade-in duration-500 overflow-y-auto">
      
      {/* Header section */}
      <div className="w-full max-w-6xl mb-10 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Projects</h1>
          <p className="text-zinc-400">
            {userRole === "admin" 
              ? "Manage your infrastructure projects or create a new one." 
              : "Select an assigned project to view and manage its infrastructure."}
          </p>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
        
        {/* 🔥 ADMIN ONLY: The "Create New Project" Card */}
        {userRole === "admin" && (
          <div 
            onClick={onCreateClick}
            className="group flex flex-col items-center justify-center h-48 rounded-2xl border-2 border-dashed border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-indigo-500/50 cursor-pointer transition-all duration-300"
          >
            <div className="w-12 h-12 rounded-full bg-white/5 group-hover:bg-indigo-500/20 flex items-center justify-center mb-3 transition-colors">
              <svg className="w-6 h-6 text-zinc-400 group-hover:text-indigo-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h3 className="font-semibold text-zinc-300 group-hover:text-white transition-colors">Create New Project</h3>
          </div>
        )}

        {/* Loading Spinner */}
        {isLoading && projects.length === 0 && (
          <div className="col-span-full py-20 flex justify-center">
            <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
          </div>
        )}

        {/* The Project Cards */}
        {projects.map((proj) => (
          <div 
            key={proj.project_id}
            onClick={() => onSelectProject(proj.project_id, proj.project_name)}
            className="flex flex-col h-48 p-6 rounded-2xl border border-white/10 bg-[#0f0f13] hover:border-white/20 hover:bg-[#141417] cursor-pointer transition-all duration-300 shadow-lg relative overflow-hidden group"
          >
            <div className="flex justify-between items-start mb-auto relative z-10">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${
                proj.environment === 'production' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 
                proj.environment === 'staging' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 
                'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              }`}>
                {proj.environment || "Development"}
              </span>

              {proj.access_level === "cloud_architect" && (
                <span className="text-xs text-zinc-500 bg-white/5 px-2 py-1 rounded-md">Guest Access</span>
              )}
            </div>

            <div className="relative z-10">
              <h3 className="text-xl font-bold text-white mb-1 group-hover:text-indigo-400 transition-colors truncate">
                {proj.project_name}
              </h3>
              <p className="text-xs text-zinc-500">
                Created {new Date(proj.created_at).toLocaleDateString()}
              </p>
            </div>

            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all duration-500"></div>
          </div>
        ))}

        {/* Empty State for Cloud Architect */}
        {!isLoading && projects.length === 0 && userRole === "cloud_architect" && (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4 border border-white/10">
              <svg className="w-8 h-8 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
            </div>
            <h3 className="text-lg font-medium text-white">No Projects Assigned</h3>
            <p className="text-zinc-500 text-sm mt-1">You haven't been invited to any projects yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}