import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { 
  BookOpen, 
  LogOut, 
  Settings, 
  GraduationCap,
  Sparkles
} from "lucide-react";

const CLASS_COLORS = [
  "bg-red-500",
  "bg-orange-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-teal-500",
  "bg-sky-500",
  "bg-indigo-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-rose-500"
];

const CLASS_ICONS = [
  "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"
];

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();

  const classes = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    name: `Class ${i + 1}`,
    color: CLASS_COLORS[i],
    icon: CLASS_ICONS[i],
    hasContent: i + 1 === 9 // Only Class 9 has full content
  }));

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-pacific-500 flex items-center justify-center text-white">
                <BookOpen size={22} />
              </div>
              <span className="font-heading font-bold text-xl text-slate-900">EduQuest</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full">
                <GraduationCap size={16} className="text-slate-500" />
                <span className="text-sm font-medium text-slate-700">{user?.name}</span>
              </div>

              {isAdmin && (
                <Link to="/admin">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Settings size={16} />
                    Admin
                  </Button>
                </Link>
              )}

              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout}
                data-testid="logout-btn"
                className="gap-2 text-slate-600 hover:text-red-600"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-3xl sm:text-4xl font-heading font-bold text-slate-900 mb-2">
            Welcome back, {user?.name?.split(' ')[0]}! 
            <Sparkles className="inline-block ml-2 text-genius-400" size={28} />
          </h1>
          <p className="text-slate-600 text-lg">Choose a class to start learning</p>
        </div>

        {/* Class Grid */}
        <div 
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6"
          data-testid="class-grid"
        >
          {classes.map((classItem, index) => (
            <button
              key={classItem.id}
              data-testid={`class-card-${classItem.id}`}
              onClick={() => navigate(`/class/${classItem.id}`)}
              className="group relative bg-white rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 text-center overflow-hidden"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {/* Color accent */}
              <div className={`absolute top-0 left-0 right-0 h-1.5 ${classItem.color}`} />
              
              {/* Content indicator badge */}
              {classItem.hasContent && (
                <div className="absolute top-3 right-3 px-2 py-0.5 bg-genius-100 text-genius-700 text-xs font-bold rounded-full">
                  Full Content
                </div>
              )}

              {/* Class number */}
              <div className={`w-16 h-16 mx-auto rounded-2xl ${classItem.color} flex items-center justify-center text-white text-2xl font-bold mb-4 group-hover:scale-110 transition-transform duration-300`}>
                {classItem.id}
              </div>

              <h3 className="font-heading font-bold text-lg text-slate-900 group-hover:text-pacific-600 transition-colors">
                {classItem.name}
              </h3>

              <p className="text-sm text-slate-500 mt-1">
                {classItem.hasContent ? "Ready to learn" : "Sample content"}
              </p>
            </button>
          ))}
        </div>

        {/* Info Banner */}
        <div className="mt-12 bg-gradient-to-r from-pacific-500 to-pacific-600 rounded-2xl p-6 sm:p-8 text-white animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <img 
              src="https://images.unsplash.com/photo-1758270705657-f28eec1a5694?w=200&h=200&fit=crop" 
              alt="Students"
              className="w-24 h-24 rounded-xl object-cover shadow-lg"
            />
            <div>
              <h2 className="text-xl sm:text-2xl font-heading font-bold mb-2">
                Class 9 Biology Chapter 14 is Fully Available!
              </h2>
              <p className="text-pacific-100 mb-4">
                Explore "The Respiratory System" with interactive GIF explainers, detailed content, and visual learning aids.
              </p>
              <Button 
                onClick={() => navigate("/class/9/subject/science/topic/biology/chapter/14")}
                className="bg-white text-pacific-600 hover:bg-pacific-50 font-semibold"
                data-testid="explore-chapter-14-btn"
              >
                Explore Now
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
