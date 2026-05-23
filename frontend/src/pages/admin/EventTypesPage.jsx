import { useEffect, useState } from "react";
import { Plus, Clock, Copy, Edit, Trash2, ExternalLink, Users } from "lucide-react";
import { eventTypesAPI } from "@/lib/api";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { EventTypeDialog } from "../../components/EventTypeDialog";
import Loader from "../../components/ui/Loader";

export default function EventTypesPage() {
  const [eventTypes, setEventTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  const fetchEventTypes = async () => {
    try {
      setLoading(true);
      const res = await eventTypesAPI.getAll();
      setEventTypes(res.data);
    } catch (error) {
      toast.error("Failed to load event types");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventTypes();
  }, []);

  const handleCreateNew = () => {
    setEditingEvent(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (event) => {
    setEditingEvent(event);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this event type? This cannot be undone.")) return;
    
    try {
      await eventTypesAPI.delete(id);
      toast.success("Event type deleted");
      fetchEventTypes();
    } catch (error) {
      toast.error("Failed to delete event type");
    }
  };

  const copyLink = (slug) => {
    const url = `${window.location.origin}/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard!");
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Event Types</h1>
          <p className="text-slate-500">Create and manage your meeting types and availability.</p>
        </div>
        <button 
          onClick={handleCreateNew}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium text-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Event Type
        </button>
      </div>

      {eventTypes.length === 0 ? (
        <div className="border border-dashed border-slate-300 rounded-xl bg-slate-50 p-12 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
            <Plus className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-1">No event types yet</h3>
          <p className="text-slate-500 mb-4 max-w-sm">Create your first event type to start allowing people to book time with you.</p>
          <button 
            onClick={handleCreateNew}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Create Event Type
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {eventTypes.map((event) => (
            <div key={event.id} className="flex flex-col bg-white border border-slate-200 border-l-[6px] border-l-purple-500 rounded-xl shadow-sm hover:border-slate-300 transition-colors overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="text-lg font-semibold text-slate-900">{event.name}</h3>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(event)} className="text-slate-400 hover:text-blue-600">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(event.id)} className="text-slate-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="text-sm text-slate-500 font-mono mb-4">/{event.slug}</div>
                
                <div className="flex gap-4">
                  <div className="flex items-center text-slate-600 font-medium text-sm">
                    <Clock className="w-4 h-4 mr-2 text-slate-400" />
                    {event.durationMin} mins
                  </div>
                  {event.capacity > 1 && (
                    <div className="flex items-center text-slate-600 font-medium text-sm">
                      <Users className="w-4 h-4 mr-2 text-slate-400" />
                      Group: {event.capacity} max
                    </div>
                  )}
                  {(!event.capacity || event.capacity === 1) && (
                    <div className="flex items-center text-slate-600 font-medium text-sm">
                      <Users className="w-4 h-4 mr-2 text-slate-400" />
                      1-on-1
                    </div>
                  )}
                </div>
                {event.description && (
                  <p className="text-sm text-slate-500 line-clamp-2 mt-3">{event.description}</p>
                )}
              </div>
              
              <div className="px-6 py-4 bg-slate-50 flex justify-between gap-3 border-t border-slate-100">
                <button 
                  onClick={() => copyLink(event.slug)}
                  className="flex-1 flex items-center justify-center px-3 py-2 border border-slate-200 rounded-md bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors"
                >
                  <Copy className="w-4 h-4 mr-2" /> Copy Link
                </button>
                <Link 
                  to={`/${event.slug}`} 
                  className="flex items-center justify-center px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md text-sm font-medium transition-colors"
                >
                  View <ExternalLink className="w-3 h-3 ml-2" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {isDialogOpen && (
        <EventTypeDialog 
          isOpen={isDialogOpen} 
          onClose={() => setIsDialogOpen(false)} 
          onSuccess={fetchEventTypes}
          initialData={editingEvent}
        />
      )}
    </div>
  );
}
