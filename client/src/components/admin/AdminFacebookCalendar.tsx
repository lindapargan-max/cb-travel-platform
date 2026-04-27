import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Calendar, Sparkles, Plus, Trash2, Edit2, ChevronRight, Loader2, AlertCircle,
  Facebook, TrendingUp, Zap,
} from "lucide-react";

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const POST_TYPES = {
  travel_deal: { label: "Travel Deal", color: "bg-emerald-50 border-emerald-200", icon: "🎫" },
  destination: { label: "Destination", color: "bg-blue-50 border-blue-200", icon: "🌍" },
  hack: { label: "Travel Hack", color: "bg-orange-50 border-orange-200", icon: "⚡" },
  roundup: { label: "Weekly Roundup", color: "bg-purple-50 border-purple-200", icon: "📰" },
};

export default function AdminFacebookCalendar() {
  const utils = trpc.useUtils();
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState({ title: "", content: "", hashtags: "" });
  const [dealsOpen, setDealsOpen] = useState(false);

  const calendarQ = trpc.facebookCalendar.getMonth.useQuery({ year, month });
  const dealsQ = trpc.facebookCalendar.getTravelDeals.useQuery();
  
  const generateContent = trpc.facebookCalendar.generateContent.useMutation({
    onSuccess: ({ postId, content }) => {
      utils.facebookCalendar.getMonth.invalidate({ year, month });
      toast.success("Content generated! ✨");
      setSelectedPost({ id: postId, content });
    },
    onError: (e) => toast.error(e.message),
  });

  const updatePost = trpc.facebookCalendar.updatePost.useMutation({
    onSuccess: () => {
      utils.facebookCalendar.getMonth.invalidate({ year, month });
      setIsEditing(false);
      setSelectedPost(null);
      toast.success("Post updated");
    },
    onError: (e) => toast.error(e.message),
  });

  const deletePost = trpc.facebookCalendar.deletePost.useMutation({
    onSuccess: () => {
      utils.facebookCalendar.getMonth.invalidate({ year, month });
      setSelectedPost(null);
      toast.success("Post deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  const addDeal = trpc.facebookCalendar.addTravelDeal.useMutation({
    onSuccess: () => {
      utils.facebookCalendar.getTravelDeals.invalidate();
      toast.success("Deal added!");
    },
    onError: (e) => toast.error(e.message),
  });

  const posts = calendarQ.data || [];
  const deals = dealsQ.data || [];

  // Build calendar grid
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay = new Date(year, month - 1, 1).getDay();
  const cells = Array(firstDay).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));

  const getPostsForDay = (day: number) => posts.filter((p: any) => {
    const pDate = new Date(p.postDate);
    return pDate.getDate() === day;
  });

  const expectedPostsForDay = (day: number) => {
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay();
    
    // Rules: 3 deals (Mon/Wed/Fri), 2 destinations (Tue/Thu), 1 hack (Wed), 1 roundup (Sun)
    if (dayOfWeek === 0) return ["roundup"]; // Sunday
    if (dayOfWeek === 1) return ["travel_deal"]; // Monday
    if (dayOfWeek === 2) return ["travel_deal", "destination"]; // Tuesday
    if (dayOfWeek === 3) return ["travel_deal", "hack"]; // Wednesday
    if (dayOfWeek === 4) return ["travel_deal", "destination"]; // Thursday
    if (dayOfWeek === 5) return ["travel_deal"]; // Friday
    if (dayOfWeek === 6) return []; // Saturday - optional
    return [];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl font-semibold flex items-center gap-3 text-gold-gradient">
            <Calendar size={24} /> Facebook Daily Posts
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Auto-generate posts following your weekly schedule</p>
        </div>
      </div>

      {/* Schedule Legend */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-xs font-semibold uppercase tracking-wide mb-3 text-amber-900">Weekly Schedule</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div>🎫 <strong>Mon</strong> — 1 Deal</div>
          <div>📍 <strong>Tue</strong> — Destination</div>
          <div>⚡ <strong>Wed</strong> — Deal + Hack</div>
          <div>📍 <strong>Thu</strong> — Destination</div>
          <div>🎫 <strong>Fri</strong> — Deal</div>
          <div>📰 <strong>Sun</strong> — Roundup</div>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-border p-4">
        <Button
          onClick={() => {
            if (month === 1) {
              setMonth(12);
              setYear(year - 1);
            } else {
              setMonth(month - 1);
            }
          }}
          variant="outline"
          size="sm"
        >
          ← Previous
        </Button>
        
        <div className="text-center">
          <h3 className="font-serif text-lg font-semibold">{MONTHS[month - 1]} {year}</h3>
        </div>

        <Button
          onClick={() => {
            if (month === 12) {
              setMonth(1);
              setYear(year + 1);
            } else {
              setMonth(month + 1);
            }
          }}
          variant="outline"
          size="sm"
        >
          Next →
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        {/* Days of week header */}
        <div className="grid grid-cols-7 bg-gradient-to-r from-navy-900 to-navy-800 text-white">
          {DAYS_OF_WEEK.map((day) => (
            <div key={day} className="p-3 text-center text-sm font-semibold">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar cells */}
        <div className="grid grid-cols-7 gap-px bg-border">
          {cells.map((day, idx) => {
            const dayPosts = day ? getPostsForDay(day) : [];
            const expectedPosts = day ? expectedPostsForDay(day) : [];
            const isComplete = expectedPosts.length > 0 && dayPosts.length >= expectedPosts.length;

            return (
              <div
                key={idx}
                className={`min-h-[120px] p-2 ${day ? "bg-white hover:bg-amber-50/30 cursor-pointer" : "bg-muted"}`}
                onClick={() => day && setSelectedPost({ date: new Date(year, month - 1, day), dayPosts, expectedPosts })}
              >
                {day && (
                  <>
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-sm font-semibold text-foreground">{day}</span>
                      {isComplete && <span className="text-green-600">✓</span>}
                    </div>
                    <div className="space-y-1">
                      {dayPosts.map((post: any) => (
                        <div
                          key={post.id}
                          className={`text-[10px] p-1.5 rounded border ${
                            POST_TYPES[post.postType as keyof typeof POST_TYPES].color
                          } truncate`}
                        >
                          {POST_TYPES[post.postType as keyof typeof POST_TYPES].icon}{" "}
                          {POST_TYPES[post.postType as keyof typeof POST_TYPES].label}
                        </div>
                      ))}
                      {expectedPosts.map((type) => {
                        const hasPost = dayPosts.some((p: any) => p.postType === type);
                        if (!hasPost) {
                          return (
                            <button
                              key={type}
                              onClick={(e) => {
                                e.stopPropagation();
                                generateContent.mutate({
                                  postDate: new Date(year, month - 1, day).toISOString().split("T")[0],
                                  postType: type as any,
                                });
                              }}
                              className="text-[10px] p-1 rounded border border-dashed border-muted-foreground/30 text-muted-foreground hover:border-amber-400 hover:bg-amber-50/50 w-full text-left truncate"
                              disabled={generateContent.isPending}
                            >
                              {generateContent.isPending ? <Loader2 size={10} className="inline animate-spin" /> : "+"}
                            </button>
                          );
                        }
                      })}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Deals Panel */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <button
          onClick={() => setDealsOpen(!dealsOpen)}
          className="w-full p-4 flex items-center justify-between hover:bg-muted/50"
        >
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-emerald-600" />
            <span className="font-semibold">Travel Deals Repository</span>
            <Badge variant="outline" className="ml-2">{deals.length}</Badge>
          </div>
          <ChevronRight size={18} className={`transition-transform ${dealsOpen ? "rotate-90" : ""}`} />
        </button>

        {dealsOpen && (
          <div className="border-t border-border p-4 space-y-3">
            <DealForm onAdd={addDeal.mutate} />
            
            <div className="space-y-2">
              {deals.map((deal: any) => (
                <div key={deal.id} className="p-3 bg-muted/30 rounded-lg border border-border flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{deal.dealTitle}</p>
                    {deal.destination && <p className="text-xs text-muted-foreground">{deal.destination}</p>}
                    {deal.discount && <p className="text-xs text-emerald-600 font-semibold">{deal.discount}</p>}
                  </div>
                  <Button
                    onClick={() => {
                      const dateStr = new Date(year, month - 1, 1).toISOString().split("T")[0];
                      generateContent.mutate({
                        postDate: dateStr,
                        postType: "travel_deal",
                        dealId: deal.id,
                      });
                    }}
                    size="sm"
                    variant="outline"
                    className="ml-2"
                  >
                    <Sparkles size={12} /> Use
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Post Detail Modal */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {isEditing ? (
              <EditPostForm
                post={selectedPost}
                onSave={(title, content, hashtags) => {
                  updatePost.mutate({ postId: selectedPost.id, title, content, hashtags });
                }}
                onCancel={() => setIsEditing(false)}
                isSaving={updatePost.isPending}
              />
            ) : (
              <PostPreview
                post={selectedPost}
                onEdit={() => {
                  setEditValues({
                    title: selectedPost.title || "",
                    content: selectedPost.content || "",
                    hashtags: selectedPost.hashtagsStr || "",
                  });
                  setIsEditing(true);
                }}
                onDelete={() => {
                  if (confirm("Delete this post?")) {
                    deletePost.mutate(selectedPost.id);
                  }
                }}
                onClose={() => setSelectedPost(null)}
                isDeleting={deletePost.isPending}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DealForm({ onAdd }: { onAdd: (data: any) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ title: "", description: "", destination: "", discount: "" });

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)} className="w-full bg-emerald-gradient text-white">
        <Plus size={16} /> Add Travel Deal
      </Button>
    );
  }

  return (
    <div className="space-y-3 p-4 bg-muted/30 rounded-lg border border-border">
      <Input
        placeholder="Deal title"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
      />
      <Textarea
        placeholder="Description"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
      />
      <div className="grid grid-cols-2 gap-2">
        <Input
          placeholder="Destination"
          value={formData.destination}
          onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
        />
        <Input
          placeholder="Discount (e.g., £500 off)"
          value={formData.discount}
          onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
        />
      </div>
      <div className="flex gap-2">
        <Button
          onClick={() => {
            if (formData.title && formData.description) {
              onAdd(formData);
              setFormData({ title: "", description: "", destination: "", discount: "" });
              setIsOpen(false);
            }
          }}
          className="bg-emerald-gradient text-white flex-1"
        >
          Add Deal
        </Button>
        <Button onClick={() => setIsOpen(false)} variant="outline">
          Cancel
        </Button>
      </div>
    </div>
  );
}

function EditPostForm({
  post,
  onSave,
  onCancel,
  isSaving,
}: {
  post: any;
  onSave: (title: string, content: string, hashtags: string) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [title, setTitle] = useState(post.title || "");
  const [content, setContent] = useState(post.content || "");
  const [hashtags, setHashtags] = useState(post.hashtagsStr || "");

  return (
    <div className="p-6 space-y-4">
      <h3 className="font-serif text-xl font-semibold">Edit Post</h3>
      <Input placeholder="Post title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <Textarea
        placeholder="Post content"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={8}
      />
      <Input placeholder="Hashtags" value={hashtags} onChange={(e) => setHashtags(e.target.value)} />
      <div className="flex gap-2">
        <Button
          onClick={() => onSave(title, content, hashtags)}
          disabled={isSaving}
          className="bg-navy-gradient text-white"
        >
          Save
        </Button>
        <Button onClick={onCancel} variant="outline">
          Cancel
        </Button>
      </div>
    </div>
  );
}

function PostPreview({
  post,
  onEdit,
  onDelete,
  onClose,
  isDeleting,
}: {
  post: any;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
  isDeleting: boolean;
}) {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-serif text-xl font-semibold">{post.title || "Untitled"}</h3>
          <p className="text-xs text-muted-foreground">
            {post.postType && POST_TYPES[post.postType as keyof typeof POST_TYPES]?.label}
          </p>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          ✕
        </button>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 whitespace-pre-wrap text-sm font-sans leading-relaxed">
        {post.content}
      </div>

      {post.hashtagsStr && (
        <div className="text-xs text-blue-600">
          {post.hashtagsStr}
        </div>
      )}

      <div className="flex gap-2">
        <Button onClick={onEdit} variant="outline" className="flex-1">
          <Edit2 size={14} /> Edit
        </Button>
        <Button
          onClick={onDelete}
          disabled={isDeleting}
          variant="outline"
          className="text-red-600 hover:bg-red-50"
        >
          <Trash2 size={14} /> Delete
        </Button>
      </div>
    </div>
  );
}