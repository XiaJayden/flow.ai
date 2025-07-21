'use client'

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InstrumentAvatar } from '@/components/ui/instrument-avatar';
import { CommentWithUser } from '@/types';
import { Reply, Send } from 'lucide-react';

interface CommentThreadProps {
  annotationId: string;
  comments: CommentWithUser[];
  onCommentAdded: () => void;
}

export function CommentThread({ annotationId, comments, onCommentAdded }: CommentThreadProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!replyContent.trim()) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/annotations/${annotationId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: replyContent.trim()
        })
      });

      if (response.ok) {
        setReplyContent('');
        setShowReplyForm(false);
        onCommentAdded();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to add comment');
      }
    } catch (error) {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Existing Comments */}
      {comments.length > 0 && (
        <div className="space-y-2">
          {comments.map(comment => (
            <div key={comment.id} className="flex gap-2 text-sm">
              <InstrumentAvatar
                instruments={comment.user.instruments}
                fallbackText={comment.user.username.charAt(0).toUpperCase()}
                className="h-5 w-5 mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-xs">{comment.user.username}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm mt-1">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reply Form */}
      {showReplyForm ? (
        <form onSubmit={handleSubmitReply} className="space-y-2">
          {error && (
            <div className="text-xs text-red-600">{error}</div>
          )}
          <div className="flex gap-2">
            <Input
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write a reply..."
              className="text-sm"
              disabled={loading}
            />
            <Button type="submit" size="sm" disabled={loading || !replyContent.trim()}>
              <Send className="h-3 w-3" />
            </Button>
          </div>
          <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              setShowReplyForm(false);
              setReplyContent('');
              setError('');
            }}
            className="text-xs h-6"
          >
            Cancel
          </Button>
        </form>
      ) : (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setShowReplyForm(true)}
          className="text-xs h-6 text-muted-foreground hover:text-foreground"
        >
          <Reply className="h-3 w-3 mr-1" />
          Reply
        </Button>
      )}
    </div>
  );
}