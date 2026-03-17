import { useEffect, useState } from "react";

/**
 * Get all IANA timezones from the browser as a flat sorted list.
 * Uses Intl.supportedValuesOf('timeZone') for the definitive list.
 */
function getTimezoneOptions() {
  return Intl.supportedValuesOf("timeZone");
}

/**
 * Get the UTC offset string for a timezone (e.g., "GMT-7", "GMT+5:30")
 */
function getTimezoneOffset(tz) {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "shortOffset",
    });
    const parts = formatter.formatToParts(new Date());
    const offsetPart = parts.find((p) => p.type === "timeZoneName");
    return offsetPart?.value || "";
  } catch {
    return "";
  }
}

/**
 * Format an IANA timezone for display.
 * e.g., "America/Los_Angeles" → "Los Angeles (America) GMT-7"
 */
function formatTimezoneLabel(tz) {
  const parts = tz.split("/");
  const offset = getTimezoneOffset(tz);

  if (parts.length === 1) {
    // Handle timezones like "UTC"
    return offset ? `${tz} ${offset}` : tz;
  }
  const region = parts[0];
  const city = parts[parts.length - 1].replace(/_/g, " ");
  return offset ? `${city} (${region}) ${offset}` : `${city} (${region})`;
}

const TIMEZONE_OPTIONS = getTimezoneOptions();

function Profile() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [isEditingTimezone, setIsEditingTimezone] = useState(false);
  const [selectedTimezone, setSelectedTimezone] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    const fetchUser = async () => {
      setError(null);

      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();

        if (!res.ok) {
          console.error("API error loading user", data);
          setError("Unable to load user from server");
        }

        console.log(data);
        setUser(data);
        setSelectedTimezone(data.timezone || "");
      } catch (err) {
        console.error("Fetch error loading user", err);
        setError("Unable to get user");
      }
    };

    fetchUser();
  }, []);

  const handleEditTimezone = () => {
    setIsEditingTimezone(true);
    setSaveMessage({ type: "", text: "" });
  };

  const handleCancelEdit = () => {
    setSelectedTimezone(user.timezone || "");
    setIsEditingTimezone(false);
    setSaveMessage({ type: "", text: "" });
  };

  const handleTimezoneChange = (e) => {
    setSelectedTimezone(e.target.value);
    setSaveMessage({ type: "", text: "" });
  };

  const handleSaveTimezone = async () => {
    if (!selectedTimezone) {
      setSaveMessage({ type: "error", text: "Please select a timezone" });
      return;
    }

    setSaving(true);
    setSaveMessage({ type: "", text: "" });

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ timezone: selectedTimezone }),
      });

      if (!res.ok) {
        const data = await res.json();
        console.error("API error saving timezone", data);
        setSaveMessage({ type: "error", text: "Failed to save timezone" });
        return;
      }

      const updatedUser = await res.json();
      setUser(updatedUser);
      setIsEditingTimezone(false);
      setSaveMessage({ type: "success", text: "Timezone saved successfully!" });
    } catch (err) {
      console.error("Fetch error saving timezone", err);
      setSaveMessage({ type: "error", text: "Failed to save timezone" });
    } finally {
      setSaving(false);
    }
  };

  // Helper to get the display label for a timezone value
  const getTimezoneLabel = (value) => {
    if (!value) return "Not set";
    return formatTimezoneLabel(value);
  };

  if (error) {
    return <p>{error}</p>;
  }

  if (!user) {
    return <p>Loading profile…</p>;
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-gradient-to-r from-slate-700 to-slate-600 rounded-lg px-6 py-4 shadow-lg">
        <h1 className="text-2xl font-bold text-white m-0">User Profile</h1>
      </div>

      <div className="bg-white/5 rounded-lg p-8 shadow-lg border border-white/10">
        <h2 className="text-3xl font-bold text-white mb-6 text-center">
          {user.display_name}
        </h2>

        <div className="space-y-4">
          <div className="flex items-center gap-3 text-lg">
            <span className="text-white/60 font-medium">Email:</span>
            <span className="text-white">{user.email}</span>
          </div>
          <div className="flex items-center gap-3 text-lg">
            <span className="text-white/60 font-medium">Timezone:</span>
            {isEditingTimezone ? (
              <>
                <select
                  id="timezone"
                  value={selectedTimezone}
                  onChange={handleTimezoneChange}
                  className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/10"
                >
                  <option value="" className="bg-slate-800">Select a timezone...</option>
                  {TIMEZONE_OPTIONS.map((tz) => (
                    <option key={tz} value={tz} className="bg-slate-800">
                      {formatTimezoneLabel(tz)}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleSaveTimezone}
                  disabled={saving}
                  className="bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 disabled:from-slate-800 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-medium px-6 py-2 rounded-lg shadow-md transition-all duration-200"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={saving}
                  className="bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:cursor-not-allowed text-white font-medium px-6 py-2 rounded-lg border border-white/20 transition-all duration-200"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <span className="text-white">{getTimezoneLabel(user.timezone)}</span>
                <button
                  onClick={handleEditTimezone}
                  className="bg-white/10 hover:bg-white/20 text-white font-medium px-4 py-1 rounded-lg border border-white/20 transition-all duration-200 text-sm"
                >
                  Edit
                </button>
              </>
            )}
          </div>
          {saveMessage.text && (
            <p
              className={`text-sm ${
                saveMessage.type === "error" ? "text-red-400" : "text-green-400"
              }`}
            >
              {saveMessage.text}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;
