import { useEffect, useState } from "react";
import { availabilityAPI } from "@/lib/api";
import { TIMEZONE_OPTIONS, getDayName } from "@/lib/time";
import { toast } from "sonner";
import { Globe, Save } from "lucide-react";

const DAYS = [0, 1, 2, 3, 4, 5, 6];

export default function AvailabilityPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  
  const [rules, setRules] = useState(
    DAYS.map((d) => ({ day_of_week: d, start_time: "09:00", end_time: "17:00", enabled: false }))
  );

  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        const res = await availabilityAPI.get();
        setTimezone(res.data.timezone);
        
        const newRules = DAYS.map((day) => {
          const existingRule = res.data.rules.find((r) => r.day_of_week === day);
          if (existingRule) {
            return {
              day_of_week: day,
              start_time: existingRule.start_time,
              end_time: existingRule.end_time,
              enabled: true,
            };
          }
          return { day_of_week: day, start_time: "09:00", end_time: "17:00", enabled: false };
        });
        
        setRules(newRules);
      } catch (error) {
        toast.error("Failed to load availability");
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, []);

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

      await availabilityAPI.update({
        timezone,
        rules: activeRules,
      });
      
      toast.success("Availability schedule saved!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save availability");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64">Loading...</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Availability</h1>
        <p className="text-slate-500">Configure the times when you are available for meetings.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Weekly Schedule</h3>
              <p className="text-sm text-slate-500">Set your recurring weekly availability.</p>
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
        </div>
        
        <div className="p-6">
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
        </div>
      </div>
    </div>
  );
}
