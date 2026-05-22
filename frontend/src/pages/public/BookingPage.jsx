import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DateTime } from "luxon";
import { Clock, Globe, Calendar as CalendarIcon, Video, CheckCircle2, ChevronLeft, ChevronRight, User } from "lucide-react";
import { publicAPI } from "@/lib/api";
import { TIMEZONE_OPTIONS, formatDateTimeDisplay } from "@/lib/time";
import { toast } from "sonner";

export default function BookingPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [eventType, setEventType] = useState(null);
  const [hostTimezone, setHostTimezone] = useState("");
  
  // State for the calendar and slots
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(DateTime.now().startOf("month"));
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [visitorTimezone, setVisitorTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );

  // Booking form state
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookingStep, setBookingStep] = useState(1); // 1: Calendar, 2: Form, 3: Success
  const [formData, setFormData] = useState({ name: "", email: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [bookedMeeting, setBookedMeeting] = useState(null);

  // 1. Fetch Event Details
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await publicAPI.getEventDetails(slug);
        setEventType(res.data.eventType);
        setHostTimezone(res.data.hostTimezone);
        setLoading(false);
      } catch (error) {
        toast.error("Event not found");
        setLoading(false);
      }
    };
    fetchEvent();
  }, [slug]);

  // 2. Fetch Slots when month changes
  useEffect(() => {
    if (!eventType) return;

    const fetchSlots = async () => {
      setLoadingSlots(true);
      try {
        const start = currentMonth.startOf('month').toISODate();
        const end = currentMonth.endOf('month').toISODate();
        
        const res = await publicAPI.getAvailableSlots(slug, start, end);
        setSlots(res.data);
      } catch (error) {
        console.error("Failed to load slots");
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [currentMonth, eventType, slug]);

  // Calculate available days for the calendar
  const availableDaysMap = useMemo(() => {
    const map = new Map();
    slots.forEach(slot => {
      const dt = DateTime.fromISO(slot.start).setZone(visitorTimezone);
      const dateStr = dt.toISODate();
      if (!map.has(dateStr)) map.set(dateStr, []);
      map.get(dateStr).push(slot);
    });
    return map;
  }, [slots, visitorTimezone]);

  // Render Calendar Grid
  const renderCalendar = () => {
    const startOfGrid = currentMonth.startOf('month').startOf('week').minus({ days: 1 }); // Sunday start
    const endOfGrid = currentMonth.endOf('month').endOf('week').minus({ days: 1 });
    
    const days = [];
    let curr = startOfGrid;
    while (curr <= endOfGrid) {
      days.push(curr);
      curr = curr.plus({ days: 1 });
    }

    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900">{currentMonth.toFormat('MMMM yyyy')}</h3>
          <div className="flex gap-2">
            <button 
              onClick={() => setCurrentMonth(m => m.minus({ months: 1 }))}
              disabled={currentMonth <= DateTime.now().startOf('month')}
              className="p-2 rounded-full hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <button 
              onClick={() => setCurrentMonth(m => m.plus({ months: 1 }))}
              className="p-2 rounded-full hover:bg-slate-100 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
            <div key={d} className="text-xs font-medium text-slate-500 py-2">{d}</div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, i) => {
            const isCurrentMonth = day.month === currentMonth.month;
            const dateStr = day.toISODate();
            const hasSlots = availableDaysMap.has(dateStr);
            const isSelected = selectedDate === dateStr;
            const isPast = day.startOf('day') < DateTime.now().setZone(visitorTimezone).startOf('day');

            return (
              <button
                key={i}
                disabled={!isCurrentMonth || !hasSlots || isPast}
                onClick={() => setSelectedDate(dateStr)}
                className={`
                  aspect-square rounded-full flex items-center justify-center text-sm transition-all
                  ${!isCurrentMonth || isPast ? 'text-slate-300 cursor-not-allowed' : ''}
                  ${isCurrentMonth && !hasSlots && !isPast ? 'text-slate-400 bg-slate-50 cursor-not-allowed' : ''}
                  ${isCurrentMonth && hasSlots && !isSelected ? 'bg-blue-50 text-blue-600 font-bold hover:bg-blue-100' : ''}
                  ${isSelected ? 'bg-blue-600 text-white font-bold shadow-md scale-105' : ''}
                `}
              >
                {day.day}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderTimeSlots = () => {
    if (!selectedDate) return null;
    const daySlots = availableDaysMap.get(selectedDate) || [];
    
    return (
      <div className="w-full md:w-64 pl-0 md:pl-6 pt-6 md:pt-0 mt-6 md:mt-0 border-t md:border-t-0 md:border-l border-slate-200">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center">
          {DateTime.fromISO(selectedDate).toFormat('cccc, LLL d')}
        </h3>
        
        <div className="flex flex-col gap-2 max-h-[300px] md:max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
          {daySlots.map((slot, i) => {
            const timeStr = DateTime.fromISO(slot.start).setZone(visitorTimezone).toFormat('h:mm a');
            return (
              <button
                key={i}
                onClick={() => {
                  setSelectedSlot(slot);
                  setBookingStep(2);
                }}
                className="w-full py-3 border border-blue-200 rounded-md text-blue-600 font-bold hover:border-blue-600 hover:bg-blue-50 transition-all text-sm"
              >
                {timeStr}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const handleBook = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const res = await publicAPI.bookMeeting(slug, {
        startAt: selectedSlot.start,
        inviteeName: formData.name,
        inviteeEmail: formData.email,
        inviteeTimezone: visitorTimezone,
        notes: formData.notes
      });
      
      setBookedMeeting(res.data);
      setBookingStep(3);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to book meeting. The slot might be taken.");
      if (error.response?.status === 409) {
        setBookingStep(1); // Go back if slot is taken
        setSelectedSlot(null);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center p-12">Loading...</div>;
  if (!eventType) return <div className="text-center p-12 text-slate-500">Event not found.</div>;

  // Render Success Screen
  if (bookingStep === 3) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden max-w-2xl mx-auto p-12 text-center">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 mb-2">You are scheduled</h2>
        <p className="text-slate-500 mb-8">
          A calendar invitation has been sent to your email address.
        </p>
        
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-left inline-block max-w-md w-full">
          <h3 className="font-bold text-lg text-slate-900 mb-4">{eventType.name}</h3>
          
          <div className="space-y-4">
            <div className="flex gap-3 text-slate-600">
              <User className="w-5 h-5 text-slate-400" />
              <div>
                <span className="font-medium text-slate-900">{formData.name}</span> and Demo User
              </div>
            </div>
            
            <div className="flex gap-3 text-slate-600">
              <CalendarIcon className="w-5 h-5 text-slate-400" />
              <div className="font-medium">
                {formatDateTimeDisplay(selectedSlot.start, visitorTimezone)}
              </div>
            </div>
            
            <div className="flex gap-3 text-slate-600">
              <Globe className="w-5 h-5 text-slate-400" />
              <div>{visitorTimezone}</div>
            </div>
            
            <div className="flex gap-3 text-slate-600">
              <Video className="w-5 h-5 text-slate-400" />
              <div>Web conferencing details to follow.</div>
            </div>
          </div>
        </div>
        
        <div className="mt-8">
          <button 
            onClick={() => window.location.reload()}
            className="text-blue-600 font-medium hover:underline"
          >
            Book another meeting
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col md:flex-row transition-all duration-300">
      {/* Left panel: Event Details */}
      <div className="w-full md:w-[35%] bg-slate-50/50 p-6 md:p-8 border-b md:border-b-0 md:border-r border-slate-200 relative">
        {bookingStep === 2 && (
          <button 
            onClick={() => setBookingStep(1)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 absolute top-4 left-4 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        
        <div className={`text-slate-500 font-medium text-sm mb-2 ${bookingStep === 2 ? 'mt-8' : ''}`}>Demo User</div>
        <h2 className="text-2xl font-bold text-slate-900 mb-6">{eventType.name}</h2>
        
        <div className="space-y-4 mb-6">
          <div className="flex items-start text-slate-600 font-medium">
            <Clock className="w-5 h-5 mr-3 text-slate-400 mt-0.5 shrink-0" />
            {eventType.durationMin} min
          </div>
          <div className="flex items-start text-slate-600 font-medium">
            <Video className="w-5 h-5 mr-3 text-slate-400 mt-0.5 shrink-0" />
            Web conferencing details provided upon confirmation.
          </div>
          
          {bookingStep === 2 && selectedSlot && (
            <div className="flex items-start text-blue-700 font-bold bg-blue-50 p-3 rounded-lg border border-blue-100">
              <CalendarIcon className="w-5 h-5 mr-3 text-blue-500 mt-0.5 shrink-0" />
              <div>
                {formatDateTimeDisplay(selectedSlot.start, visitorTimezone)}
              </div>
            </div>
          )}
        </div>

        {eventType.description && (
          <div className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap pt-4 border-t border-slate-200">
            {eventType.description}
          </div>
        )}
      </div>

      {/* Right panel: Dynamic Content (Calendar OR Form) */}
      <div className="flex-1 p-6 md:p-8">
        {bookingStep === 1 ? (
          <div className="animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Select a Date & Time</h2>
            <div className="flex flex-col md:flex-row">
              <div className="flex-1">
                {renderCalendar()}
                
                <div className="mt-8 flex items-center text-sm text-slate-600 font-medium">
                  <Globe className="w-4 h-4 mr-2 text-slate-400" />
                  Time zone:
                  <select 
                    value={visitorTimezone} 
                    onChange={(e) => setVisitorTimezone(e.target.value)}
                    className="ml-2 bg-transparent border-b border-slate-300 py-1 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    {TIMEZONE_OPTIONS.map(tz => (
                      <option key={tz.value} value={tz.value}>{tz.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {renderTimeSlots()}
            </div>
            
            {loadingSlots && (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center">
                Loading availability...
              </div>
            )}
          </div>
        ) : (
          <div className="animate-in slide-in-from-right-8 duration-300 max-w-md">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Enter Details</h2>
            
            <form onSubmit={handleBook} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1">Name *</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1">Email *</label>
                <input 
                  type="email" 
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1">Please share anything that will help prepare for our meeting.</label>
                <textarea 
                  rows={4}
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none" 
                />
              </div>
              
              <button 
                type="submit" 
                disabled={submitting}
                className="px-6 py-3 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {submitting ? "Scheduling..." : "Schedule Event"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
