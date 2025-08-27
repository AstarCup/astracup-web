"use client"
import { useEffect, useState } from 'react';

interface CountdownProps {
    targetDate: string; // 例如 '2025-05-01T12:00:00'
}

const calculateTimeLeft = (targetDate: string) => {
    const difference = new Date(targetDate).getTime() - new Date().getTime();
    let timeLeft = {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        isExpired: difference <= 0,
    };

    if (difference > 0) {
        timeLeft = {
            days: Math.floor(difference / (1000 * 60 * 60 * 24)),
            hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((difference / 1000 / 60) % 60),
            seconds: Math.floor((difference / 1000) % 60),
            isExpired: false,
        };
    }

    return timeLeft;
};

const Countdown: React.FC<CountdownProps> = ({ targetDate }) => {
    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(targetDate));
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft(targetDate));
        }, 1000);

        return () => clearInterval(timer);
    }, [targetDate]);

    if (!isClient) {
        // 服务器端渲染时显示加载状态或空内容
        return <div className="countdown">加载中...</div>;
    }

    if (timeLeft.isExpired) {
        return <div>活动已开始！</div>;
    }

    return (
        <div className="countdown">
            <div>{timeLeft.days} 天</div>
            <div>{timeLeft.hours} 小时</div>
            <div>{timeLeft.minutes} 分钟</div>
            <div>{timeLeft.seconds} 秒</div>
        </div>
    );
};

export default Countdown;
