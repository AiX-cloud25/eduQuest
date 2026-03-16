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
  ImageIcon,
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

const AdminImages = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingImage, setEditingImage] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    classId: "",
    subject: "",
    topic: "",
    chapter: "",
    section: ""
  });

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const response = await axios.get(`${API}/media?type=image`);
      setImages(response.data);
    } catch (error) {
      toast.error("Failed to fetch images");
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
      filePath: `images/${linkedTo}.png`,
      linkedTo,
      linkLevel: "topic",
      type: "image"
    };

    try {
      if (editingImage) {
        await axios.put(`${API}/media/${editingImage.id}`, payload);
        toast.success("Image updated successfully");
      } else {
        await axios.post(`${API}/media`, payload);
        toast.success("Image added successfully");
      }
      setDialogOpen(false);
      resetForm();
      fetchImages();
    } catch (error) {
      toast.error("Failed to save image");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this image?")) return;
    
    try {
      await axios.delete(`${API}/media/${id}`);
      toast.success("Image deleted");
      fetchImages();
    } catch (error) {
      toast.error("Failed to delete image");
    }
  };

  const handleEdit = (image) => {
    const parts = image.linkedTo.split("/");
    setFormData({
      title: image.title,
      classId: parts[0]?.replace("class", "") || "",
      subject: parts[1] || "",
      topic: parts[2] || "",
      chapter: parts[3]?.replace("chapter", "") || "",
      section: parts[4] || ""
    });
    setEditingImage(image);
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
    setEditingImage(null);
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
          <h1 className="text-2xl font-heading font-bold text-slate-900">Images</h1>
          <p className="text-slate-600 mt-1">Manage static images for topics</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-pacific-500 hover:bg-pacific-600" data-testid="add-image-btn">
              <Plus size={18} />
              Upload Image
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingImage ? "Edit Image" : "Add New Image"}</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <Label>Title</Label>
                <Input
                  data-testid="image-title-input"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Image title"
                  required
                />
              </div>

              <div>
                <Label>Upload Image File</Label>
                <Input
                  type="file"
                  accept=".png,.jpg,.jpeg,.webp"
                  className="mt-1"
                />
                <p className="text-xs text-slate-500 mt-1">Accepts .png, .jpg, .jpeg, .webp files</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Class</Label>
                  <Select
                    value={formData.classId}
                    onValueChange={(value) => setFormData({ ...formData, classId: value })}
                  >
                    <SelectTrigger data-testid="image-class-select">
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
                    <SelectTrigger data-testid="image-subject-select">
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
                    <SelectTrigger data-testid="image-topic-select">
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
                    data-testid="image-chapter-input"
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
                  data-testid="image-section-input"
                  value={formData.section}
                  onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                  placeholder="e.g., respiratory-organs"
                  required
                />
                <p className="text-xs text-slate-500 mt-1">Images can only be linked to specific topics within chapters</p>
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
                <Button type="submit" className="bg-pacific-500 hover:bg-pacific-600" data-testid="image-submit-btn">
                  {editingImage ? "Update" : "Save"} Image
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Images Table */}
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
            {images.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-8 text-slate-500">
                  <ImageIcon className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                  No images uploaded yet
                </td>
              </tr>
            ) : (
              images.map((image) => (
                <tr key={image.id}>
                  <td>
                    <div className="w-12 h-12 rounded bg-slate-100 flex items-center justify-center overflow-hidden">
                      {image.filePath ? (
                        <img 
                          src={`${BACKEND_URL}/media/${image.filePath}`}
                          alt={image.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <ImageIcon size={20} className="text-slate-400" />
                      )}
                    </div>
                  </td>
                  <td className="font-medium">{image.title}</td>
                  <td className="font-mono text-xs text-slate-600">{image.linkedTo}</td>
                  <td className="font-mono text-xs text-slate-500">{image.filePath}</td>
                  <td className="text-slate-500">{image.uploadedAt}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(image)}
                        data-testid={`edit-image-${image.id}`}
                      >
                        <Pencil size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-600"
                        onClick={() => handleDelete(image.id)}
                        data-testid={`delete-image-${image.id}`}
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

export default AdminImages;
