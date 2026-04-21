"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageSquare, Send, Trash2, MoreVertical, Check, X } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface Post {
  id: string;
  organization_id: string;
  user_id: string;
  content: string;
  likes: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  profiles?: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    avatar_url: string | null;
  };
  has_liked?: boolean;
}

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    avatar_url: string | null;
  };
}

interface FreedomWallProps {
  organizationId: string;
  userRole: 'creator' | 'officer' | 'member' | null;
}

export default function FreedomWall({ organizationId, userRole }: FreedomWallProps) {
  const { user, profile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState("");
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [newCommentContent, setNewCommentContent] = useState<Record<string, string>>({});
  const [expandedPosts, setExpandedPosts] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadPosts();
  }, [organizationId]);

  const loadPosts = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from("freedom_wall_posts")
        .select(`*, profiles:user_id(first_name, last_name, email, avatar_url)`)
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setPosts(data || []);
      
    } catch (error) {
      console.error("Error loading posts:", error);
      toast.error("Failed to load posts");
    } finally {
      setIsLoading(false);
    }
  };

  const loadComments = async (postId: string) => {
    try {
      const { data, error } = await supabase
        .from("freedom_wall_comments")
        .select(`*, profiles:user_id(first_name, last_name, email, avatar_url)`)
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      setComments(prev => ({ ...prev, [postId]: data || [] }));
    } catch (error) {
      console.error("Error loading comments:", error);
      toast.error("Failed to load comments");
    }
  };

  const handleCreatePost = async () => {
    if (!user || !newPostContent.trim()) return;

    try {
      const { error } = await supabase
        .from("freedom_wall_posts")
        .insert([{
          organization_id: organizationId,
          user_id: user.id,
          content: newPostContent.trim(),
          likes: 0,
          comments_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }]);

      if (error) throw error;

      toast.success("Post created successfully!");
      setNewPostContent("");
      loadPosts();
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("Failed to create post");
    }
  };

  const handleLikePost = async (postId: string) => {
    if (!user) {
      toast.error("Please login to like posts");
      return;
    }

    try {
      const { data: existingLike, error: checkError } = await supabase
        .from("freedom_wall_likes")
        .select("*")
        .eq("post_id", postId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingLike) {
        // Unlike
        const { error: unlikeError } = await supabase
          .from("freedom_wall_likes")
          .delete()
          .eq("id", existingLike.id);

        if (unlikeError) throw unlikeError;

        // Update post likes count
        const { error: updateError } = await supabase
          .from("freedom_wall_posts")
          .update({ likes: Math.max(0, (posts.find(p => p.id === postId)?.likes || 0) - 1) })
          .eq("id", postId);

        if (updateError) throw updateError;

        setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: p.likes - 1 } : p));
      } else {
        // Like
        const { error: likeError } = await supabase
          .from("freedom_wall_likes")
          .insert([{
            post_id: postId,
            user_id: user.id,
            created_at: new Date().toISOString(),
          }]);

        if (likeError) throw likeError;

        // Update post likes count
        const { error: updateError } = await supabase
          .from("freedom_wall_posts")
          .update({ likes: (posts.find(p => p.id === postId)?.likes || 0) + 1 })
          .eq("id", postId);

        if (updateError) throw updateError;

        setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: p.likes + 1 } : p));
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      toast.error("Failed to update like");
    }
  };

  const handleCreateComment = async (postId: string) => {
    if (!user || !newCommentContent[postId]?.trim()) return;

    try {
      const { error } = await supabase
        .from("freedom_wall_comments")
        .insert([{
          post_id: postId,
          user_id: user.id,
          content: newCommentContent[postId].trim(),
          created_at: new Date().toISOString(),
        }]);

      if (error) throw error;

      // Update comments count
      const { error: updateError } = await supabase
        .from("freedom_wall_posts")
        .update({ comments_count: (posts.find(p => p.id === postId)?.comments_count || 0) + 1 })
        .eq("id", postId);

      if (updateError) throw updateError;

      toast.success("Comment added!");
      setNewCommentContent(prev => ({ ...prev, [postId]: "" }));
      loadComments(postId);
      loadPosts();
    } catch (error) {
      console.error("Error creating comment:", error);
      toast.error("Failed to add comment");
    }
  };

  const handleEditPost = async (postId: string) => {
    if (!editContent.trim()) {
      toast.error("Post content cannot be empty");
      return;
    }

    try {
      const { error } = await supabase
        .from("freedom_wall_posts")
        .update({ content: editContent.trim(), updated_at: new Date().toISOString() })
        .eq("id", postId);

      if (error) throw error;

      toast.success("Post updated!");
      setEditingPostId(null);
      setEditContent("");
      loadPosts();
    } catch (error) {
      console.error("Error updating post:", error);
      toast.error("Failed to update post");
    }
  };

  const handleDeletePost = async () => {
    if (!deletingPostId) return;

    try {
      // Delete comments first
      const { error: commentError } = await supabase
        .from("freedom_wall_comments")
        .delete()
        .eq("post_id", deletingPostId);

      if (commentError) throw commentError;

      // Delete likes
      const { error: likeError } = await supabase
        .from("freedom_wall_likes")
        .delete()
        .eq("post_id", deletingPostId);

      if (likeError) throw likeError;

      // Delete post
      const { error: postError } = await supabase
        .from("freedom_wall_posts")
        .delete()
        .eq("id", deletingPostId);

      if (postError) throw postError;

      toast.success("Post deleted successfully!");
      setDeletingPostId(null);
      loadPosts();
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post");
    }
  };

  const handleDeleteComment = async () => {
    if (!deletingCommentId) return;

    try {
      const { error } = await supabase
        .from("freedom_wall_comments")
        .delete()
        .eq("id", deletingCommentId);

      if (error) throw error;

      toast.success("Comment deleted!");
      setDeletingCommentId(null);
      loadPosts();
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Failed to delete comment");
    }
  };

  const canDeletePost = (postUserId: string) => {
    return userRole === "creator" || userRole === "officer" || user?.id === postUserId;
  };

  const canDeleteComment = (commentUserId: string) => {
    return userRole === "creator" || userRole === "officer" || user?.id === commentUserId;
  };

  if (isLoading) {
    return (
      <div className="min-h-[200px] flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Create Post Section */}
      <Card>
        <CardHeader>
          <CardTitle>Create a Post</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Textarea
              placeholder="What's on your mind? Share your thoughts with the community..."
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              rows={3}
            />
            <Button
              onClick={handleCreatePost}
              disabled={!newPostContent.trim()}
              className="gap-2"
            >
              <Send className="h-4 w-4" /> Post
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Posts List */}
      {posts.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">No posts yet. Be the first to create one!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <Card key={post.id}>
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={post.profiles?.avatar_url || undefined} />
                    <AvatarFallback>
                      {post.profiles?.first_name?.charAt(0) || "U"}{post.profiles?.last_name?.charAt(0) || ""}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">
                        {post.profiles?.first_name} {post.profiles?.last_name}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {new Date(post.created_at).toLocaleString()}
                      </span>
                    </div>
                    {editingPostId === post.id ? (
                      <div className="space-y-2 mt-2">
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleEditPost(post.id)}>
                            <Check className="h-4 w-4" /> Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => {
                            setEditingPostId(null);
                            setEditContent("");
                          }}>
                            <X className="h-4 w-4" /> Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm mt-1 whitespace-pre-line">{post.content}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 h-6 px-2"
                        onClick={() => handleLikePost(post.id)}
                      >
                        <Heart className="h-4 w-4" />
                        <span>{post.likes} {post.likes === 1 ? "Like" : "Likes"}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 h-6 px-2"
                        onClick={() => {
                          setExpandedPosts(prev => ({
                            ...prev,
                            [post.id]: !prev[post.id]
                          }));
                          loadComments(post.id);
                        }}
                      >
                        <MessageSquare className="h-4 w-4" />
                        <span>{post.comments_count} {post.comments_count === 1 ? "Comment" : "Comments"}</span>
                      </Button>
                      {canDeletePost(post.user_id) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 px-2">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => {
                              setEditingPostId(post.id);
                              setEditContent(post.content);
                            }}>
                              Edit Post
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setDeletingPostId(post.id)} className="text-destructive">
                              Delete Post
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                    {/* Comments Section */}
                    {(expandedPosts[post.id] || post.comments_count === 0) && (
                      <div className="mt-3 space-y-3 pl-2 border-l">
                        {comments[post.id]?.map((comment) => (
                          <div key={comment.id} className="flex items-start gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={comment.profiles?.avatar_url || undefined} />
                              <AvatarFallback>
                                {comment.profiles?.first_name?.charAt(0) || "U"}{comment.profiles?.last_name?.charAt(0) || ""}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-xs">
                                  {comment.profiles?.first_name} {comment.profiles?.last_name}
                                </p>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(comment.created_at).toLocaleTimeString()}
                                </span>
                                {canDeleteComment(comment.user_id) && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-5 w-5 p-0 ml-auto"
                                    onClick={() => setDeletingCommentId(comment.id)}
                                  >
                                    <Trash2 className="h-3 w-3 text-destructive" />
                                  </Button>
                                )}
                              </div>
                              <p className="text-xs mt-1">{comment.content}</p>
                            </div>
                          </div>
                        ))}
                        <div className="flex items-start gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={profile?.avatar_url || undefined} />
                            <AvatarFallback>
                              {profile?.first_name?.charAt(0) || "U"}{profile?.last_name?.charAt(0) || ""}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <Textarea
                              placeholder="Add a comment..."
                              value={newCommentContent[post.id] || ""}
                              onChange={(e) => setNewCommentContent(prev => ({
                                ...prev,
                                [post.id]: e.target.value
                              }))}
                              rows={1}
                              className="text-xs"
                            />
                            <div className="flex justify-end mt-1">
                              <Button
                                size="sm"
                                onClick={() => handleCreateComment(post.id)}
                                disabled={!newCommentContent[post.id]?.trim()}
                              >
                                Post Comment
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Post Confirmation */}
      <AlertDialog open={!!deletingPostId} onOpenChange={() => setDeletingPostId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePost} className="bg-destructive hover:bg-destructive/90">
              Delete Post
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Comment Confirmation */}
      <AlertDialog open={!!deletingCommentId} onOpenChange={() => setDeletingCommentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Comment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this comment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteComment} className="bg-destructive hover:bg-destructive/90">
              Delete Comment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}