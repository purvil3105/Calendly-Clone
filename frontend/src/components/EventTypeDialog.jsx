import { useEffect, useState } from "react";
import { eventTypesAPI, availabilityAPI } from "@/lib/api";
import { toast } from "sonner";
import { X, CalendarDays } from "lucide-react";

export function EventTypeDialog({ isOpen, onClose, onSuccess, initialData }) {
  const isEditing = !!initialData;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    duration_min: "30",
    description: "",
    schedule_id: "",
    buffer_before: "0",
    buffer_after: "0",
    custom_questions: [],
  });
  
  const [schedules, setSchedules] = useState([]);

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const res = await availabilityAPI.get();
        setSchedules(res.data);
      } catch (err) {
        toast.error("Failed to load schedules");
      }
    };
    if (isOpen) fetchSchedules();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          name: initialData.name || "",
          slug: initialData.slug || "",
          duration_min: String(initialData.durationMin || 30),
          description: initialData.description || "",
          schedule_id: initialData.scheduleId || "",
          buffer_before: String(initialData.bufferBefore || 0),
          buffer_after: String(initialData.bufferAfter || 0),
          custom_questions: initialData.customQuestions || [],
        });
      } else {
        setFormData({
          name: "",
          slug: "",
          duration_min: "30",
          description: "",
          schedule_id: "",
          buffer_before: "0",
          buffer_after: "0",
          custom_questions: [],
        });
      }
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    if (isOpen && schedules.length > 0 && !formData.schedule_id) {
      setFormData(prev => ({ ...prev, schedule_id: schedules[0].id }));
    }
  }, [isOpen, schedules, formData.schedule_id]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "name" && !isEditing) {
        updated.slug = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      }
      return updated;
    });
  };

  const addCustomQuestion = () => {
    setFormData(prev => ({
      ...prev,
      custom_questions: [
        ...prev.custom_questions,
        { id: Math.random().toString(36).substring(7), label: "", type: "text", required: false }
      ]
    }));
  };

  const updateCustomQuestion = (index, field, value) => {
    setFormData(prev => {
      const newQuestions = [...prev.custom_questions];
      newQuestions[index] = { ...newQuestions[index], [field]: value };
      return { ...prev, custom_questions: newQuestions };
    });
  };

  const removeCustomQuestion = (index) => {
    setFormData(prev => {
      const newQuestions = [...prev.custom_questions];
      newQuestions.splice(index, 1);
      return { ...prev, custom_questions: newQuestions };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        duration_min: parseInt(formData.duration_min, 10),
        buffer_before: parseInt(formData.buffer_before, 10) || 0,
        buffer_after: parseInt(formData.buffer_after, 10) || 0,
      };

      if (isEditing) {
        await eventTypesAPI.update(initialData.id, payload);
        toast.success("Event type updated successfully");
      } else {
        await eventTypesAPI.create(payload);
        toast.success("Event type created successfully");
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 shrink-0">
          <h2 className="text-lg font-semibold text-slate-900">
            {isEditing ? "Edit Event Type" : "Add Event Type"}
          </h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded-full p-1 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
            <div className="space-y-1.5">
            <label htmlFor="name" className="text-sm font-medium text-slate-900">Event Name</label>
            <input 
              id="name" 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              placeholder="e.g. 30 Minute Meeting" 
              required 
              className="w-full p-2.5 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="space-y-1.5">
            <label htmlFor="slug" className="text-sm font-medium text-slate-900">URL Slug</label>
            <input 
              id="slug" 
              name="slug" 
              value={formData.slug} 
              onChange={handleChange} 
              placeholder="e.g. 30min" 
              required 
              pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
              title="Lowercase alphanumeric with dashes"
              className="w-full p-2.5 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="duration" className="text-sm font-medium text-slate-900">Duration</label>
            <select 
              id="duration"
              name="duration_min"
              value={formData.duration_min} 
              onChange={handleChange}
              className="w-full p-2.5 border border-slate-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="45">45 minutes</option>
              <option value="60">60 minutes</option>
              <option value="90">90 minutes</option>
              <option value="120">2 hours</option>
            </select>
          </div>

          <div className="flex gap-4">
            <div className="space-y-1.5 flex-1">
              <label htmlFor="buffer_before" className="text-sm font-medium text-slate-900">Buffer Before</label>
              <select 
                id="buffer_before"
                name="buffer_before"
                value={formData.buffer_before} 
                onChange={handleChange}
                className="w-full p-2.5 border border-slate-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="0">0 minutes</option>
                <option value="5">5 minutes</option>
                <option value="10">10 minutes</option>
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">60 minutes</option>
              </select>
            </div>
            <div className="space-y-1.5 flex-1">
              <label htmlFor="buffer_after" className="text-sm font-medium text-slate-900">Buffer After</label>
              <select 
                id="buffer_after"
                name="buffer_after"
                value={formData.buffer_after} 
                onChange={handleChange}
                className="w-full p-2.5 border border-slate-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="0">0 minutes</option>
                <option value="5">5 minutes</option>
                <option value="10">10 minutes</option>
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">60 minutes</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="schedule_id" className="text-sm font-medium text-slate-900 flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-slate-500" />
              Assigned Schedule
            </label>
            <select 
              id="schedule_id"
              name="schedule_id"
              value={formData.schedule_id} 
              onChange={handleChange}
              required
              className="w-full p-2.5 border border-slate-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" disabled>Select a schedule...</option>
              {schedules.map(schedule => (
                <option key={schedule.id} value={schedule.id}>
                  {schedule.name} ({schedule.timezone})
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500 mt-1">This event type will use the availability rules from this schedule.</p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="description" className="text-sm font-medium text-slate-900">Description / Instructions</label>
            <textarea 
              id="description" 
              name="description" 
              value={formData.description} 
              onChange={handleChange} 
              placeholder="Write a summary and any details your invitee should know about the meeting."
              rows={4}
              className="w-full p-2.5 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-slate-900">Custom Questions</label>
              <button 
                type="button" 
                onClick={addCustomQuestion}
                className="text-xs text-blue-600 font-medium hover:text-blue-800"
              >
                + Add Question
              </button>
            </div>
            
            {formData.custom_questions.map((q, idx) => (
              <div key={q.id} className="bg-slate-50 p-3 rounded-md border border-slate-200 space-y-2">
                <div className="flex justify-between gap-2">
                  <input 
                    type="text" 
                    placeholder="Question label (e.g. Phone Number)" 
                    value={q.label}
                    onChange={(e) => updateCustomQuestion(idx, 'label', e.target.value)}
                    className="flex-1 p-2 text-sm border border-slate-300 rounded-md"
                    required
                  />
                  <button type="button" onClick={() => removeCustomQuestion(idx)} className="text-red-500 hover:text-red-700">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex gap-4 items-center">
                  <select 
                    value={q.type}
                    onChange={(e) => updateCustomQuestion(idx, 'type', e.target.value)}
                    className="p-1.5 text-sm border border-slate-300 rounded-md"
                  >
                    <option value="text">Single Line</option>
                    <option value="textarea">Multiple Lines</option>
                  </select>
                  <label className="flex items-center gap-1.5 text-sm text-slate-700">
                    <input 
                      type="checkbox" 
                      checked={q.required}
                      onChange={(e) => updateCustomQuestion(idx, 'required', e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    Required
                  </label>
                </div>
              </div>
            ))}
            {formData.custom_questions.length === 0 && (
              <p className="text-xs text-slate-500">Ask invitees for extra information when they book.</p>
            )}
          </div>
          </div>

          <div className="flex justify-end gap-3 p-6 border-t border-slate-100 bg-slate-50 shrink-0">
            <button 
              type="button" 
              onClick={onClose} 
              disabled={loading}
              className="px-4 py-2 border border-slate-300 text-slate-700 bg-white rounded-md hover:bg-slate-50 transition-colors font-medium text-sm disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium text-sm disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
