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
  FileText,
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

const AdminPdfs = () => {
  const [pdfs, setPdfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPdf, setEditingPdf] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    classId: "",
    subject: "",
    topic: "",
    chapter: ""
  });

  useEffect(() => {
    fetchPdfs();
  }, []);

  const fetchPdfs = async () => {
    try {
      const response = await axios.get(`${API}/media?type=pdf`);
      setPdfs(response.data);
    } catch (error) {
      toast.error("Failed to fetch PDFs");
    } finally {
      setLoading(false);
    }
  };

  const getTopics = () => {
    return formData.subject === "science" ? SCIENCE_TOPICS : MATHS_TOPICS;
  };

  const buildLinkedTo = () => {
    if (!formData.classId || !formData.subject || !formData.topic || !formData.chapter) {
      return "";
    }
    return `class${formData.classId}/${formData.subject}/${formData.topic}/chapter${formData.chapter}`;
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
      filePath: `pdfs/${linkedTo}/chapter${formData.chapter}.pdf`,
      linkedTo,
      linkLevel: "chapter",
      type: "pdf"
    };

    try {
      if (editingPdf) {
        await axios.put(`${API}/media/${editingPdf.id}`, payload);
        toast.success("PDF updated successfully");
      } else {
        await axios.post(`${API}/media`, payload);
        toast.success("PDF added successfully");
      }
      setDialogOpen(false);
      resetForm();
      fetchPdfs();
    } catch (error) {
      toast.error("Failed to save PDF");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this PDF?")) return;
    
    try {
      await axios.delete(`${API}/media/${id}`);
      toast.success("PDF deleted");
      fetchPdfs();
    } catch (error) {
      toast.error("Failed to delete PDF");
    }
  };

  const handleEdit = (pdf) => {
    const parts = pdf.linkedTo.split("/");
    setFormData({
      title: pdf.title,
      classId: parts[0]?.replace("class", "") || "",
      subject: parts[1] || "",
      topic: parts[2] || "",
      chapter: parts[3]?.replace("chapter", "") || ""
    });
    setEditingPdf(pdf);
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      classId: "",
      subject: "",
      topic: "",
      chapter: ""
    });
    setEditingPdf(null);
  };

  const getLinkedToDisplay = (linkedTo) => {
    const parts = linkedTo.split("/");
    const classNum = parts[0]?.replace("class", "");
    const subject = parts[1];
    const topic = parts[2];
    const chapter = parts[3]?.replace("chapter", "");
    return `Class ${classNum} > ${subject} > ${topic} > Chapter ${chapter}`;
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
          <h1 className="text-2xl font-heading font-bold text-slate-900">PDFs</h1>
          <p className="text-slate-600 mt-1">Manage textbook PDFs for chapters</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-pacific-500 hover:bg-pacific-600" data-testid="add-pdf-btn">
              <Plus size={18} />
              Upload PDF
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPdf ? "Edit PDF" : "Add New PDF"}</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <Label>Title</Label>
                <Input
                  data-testid="pdf-title-input"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="PDF title"
                  required
                />
              </div>

              <div>
                <Label>Upload PDF File</Label>
                <Input
                  type="file"
                  accept=".pdf"
                  className="mt-1"
                />
                <p className="text-xs text-slate-500 mt-1">Accepts .pdf files only</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Class</Label>
                  <Select
                    value={formData.classId}
                    onValueChange={(value) => setFormData({ ...formData, classId: value })}
                  >
                    <SelectTrigger data-testid="pdf-class-select">
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
                    <SelectTrigger data-testid="pdf-subject-select">
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
                    <SelectTrigger data-testid="pdf-topic-select">
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
                    data-testid="pdf-chapter-input"
                    value={formData.chapter}
                    onChange={(e) => setFormData({ ...formData, chapter: e.target.value })}
                    placeholder="Chapter number"
                    min="1"
                    required
                  />
                </div>
              </div>

              <p className="text-xs text-slate-500">PDFs can only be linked to chapters, not individual topics</p>

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
                <Button type="submit" className="bg-pacific-500 hover:bg-pacific-600" data-testid="pdf-submit-btn">
                  {editingPdf ? "Update" : "Save"} PDF
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* PDFs Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Linked Chapter</th>
              <th>File Path</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pdfs.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-8 text-slate-500">
                  <FileText className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                  No PDFs uploaded yet
                </td>
              </tr>
            ) : (
              pdfs.map((pdf) => (
                <tr key={pdf.id}>
                  <td className="font-medium">{pdf.title}</td>
                  <td className="text-slate-600 text-sm">{getLinkedToDisplay(pdf.linkedTo)}</td>
                  <td className="font-mono text-xs text-slate-500">{pdf.filePath}</td>
                  <td className="text-slate-500">{pdf.uploadedAt}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(pdf)}
                        data-testid={`edit-pdf-${pdf.id}`}
                      >
                        <Pencil size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-600"
                        onClick={() => handleDelete(pdf.id)}
                        data-testid={`delete-pdf-${pdf.id}`}
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
      <div className="mt-6 p-4 bg-pacific-50 border border-pacific-200 rounded-lg">
        <p className="text-sm text-pacific-800">
          <strong>How it works:</strong> When you upload a PDF for a chapter, the chapter reader will 
          automatically parse and render the textbook content as clean, formatted HTML with all 
          images, tables, and equations properly displayed.
        </p>
      </div>
    </div>
  );
};

export default AdminPdfs;
