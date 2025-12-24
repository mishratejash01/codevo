import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Star, Loader2, User, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface Review {
  id: string;
  rating: number;
  review_text: string | null;
  is_verified: boolean;
  created_at: string;
  user_id: string | null;
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface EventReviewsProps {
  eventId: string;
}

export function EventReviews({ eventId }: EventReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [newReview, setNewReview] = useState('');
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [hasReviewed, setHasReviewed] = useState(false);

  useEffect(() => {
    fetchReviews();
    checkAuth();
  }, [eventId]);

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    setUserId(user?.id || null);

    if (user) {
      const { data } = await supabase
        .from('event_reviews')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .maybeSingle();
      
      setHasReviewed(!!data);
    }
  }

  async function fetchReviews() {
    const { data, error } = await supabase
      .from('event_reviews')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      // Fetch profiles separately
      const userIds = data.filter(r => r.user_id).map(r => r.user_id as string);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      const reviewsWithProfiles = data.map(r => ({
        ...r,
        profiles: profiles?.find(p => p.id === r.user_id) || null
      }));
      setReviews(reviewsWithProfiles as Review[]);
    }
    setLoading(false);
  }

  async function handleSubmit() {
    if (rating === 0 || !userId) return;

    setSubmitting(true);
    const { error } = await supabase
      .from('event_reviews')
      .insert({
        event_id: eventId,
        user_id: userId,
        rating,
        review_text: newReview.trim() || null,
      });

    if (error) {
      toast.error('Failed to submit review');
    } else {
      toast.success('Review submitted!');
      setNewReview('');
      setRating(0);
      setHasReviewed(true);
      fetchReviews();
    }
    setSubmitting(false);
  }

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin h-6 w-6 text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-white flex items-center gap-2">
        <div className="w-1 h-6 bg-pink-500 rounded-full" />
        Reviews & Feedback
      </h3>

      {/* Rating summary */}
      <div className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/20 rounded-xl p-6 flex items-center gap-6">
        <div className="text-center">
          <div className="text-4xl font-bold text-white">{averageRating}</div>
          <div className="flex items-center gap-1 mt-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${i <= Math.round(parseFloat(averageRating)) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-500'}`}
              />
            ))}
          </div>
          <div className="text-gray-400 text-sm mt-1">{reviews.length} reviews</div>
        </div>
      </div>

      {/* New review form */}
      {userId && !hasReviewed && (
        <div className="bg-[#151518] border border-white/10 rounded-xl p-5">
          <h4 className="text-white font-medium mb-4">Leave a Review</h4>
          
          <div className="flex items-center gap-2 mb-4">
            <span className="text-gray-400 text-sm mr-2">Your rating:</span>
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                key={i}
                onMouseEnter={() => setHoveredRating(i)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => setRating(i)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`w-6 h-6 ${
                    i <= (hoveredRating || rating) 
                      ? 'text-yellow-400 fill-yellow-400' 
                      : 'text-gray-500'
                  }`}
                />
              </button>
            ))}
          </div>

          <Textarea
            placeholder="Share your experience (optional)..."
            value={newReview}
            onChange={(e) => setNewReview(e.target.value)}
            className="bg-[#09090b] border-white/10 text-white min-h-[80px] mb-3"
          />

          <Button 
            onClick={handleSubmit} 
            disabled={submitting || rating === 0}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Submit Review
          </Button>
        </div>
      )}

      {/* Reviews list */}
      {reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-[#151518] border border-white/10 rounded-xl p-5"
            >
              <div className="flex items-start gap-4">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={review.profiles?.avatar_url || undefined} />
                  <AvatarFallback className="bg-purple-500/20 text-purple-400">
                    <User className="w-5 h-5" />
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-white">
                      {review.profiles?.full_name || 'Anonymous'}
                    </span>
                    {review.is_verified && (
                      <span className="inline-flex items-center gap-1 text-xs text-green-400">
                        <CheckCircle className="w-3 h-3" />
                        Verified
                      </span>
                    )}
                    <span className="text-gray-500 text-sm">
                      {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-500'}`}
                      />
                    ))}
                  </div>

                  {review.review_text && (
                    <p className="text-gray-300">{review.review_text}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-[#151518] rounded-2xl border border-white/10">
          <Star className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400 mb-2">No reviews yet</p>
          <p className="text-gray-500 text-sm">Be the first to share your experience!</p>
        </div>
      )}
    </div>
  );
}
