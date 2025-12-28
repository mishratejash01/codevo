import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Star, Loader2, User, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Review {
  id: string;
  content: string;
  rating: number;
  created_at: string;
  user_id: string;
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
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchReviews();
    checkAuth();
  }, [eventId]);

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    setUserId(user?.id || null);
  }

  async function fetchReviews() {
    const { data, error } = await supabase
      .from('event_reviews')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      const userIds = data.map(r => r.user_id);
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
    if (!newReview.trim() || !userId) return;

    setSubmitting(true);
    const { error } = await supabase
      .from('event_reviews')
      .insert({
        event_id: eventId,
        user_id: userId,
        content: newReview.trim(),
        rating,
      });

    if (error) {
      toast.error('Failed to submit review');
    } else {
      toast.success('Review submitted!');
      setNewReview('');
      setRating(5);
      fetchReviews();
    }
    setSubmitting(false);
  }

  const averageRating = reviews.length > 0
    ? (reviews.reduce((acc, rev) => acc + rev.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  const StarRow = ({ score, size = 14, className = "" }: { score: number, size?: number, className?: string }) => (
    <div className={cn("flex gap-1 text-[#ff8c00]", className)}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={size}
          fill={s <= score ? "currentColor" : "none"}
          className={cn(s > score && "text-[#222]")}
        />
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin h-6 w-6 text-[#ff8c00]" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-[800px] mx-auto font-sans selection:bg-orange-500/30">
      
      {/* --- Section Header --- */}
      <div className="flex items-center gap-[15px] mb-[40px]">
        <div className="w-[2px] h-[24px] bg-[#ff8c00]" />
        <h3 className="font-serif text-[2.2rem] font-normal tracking-[-0.5px] text-white">
          Participant Feedback
        </h3>
      </div>

      {/* --- Rating Summary Card --- */}
      <div className="bg-[#050505] border border-[#1a1a1a] p-[40px] flex flex-col md:flex-row items-center gap-[40px] mb-[40px]">
        <div className="font-serif text-[4rem] font-bold text-white leading-none">
          {averageRating}
        </div>
        <div className="flex flex-col gap-2 items-center md:items-start text-center md:text-left">
          <span className="text-[0.7rem] uppercase tracking-[2px] text-[#666666]">Overall Rating</span>
          <StarRow score={Math.round(Number(averageRating))} />
          <span className="text-[0.7rem] uppercase tracking-[2px] text-[#666666] mt-1">
            Based on {reviews.length} reviews
          </span>
        </div>
      </div>

      {/* --- New Review Form (Auth Protected) --- */}
      {userId ? (
        <div className="border border-[#1a1a1a] p-[30px] mb-[60px] relative">
          <span className="block text-[0.7rem] uppercase tracking-[2px] text-[#666666] mb-[20px] font-bold">
            Share your experience
          </span>
          
          <div className="flex gap-[10px] mb-[25px]">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                onClick={() => setRating(s)}
                className={cn(
                  "bg-none border-none cursor-pointer transition-colors duration-200",
                  s <= rating ? "text-[#ff8c00]" : "text-[#222] hover:text-[#ff8c00]/50"
                )}
              >
                <Star size={24} fill={s <= rating ? "currentColor" : "none"} />
              </button>
            ))}
          </div>

          <textarea
            placeholder="Write a few words about the assembly..."
            value={newReview}
            onChange={(e) => setNewReview(e.target.value)}
            className="w-full bg-transparent border-none border-b border-[#1a1a1a] focus:border-[#ff8c00] text-white font-inter text-[1rem] min-h-[60px] resize-none outline-none pb-[15px] mb-[25px] font-light placeholder:text-[#333] transition-colors"
          />

          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={submitting || !newReview.trim()}
              className="bg-[#ff8c00] hover:bg-white text-black border-none px-[30px] py-[14px] text-[0.75rem] font-extrabold uppercase tracking-[3px] cursor-pointer transition-all duration-300 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Review'}
            </button>
          </div>
        </div>
      ) : (
        <div className="border border-[#1a1a1a] p-[40px] mb-[60px] text-center bg-[#050505]">
          <p className="text-[#666666] text-xs uppercase tracking-widest">
            Authorization required to submit feedback
          </p>
        </div>
      )}

      {/* --- Reviews List --- */}
      {reviews.length > 0 ? (
        <div className="divide-y divide-[#1a1a1a]">
          {reviews.map((review) => (
            <div key={review.id} className="py-[40px] flex flex-col md:flex-row gap-[25px] first:pt-0">
              {/* Avatar */}
              <div className="w-[50px] h-[50px] border border-[#1a1a1a] shrink-0 bg-[#080808] overflow-hidden flex items-center justify-center">
                {review.profiles?.avatar_url ? (
                  <img 
                    src={review.profiles.avatar_url} 
                    alt="Avatar" 
                    className="w-full h-full object-cover grayscale"
                  />
                ) : (
                  <User size={20} className="text-[#333]" />
                )}
              </div>

              {/* Review Content */}
              <div className="grow">
                <div className="flex justify-between items-start mb-[15px]">
                  <div className="flex flex-col gap-1.5">
                    <h4 className="text-[1rem] font-medium text-white">
                      {review.profiles?.full_name || 'Anonymous Operative'}
                    </h4>
                    <div className="inline-flex items-center gap-[6px] px-[10px] py-[4px] border border-[#1a1a1a] bg-white/[0.02] text-[0.6rem] uppercase tracking-[1px] text-[#00ff88] w-fit">
                      <CheckCircle2 size={10} strokeWidth={3} />
                      Verified Participant
                    </div>
                  </div>
                  <span className="text-[0.7rem] text-[#666666] uppercase tracking-[1px]">
                    {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                  </span>
                </div>

                <StarRow score={review.rating} size={12} className="mb-[15px]" />
                
                <p className="text-[#e0e0e0] text-[1rem] leading-[1.6] font-light whitespace-pre-wrap">
                  {review.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 border border-dashed border-[#1a1a1a]">
          <p className="text-[#666666] uppercase tracking-widest text-xs font-bold">
            No Records Found
          </p>
          <p className="text-[#333] text-sm mt-2">Historical data for this event is currently pending.</p>
        </div>
      )}
    </div>
  );
}
