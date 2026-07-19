import { createContext, useContext, useEffect, useState } from "react";

const AppContext = createContext(null);

const PREFS_KEY = "jobmatch.preferences";

const DEFAULT_PREFERENCES = {
  role: "",
  location: "",
  remoteType: "remote", // remote | hybrid | onsite
  salaryMin: "",
  salaryMax: "",
  experienceLevel: "mid", // entry | mid | senior | lead
};

function loadPreferences() {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function AppProvider({ children }) {
  const [preferences, setPreferencesState] = useState(loadPreferences);
  const [resumeText, setResumeText] = useState("");
  const [parsedResume, setParsedResume] = useState(null);
  const [jobs, setJobs] = useState([]); // matched jobs, sorted by score

  useEffect(() => {
    localStorage.setItem(PREFS_KEY, JSON.stringify(preferences));
  }, [preferences]);

  function setPreferences(next) {
    setPreferencesState((prev) => ({ ...prev, ...next }));
  }

  const preferencesComplete = Boolean(
    preferences.role.trim() && preferences.location.trim() && preferences.remoteType
  );

  const value = {
    preferences,
    setPreferences,
    preferencesComplete,
    resumeText,
    setResumeText,
    parsedResume,
    setParsedResume,
    jobs,
    setJobs,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
