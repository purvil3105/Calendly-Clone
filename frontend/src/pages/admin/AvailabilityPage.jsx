import { useEffect, useState } from "react";
import { availabilityAPI } from "@/lib/api";
import { TIMEZONE_OPTIONS, getDayName } from "@/lib/time";
import { toast } from "sonner";
import { Plus, Trash2, Globe, Clock, Check, Calendar as CalendarIcon, ExternalLink, Settings } from "lucide-react";
import Loader from "../../components/ui/Loader";

const DAYS = [0, 1, 2, 3, 4, 5, 6];
const defaultRules = DAYS.map((d) => ({ day_of_week: d, start_time: "09:00", end_time: "17:00", enabled: false }));

export default function AvailabilityPage() {
  const [schedules, setSchedules] = useState([]);
  const [activeScheduleId, setActiveScheduleId] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Active schedule state
  const [name, setName] = useState("");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [rules, setRules] = useState(defaultRules);

  // Date overrides state
  const [overrides, setOverrides] = useState([]);
  const [showOverrideForm, setShowOverrideForm] = useState(false);
  const [overrideDate, setOverrideDate] = useState("");
  const [overrideType, setOverrideType] = useState("unavailable"); // "unavailable" or "custom"
  const [overrideStart, setOverrideStart] = useState("09:00");
  const [overrideEnd, setOverrideEnd] = useState("17:00");

  // Tab state
  const [activeTab, setActiveTab] = useState("weekly"); // "weekly" or "overrides"

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const res = await availabilityAPI.get();
      const data = res.data;
      setSchedules(data);
      
      if (data.length > 0) {
        if (!activeScheduleId || !data.find(s => s.id === activeScheduleId)) {
          selectSchedule(data[0]);
        } else {
          selectSchedule(data.find(s => s.id === activeScheduleId));
        }
      } else {
        setActiveScheduleId(null);
      }
    } catch (error) {
      toast.error("Failed to load schedules");
    } finally {
      setLoading(false);
    }
  };

  const fetchOverrides = async (scheduleId) => {
    try {
      const res = await availabilityAPI.getOverrides(scheduleId);
      setOverrides(res.data);
    } catch (error) {
      console.error("Failed to load overrides", error);
      setOverrides([]);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const selectSchedule = (schedule) => {
    setActiveScheduleId(schedule.id);
    setName(schedule.name);
    setTimezone(schedule.timezone);
    
    const newRules = DAYS.map((day) => {
      const existingRule = schedule.availabilityRules?.find((r) => r.dayOfWeek === day);
      if (existingRule) {
        return {
          day_of_week: day,
          start_time: existingRule.startTime,
          end_time: existingRule.endTime,
          enabled: true,
        };
      }
      return { day_of_week: day, start_time: "09:00", end_time: "17:00", enabled: false };
    });
    setRules(newRules);
    fetchOverrides(schedule.id);
  };

  const handleCreateNew = async () => {
    const newName = prompt("Enter a name for the new schedule:");
    if (!newName) return;
    
    try {
      setSaving(true);
      const res = await availabilityAPI.create({ name: newName, timezone: "Asia/Kolkata" });
      toast.success("Schedule created");
      setActiveScheduleId(res.data.id);
      await fetchSchedules();
    } catch (error) {
      toast.error("Failed to create schedule");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (schedules.length === 1) {
      return toast.error("You must have at least one schedule.");
    }
    if (!confirm("Are you sure you want to delete this schedule?")) return;
    
    try {
      await availabilityAPI.delete(id);
      toast.success("Schedule deleted");
      await fetchSchedules();
    } catch (error) {
      toast.error("Failed to delete schedule");
    }
  };

  const handleToggleDay = (dayIndex, enabled) => {
    const newRules = [...rules];
    newRules[dayIndex].enabled = enabled;
    setRules(newRules);
  };

  const handleTimeChange = (dayIndex, field, value) => {
    const newRules = [...rules];
    newRules[dayIndex][field] = value;
    setRules(newRules);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const activeRules = rules
        .filter((r) => r.enabled)
        .map((r) => ({
          day_of_week: r.day_of_week,
          start_time: r.start_time,
          end_time: r.end_time,
        }));

      await availabilityAPI.update(activeScheduleId, {
        name,
        timezone,
        rules: activeRules,
      });
      
      toast.success("Availability schedule saved!");
      await fetchSchedules();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save availability");
    } finally {
      setSaving(false);
    }
  };

  // ─── Override Handlers ──────────────────────────────────
  const handleAddOverride = async () => {
    if (!overrideDate) {
      return toast.error("Please select a date.");
    }
    
    try {
      const payload = {
        date: overrideDate,
        startTime: overrideType === "custom" ? overrideStart : null,
        endTime: overrideType === "custom" ? overrideEnd : null,
      };
      
      await availabilityAPI.upsertOverride(activeScheduleId, payload);
      toast.success(overrideType === "unavailable" ? "Day blocked" : "Custom hours set");
      setShowOverrideForm(false);
      setOverrideDate("");
      setOverrideType("unavailable");
      setOverrideStart("09:00");
      setOverrideEnd("17:00");
      await fetchOverrides(activeScheduleId);
    } catch (error) {
      toast.error("Failed to save override");
    }
  };

  const handleDeleteOverride = async (overrideId) => {
    try {
      await availabilityAPI.deleteOverride(activeScheduleId, overrideId);
      toast.success("Override removed");
      await fetchOverrides(activeScheduleId);
    } catch (error) {
      toast.error("Failed to delete override");
    }
  };

  const formatOverrideDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Availability</h1>
          <p className="text-slate-500">Configure the times when you are available for meetings.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Left Sidebar for Schedules */}
        <div className="w-full md:w-64 flex flex-col gap-2">
          <div className="flex items-center justify-between px-2 mb-2">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Schedules</h3>
            <button onClick={handleCreateNew} className="text-blue-600 hover:text-blue-800 p-1 rounded-md hover:bg-blue-50">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          {schedules.map((schedule) => (
            <div 
              key={schedule.id}
              onClick={() => selectSchedule(schedule)}
              className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors border ${
                activeScheduleId === schedule.id 
                  ? "bg-blue-50 border-blue-200" 
                  : "bg-white border-slate-200 hover:border-blue-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <CalendarDays className={`w-5 h-5 ${activeScheduleId === schedule.id ? "text-blue-600" : "text-slate-400"}`} />
                <div>
                  <div className={`font-medium text-sm ${activeScheduleId === schedule.id ? "text-blue-900" : "text-slate-700"}`}>
                    {schedule.name}
                  </div>
                  <div className="text-xs text-slate-500">{schedule.timezone}</div>
                </div>
              </div>
              
              {activeScheduleId === schedule.id && schedules.length > 1 && (
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDelete(schedule.id); }}
                  className="text-slate-400 hover:text-red-600 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Right Content Area */}
        <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          {activeScheduleId ? (
            <>
              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex-1">
                    <input 
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="text-lg font-semibold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none transition-colors w-full sm:w-auto px-1"
                    />
                    <p className="text-sm text-slate-500 mt-1 px-1">Manage your weekly hours and date-specific overrides.</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-slate-500" />
                    <select 
                      value={timezone} 
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-[220px] p-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {TIMEZONE_OPTIONS.map((tz) => (
                        <option key={tz.value} value={tz.value}>
                          {tz.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mt-4 bg-slate-100 rounded-lg p-1 w-fit">
                  <button
                    onClick={() => setActiveTab("weekly")}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === "weekly"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    Weekly Hours
                  </button>
                  <button
                    onClick={() => setActiveTab("overrides")}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === "overrides"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    Date Overrides
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                {/* ─── Weekly Hours Tab ─── */}
                {activeTab === "weekly" && (
                  <>
                    <div className="space-y-6">
                      {rules.map((rule, idx) => (
                        <div key={rule.day_of_week} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 py-2 border-b border-slate-100 last:border-0 pb-4 last:pb-0">
                          
                          <div className="flex items-center gap-4 w-40">
                            <input 
                              type="checkbox"
                              checked={rule.enabled} 
                              onChange={(e) => handleToggleDay(idx, e.target.checked)}
                              className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                            />
                            <label className={`text-base ${rule.enabled ? "font-medium text-slate-900" : "text-slate-400"}`}>
                              {getDayName(rule.day_of_week)}
                            </label>
                          </div>

                          <div className="flex-1 flex items-center gap-2">
                            {rule.enabled ? (
                              <div className="flex items-center gap-3">
                                <input 
                                  type="time" 
                                  value={rule.start_time}
                                  onChange={(e) => handleTimeChange(idx, "start_time", e.target.value)}
                                  className="w-32 p-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <span className="text-slate-400">-</span>
                                <input 
                                  type="time" 
                                  value={rule.end_time}
                                  onChange={(e) => handleTimeChange(idx, "end_time", e.target.value)}
                                  className="w-32 p-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-sm">Unavailable</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                      <button 
                        onClick={handleSave} 
                        disabled={saving} 
                        className="flex items-center px-6 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                      >
                        {saving ? "Saving..." : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Save Schedule
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}

                {/* ─── Date Overrides Tab ─── */}
                {activeTab === "overrides" && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-semibold text-slate-900">Date-Specific Hours</h3>
                        <p className="text-sm text-slate-500 mt-1">Override your availability for specific dates. Block days off or set custom hours.</p>
                      </div>
                      <button 
                        onClick={() => setShowOverrideForm(!showOverrideForm)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        <Plus className="w-4 h-4" />
                        Add Override
                      </button>
                    </div>

                    {/* Add Override Form */}
                    {showOverrideForm && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 space-y-4">
                        <div className="flex flex-col sm:flex-row gap-4">
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                            <input
                              type="date"
                              value={overrideDate}
                              onChange={(e) => setOverrideDate(e.target.value)}
                              min={new Date().toISOString().split('T')[0]}
                              className="w-full p-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                            <select
                              value={overrideType}
                              onChange={(e) => setOverrideType(e.target.value)}
                              className="w-full p-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="unavailable">Block entire day (unavailable)</option>
                              <option value="custom">Set custom hours</option>
                            </select>
                          </div>
                        </div>

                        {overrideType === "custom" && (
                          <div className="flex items-center gap-3">
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Start Time</label>
                              <input
                                type="time"
                                value={overrideStart}
                                onChange={(e) => setOverrideStart(e.target.value)}
                                className="w-32 p-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <span className="text-slate-400 mt-6">-</span>
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">End Time</label>
                              <input
                                type="time"
                                value={overrideEnd}
                                onChange={(e) => setOverrideEnd(e.target.value)}
                                className="w-32 p-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={handleAddOverride}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                          >
                            Save Override
                          </button>
                          <button
                            onClick={() => setShowOverrideForm(false)}
                            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Overrides List */}
                    {overrides.length === 0 ? (
                      <div className="text-center py-12 text-slate-400">
                        <CalendarOff className="w-10 h-10 mx-auto mb-3 opacity-40" />
                        <p className="text-sm">No date overrides set yet.</p>
                        <p className="text-xs mt-1">Add overrides to block days or set custom hours for specific dates.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {overrides.map((ov) => (
                          <div key={ov.id} className="flex items-center justify-between py-3">
                            <div className="flex items-center gap-3">
                              {ov.startTime ? (
                                <CalendarClock className="w-5 h-5 text-amber-500" />
                              ) : (
                                <CalendarOff className="w-5 h-5 text-red-400" />
                              )}
                              <div>
                                <div className="font-medium text-sm text-slate-900">
                                  {formatOverrideDate(ov.date)}
                                </div>
                                <div className="text-xs text-slate-500">
                                  {ov.startTime && ov.endTime
                                    ? `Custom hours: ${ov.startTime} – ${ov.endTime}`
                                    : "Unavailable (blocked)"}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeleteOverride(ov.id)}
                              className="text-slate-400 hover:text-red-600 p-1 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-slate-500">
              Select or create a schedule to edit its rules.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
