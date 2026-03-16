import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { 
  BookOpen, 
  LogOut, 
  ChevronRight,
  FlaskConical,
  Calculator,
  ArrowLeft
} from "lucide-react";

const SubjectPage = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const subjects = [
    {
      id: "science",
      name: "Science",
      icon: FlaskConical,
      color: "bg-emerald-500",
      description: "Physics, Chemistry, and Biology",
      image: "https://images.unsplash.com/photo-1758685734153-132c8620c1bd?w=400&h=250&fit=crop"
    },
    {
      id: "maths",
      name: "Mathematics",
      icon: Calculator,
      color: "bg-indigo-500",
      description: "Linear Equations and Algebra",
      image: "https://images.unsplash.com/photo-1647942060371-61d4102c0547?w=400&h=250&fit=crop"
    }
  ];

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
              <Link to="/dashboard" className="w-10 h-10 rounded-xl bg-pacific-500 flex items-center justify-center text-white">
                <BookOpen size={22} />
              </Link>
              <span className="font-heading font-bold text-xl text-slate-900">EduQuest</span>
            </div>

            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogout}
              className="gap-2 text-slate-600 hover:text-red-600"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-2 text-sm">
            <Link to="/dashboard" className="text-slate-500 hover:text-pacific-500 transition-colors">
              Dashboard
            </Link>
            <ChevronRight size={14} className="text-slate-400" />
            <span className="text-slate-900 font-medium">Class {classId}</span>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button 
          variant="ghost" 
          className="mb-6 gap-2 text-slate-600"
          onClick={() => navigate("/dashboard")}
          data-testid="back-to-dashboard-btn"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </Button>

        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-3xl font-heading font-bold text-slate-900 mb-2">
            Class {classId} Subjects
          </h1>
          <p className="text-slate-600">Choose a subject to explore topics</p>
        </div>

        {/* Subject Cards */}
        <div className="grid sm:grid-cols-2 gap-6" data-testid="subject-grid">
          {subjects.map((subject, index) => (
            <button
              key={subject.id}
              data-testid={`subject-card-${subject.id}`}
              onClick={() => navigate(`/class/${classId}/subject/${subject.id}`)}
              className="group bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 text-left animate-fade-in-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="relative h-40 overflow-hidden">
                <img 
                  src={subject.image} 
                  alt={subject.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className={`absolute top-4 left-4 w-12 h-12 ${subject.color} rounded-xl flex items-center justify-center text-white shadow-lg`}>
                  <subject.icon size={24} />
                </div>
              </div>
              
              <div className="p-6">
                <h3 className="font-heading font-bold text-xl text-slate-900 group-hover:text-pacific-600 transition-colors mb-2">
                  {subject.name}
                </h3>
                <p className="text-slate-500">{subject.description}</p>
                
                <div className="mt-4 flex items-center text-pacific-500 font-medium">
                  <span>Explore Topics</span>
                  <ChevronRight size={18} className="ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
};

export default SubjectPage;
