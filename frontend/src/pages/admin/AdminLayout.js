import { Outlet, NavLink, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/button";
import { 
  BookOpen, 
  LogOut, 
  Video,
  ImageIcon,
  FileImage,
  FileText,
  Home
} from "lucide-react";

const AdminLayout = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    { path: "/admin/videos", label: "Videos", icon: Video },
    { path: "/admin/gifs", label: "GIFs", icon: FileImage },
    { path: "/admin/images", label: "Images", icon: ImageIcon },
    { path: "/admin/pdfs", label: "PDFs", icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link to="/dashboard" className="w-10 h-10 rounded-xl bg-pacific-500 flex items-center justify-center text-white">
                <BookOpen size={22} />
              </Link>
              <div>
                <span className="font-heading font-bold text-xl text-slate-900">EduQuest</span>
                <span className="ml-2 px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-medium rounded">Admin</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600 hidden sm:block">{user?.email}</span>
              
              <Link to="/dashboard">
                <Button variant="outline" size="sm" className="gap-2">
                  <Home size={16} />
                  <span className="hidden sm:inline">Dashboard</span>
                </Button>
              </Link>

              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout}
                className="gap-2 text-slate-600 hover:text-red-600"
                data-testid="admin-logout-btn"
              >
                <LogOut size={16} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-64px)] hidden md:block">
          <nav className="p-4 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                data-testid={`admin-nav-${item.label.toLowerCase()}`}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-pacific-50 text-pacific-600 font-medium"
                      : "text-slate-600 hover:bg-slate-50"
                  }`
                }
              >
                <item.icon size={20} />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Mobile Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40">
          <nav className="flex justify-around p-2">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
                    isActive
                      ? "text-pacific-600"
                      : "text-slate-500"
                  }`
                }
              >
                <item.icon size={20} />
                <span className="text-xs">{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <main className="flex-1 p-6 pb-24 md:pb-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
