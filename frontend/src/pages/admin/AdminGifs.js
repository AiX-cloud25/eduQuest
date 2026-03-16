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
  FileImage,
  Loader2,
  Play
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

const AdminGifs = () => {
  const [gifs, setGifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGif, setEditingGif] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    classId: "",
    subject: "",
    topic: "",
    chapter: "",
    section: ""
  });

  useEffect(() => {
    fetchGifs();
  }, []);

  const fetchGifs = async () => {
    try {
      const response = await axios.get(`${API}/media?type=gif`);
      setGifs(response.data);
    } catch (error) {
      toast.error("Failed to fetch GIFs");
    } finally {
      setLoading(false);
    }
  };

  const getTopics = () => {
    return formData.subject === "science" ? SCIENCE_TOPICS : MATHS_TOPICS;
  };

  const buildLinkedTo = () => {
    if (!formData.classId || !formData.subject || !formData.topic || !formData.chapter || !formData.section) {
      return "";
    }
    return `class${formData.classId}/${formData.subject}/${formData.topic}/chapter${formData.chapter}/${formData.section}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const linkedTo = buildLinkedTo();
    
    if (!linkedTo) {
      toast.error("Please fill in all fields");
      return;
    }

    const payload = {
      title: formData.title,
      filePath: `gifs/${linkedTo}.gif`,
      linkedTo,
      linkLevel: "topic",
      type: "gif"
    };

    try {
      if (editingGif) {
        await axios.put(`${API}/media/${editingGif.id}`, payload);
        toast.success("GIF updated successfully");
      } else {
        await axios.post(`${API}/media`, payload);
        toast.success("GIF added successfully");
      }
      setDialogOpen(false);
      resetForm();
      fetchGifs();
    } catch (error) {
      toast.error("Failed to save GIF");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this GIF?")) return;
    
    try {
      await axios.delete(`${API}/media/${id}`);
      toast.success("GIF deleted");
      fetchGifs();
    } catch (error) {
      toast.error("Failed to delete GIF");
    }
  };

  const handleEdit = (gif) => {
    const parts = gif.linkedTo.split("/");
    setFormData({
      title: gif.title,
      classId: parts[0]?.replace("class", "") || "",
      subject: parts[1] || "",
      topic: parts[2] || "",
      chapter: parts[3]?.replace("chapter", "") || "",
      section: parts[4] || ""
    });
    setEditingGif(gif);
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      classId: "",
      subject: "",
      topic: "",
      chapter: "",
      section: ""
    });
    setEditingGif(null);
    setSelectedFile(null);
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
          <h1 className="text-2xl font-heading font-bold text-slate-900">GIFs & Animations</h1>
          <p className="text-slate-600 mt-1">Manage GIF explainers for topics (auto-generated for Chapter 14)</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-pacific-500 hover:bg-pacific-600" data-testid="add-gif-btn">
              <Plus size={18} />
              Upload GIF
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingGif ? "Edit GIF" : "Add New GIF"}</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <Label>Title</Label>
                <Input
                  data-testid="gif-title-input"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="GIF title"
                  required
                />
              </div>

              <div>
                <Label>Upload GIF File</Label>
                <Input
                  type="file"
                  accept=".gif,.html"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  className="mt-1"
                />
                <p className="text-xs text-slate-500 mt-1">Accepts .gif and .html animation files</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Class</Label>
                  <Select
                    value={formData.classId}
                    onValueChange={(value) => setFormData({ ...formData, classId: value })}
                  >
                    <SelectTrigger data-testid="gif-class-select">
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
                    <SelectTrigger data-testid="gif-subject-select">
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
                    <SelectTrigger data-testid="gif-topic-select">
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
                    data-testid="gif-chapter-input"
                    value={formData.chapter}
                    onChange={(e) => setFormData({ ...formData, chapter: e.target.value })}
                    placeholder="Chapter number"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div>
                <Label>Section/Topic Slug</Label>
                <Input
                  data-testid="gif-section-input"
                  value={formData.section}
                  onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                  placeholder="e.g., breathing-cycle"
                  required
                />
                <p className="text-xs text-slate-500 mt-1">GIFs can only be linked to specific topics within chapters</p>
              </div>

              {buildLinkedTo() && (
                <div className="p-3 bg-slate-50 rounded-lg">
                  <Label className="text-xs text-slate-500">Generated Path</Label>
                  <p className="text-sm font-mono text-slate-700 mt-1">{buildLinkedTo()}</p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-pacific-500 hover:bg-pacific-600" data-testid="gif-submit-btn">
                  {editingGif ? "Update" : "Save"} GIF
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* GIFs Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Preview</th>
              <th>Title</th>
              <th>Linked To</th>
              <th>File Path</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {gifs.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-8 text-slate-500">
                  <FileImage className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                  No GIFs uploaded yet
                </td>
              </tr>
            ) : (
              gifs.map((gif) => (
                <tr key={gif.id}>
                  <td>
                    <div className="w-12 h-12 rounded bg-slate-100 flex items-center justify-center">
                      {gif.filePath ? (
                        <img 
                          src={`${BACKEND_URL}/media/${gif.filePath}`}
                          alt={gif.title}
                          className="w-full h-full object-cover rounded"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <Play size={20} className={`text-slate-400 ${gif.filePath ? 'hidden' : 'block'}`} />
                    </div>
                  </td>
                  <td className="font-medium">{gif.title}</td>
                  <td className="font-mono text-xs text-slate-600">{gif.linkedTo}</td>
                  <td className="font-mono text-xs text-slate-500">{gif.filePath}</td>
                  <td className="text-slate-500">{gif.uploadedAt}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(gif)}
                        data-testid={`edit-gif-${gif.id}`}
                      >
                        <Pencil size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-600"
                        onClick={() => handleDelete(gif.id)}
                        data-testid={`delete-gif-${gif.id}`}
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

      {/* Info Banner */}
      <div className="mt-6 p-4 bg-genius-50 border border-genius-200 rounded-lg">
        <p className="text-sm text-genius-800">
          <strong>Note:</strong> GIF explainers for Chapter 14 (The Respiratory System) are auto-generated 
          using AI at build time. They appear automatically in this list.
        </p>
      </div>
    </div>
  );
};

export default AdminGifs;
