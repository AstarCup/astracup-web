'use client';

interface CurrentRatingProps {
    rating: number;
    onRatingChange: (rating: number) => void;
    isSubmitting: boolean;
    userId: string | null;
}

export default function CurrentRating({ rating, onRatingChange, isSubmitting, userId }: CurrentRatingProps) {
    return (
        <div className="flex items-center space-x-2 mb-3 justify-center">
            <select
                value={rating}
                onChange={(e) => onRatingChange(parseInt(e.target.value))}
                disabled={isSubmitting || !userId}
                className="bg-white border border-gray-300 text-gray-800 px-2 py-1 rounded text-sm"
                title={!userId ? '请先登录' : '选择评分'}
            >
                <option value={0}>未评分</option>
                <option value={1}>1分</option>
                <option value={2}>2分</option>
                <option value={3}>3分</option>
                <option value={4}>4分</option>
                <option value={5}>5分</option>
            </select>
            {rating > 0 && (
                <span className="text-sm text-gray-600 font-medium">
                    当前评分: {rating}分
                </span>
            )}
        </div>
    );
}
