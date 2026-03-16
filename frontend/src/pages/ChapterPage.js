import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { Button } from "../components/ui/button";
import { 
  BookOpen, 
  LogOut, 
  ChevronRight,
  ArrowLeft,
  Play,
  X,
  Loader2
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Explainer Image Component with loading state
const ExplainerImage = ({ filePath, backendUrl, title }) => {
  const [imgStatus, setImgStatus] = useState("loading"); // loading, loaded, error

  useEffect(() => {
    setImgStatus("loading");
  }, [filePath]);

  if (!filePath) {
    return (
      <div className="bg-slate-100 rounded-xl overflow-hidden min-h-[300px] flex items-center justify-center">
        <div className="text-center p-8 flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-genius-100 flex items-center justify-center mb-4">
            <Play size={32} className="text-genius-600" />
          </div>
          <p className="font-heading font-semibold text-lg text-slate-700 mb-2">
            Visual Explainer Coming Soon
          </p>
          <p className="text-slate-500 text-sm max-w-xs">
            Our AI is generating an educational animation for this topic. Check back soon!
          </p>
        </div>
      </div>
    );
  }

  const imageUrl = `${backendUrl}/api/media/${filePath}`;

  return (
    <div className="bg-slate-100 rounded-xl overflow-hidden min-h-[300px] flex items-center justify-center">
      {imgStatus === "loading" && (
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-pacific-500" />
          <span className="text-sm text-slate-500">Loading explainer...</span>
        </div>
      )}
      
      <img 
        src={imageUrl}
        alt={title || "Visual explainer"}
        className={`max-w-full max-h-[400px] object-contain ${imgStatus === "loaded" ? "" : "hidden"}`}
        onLoad={() => setImgStatus("loaded")}
        onError={() => setImgStatus("error")}
      />
      
      {imgStatus === "error" && (
        <div className="text-center p-8 flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-genius-100 flex items-center justify-center mb-4">
            <Play size={32} className="text-genius-600" />
          </div>
          <p className="font-heading font-semibold text-lg text-slate-700 mb-2">
            Visual Explainer Coming Soon
          </p>
          <p className="text-slate-500 text-sm max-w-xs">
            Our AI is generating an educational animation for this topic. Check back soon!
          </p>
        </div>
      )}
    </div>
  );
};

const ChapterPage = () => {
  const { classId, subjectId, topicId, chapterId } = useParams();
  const navigate = useNavigate();
  const { logout, token } = useAuth();
  const [chapter, setChapter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeExplainer, setActiveExplainer] = useState(null);
  const [explainerMedia, setExplainerMedia] = useState(null);

  useEffect(() => {
    const fetchChapter = async () => {
      try {
        const response = await axios.get(
          `${API}/chapters/${classId}/${subjectId}/${topicId}/${chapterId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setChapter(response.data);
      } catch (error) {
        console.error("Error fetching chapter:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchChapter();
  }, [classId, subjectId, topicId, chapterId, token]);

  const openExplainer = useCallback(async (section) => {
    setActiveExplainer(section);
    setModalOpen(true);
    setExplainerMedia(null);
    
    try {
      const path = `class${classId}/${subjectId}/${topicId}/chapter${chapterId}/${section.slug}`;
      const response = await axios.get(`${API}/explainers/${path}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setExplainerMedia(response.data);
    } catch (error) {
      console.log("No explainer media found for this section");
    }
  }, [classId, subjectId, topicId, chapterId, token]);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setActiveExplainer(null);
    setExplainerMedia(null);
  }, []);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && modalOpen) {
        closeModal();
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modalOpen, closeModal]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const renderContent = (content) => {
    return content.map((item, index) => {
      switch (item.type) {
        case "paragraph":
          return (
            <p key={index} className="mb-5 leading-relaxed">
              {item.text}
            </p>
          );
        
        case "heading":
          return (
            <h3 key={index} className="font-heading font-semibold text-xl text-slate-800 mt-8 mb-4">
              {item.text}
            </h3>
          );
        
        case "equation":
          return (
            <div key={index} className="equation">
              {item.text}
            </div>
          );
        
        case "list":
          return (
            <ul key={index} className="list-disc list-outside ml-6 mb-5 space-y-2">
              {item.items.map((li, i) => (
                <li key={i} className="leading-relaxed">{li}</li>
              ))}
            </ul>
          );
        
        case "callout":
          return (
            <div key={index} className="callout-box">
              <h4 className="font-heading font-bold text-amber-800 mb-2">{item.title}</h4>
              <p className="text-amber-900 text-sm leading-relaxed">{item.text}</p>
            </div>
          );
        
        case "table":
          return (
            <div key={index} className="my-6 overflow-x-auto">
              <p className="font-medium text-slate-700 mb-3">{item.title}</p>
              <table className="chapter-table">
                <thead>
                  <tr>
                    {item.headers.map((header, i) => (
                      <th key={i}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {item.rows.map((row, i) => (
                    <tr key={i}>
                      {row.map((cell, j) => (
                        <td key={j}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        
        default:
          return null;
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-pacific-500 animate-spin" />
      </div>
    );
  }

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
            <Link to={`/class/${classId}/subject/${subjectId}`} className="text-slate-500 hover:text-pacific-500 transition-colors capitalize">
              {subjectId}
            </Link>
            <ChevronRight size={14} className="text-slate-400" />
            <span className="text-slate-900 font-medium">Chapter {chapterId}</span>
          </nav>
        </div>
      </div>

      {/* Chapter Content */}
      <main className="max-w-3xl mx-auto bg-white min-h-screen shadow-sm">
        <div className="px-6 sm:px-12 lg:px-16 py-8 sm:py-12">
          <Button 
            variant="ghost" 
            className="mb-6 gap-2 text-slate-600 -ml-2"
            onClick={() => navigate(`/class/${classId}/subject/${subjectId}`)}
            data-testid="back-to-topics-btn"
          >
            <ArrowLeft size={18} />
            Back to Chapters
          </Button>

          {/* Chapter Title */}
          <div className="mb-10 animate-fade-in-up">
            <span className="text-pacific-500 font-medium text-sm uppercase tracking-wider">
              Chapter {chapter?.chapterNumber}
            </span>
            <h1 className="text-3xl sm:text-4xl font-heading font-bold text-slate-900 mt-2">
              {chapter?.title}
            </h1>
          </div>

          {/* Chapter Sections */}
          <div className="chapter-content" data-testid="chapter-content">
            {chapter?.sections?.map((section, sectionIndex) => (
              <section 
                key={section.id} 
                className="mb-12 animate-fade-in-up"
                style={{ animationDelay: `${sectionIndex * 0.05}s` }}
              >
                {/* Section Heading with GIF Badge */}
                <button
                  data-testid={`section-heading-${section.slug}`}
                  onClick={() => openExplainer(section)}
                  className="section-heading-interactive mb-6"
                >
                  <h2 className="font-heading font-bold text-2xl text-slate-900 m-0">
                    {section.title}
                  </h2>
                  <span className="gif-badge" title="Click for visual explainer">
                    <Play size={14} fill="currentColor" />
                  </span>
                </button>

                {/* Section Content */}
                {renderContent(section.content)}
              </section>
            ))}
          </div>

          {/* Progress Checks (if any) */}
          {chapter?.progressChecks?.length > 0 && (
            <div className="mt-16 pt-8 border-t border-slate-200">
              <h2 className="font-heading font-bold text-2xl text-slate-900 mb-6">
                Progress Check Questions
              </h2>
              {chapter.progressChecks.map((check, checkIndex) => (
                <div key={checkIndex} className="mb-8 bg-pacific-50 rounded-xl p-6">
                  <p className="font-medium text-pacific-700 mb-4">Section {check.sectionId}</p>
                  <ol className="list-decimal list-inside space-y-3">
                    {check.questions.map((q, i) => (
                      <li key={i} className="text-slate-700">{q}</li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Explainer Modal */}
      {modalOpen && (
        <div 
          className="modal-overlay animate-fade-in"
          onClick={closeModal}
          data-testid="explainer-modal-overlay"
        >
          <div 
            className="modal-content animate-scale-in"
            onClick={(e) => e.stopPropagation()}
            data-testid="explainer-modal"
          >
            {/* Close Button */}
            <button
              data-testid="modal-close-btn"
              onClick={closeModal}
              className="absolute top-4 right-4 z-10 p-2 bg-white/80 hover:bg-slate-100 rounded-full text-slate-500 hover:text-red-500 transition-colors shadow-md"
            >
              <X size={20} />
            </button>

            {/* Modal Content */}
            <div className="p-6 sm:p-8">
              <h3 className="font-heading font-bold text-xl text-slate-900 mb-4 pr-10">
                {activeExplainer?.title}
              </h3>

              {/* Explainer Image/GIF */}
              <ExplainerImage 
                filePath={explainerMedia?.filePath}
                backendUrl={BACKEND_URL}
                title={activeExplainer?.title}
              />

              {/* Topic Description */}
              {explainerMedia?.concept && (
                <div className="mt-4 p-4 bg-pacific-50 rounded-lg">
                  <p className="text-sm text-pacific-800">
                    <span className="font-semibold">This explainer visualizes: </span>
                    {explainerMedia.concept}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChapterPage;
