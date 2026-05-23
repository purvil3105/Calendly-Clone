import { useEffect, useState } from "react";
import { formatDateTimeDisplay } from "@/lib/time";
import { meetingsAPI } from "@/lib/api";
import Loader from "../../components/ui/Loader";
import { toast } from "sonner";
import { CalendarX2, Users, Clock, AlignLeft } from "lucide-react";

export default function MeetingsPage() {
  const [upcoming, setUpcoming] = useState([]);
  const [past, setPast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [activeTab, setActiveTab] = useState("upcoming");

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const [upcomingRes, pastRes] = await Promise.all([
        meetingsAPI.getAll("upcoming"),
        meetingsAPI.getAll("past"),
      ]);
      setUpcoming(upcomingRes.data);
      setPast(pastRes.data);
    } catch (error) {
      toast.error("Failed to load meetings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  const handleCancel = async (id) => {
    if (!confirm("Are you sure you want to cancel this meeting?")) return;
    
    setCancellingId(id);
    try {
      await meetingsAPI.cancel(id);
      toast.success("Meeting cancelled successfully");
      fetchMeetings();
    } catch (error) {
      toast.error("Failed to cancel meeting");
    } finally {
      setCancellingId(null);
    }
  };

  const getLocalTimezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

  const MeetingCard = ({ meeting, isPast = false }) => {
    const isCancelled = meeting.status === "cancelled";
    const tz = getLocalTimezone();
    const [datePart, timePart] = formatDateTimeDisplay(meeting.startAt, tz).split('·');
    const endTimePart = formatDateTimeDisplay(meeting.endAt, tz).split('·')[1].trim();
    
    return (
      <div className={`mb-4 overflow-hidden bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col md:flex-row ${isCancelled ? "opacity-75 bg-slate-50" : ""}`}>
        {/* Left colored bar & date area */}
        <div className={`p-6 flex flex-col justify-center items-start md:w-64 border-b md:border-b-0 md:border-r border-slate-100 ${
          isCancelled ? "bg-red-50/50" : isPast ? "bg-slate-50" : "bg-blue-50/50"
        }`}>
          <div className="text-sm font-semibold text-slate-500 mb-1">
            {datePart.trim()}
          </div>
          <div className="text-lg font-bold text-slate-900">
            {timePart.trim()} - {endTimePart}
          </div>
          {isCancelled && (
            <span className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
              Cancelled
            </span>
          )}
        </div>
        
        {/* Right details area */}
        <div className="p-6 flex-1 flex flex-col sm:flex-row justify-between gap-4">
          <div className="space-y-3 flex-1">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-900">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              {meeting.eventType.name}
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-400" />
                <span className="font-medium text-slate-900">{meeting.inviteeName}</span>
              </div>
              <div className="flex items-center gap-2">
                <a href={`mailto:${meeting.inviteeEmail}`} className="text-blue-600 hover:underline">
                  {meeting.inviteeEmail}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>{meeting.eventType.durationMin} minutes</span>
              </div>
            </div>

            {meeting.notes && (
              <div className="mt-4 bg-slate-50 p-3 rounded-md border border-slate-100 text-sm flex gap-3 items-start">
                <AlignLeft className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <p className="text-slate-700">{meeting.notes}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          {!isPast && !isCancelled && (
            <div className="flex flex-col justify-start gap-2">
              <a 
                href={`/reschedule/${meeting.id}`}
                target="_blank"
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 text-sm font-medium transition-colors text-center"
              >
                Reschedule
              </a>
              <button 
                onClick={() => handleCancel(meeting.id)}
                disabled={cancellingId === meeting.id}
                className="px-4 py-2 border border-red-200 text-red-600 rounded-md hover:bg-red-50 text-sm font-medium transition-colors disabled:opacity-50"
              >
                {cancellingId === meeting.id ? "Cancelling..." : "Cancel"}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Meetings</h1>
        <p className="text-slate-500">View your upcoming and past bookings.</p>
      </div>

      <div className="w-full">
        <div className="flex border-b border-slate-200 mb-6 gap-6">
          <button 
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "upcoming" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
            onClick={() => setActiveTab("upcoming")}
          >
            Upcoming ({upcoming.filter(m => m.status !== 'cancelled').length})
          </button>
          <button 
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "past" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
            onClick={() => setActiveTab("past")}
          >
            Past & Cancelled
          </button>
        </div>
        
        {activeTab === "upcoming" && (
          <div className="space-y-4">
            {upcoming.length === 0 ? (
              <EmptyState message="You have no upcoming meetings." />
            ) : (
              upcoming.map((meeting) => (
                <MeetingCard key={meeting.id} meeting={meeting} />
              ))
            )}
          </div>
        )}
        
        {activeTab === "past" && (
          <div className="space-y-4">
            {past.length === 0 ? (
              <EmptyState message="You have no past meetings." />
            ) : (
              past.map((meeting) => (
                <MeetingCard key={meeting.id} meeting={meeting} isPast={true} />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="border border-dashed border-slate-300 rounded-xl bg-slate-50 p-12 flex flex-col items-center justify-center text-center">
      <div className="w-12 h-12 bg-slate-200 text-slate-500 rounded-full flex items-center justify-center mb-4">
        <CalendarX2 className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-medium text-slate-900 mb-1">No meetings</h3>
      <p className="text-slate-500">{message}</p>
    </div>
  );
}
