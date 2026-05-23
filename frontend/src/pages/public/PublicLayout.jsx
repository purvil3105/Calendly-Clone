import { Outlet } from "react-router-dom";

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center gap-2 mb-2">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
              C
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Calendly Clone</h1>
          </div>
          <p className="text-slate-500">Book a meeting with Purvil Patel</p>
        </div>
        
        <Outlet />
        
        <div className="text-center mt-8 text-slate-400 text-sm">
          Powered by Calendly Clone
        </div>
      </div>
    </div>
  );
}
