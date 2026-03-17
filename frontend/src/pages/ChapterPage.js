import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion";
import { 
  BookOpen, 
  LogOut, 
  ChevronRight,
  ArrowLeft,
  Play,
  X,
  Loader2,
  Video,
  FileQuestion,
  Send,
  RotateCcw,
  Clock
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Explainer Media Component with loading state
const ExplainerMedia = ({ explainerData, backendUrl, title }) => {
  const [imgStatus, setImgStatus] = useState("loading");

  useEffect(() => {
    setImgStatus("loading");
  }, [explainerData]);

  // Check for video first
  if (explainerData?.video) {
    const video = explainerData.video;
    if (video.sourceType === "url" && video.url) {
      // YouTube or external URL
      const videoId = extractYouTubeId(video.url);
      if (videoId) {
        return (
          <div className="bg-slate-100 rounded-xl overflow-hidden">
            <iframe
              width="100%"
              height="360"
              src={`https://www.youtube.com/embed/${videoId}`}
              title={title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="rounded-xl"
            />
          </div>
        );
      }
    } else if (video.filePath) {
      return (
        <div className="bg-slate-100 rounded-xl overflow-hidden">
          <video
            controls
            className="w-full max-h-[400px]"
            src={`${backendUrl}/api/media/${video.filePath}`}
          >
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }
  }

  // Then check for GIF or Image
  const filePath = explainerData?.gif?.filePath || explainerData?.image?.filePath || explainerData?.filePath;

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
        </div>
      )}
    </div>
  );
};

// Helper to extract YouTube video ID
function extractYouTubeId(url) {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  return match ? match[1] : null;
}

// Video Player Component for chapter-level videos
const ChapterVideoPlayer = ({ video, backendUrl }) => {
  if (!video) return null;

  if (video.sourceType === "url" && video.url) {
    const videoId = extractYouTubeId(video.url);
    if (videoId) {
      return (
        <div className="mt-12 pt-8 border-t border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <Video className="text-pacific-500" size={24} />
            <h2 className="font-heading font-bold text-2xl text-slate-900">
              Chapter Video
            </h2>
          </div>
          <div className="rounded-xl overflow-hidden shadow-lg">
            <iframe
              width="100%"
              height="400"
              src={`https://www.youtube.com/embed/${videoId}`}
              title={video.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <p className="mt-3 text-slate-600">{video.title}</p>
        </div>
      );
    }
  }

  if (video.filePath) {
    return (
      <div className="mt-12 pt-8 border-t border-slate-200">
        <div className="flex items-center gap-3 mb-6">
          <Video className="text-pacific-500" size={24} />
          <h2 className="font-heading font-bold text-2xl text-slate-900">
            Chapter Video
          </h2>
        </div>
        <video
          controls
          className="w-full rounded-xl shadow-lg"
          src={`${backendUrl}/api/media/${video.filePath}`}
        >
          Your browser does not support the video tag.
        </video>
        <p className="mt-3 text-slate-600">{video.title}</p>
      </div>
    );
  }

  return null;
};

// Q&A Section Component
const QASection = ({ chapterPath, token }) => {
  const [questions, setQuestions] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch questions
        const pathParts = chapterPath.split("/");
        const classId = pathParts[0].replace("class", "");
        const subject = pathParts[1];
        const topic = pathParts[2];
        const chapterNum = pathParts[3].replace("chapter", "");

        const qRes = await axios.get(
          `${API}/chapters/${classId}/${subject}/${topic}/${chapterNum}/questions`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setQuestions(qRes.data);

        // Fetch latest submission
        const subRes = await axios.get(
          `${API}/qa/latest/${chapterPath}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (subRes.data) {
          // Restore previous answers
          const prevAnswers = {};
          subRes.data.answers?.forEach(a => {
            if (a.type === "mcq") {
              prevAnswers[a.questionId] = a.selectedOption;
            } else {
              prevAnswers[a.questionId] = a.answerText;
            }
          });
          setAnswers(prevAnswers);
        }

        // Fetch all submissions
        const allSubRes = await axios.get(
          `${API}/qa/submissions/${chapterPath}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSubmissions(allSubRes.data || []);

      } catch (error) {
        console.error("Error fetching Q&A data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (chapterPath && token) {
      fetchData();
    }
  }, [chapterPath, token]);

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const answersList = [];
      
      // Collect all answers
      if (questions?.sections) {
        Object.entries(questions.sections).forEach(([type, section]) => {
          section.questions?.forEach(q => {
            const answer = answers[q.id];
            answersList.push({
              questionId: q.id,
              type: type === "mcq" ? "mcq" : type,
              selectedOption: type === "mcq" ? answer : null,
              answerText: type !== "mcq" ? (answer || "") : null
            });
          });
        });
      }

      await axios.post(
        `${API}/qa/submit`,
        { chapterId: chapterPath, answers: answersList },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Your answers have been saved");

      // Refresh submissions
      const allSubRes = await axios.get(
        `${API}/qa/submissions/${chapterPath}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSubmissions(allSubRes.data || []);

    } catch (error) {
      toast.error("Failed to save answers");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm("Are you sure you want to cancel? Your answers will be lost.")) {
      setAnswers({});
      toast.info("Answers cleared");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-pacific-500" />
      </div>
    );
  }

  if (!questions || questions.noQuestions || !questions.sections || Object.keys(questions.sections).length === 0) {
    return null;
  }

  return (
    <div className="mt-16 pt-8 border-t border-slate-200" data-testid="qa-section">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FileQuestion className="text-pacific-500" size={24} />
          <h2 className="font-heading font-bold text-2xl text-slate-900">
            Review Questions
          </h2>
        </div>
        {submissions.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
            className="gap-2"
          >
            <Clock size={16} />
            {showHistory ? "Hide History" : `View History (${submissions.length})`}
          </Button>
        )}
      </div>

      {/* Submission History */}
      {showHistory && submissions.length > 0 && (
        <div className="mb-8 p-4 bg-slate-50 rounded-xl">
          <h3 className="font-semibold text-slate-700 mb-3">Previous Submissions</h3>
          <div className="space-y-2">
            {submissions.map((sub, idx) => (
              <div key={sub.id} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">
                  Attempt {submissions.length - idx}: {new Date(sub.submittedAt).toLocaleString()}
                </span>
                <span className="text-pacific-600">
                  {sub.answers?.filter(a => a.selectedOption || a.answerText).length} answers
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Questions Accordion */}
      <Accordion type="multiple" className="space-y-4">
        {questions.sections.mcq && (
          <AccordionItem value="mcq" className="border rounded-xl px-4">
            <AccordionTrigger className="font-heading font-semibold text-lg">
              {questions.sections.mcq.title}
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <div className="space-y-6">
                {questions.sections.mcq.questions.map((q, idx) => (
                  <div key={q.id} className="p-4 bg-slate-50 rounded-lg">
                    <p className="font-medium text-slate-800 mb-3">
                      {idx + 1}. {q.text}
                    </p>
                    <RadioGroup
                      value={answers[q.id] || ""}
                      onValueChange={(val) => handleAnswerChange(q.id, val)}
                    >
                      {q.options.map((opt, optIdx) => (
                        <div key={optIdx} className="flex items-center space-x-2">
                          <RadioGroupItem value={opt} id={`${q.id}-${optIdx}`} />
                          <Label htmlFor={`${q.id}-${optIdx}`} className="cursor-pointer">
                            ({String.fromCharCode(97 + optIdx)}) {opt}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {questions.sections.veryShort && (
          <AccordionItem value="veryShort" className="border rounded-xl px-4">
            <AccordionTrigger className="font-heading font-semibold text-lg">
              {questions.sections.veryShort.title}
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <div className="space-y-6">
                {questions.sections.veryShort.questions.map((q, idx) => (
                  <div key={q.id} className="p-4 bg-slate-50 rounded-lg">
                    <p className="font-medium text-slate-800 mb-3">
                      {idx + 1}. {q.text}
                    </p>
                    <Input
                      placeholder="Your answer..."
                      value={answers[q.id] || ""}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      data-testid={`answer-${q.id}`}
                    />
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {questions.sections.shortAnswer && (
          <AccordionItem value="shortAnswer" className="border rounded-xl px-4">
            <AccordionTrigger className="font-heading font-semibold text-lg">
              {questions.sections.shortAnswer.title}
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <div className="space-y-6">
                {questions.sections.shortAnswer.questions.map((q, idx) => (
                  <div key={q.id} className="p-4 bg-slate-50 rounded-lg">
                    <p className="font-medium text-slate-800 mb-3">
                      {idx + 1}. {q.text}
                    </p>
                    <Textarea
                      placeholder="Your answer..."
                      value={answers[q.id] || ""}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      rows={3}
                      data-testid={`answer-${q.id}`}
                    />
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {questions.sections.longAnswer && (
          <AccordionItem value="longAnswer" className="border rounded-xl px-4">
            <AccordionTrigger className="font-heading font-semibold text-lg">
              {questions.sections.longAnswer.title}
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <div className="space-y-6">
                {questions.sections.longAnswer.questions.map((q, idx) => (
                  <div key={q.id} className="p-4 bg-slate-50 rounded-lg">
                    <p className="font-medium text-slate-800 mb-3">
                      {idx + 1}. {q.text}
                    </p>
                    <Textarea
                      placeholder="Write your detailed answer..."
                      value={answers[q.id] || ""}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      rows={5}
                      data-testid={`answer-${q.id}`}
                    />
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {questions.sections.structured && (
          <AccordionItem value="structured" className="border rounded-xl px-4">
            <AccordionTrigger className="font-heading font-semibold text-lg">
              {questions.sections.structured.title}
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <div className="space-y-6">
                {questions.sections.structured.questions.map((q, idx) => (
                  <div key={q.id} className="p-4 bg-slate-50 rounded-lg">
                    <p className="font-medium text-slate-800 mb-3">
                      {idx + 1}. {q.text}
                    </p>
                    {q.figureRef && (
                      <p className="text-sm text-pacific-600 mb-3">
                        (Refer to {q.figureRef} in the chapter)
                      </p>
                    )}
                    <Textarea
                      placeholder="Write your answer..."
                      value={answers[q.id] || ""}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      rows={5}
                      data-testid={`answer-${q.id}`}
                    />
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>

      {/* Submit/Cancel Buttons */}
      <div className="mt-8 flex items-center justify-end gap-4">
        <Button
          variant="outline"
          onClick={handleCancel}
          className="gap-2"
          data-testid="qa-cancel-btn"
        >
          <RotateCcw size={16} />
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="gap-2 bg-pacific-500 hover:bg-pacific-600"
          data-testid="qa-submit-btn"
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send size={16} />
          )}
          Submit Answers
        </Button>
      </div>
    </div>
  );
};

// Main Chapter Page Component
const ChapterPage = () => {
  const { classId, subjectId, topicId, chapterId } = useParams();
  const navigate = useNavigate();
  const { logout, token } = useAuth();
  const [chapter, setChapter] = useState(null);
  const [chapterMedia, setChapterMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeExplainer, setActiveExplainer] = useState(null);
  const [explainerMedia, setExplainerMedia] = useState(null);

  // Build chapter path consistently
  const chapterPath = `class${classId}/${subjectId}/${topicId}/chapter${chapterId}`;

  useEffect(() => {
    const fetchChapter = async () => {
      try {
        // Fetch chapter content
        const response = await axios.get(
          `${API}/chapters/${classId}/${subjectId}/${topicId}/${chapterId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setChapter(response.data);

        // Fetch chapter-level media (videos, PDFs linked to chapter)
        const mediaResponse = await axios.get(
          `${API}/media/by-chapter/${chapterPath}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setChapterMedia(mediaResponse.data || []);

      } catch (error) {
        console.error("Error fetching chapter:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchChapter();
  }, [classId, subjectId, topicId, chapterId, token, chapterPath]);

  const openExplainer = useCallback(async (section) => {
    setActiveExplainer(section);
    setModalOpen(true);
    setExplainerMedia(null);
    
    try {
      // Build topic path: class9/science/biology/chapter14/breathing-cycle
      const topicPath = `${chapterPath}/${section.slug}`;
      const response = await axios.get(`${API}/explainers/${topicPath}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setExplainerMedia(response.data);
    } catch (error) {
      console.log("No explainer media found for this section");
    }
  }, [chapterPath, token]);

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

  // Get figure by ID
  const getFigure = (figureId) => {
    return chapter?.figures?.find(f => f.id === figureId);
  };

  // Render content items
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
        
        case "figure":
          const figure = getFigure(item.figureId);
          if (figure) {
            return (
              <div key={index} className="my-8">
                <img
                  src={`${BACKEND_URL}/api/media/images/class9/science/biology/chapter14/${figure.filename}`}
                  alt={figure.caption}
                  className="max-w-full mx-auto rounded-lg shadow-md"
                />
                <p className="text-center text-sm text-slate-600 mt-3 italic">
                  {figure.caption}
                </p>
              </div>
            );
          }
          return null;
        
        default:
          return null;
      }
    });
  };

  // Get chapter-level video
  const chapterVideo = chapterMedia.find(m => m.type === "video" && m.linkLevel === "chapter");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-pacific-500 animate-spin" />
      </div>
    );
  }

  // No content placeholder
  if (chapter?.noContent) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <Link to="/dashboard" className="w-10 h-10 rounded-xl bg-pacific-500 flex items-center justify-center text-white">
                  <BookOpen size={22} />
                </Link>
                <span className="font-heading font-bold text-xl text-slate-900">EduQuest</span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2 text-slate-600 hover:text-red-600">
                <LogOut size={16} />
              </Button>
            </div>
          </div>
        </header>
        
        <main className="max-w-3xl mx-auto bg-white min-h-screen shadow-sm">
          <div className="px-6 sm:px-12 lg:px-16 py-8 sm:py-12">
            <Button variant="ghost" className="mb-6 gap-2 text-slate-600 -ml-2" onClick={() => navigate(`/class/${classId}/subject/${subjectId}`)}>
              <ArrowLeft size={18} />
              Back to Chapters
            </Button>
            
            <div className="text-center py-20">
              <div className="w-20 h-20 mx-auto rounded-full bg-slate-100 flex items-center justify-center mb-6">
                <BookOpen size={40} className="text-slate-400" />
              </div>
              <h1 className="text-2xl font-heading font-bold text-slate-900 mb-4">
                No Content Uploaded Yet
              </h1>
              <p className="text-slate-600 mb-8">
                This chapter doesn't have any content yet. Ask your administrator to upload a PDF for this chapter.
              </p>
            </div>
          </div>
        </main>
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

          {/* Chapter-level Video */}
          <ChapterVideoPlayer video={chapterVideo} backendUrl={BACKEND_URL} />

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

          {/* Q&A Section */}
          <QASection chapterPath={chapterPath} token={token} />
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

              {/* Explainer Media (GIF/Image/Video) */}
              <ExplainerMedia 
                explainerData={explainerMedia}
                backendUrl={BACKEND_URL}
                title={activeExplainer?.title}
              />

              {/* Topic Description */}
              {(explainerMedia?.concept || explainerMedia?.gif?.concept) && (
                <div className="mt-4 p-4 bg-pacific-50 rounded-lg">
                  <p className="text-sm text-pacific-800">
                    <span className="font-semibold">This explainer visualizes: </span>
                    {explainerMedia?.concept || explainerMedia?.gif?.concept}
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
