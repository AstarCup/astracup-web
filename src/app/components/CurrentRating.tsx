'use client';

interface CurrentRatingProps {
    rating: number;
    onRatingChange: (rating: number) => void;
    isSubmitting: boolean;
    userId: string | null;
}

export default function CurrentRating({ rating, onRatingChange, isSubmitting, userId }: CurrentRatingProps) {
    return (
        <div className="space-y-2">
            {/* 评分器 */}
            <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">我的评分：</span>
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => onRatingChange(star)}
                        disabled={isSubmitting || !userId}
                        className={`w-6 h-6 text-lg ${star <= rating ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400 transition-colors disabled:opacity-50`}
                    >★</button>
                ))}
                <span className="text-sm text-gray-500 ml-2">{rating > 0 && `${rating}分`}</span>
            </div>
        </div>
    );
}
