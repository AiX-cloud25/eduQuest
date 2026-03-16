import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { 
  BookOpen, 
  LogOut, 
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  Atom,
  TestTube2,
  Leaf,
  Calculator,
  FunctionSquare,
  BookText
} from "lucide-react";

const SCIENCE_TOPICS = [
  { id: "physics", name: "Physics", icon: Atom, color: "text-blue-500" },
  { id: "chemistry", name: "Chemistry", icon: TestTube2, color: "text-purple-500" },
  { id: "biology", name: "Biology", icon: Leaf, color: "text-green-500" }
];

const MATHS_TOPICS = [
  { id: "linear-equations", name: "Linear Equations", icon: FunctionSquare, color: "text-indigo-500" },
  { id: "algebra", name: "Algebra", icon: Calculator, color: "text-pink-500" }
];

const CHAPTER_TITLES = {
  biology: {
    1: "Cell - The Unit of Life",
    2: "Tissues, Organs and Organ Systems",
    3: "Movement and Locomotion",
    4: "The Flower",
    5: "Pollination and Fertilisation",
    6: "Seeds",
    7: "The Skin",
    8: "The Muscular System",
    9: "The Skeleton",
    10: "The Nervous System",
    11: "Sense Organs",
    12: "The Circulatory System",
    13: "The Excretory System",
    14: "The Respiratory System",
  }
};

const TopicPage = () => {
  const { classId, subjectId, topicId } = useParams();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [expandedTopic, setExpandedTopic] = useState(topicId || null);

  const topics = subjectId === "science" ? SCIENCE_TOPICS : MATHS_TOPICS;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getChapters = (topic) => {
    const numChapters = topic === "biology" ? 14 : 10;
    return Array.from({ length: numChapters }, (_, i) => ({
      id: i + 1,
      number: i + 1,
      title: CHAPTER_TITLES[topic]?.[i + 1] || `Chapter ${i + 1}`,
      hasFullContent: classId === "9" && subjectId === "science" && topic === "biology" && i + 1 === 14
    }));
  };

  const toggleTopic = (topicId) => {
    setExpandedTopic(expandedTopic === topicId ? null : topicId);
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
          <nav className="flex items-center gap-2 text-sm flex-wrap">
            <Link to="/dashboard" className="text-slate-500 hover:text-pacific-500 transition-colors">
              Dashboard
            </Link>
            <ChevronRight size={14} className="text-slate-400" />
            <Link to={`/class/${classId}`} className="text-slate-500 hover:text-pacific-500 transition-colors">
              Class {classId}
            </Link>
            <ChevronRight size={14} className="text-slate-400" />
            <span className="text-slate-900 font-medium capitalize">{subjectId}</span>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button 
          variant="ghost" 
          className="mb-6 gap-2 text-slate-600"
          onClick={() => navigate(`/class/${classId}`)}
          data-testid="back-to-subjects-btn"
        >
          <ArrowLeft size={18} />
          Back to Subjects
        </Button>

        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-3xl font-heading font-bold text-slate-900 mb-2 capitalize">
            Class {classId} {subjectId}
          </h1>
          <p className="text-slate-600">Select a topic and chapter to begin</p>
        </div>

        {/* Topics with Chapters */}
        <div className="space-y-4" data-testid="topic-list">
          {topics.map((topic, index) => {
            const isExpanded = expandedTopic === topic.id;
            const chapters = getChapters(topic.id);
            const TopicIcon = topic.icon;

            return (
              <div 
                key={topic.id}
                className="bg-white rounded-2xl shadow-card overflow-hidden animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Topic Header */}
                <button
                  data-testid={`topic-${topic.id}`}
                  onClick={() => toggleTopic(topic.id)}
                  className="w-full p-5 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center ${topic.color}`}>
                      <TopicIcon size={24} />
                    </div>
                    <div className="text-left">
                      <h3 className="font-heading font-bold text-lg text-slate-900">
                        {topic.name}
                      </h3>
                      <p className="text-sm text-slate-500">{chapters.length} chapters</p>
                    </div>
                  </div>
                  <ChevronDown 
                    size={20} 
                    className={`text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* Chapter List */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/50">
                    <div className="divide-y divide-slate-100">
                      {chapters.map((chapter) => (
                        <button
                          key={chapter.id}
                          data-testid={`chapter-${topic.id}-${chapter.id}`}
                          onClick={() => navigate(`/class/${classId}/subject/${subjectId}/topic/${topic.id}/chapter/${chapter.id}`)}
                          className="w-full p-4 pl-20 flex items-center justify-between hover:bg-white transition-colors text-left"
                        >
                          <div className="flex items-center gap-3">
                            <BookText size={18} className="text-slate-400" />
                            <div>
                              <span className="font-medium text-slate-900">
                                Chapter {chapter.number}
                              </span>
                              <span className="text-slate-500 ml-2">
                                — {chapter.title}
                              </span>
                            </div>
                            {chapter.hasFullContent && (
                              <span className="ml-2 px-2 py-0.5 bg-genius-100 text-genius-700 text-xs font-bold rounded-full">
                                Full Content
                              </span>
                            )}
                          </div>
                          <ChevronRight size={16} className="text-slate-400" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default TopicPage;
