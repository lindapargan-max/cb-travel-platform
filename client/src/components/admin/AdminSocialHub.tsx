import React, { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { format, startOfWeek, addDays } from "date-fns";
import { Copy, Trash2, Calendar, Zap, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface Post {
  id: number;
  platform: string;
  title?: string;
  body: string;
  caption?: string;
  hashtags?: string;
  imagePrompt?: string;
  imageUrl?: string;
  scheduledFor?: Date;
  status: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const PLATFORMS = ["facebook", "instagram", "twitter"];

export function AdminSocialHub() {
  const [selectedPlatform, setSelectedPlatform] = useState<string>("facebook");
  const [posts, setPosts] = useState<Post[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCopied, setShowCopied] = useState<number | null>(null);

  const generateWeekMutation = trpc.socialHub.generateWeek.useMutation();
  const getWeekPostsQuery = trpc.socialHub.getWeekPosts.useQuery({
    platform: selectedPlatform as any,
    status: "draft",
  });
  const deletePostMutation = trpc.socialHub.deletePost.useMutation();
  const schedulePostMutation = trpc.socialHub.schedulePost.useMutation();

  const handleGenerateWeek = useCallback(async () => {
    setIsGenerating(true);
    try {
      const result = await generateWeekMutation.mutateAsync({
        platform: selectedPlatform,
        destinationCount: 3,
      });
      setPosts(result.posts);
      toast.success(`Generated ${result.count} posts for the week!`);
      getWeekPostsQuery.refetch();
    } catch (error) {
      toast.error("Failed to generate posts");
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  }, [selectedPlatform, generateWeekMutation, getWeekPostsQuery]);

  const handleCopyPost = (post: Post) => {
    const text = `TITLE: ${post.title || "No Title"}

CONTENT:
${post.body}

CAPTION:
${post.caption || ""}

HASHTAGS:
${post.hashtags || ""}

IMAGE PROMPT:
${post.imagePrompt || ""}`;

    navigator.clipboard.writeText(text);
    setShowCopied(post.id);
    toast.success("Post copied to clipboard!");
    setTimeout(() => setShowCopied(null), 2000);
  };

  const handleDeletePost = async (id: number) => {
    if (confirm("Delete this post?")) {
      try {
        await deletePostMutation.mutateAsync({ id });
        setPosts(posts.filter((p) => p.id !== id));
        toast.success("Post deleted");
      } catch (error) {
        toast.error("Failed to delete post");
      }
    }
  };

  const handleSchedulePost = async (id: number) => {
    const post = posts.find((p) => p.id === id);
    if (!post) return;

    const dateStr = prompt("Schedule for (YYYY-MM-DD HH:MM):");
    if (!dateStr) return;

    try {
      await schedulePostMutation.mutateAsync({
        id,
        scheduledFor: new Date(dateStr),
      });
      toast.success("Post scheduled!");
      getWeekPostsQuery.refetch();
    } catch (error) {
      toast.error("Failed to schedule post");
    }
  };

  // Organize posts by day of week
  const postsByDay = DAYS_OF_WEEK.map((day, index) => ({
    day,
    posts: posts.length > index ? [posts[index]] : [],
  }));

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen rounded-lg">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">📱 Social Media Calendar</h1>
        <div className="flex gap-2">
          {PLATFORMS.map((platform) => (
            <button
              key={platform}
              onClick={() => setSelectedPlatform(platform)}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                selectedPlatform === platform
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              {platform.charAt(0).toUpperCase() + platform.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Generate Button */}
      <div className="flex gap-3">
        <button
          onClick={handleGenerateWeek}
          disabled={isGenerating}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-bold shadow-lg transition transform hover:scale-105"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="animate-spin" size={20} />
              Generating...
            </>
          ) : (
            <>
              <Zap size={20} />
              Generate This Week's Posts
            </>
          )}
        </button>
        <p className="text-sm text-gray-600 flex items-center">
          Create 7 tailored posts with copy-paste content, hashtags, and image prompts
        </p>
      </div>

      {/* Weekly Calendar Grid */}
      {posts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6">
          {postsByDay.map((dayData, index) => {
            const post = dayData.posts[0];
            return (
              <div
                key={dayData.day}
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition overflow-hidden border-l-4 border-blue-500"
              >
                {/* Day Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4">
                  <h2 className="text-xl font-bold">{dayData.day}</h2>
                  <p className="text-blue-100 text-sm">
                    {format(addDays(new Date(), index), "MMM d, yyyy")}
                  </p>
                </div>

                {post ? (
                  <div className="p-6 space-y-4">
                    {/* Post Title */}
                    {post.title && (
                      <div className="bg-amber-50 p-3 rounded-lg border-l-4 border-amber-400">
                        <p className="text-xs text-gray-600 font-semibold uppercase">Title</p>
                        <p className="font-bold text-gray-800 text-lg">{post.title}</p>
                      </div>
                    )}

                    {/* Main Content */}
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <p className="text-xs text-gray-600 font-semibold uppercase">Content</p>
                      <p className="text-gray-800 whitespace-pre-wrap text-sm leading-relaxed">
                        {post.body}
                      </p>
                    </div>

                    {/* Caption */}
                    {post.caption && (
                      <div className="bg-green-50 p-3 rounded-lg border-l-4 border-green-400">
                        <p className="text-xs text-gray-600 font-semibold uppercase">Caption</p>
                        <p className="text-gray-800 font-semibold">{post.caption}</p>
                      </div>
                    )}

                    {/* Hashtags */}
                    {post.hashtags && (
                      <div className="bg-pink-50 p-3 rounded-lg border-l-4 border-pink-400">
                        <p className="text-xs text-gray-600 font-semibold uppercase">Hashtags</p>
                        <p className="text-pink-700 font-mono text-sm break-words">
                          {post.hashtags}
                        </p>
                      </div>
                    )}

                    {/* Image Prompt */}
                    {post.imagePrompt && (
                      <div className="bg-purple-50 p-3 rounded-lg border-l-4 border-purple-400">
                        <p className="text-xs text-gray-600 font-semibold uppercase">Image Prompt</p>
                        <p className="text-gray-800 text-sm italic">{post.imagePrompt}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          💡 Use this prompt in DALL-E, Midjourney, or your image editor
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-4 border-t">
                      <button
                        onClick={() => handleCopyPost(post)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition ${
                          showCopied === post.id
                            ? "bg-green-500 text-white"
                            : "bg-blue-500 hover:bg-blue-600 text-white"
                        }`}
                      >
                        <Copy size={16} />
                        {showCopied === post.id ? "Copied!" : "Copy All"}
                      </button>
                      <button
                        onClick={() => handleSchedulePost(post.id)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold bg-orange-500 hover:bg-orange-600 text-white transition"
                      >
                        <Calendar size={16} />
                        Schedule
                      </button>
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold bg-red-500 hover:bg-red-600 text-white transition ml-auto"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center text-gray-400">
                    <p>No post yet. Generate the week to create content!</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <Zap size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            Ready to Generate This Week's Posts?
          </h3>
          <p className="text-gray-600 mb-6">
            Click the button above to auto-generate 7 unique, platform-tailored posts with hashtags,
            captions, and image prompts ready to go!
          </p>
          <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-900">
            <p className="font-semibold mb-2">🎯 What you'll get:</p>
            <ul className="text-left space-y-1">
              <li>✨ Monday: Travel Hack</li>
              <li>🌟 Tuesday: Destination Spotlight</li>
              <li>📸 Wednesday: Customer Story</li>
              <li>🎉 Thursday: Deal Alert</li>
              <li>🏖️ Friday: Featured Destination</li>
              <li>🎭 Saturday: Culture & Experience</li>
              <li>🗺️ Sunday: Planning CTA</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminSocialHub;
