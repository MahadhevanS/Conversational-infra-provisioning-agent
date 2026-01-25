import { useState } from "react";
import LandingPage from "./components/LandingPage";
import ConsoleLayout from "./components/ConsoleLayout";
import "./App.css"; 
function App() {
  const [view, setView] = useState("landing"); 

  return (
    <div className="min-h-screen w-full bg-[#050505] text-white font-sans antialiased overflow-hidden">
      {view === "landing" ? (
        <LandingPage onStart={() => setView("console")} />
      ) : (
        <ConsoleLayout />
      )}
    </div>
  );
}

export default App;