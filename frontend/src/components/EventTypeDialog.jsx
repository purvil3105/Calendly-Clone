import { useEffect, useState } from "react";
import { eventTypesAPI } from "@/lib/api";
import { toast } from "sonner";
import { X } from "lucide-react";

export function EventTypeDialog({ isOpen, onClose, onSuccess, initialData }) {
  const isEditing = !!initialData;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    duration_min: "30",
    description: "",
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          name: initialData.name || "",
          slug: initialData.slug || "",
          duration_min: String(initialData.durationMin || 30),
          description: initialData.description || "",
        });
      } else {
        setFormData({
          name: "",
          slug: "",
          duration_min: "30",
          description: "",
        });
      }
    }
  }, [isOpen, initialData]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        duration_min: parseInt(formData.duration_min, 10),
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
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
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
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
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
