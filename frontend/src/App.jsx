import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";

// Admin Layout & Pages
import AdminLayout from "./layouts/AdminLayout";
import EventTypesPage from "./pages/admin/EventTypesPage";
import AvailabilityPage from "./pages/admin/AvailabilityPage";
import MeetingsPage from "./pages/admin/MeetingsPage";

// Public Layout & Pages
import PublicLayout from "./pages/public/PublicLayout";
import BookingPage from "./pages/public/BookingPage";

export default function App() {
  return (
    <>
      <Toaster position="top-center" />
      <BrowserRouter>
        <Routes>
          {/* Admin Routes */}
          <Route path="/" element={<AdminLayout />}>
            <Route index element={<Navigate to="/event-types" replace />} />
            <Route path="event-types" element={<EventTypesPage />} />
            <Route path="availability" element={<AvailabilityPage />} />
            <Route path="meetings" element={<MeetingsPage />} />
          </Route>

          {/* Public Booking Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/:slug" element={<BookingPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}
