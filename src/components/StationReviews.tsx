import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, Send, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Review {
  id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user_email?: string;
}

interface StationReviewsProps {
  stationId: string;
}

export default function StationReviews({ stationId }: StationReviewsProps) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReviews();

    const channel = supabase
      .channel('reviews')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'station_reviews',
        filter: `station_id=eq.${stationId}`
      }, () => {
        fetchReviews();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [stationId]);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('station_reviews')
        .select('*')
        .eq('station_id', stationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to leave a review',
        variant: 'destructive'
      });
      return;
    }

    if (rating === 0) {
      toast({
        title: 'Rating required',
        description: 'Please select a rating',
        variant: 'destructive'
      });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('station_reviews')
        .insert({
          station_id: stationId,
          user_id: user.id,
          rating,
          comment: comment.trim() || null
        });

      if (error) throw error;

      toast({
        title: 'Review submitted',
        description: 'Thank you for your feedback!'
      });

      setRating(0);
      setComment('');
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit review',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (reviewId: string) => {
    try {
      const { error } = await supabase
        .from('station_reviews')
        .delete()
        .eq('id', reviewId);

      if (error) throw error;

      toast({
        title: 'Review deleted',
        description: 'Your review has been removed'
      });
    } catch (error) {
      console.error('Error deleting review:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete review',
        variant: 'destructive'
      });
    }
  };

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return (
    <div className="space-y-4">
      {/* Average Rating */}
      {reviews.length > 0 && (
        <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-xl">
          <div className="text-3xl font-bold">{avgRating.toFixed(1)}</div>
          <div>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    'h-4 w-4',
                    star <= avgRating ? 'text-warning fill-current' : 'text-muted-foreground'
                  )}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{reviews.length} reviews</p>
          </div>
        </div>
      )}

      {/* Add Review */}
      {user && (
        <div className="space-y-3 p-4 border border-border/30 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Your Rating</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="touch-target p-1"
                >
                  <Star
                    className={cn(
                      'h-5 w-5 transition-colors',
                      star <= rating ? 'text-warning fill-current' : 'text-muted-foreground'
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          <Textarea
            placeholder="Share your experience (optional)..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            className="resize-none"
          />

          <Button
            onClick={handleSubmit}
            disabled={submitting || rating === 0}
            className="w-full"
            size="sm"
          >
            <Send className="h-4 w-4 mr-2" />
            Submit Review
          </Button>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center text-muted-foreground py-8">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No reviews yet. Be the first to review!
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="p-4 border border-border/30 rounded-xl">
              <div className="flex items-start justify-between mb-2">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn(
                        'h-4 w-4',
                        star <= review.rating ? 'text-warning fill-current' : 'text-muted-foreground'
                      )}
                    />
                  ))}
                </div>
                {user?.id === review.user_id && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(review.id)}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {review.comment && (
                <p className="text-sm text-muted-foreground mb-2">{review.comment}</p>
              )}

              <p className="text-xs text-muted-foreground">
                {new Date(review.created_at).toLocaleDateString()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
