import { NavLink, Route, Routes, Navigate } from "react-router-dom";
import { useApp } from "./context/AppContext.jsx";
import PreferencesPage from "./pages/PreferencesPage.jsx";
import ResumePage from "./pages/ResumePage.jsx";
import TrackerPage from "./pages/TrackerPage.jsx";

export default function App() {
  const { preferencesComplete } = useApp();

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">JobMatch AI</div>
        <nav className="tabs">
          <NavLink to="/" end className={({ isActive }) => (isActive ? "tab active" : "tab")}>
            Preferences
          </NavLink>
          <NavLink
            to="/resume"
            className={({ isActive }) => (isActive ? "tab active" : "tab")}
          >
            Resume &amp; Results
          </NavLink>
          <NavLink
            to="/tracker"
            className={({ isActive }) => (isActive ? "tab active" : "tab")}
          >
            Tracker
          </NavLink>
        </nav>
      </header>

      <main className="content">
        <Routes>
          <Route path="/" element={<PreferencesPage />} />
          <Route
            path="/resume"
            element={preferencesComplete ? <ResumePage /> : <Navigate to="/" replace />}
          />
          <Route path="/tracker" element={<TrackerPage />} />
        </Routes>
      </main>
    </div>
  );
}
