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

  const groupMeetings = (meetingsList) => {
    const groupsMap = new Map();
    meetingsList.forEach(m => {
      const key = `${m.eventTypeId}_${new Date(m.startAt).getTime()}`;
      if (!groupsMap.has(key)) {
        groupsMap.set(key, {
          id: key,
          eventTypeId: m.eventTypeId,
          eventType: m.eventType,
          startAt: m.startAt,
          endAt: m.endAt,
          attendees: []
        });
      }
      groupsMap.get(key).attendees.push({
        id: m.id,
        name: m.inviteeName,
        email: m.inviteeEmail,
        notes: m.notes,
        status: m.status
      });
    });
    return Array.from(groupsMap.values());
  };

  const MeetingCard = ({ group, isPast = false }) => {
    const isCancelled = group.attendees.every(a => a.status === "cancelled");
    const tz = getLocalTimezone();
    const [datePart, timePart] = formatDateTimeDisplay(group.startAt, tz).split('·');
    const endTimePart = formatDateTimeDisplay(group.endAt, tz).split('·')[1].trim();
    
    return (
      <div className={`mb-4 overflow-hidden bg-white border border-slate-200 border-l-[6px] rounded-xl shadow-sm flex flex-col md:flex-row ${isCancelled ? "opacity-75 bg-slate-50 border-l-red-500" : "border-l-purple-500"}`}>
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
        
        <div className="p-6 flex-1 flex flex-col gap-4">
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-900">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                {group.eventType.name}
              </h3>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>{group.eventType.durationMin} mins</span>
              </div>
            </div>
            
            <div className="mt-4 space-y-3">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {group.attendees.length} {group.attendees.length === 1 ? 'Invitee' : 'Invitees'}
              </div>
              
              {group.attendees.map(attendee => (
                <div key={attendee.id} className={`p-4 rounded-lg border ${attendee.status === 'cancelled' ? 'bg-red-50/30 border-red-100' : 'bg-slate-50 border-slate-100'} flex flex-col sm:flex-row justify-between gap-4`}>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-slate-400" />
                      <span className={`font-medium ${attendee.status === 'cancelled' ? 'text-slate-500 line-through' : 'text-slate-900'}`}>{attendee.name}</span>
                      {attendee.status === 'cancelled' && (
                        <span className="ml-2 text-xs font-medium text-red-600 border border-red-200 bg-white px-2 py-0.5 rounded-full">Cancelled</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <a href={`mailto:${attendee.email}`} className="text-blue-600 hover:underline text-sm">
                        {attendee.email}
                      </a>
                    </div>
                    {attendee.notes && (
                      <div className="mt-2 text-sm flex gap-2 items-start text-slate-600">
                        <AlignLeft className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                        <p>{attendee.notes}</p>
                      </div>
                    )}
                  </div>
                  
                  {!isPast && attendee.status !== 'cancelled' && (
                    <div className="flex sm:flex-col justify-start sm:justify-center gap-2 shrink-0">
                      <a 
                        href={`/reschedule/${attendee.id}`}
                        target="_blank"
                        className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded-md hover:bg-white text-xs font-medium transition-colors text-center bg-transparent"
                      >
                        Reschedule
                      </a>
                      <button 
                        onClick={() => handleCancel(attendee.id)}
                        disabled={cancellingId === attendee.id}
                        className="px-3 py-1.5 border border-red-200 text-red-600 rounded-md hover:bg-white text-xs font-medium transition-colors disabled:opacity-50 bg-transparent"
                      >
                        {cancellingId === attendee.id ? "Cancelling..." : "Cancel"}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
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
              groupMeetings(upcoming).map((group) => (
                <MeetingCard key={group.id} group={group} />
              ))
            )}
          </div>
        )}
        
        {activeTab === "past" && (
          <div className="space-y-4">
            {past.length === 0 ? (
              <EmptyState message="You have no past meetings." />
            ) : (
              groupMeetings(past).map((group) => (
                <MeetingCard key={group.id} group={group} isPast={true} />
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
