'use client';

interface CurrentRatingProps {
    rating: number;
    onRatingChange: (rating: number) => void;
    isSubmitting: boolean;
    userId: string | null;
}

export default function CurrentRating({ rating, onRatingChange, isSubmitting, userId }: CurrentRatingProps) {
    return (
        <div className="flex items-center justify-center mb-3">
            <span className="text-base text-gray-800 font-bold">
                总评分：{rating}分
            </span>
        </div>
    );
}
