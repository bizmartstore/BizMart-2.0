"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThumbsUp, MessageSquare, Send, Trash2, MoreVertical, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface Post {
  id: string;
  organization_id: string;
  user_id: string;
  content: string;
  likes: number;
  comments: number;
  created_at: string;
  profiles?: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    avatar_url: string | null;
  };
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
  const [newCommentContent, setNewCommentContent] = useState<Record<string, string>>({});
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [commentToDelete, setCommentToDelete] = useState<{ postId: string; commentId: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPosts = useCallback(async () => {
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
      console.error("Error fetching posts:", error);
      toast.error("Failed to load posts");
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]);

  const fetchComments = useCallback(async (postId: string) => {
    try {
      const { data, error } = await supabase
        .from("freedom_wall_comments")
        .select(`*, profiles:user_id(first_name, last_name, email, avatar_url)`)
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error("Error fetching comments:", error);
      toast.error("Failed to load comments");
      return [];
    }
  }, []);

  useEffect(() => {
    if (organizationId) {
      fetchPosts();
    }
  }, [organizationId, fetchPosts]);

  const handleCreatePost = async () => {
    if (!user || !newPostContent.trim()) return;

    try {
      setIsSubmitting(true);

      const { error } = await supabase
        .from("freedom_wall_posts")
        .insert([{
          organization_id: organizationId,
          user_id: user.id,
          content: newPostContent.trim(),
          likes: 0,
          comments: 0,
          created_at: new Date().toISOString(),
        }]);

      if (error) throw error;

      toast.success("Post created successfully!");
      setNewPostContent("");
      fetchPosts();
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("Failed to create post");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLikePost = async (postId: string) => {
    if (!user) return;

    try {
      // Check if already liked
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

        // Decrement like count
        const { error: updateError } = await supabase
          .from("freedom_wall_posts")
          .update({ likes: Math.max(0, (posts.find(p => p.id === postId)?.likes || 0) - 1) })
          .eq("id", postId);

        if (updateError) throw updateError;

        setPosts(posts.map(p => p.id === postId ? { ...p, likes: Math.max(0, p.likes - 1) } : p));
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

        // Increment like count
        const { error: updateError } = await supabase
          .from("freedom_wall_posts")
          .update({ likes: (posts.find(p => p.id === postId)?.likes || 0) + 1 })
          .eq("id", postId);

        if (updateError) throw updateError;

        setPosts(posts.map(p => p.id === postId ? { ...p, likes: p.likes + 1 } : p));
      }
    } catch (error) {
      console.error("Error liking post:", error);
      toast.error("Failed to update like");
    }
  };

  const handleCreateComment = async (postId: string) => {
    if (!user || !newCommentContent[postId]?.trim()) return;

    try {
      setIsSubmitting(true);

      const { error } = await supabase
        .from("freedom_wall_comments")
        .insert([{
          post_id: postId,
          user_id: user.id,
          content: newCommentContent[postId].trim(),
          created_at: new Date().toISOString(),
        }]);

      if (error) throw error;

      // Increment comment count
      const { error: updateError } = await supabase
        .from("freedom_wall_posts")
        .update({ comments: (posts.find(p => p.id === postId)?.comments || 0) + 1 })
        .eq("id", postId);

      if (updateError) throw updateError;

      toast.success("Comment added!");
      setNewCommentContent({ ...newCommentContent, [postId]: "" });
      fetchPosts();
    } catch (error) {
      console.error("Error creating comment:", error);
      toast.error("Failed to add comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePost = async () => {
    if (!postToDelete) return;

    try {
      // Delete comments first
      const { error: deleteCommentsError } = await supabase
        .from("freedom_wall_comments")
        .delete()
        .eq("post_id", postToDelete);

      if (deleteCommentsError) throw deleteCommentsError;

      // Delete likes
      const { error: deleteLikesError } = await supabase
        .from("freedom_wall_likes")
        .delete()
        .eq("post_id", postToDelete);

      if (deleteLikesError) throw deleteLikesError;

      // Delete post
      const { error: deletePostError } = await supabase
        .from("freedom_wall_posts")
        .delete()
        .eq("id", postToDelete);

      if (deletePostError) throw deletePostError;

      toast.success("Post deleted successfully!");
      fetchPosts();
      setPostToDelete(null);
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post");
    }
  };

  const handleDeleteComment = async () => {
    if (!commentToDelete) return;

    try {
      const { postId, commentId } = commentToDelete;

      const { error } = await supabase
        .from("freedom_wall_comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;

      // Decrement comment count
      const { error: updateError } = await supabase
        .from("freedom_wall_posts")
        .update({ comments: Math.max(0, (posts.find(p => p.id === postId)?.comments || 0) - 1) })
        .eq("id", postId);

      if (updateError) throw updateError;

      toast.success("Comment deleted successfully!");
      fetchPosts();
      setCommentToDelete(null);
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Failed to delete comment");
    }
  };

  const canManagePosts = userRole === "creator" || userRole === "officer";

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create Post Section */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg">Create a Post</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Textarea
              placeholder="What's on your mind? Share your thoughts, ideas, or announcements with the organization..."
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              className="min-h-[100px] resize-none"
              disabled={isSubmitting}
            />
            <div className="flex justify-end">
              <Button
                onClick={handleCreatePost}
                disabled={!newPostContent.trim() || isSubmitting}
                className="gap-2"
              >
                <Send className="h-4 w-4" /> Post
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Posts List */}
      {posts.length === 0 ? (
        <Card className="text-center py-8">
          <CardContent>
            <p className="text-muted-foreground">No posts yet. Be the first to create one!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <Card key={post.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={post.profiles?.avatar_url || undefined} />
                    <AvatarFallback>
                      {post.profiles?.first_name?.charAt(0) || "U"}{post.profiles?.last_name?.charAt(0) || ""}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {post.profiles?.first_name} {post.profiles?.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(post.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                {canManagePosts && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setPostToDelete(post.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Delete Post
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line mb-4">{post.content}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 h-8 px-2"
                    onClick={() => handleLikePost(post.id)}
                  >
                    <ThumbsUp className={`h-4 w-4 ${posts.find(p => p.id === post.id)?.likes && user ? 'fill-blue-500 text-blue-500' : ''}`} />
                    <span>{post.likes} {post.likes === 1 ? 'Like' : 'Likes'}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 h-8 px-2"
                    onClick={() => {
                      // Scroll to comment section or open comment input
                      const commentInput = document.getElementById(`comment-input-${post.id}`);
                      if (commentInput) {
                        commentInput.scrollIntoView({ behavior: "smooth", block: "center" });
                        commentInput.focus();
                      }
                    }}
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span>{post.comments} {post.comments === 1 ? 'Comment' : 'Comments'}</span>
                  </Button>
                </div>
                {/* Comment Section */}
                <div className="space-y-3 mt-4">
                  {post.comments > 0 && (
                    <div className="space-y-3">
                      {posts.find(p => p.id === post.id)?.comments ? (
                        <div className="space-y-3">
                          {posts
                            .find(p => p.id === post.id)
                            ?.comments && "profiles" in posts.find(p => p.id === post.id)! &&
                            posts.find(p => p.id === post.id)?.comments > 0 ? (
                            <div className="space-y-3">
                              {(posts.find(p => p.id === post.id) as any).commentsData?.map((comment: Comment) => (
                                <div key={comment.id} className="flex items-start gap-3 p-3 bg-muted/20 rounded-lg">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={comment.profiles?.avatar_url || undefined} />
                                    <AvatarFallback>
                                      {comment.profiles?.first_name?.charAt(0) || "U"}{comment.profiles?.last_name?.charAt(0) || ""}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <p className="font-medium text-sm">
                                        {comment.profiles?.first_name} {comment.profiles?.last_name}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {new Date(comment.created_at).toLocaleString()}
                                      </p>
                                    </div>
                                    <p className="text-sm whitespace-pre-line">{comment.content}</p>
                                  </div>
                                  {canManagePosts && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={() => setCommentToDelete({ postId: post.id, commentId: comment.id })}
                                    >
                                      <Trash2 className="h-3 w-3 text-destructive" />
                                    </Button>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  )}
                  {/* Add Comment */}
                  <div className="flex items-center gap-2 mt-4" id={`comment-input-${post.id}`}>
                    <Input
                      placeholder="Add a comment..."
                      value={newCommentContent[post.id] || ""}
                      onChange={(e) => setNewCommentContent({ ...newCommentContent, [post.id]: e.target.value })}
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleCreateComment(post.id);
                        }
                      }}
                      className="flex-1"
                    />
                    <Button
                      onClick={() => handleCreateComment(post.id)}
                      disabled={!newCommentContent[post.id]?.trim() || isSubmitting}
                      size="sm"
                      className="gap-2"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Post Confirmation */}
      <AlertDialog open={!!postToDelete} onOpenChange={() => setPostToDelete(null)}>
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
      <AlertDialog open={!!commentToDelete} onOpenChange={() => setCommentToDelete(null)}>
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
