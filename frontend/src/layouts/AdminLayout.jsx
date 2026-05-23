import { useState } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { Calendar, Clock, Link as LinkIcon, Menu, ChevronDown, User, Star, Link2, Settings, FileText, HelpCircle, ExternalLink, LogOut } from "lucide-react";

const navItems = [
  { name: "Event Types", href: "/event-types", icon: LinkIcon },
  { name: "Meetings", href: "/meetings", icon: Calendar },
  { name: "Availability", href: "/availability", icon: Clock },
];

export default function AdminLayout() {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <div className="min-h-screen flex w-full">
      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center h-16 px-6 border-b border-slate-200">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-blue-600">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white">
              C
            </div>
            Calendly Clone
          </Link>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? "text-blue-700" : "text-slate-400"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 md:px-8">
          <button
            className="md:hidden mr-2 p-2 rounded-md hover:bg-slate-100"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3 relative">
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 hover:bg-slate-100 p-1.5 rounded-md transition-colors"
            >
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-sm">
                P
              </div>
              <ChevronDown className="w-4 h-4 text-slate-500" />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden z-50">
                <div className="p-4 border-b border-slate-100">
                  <p className="font-bold text-slate-900">Purvil Patel</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-sm text-slate-500">Teams free trial</p>
                    <button className="text-sm text-blue-600 font-medium hover:underline">Upgrade</button>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">14 days left</p>
                </div>
                
                <div className="py-2">
                  <div className="px-4 py-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">Account settings</div>
                  <button className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"><User className="w-4 h-4" /> Profile</button>
                  <button className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"><Star className="w-4 h-4" /> Branding</button>
                  <button className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"><Link2 className="w-4 h-4" /> My Link</button>
                  <button className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"><Settings className="w-4 h-4" /> All settings</button>
                </div>

                <div className="py-2 border-t border-slate-100">
                  <div className="px-4 py-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">Resources</div>
                  <button className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"><FileText className="w-4 h-4" /> Getting started guide</button>
                  <button className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"><HelpCircle className="w-4 h-4" /> Community</button>
                </div>
                
                <div className="py-2 border-t border-slate-100">
                  <a href="https://calendly.com" target="_blank" rel="noreferrer" className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"><ExternalLink className="w-4 h-4" /> Visit calendly.com</a>
                  <button className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"><LogOut className="w-4 h-4" /> Logout</button>
                </div>
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
