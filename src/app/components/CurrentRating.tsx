'use client';

interface CurrentRatingProps {
    rating: number;
    onRatingChange: (rating: number) => void;
    isSubmitting: boolean;
    userId: string | null;
}

export default function CurrentRating({ rating, onRatingChange, isSubmitting, userId }: CurrentRatingProps) {
    const renderStars = (currentRating: number, interactive: boolean = false) => {
        return Array.from({ length: 5 }, (_, i) => i + 1).map(star => (
            <button
                key={star}
                onClick={() => interactive && onRatingChange(star)}
                disabled={!interactive || isSubmitting || !userId}
                className={`text-2xl ${star <= currentRating
                    ? 'text-yellow-400'
                    : 'text-gray-300'
                    } ${interactive ? 'hover:text-yellow-300 cursor-pointer' : 'cursor-default'}`}
                title={!userId ? '请先登录' : `评分 ${star} 分`}
            >
                ★
            </button>
        ));
    };

    return (
        <div className="flex items-center space-x-1 mb-3 justify-center">
            {renderStars(rating, true)}
            {rating > 0 && (
                <span className="text-sm text-gray-600 ml-2">
                    {rating}分
                </span>
            )}
        </div>
    );
}
