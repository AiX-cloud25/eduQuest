import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { 
  Plus, 
  Pencil, 
  Trash2,
  Video,
  Link as LinkIcon,
  Upload,
  Loader2
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CLASSES = Array.from({ length: 10 }, (_, i) => ({ id: String(i + 1), name: `Class ${i + 1}` }));
const SUBJECTS = [
  { id: "science", name: "Science" },
  { id: "maths", name: "Mathematics" }
];
const SCIENCE_TOPICS = [
  { id: "physics", name: "Physics" },
  { id: "chemistry", name: "Chemistry" },
  { id: "biology", name: "Biology" }
];
const MATHS_TOPICS = [
  { id: "linear-equations", name: "Linear Equations" },
  { id: "algebra", name: "Algebra" }
];

const AdminVideos = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    sourceType: "url",
    url: "",
    linkedTo: "",
    linkLevel: "chapter",
    classId: "",
    subject: "",
    topic: "",
    chapter: "",
    section: ""
  });

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const response = await axios.get(`${API}/media?type=video`);
      setVideos(response.data);
    } catch (error) {
      toast.error("Failed to fetch videos");
    } finally {
      setLoading(false);
    }
  };

  const getTopics = () => {
    return formData.subject === "science" ? SCIENCE_TOPICS : MATHS_TOPICS;
  };

  const buildLinkedTo = () => {
    let path = `class${formData.classId}/${formData.subject}/${formData.topic}/chapter${formData.chapter}`;
    if (formData.linkLevel === "topic" && formData.section) {
      path += `/${formData.section}`;
    }
    return path;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const linkedTo = buildLinkedTo();
    const payload = {
      title: formData.title,
      sourceType: formData.sourceType,
      url: formData.sourceType === "url" ? formData.url : null,
      filePath: formData.sourceType === "local" ? formData.filePath : null,
      linkedTo,
      linkLevel: formData.linkLevel,
      type: "video"
    };

    try {
      if (editingVideo) {
        await axios.put(`${API}/media/${editingVideo.id}`, payload);
        toast.success("Video updated successfully");
      } else {
        await axios.post(`${API}/media`, payload);
        toast.success("Video added successfully");
      }
      setDialogOpen(false);
      resetForm();
      fetchVideos();
    } catch (error) {
      toast.error("Failed to save video");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this video?")) return;
    
    try {
      await axios.delete(`${API}/media/${id}`);
      toast.success("Video deleted");
      fetchVideos();
    } catch (error) {
      toast.error("Failed to delete video");
    }
  };

  const handleEdit = (video) => {
    const parts = video.linkedTo.split("/");
    setFormData({
      title: video.title,
      sourceType: video.sourceType,
      url: video.url || "",
      linkedTo: video.linkedTo,
      linkLevel: video.linkLevel,
      classId: parts[0]?.replace("class", "") || "",
      subject: parts[1] || "",
      topic: parts[2] || "",
      chapter: parts[3]?.replace("chapter", "") || "",
      section: parts[4] || ""
    });
    setEditingVideo(video);
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      sourceType: "url",
      url: "",
      linkedTo: "",
      linkLevel: "chapter",
      classId: "",
      subject: "",
      topic: "",
      chapter: "",
      section: ""
    });
    setEditingVideo(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-pacific-500 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-slate-900">Videos</h1>
          <p className="text-slate-600 mt-1">Manage video content for chapters and topics</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-pacific-500 hover:bg-pacific-600" data-testid="add-video-btn">
              <Plus size={18} />
              Upload Video
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingVideo ? "Edit Video" : "Add New Video"}</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <Label>Title</Label>
                <Input
                  data-testid="video-title-input"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Video title"
                  required
                />
              </div>

              <div>
                <Label>Source Type</Label>
                <Select
                  value={formData.sourceType}
                  onValueChange={(value) => setFormData({ ...formData, sourceType: value })}
                >
                  <SelectTrigger data-testid="video-source-type-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="url">
                      <span className="flex items-center gap-2">
                        <LinkIcon size={16} /> Paste URL
                      </span>
                    </SelectItem>
                    <SelectItem value="local">
                      <span className="flex items-center gap-2">
                        <Upload size={16} /> Upload from device
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.sourceType === "url" && (
                <div>
                  <Label>Video URL</Label>
                  <Input
                    data-testid="video-url-input"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    placeholder="https://youtube.com/watch?v=..."
                    required
                  />
                </div>
              )}

              <div>
                <Label>Link Level</Label>
                <Select
                  value={formData.linkLevel}
                  onValueChange={(value) => setFormData({ ...formData, linkLevel: value })}
                >
                  <SelectTrigger data-testid="video-link-level-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="chapter">Chapter (entire chapter)</SelectItem>
                    <SelectItem value="topic">Topic (specific section)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Class</Label>
                  <Select
                    value={formData.classId}
                    onValueChange={(value) => setFormData({ ...formData, classId: value })}
                  >
                    <SelectTrigger data-testid="video-class-select">
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {CLASSES.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Subject</Label>
                  <Select
                    value={formData.subject}
                    onValueChange={(value) => setFormData({ ...formData, subject: value, topic: "" })}
                  >
                    <SelectTrigger data-testid="video-subject-select">
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUBJECTS.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Topic</Label>
                  <Select
                    value={formData.topic}
                    onValueChange={(value) => setFormData({ ...formData, topic: value })}
                    disabled={!formData.subject}
                  >
                    <SelectTrigger data-testid="video-topic-select">
                      <SelectValue placeholder="Select topic" />
                    </SelectTrigger>
                    <SelectContent>
                      {getTopics().map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Chapter</Label>
                  <Input
                    type="number"
                    data-testid="video-chapter-input"
                    value={formData.chapter}
                    onChange={(e) => setFormData({ ...formData, chapter: e.target.value })}
                    placeholder="Chapter number"
                    min="1"
                    required
                  />
                </div>
              </div>

              {formData.linkLevel === "topic" && (
                <div>
                  <Label>Section Slug</Label>
                  <Input
                    data-testid="video-section-input"
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    placeholder="e.g., breathing-cycle"
                  />
                </div>
              )}

              {formData.classId && formData.subject && formData.topic && formData.chapter && (
                <div className="p-3 bg-slate-50 rounded-lg">
                  <Label className="text-xs text-slate-500">Generated Path</Label>
                  <p className="text-sm font-mono text-slate-700 mt-1">{buildLinkedTo()}</p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-pacific-500 hover:bg-pacific-600" data-testid="video-submit-btn">
                  {editingVideo ? "Update" : "Save"} Video
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Videos Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Source</th>
              <th>Linked To</th>
              <th>Level</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {videos.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-8 text-slate-500">
                  <Video className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                  No videos uploaded yet
                </td>
              </tr>
            ) : (
              videos.map((video) => (
                <tr key={video.id}>
                  <td className="font-medium">{video.title}</td>
                  <td>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      video.sourceType === "url" ? "bg-blue-50 text-blue-600" : "bg-green-50 text-green-600"
                    }`}>
                      {video.sourceType === "url" ? "URL" : "Local"}
                    </span>
                  </td>
                  <td className="font-mono text-xs text-slate-600">{video.linkedTo}</td>
                  <td className="capitalize">{video.linkLevel}</td>
                  <td className="text-slate-500">{video.uploadedAt}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(video)}
                        data-testid={`edit-video-${video.id}`}
                      >
                        <Pencil size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-600"
                        onClick={() => handleDelete(video.id)}
                        data-testid={`delete-video-${video.id}`}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminVideos;
