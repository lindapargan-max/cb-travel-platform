import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, Eye, EyeOff, Star, StarOff, Globe, Heart, Handshake, Gift, Users, Upload, X, Link } from "lucide-react";

type PostType = "charity" | "partnership" | "giveaway" | "community";

const TYPE_CONFIG: Record<PostType, { label: string; icon: typeof Heart; color: string; bg: string; border: string }> = {
  charity: { label: "Charity", icon: Heart, color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200" },
  partnership: { label: "Local Partnership", icon: Handshake, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
  giveaway: { label: "Giveaway", icon: Gift, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
  community: { label: "Community Event", icon: Users, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
};

const emptyForm = {
  type: "community" as PostType,
  title: "",
  subtitle: "",
  description: "",
  content: "",
  imageUrl: "",
  partnerName: "",
  charityName: "",
  amountRaised: "",
  location: "",
  eventDate: "",
  isFeatured: false,
  isPublished: false,
  displayOrder: 0,
};

export default function AdminCommunityManager() {
  const utils = trpc.useUtils();
  const { data: posts = [], isLoading } = trpc.community.getAll.useQuery();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [filter, setFilter] = useState<PostType | "all">("all");
  const [imageMode, setImageMode] = useState<"upload" | "url">("upload");
  const imageInputRef = useRef<HTMLInputElement>(null);

  const setField = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const createMutation = trpc.community.create.useMutation({
    onSuccess: () => { toast.success("Post created!"); utils.community.getAll.invalidate(); utils.community.getFeatured.invalidate(); resetForm(); },
    onError: e => toast.error("Failed: " + e.message),
  });
  const updateMutation = trpc.community.update.useMutation({
    onSuccess: () => { toast.success("Post updated!"); utils.community.getAll.invalidate(); utils.community.getFeatured.invalidate(); resetForm(); },
    onError: e => toast.error("Failed: " + e.message),
  });
  const deleteMutation = trpc.community.delete.useMutation({
    onSuccess: () => { toast.success("Post deleted"); utils.community.getAll.invalidate(); utils.community.getFeatured.invalidate(); },
    onError: e => toast.error("Failed: " + e.message),
  });
  const togglePublished = trpc.community.togglePublished.useMutation({
    onSuccess: () => utils.community.getAll.invalidate(),
    onError: e => toast.error(e.message),
  });
  const toggleFeatured = trpc.community.toggleFeatured.useMutation({
    onSuccess: () => { utils.community.getAll.invalidate(); utils.community.getFeatured.invalidate(); },
    onError: e => toast.error(e.message),
  });

  const resetForm = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
    setShowForm(false);
    setImageMode("upload");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setField("imageUrl", ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleEdit = (post: any) => {
    setForm({
      type: post.type || "community",
      title: post.title || "",
      subtitle: post.subtitle || "",
      description: post.description || "",
      content: post.content || "",
      imageUrl: post.imageUrl || "",
      partnerName: post.partnerName || "",
      charityName: post.charityName || "",
      amountRaised: post.amountRaised || "",
      location: post.location || "",
      eventDate: post.eventDate || "",
      isFeatured: !!post.isFeatured,
      isPublished: !!post.isPublished,
      displayOrder: post.displayOrder || 0,
    });
    setEditingId(post.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = () => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...form, displayOrder: Number(form.displayOrder) || 0 });
    } else {
      createMutation.mutate({ ...form, displayOrder: Number(form.displayOrder) || 0 });
    }
  };

  const filtered = filter === "all" ? posts : posts.filter((p: any) => p.type === filter);
  const inputCls = "w-full px-3 py-2 text-sm border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all";
  const labelCls = "text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-xl font-semibold text-foreground">Community & Impact</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your charity, partnerships, giveaways & community stories</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 bg-[#1e3a5f] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#0f2a4a] transition-all shadow-sm"
        >
          <Plus size={16} /> New Post
        </button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(Object.entries(TYPE_CONFIG) as [PostType, typeof TYPE_CONFIG[PostType]][]).map(([type, cfg]) => {
          const count = posts.filter((p: any) => p.type === type).length;
          const Icon = cfg.icon;
          return (
            <button
              key={type}
              onClick={() => setFilter(filter === type ? "all" : type)}
              className={`rounded-2xl border p-4 flex items-center gap-3 transition-all hover:shadow-sm ${filter === type ? `${cfg.bg} ${cfg.border} border-2` : "bg-white border-border"}`}
            >
              <div className={`w-9 h-9 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                <Icon size={16} className={cfg.color} />
              </div>
              <div className="text-left min-w-0">
                <p className="text-xl font-bold text-foreground">{count}</p>
                <p className="text-xs text-muted-foreground truncate">{cfg.label}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-border shadow-sm p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-semibold">{editingId ? "Edit Post" : "New Community Post"}</h3>
            <button onClick={resetForm} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
          </div>

          {/* Type selector */}
          <div>
            <label className={labelCls}>Category</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(Object.entries(TYPE_CONFIG) as [PostType, typeof TYPE_CONFIG[PostType]][]).map(([type, cfg]) => {
                const Icon = cfg.icon;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setField("type", type)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${form.type === type ? `${cfg.bg} ${cfg.border} border-2 ${cfg.color}` : "border-border text-muted-foreground hover:bg-slate-50"}`}
                  >
                    <Icon size={14} /> {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelCls}>Title *</label>
              <input type="text" value={form.title} onChange={e => setField("title", e.target.value)} placeholder="e.g. Supporting The Local Food Bank This Christmas" className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Subtitle</label>
              <input type="text" value={form.subtitle} onChange={e => setField("subtitle", e.target.value)} placeholder="e.g. Together, we raised £2,500 for families in need" className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Description (short — shown on cards)</label>
              <textarea
                value={form.description}
                onChange={e => setField("description", e.target.value)}
                rows={3}
                placeholder="A warm, brief description shown in previews..."
                className={`${inputCls} resize-none`}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Full Story (shown on the Community page)</label>
              <textarea
                value={form.content}
                onChange={e => setField("content", e.target.value)}
                rows={5}
                placeholder="Tell the full story here. Be warm, authentic, and specific..."
                className={`${inputCls} resize-none`}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Image</label>
              {/* Mode toggle */}
              <div className="flex gap-2 mb-2">
                <button type="button" onClick={() => setImageMode("upload")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${imageMode === "upload" ? "bg-[#1e3a5f] text-white border-[#1e3a5f]" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}>
                  <Upload size={12} /> Upload Image
                </button>
                <button type="button" onClick={() => setImageMode("url")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${imageMode === "url" ? "bg-[#1e3a5f] text-white border-[#1e3a5f]" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}>
                  <Link size={12} /> Image URL
                </button>
              </div>

              {imageMode === "upload" ? (
                <div>
                  <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  <button type="button" onClick={() => imageInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-slate-200 rounded-xl py-6 flex flex-col items-center gap-2 text-slate-500 hover:border-[#c9a96e] hover:text-[#c9a96e] transition-colors cursor-pointer bg-slate-50/50">
                    <Upload size={20} />
                    <span className="text-sm font-medium">Click to upload image</span>
                    <span className="text-xs">JPG, PNG, WebP — max 5MB</span>
                  </button>
                </div>
              ) : (
                <input type="url" value={form.imageUrl.startsWith("data:") ? "" : form.imageUrl}
                  onChange={e => setField("imageUrl", e.target.value)}
                  placeholder="https://..." className={inputCls} />
              )}

              {form.imageUrl && (
                <div className="mt-2 rounded-xl overflow-hidden h-32 bg-slate-100 relative group">
                  <img src={form.imageUrl} alt="Preview" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = "none")} />
                  <button type="button" onClick={() => setField("imageUrl", "")}
                    className="absolute top-1.5 right-1.5 bg-black/50 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500">
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
            {(form.type === "charity") && (
              <div>
                <label className={labelCls}>Charity Name</label>
                <input type="text" value={form.charityName} onChange={e => setField("charityName", e.target.value)} placeholder="e.g. The Trussell Trust" className={inputCls} />
              </div>
            )}
            {(form.type === "partnership") && (
              <div>
                <label className={labelCls}>Partner Name</label>
                <input type="text" value={form.partnerName} onChange={e => setField("partnerName", e.target.value)} placeholder="e.g. The Grand Hotel Birmingham" className={inputCls} />
              </div>
            )}
            {(form.type === "giveaway") && (
              <div>
                <label className={labelCls}>Prize / What's Being Given</label>
                <input type="text" value={form.prize} onChange={e => setField("prize", e.target.value)} placeholder="e.g. Weekend for 2 in Paris" className={inputCls} />
              </div>
            )}
            <div>
              <label className={labelCls}>Amount Given Back</label>
              <div className="flex items-center border border-input rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-ring bg-background">
                <span className="px-3 py-2 bg-muted text-muted-foreground text-sm font-bold border-r border-input select-none">£</span>
                <input
                  type="text"
                  value={form.amountRaised.replace(/^£/, "")}
                  onChange={e => setField("amountRaised", e.target.value ? `£${e.target.value.replace(/^£/, "")}` : "")}
                  placeholder="2,500 (optional)"
                  className="flex-1 px-3 py-2 bg-transparent outline-none text-sm"
                />
              </div>
            </div>
            <div>
              <label className={labelCls}>Location</label>
              <input type="text" value={form.location} onChange={e => setField("location", e.target.value)} placeholder="e.g. Birmingham, UK" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Event Date</label>
              <input type="date" value={form.eventDate} onChange={e => setField("eventDate", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Display Order (lower = first)</label>
              <input type="number" value={form.displayOrder} onChange={e => setField("displayOrder", e.target.value)} min={0} className={inputCls} />
            </div>
          </div>

          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isPublished} onChange={e => setField("isPublished", e.target.checked)} className="w-4 h-4 rounded accent-primary" />
              <span className="text-sm font-medium">Publish (visible on website)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isFeatured} onChange={e => setField("isFeatured", e.target.checked)} className="w-4 h-4 rounded accent-amber-500" />
              <span className="text-sm font-medium text-amber-700">⭐ Feature on homepage</span>
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex-1 py-3 bg-[#1e3a5f] text-white rounded-xl font-semibold text-sm hover:bg-[#0f2a4a] transition-all disabled:opacity-60"
            >
              {createMutation.isPending || updateMutation.isPending ? "Saving…" : editingId ? "Save Changes" : "Create Post"}
            </button>
            <button onClick={resetForm} className="px-6 py-3 border border-border rounded-xl text-sm font-medium text-muted-foreground hover:bg-slate-50 transition-all">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Posts List */}
      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl h-28 animate-pulse border border-border" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-12 text-center">
          <Globe size={40} className="text-muted-foreground mx-auto mb-4 opacity-40" />
          <p className="font-serif text-lg text-muted-foreground">No posts yet</p>
          <p className="text-sm text-muted-foreground mt-1">Create your first community story</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((post: any) => {
            const cfg = TYPE_CONFIG[post.type as PostType] || TYPE_CONFIG.community;
            const Icon = cfg.icon;
            return (
              <div key={post.id} className="bg-white rounded-2xl border border-border shadow-sm p-4 flex items-start gap-4 hover:border-primary/30 transition-all">
                {post.imageUrl ? (
                  <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100">
                    <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = "none")} />
                  </div>
                ) : (
                  <div className={`w-16 h-16 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon size={24} className={cfg.color} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 flex-wrap mb-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                    {post.isFeatured && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">⭐ Featured</span>}
                    {post.isPublished ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">Published</span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">Draft</span>
                    )}
                  </div>
                  <h3 className="font-semibold text-sm text-foreground leading-snug mb-0.5">{post.title}</h3>
                  {post.subtitle && <p className="text-xs text-muted-foreground">{post.subtitle}</p>}
                  {post.location && <p className="text-xs text-muted-foreground mt-0.5">📍 {post.location}{post.eventDate ? ` · ${post.eventDate}` : ""}</p>}
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => toggleFeatured.mutate({ id: post.id, isFeatured: !post.isFeatured })}
                    title={post.isFeatured ? "Remove from featured" : "Feature on homepage"}
                    className={`p-1.5 rounded-lg transition-colors ${post.isFeatured ? "text-amber-500 hover:bg-amber-50" : "text-muted-foreground hover:bg-slate-100"}`}
                  >
                    {post.isFeatured ? <Star size={14} fill="currentColor" /> : <StarOff size={14} />}
                  </button>
                  <button
                    onClick={() => togglePublished.mutate({ id: post.id, isPublished: !post.isPublished })}
                    title={post.isPublished ? "Unpublish" : "Publish"}
                    className={`p-1.5 rounded-lg transition-colors ${post.isPublished ? "text-emerald-600 hover:bg-emerald-50" : "text-muted-foreground hover:bg-slate-100"}`}
                  >
                    {post.isPublished ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  <button
                    onClick={() => handleEdit(post)}
                    className="p-1.5 rounded-lg text-primary hover:bg-primary/8 transition-colors"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => { if (confirm(`Delete "${post.title}"?`)) deleteMutation.mutate({ id: post.id }); }}
                    className="p-1.5 rounded-lg text-destructive hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
