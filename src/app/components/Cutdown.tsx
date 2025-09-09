"use client"
import { useEffect, useState, useRef } from 'react';
import localFont from "next/font/local";
const audiowide = localFont({
    src: "./font/Audiowide-Regular.ttf",
    display: "auto",
});

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

// 无限向上滚动数字组件（彻底修正闪烁和倒回）
function RollingDigit({ value }: { value: number }) {
    const [digits, setDigits] = useState([value]);
    const [animating, setAnimating] = useState(false);
    const prevValue = useRef(value);

    useEffect(() => {
        if (value !== prevValue.current) {
            setDigits([prevValue.current, value]);
            setAnimating(true);
            prevValue.current = value;
        }
    }, [value]);

    useEffect(() => {
        if (!animating) return;
        const timer = setTimeout(() => {
            setDigits(prev => [prev[1]]);
            // 关键：用 requestAnimationFrame 保证 transform 先归位再禁用动画
            requestAnimationFrame(() => setAnimating(false));
        }, 300);
        return () => clearTimeout(timer);
    }, [animating]);

    return (
        <div className="relative w-[120px] h-[80px] overflow-hidden inline-block mx-1">
            <div
                className={`absolute left-0 w-full ${animating ? "transition-transform duration-300 ease-in-out" : ""}`}
                style={{
                    transform: animating ? `translateY(-80px)` : `translateY(0px)`,
                }}
            >
                {digits.map((d, i) => (
                    <div key={i} className="text-[70px] leading-[80px] text-center">{d}</div>
                ))}
            </div>
        </div>
    );
}

const Countdown = () => {
    const [targetDate, setTargetDate] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft('2100-01-01T00:00:00'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/countdown')
            .then(res => res.json())
            .then(data => {
                setTargetDate(data.targetDate);
                setTimeLeft(calculateTimeLeft(data.targetDate));
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        if (!targetDate) return;
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft(targetDate));
        }, 1000);
        return () => clearInterval(timer);
    }, [targetDate]);

    if (loading) return (
        <div className={`countdown ${audiowide.className} antialiased font-bold`}>
            <div className='flex flex-wrap flex-row justify-end'>
                <RollingDigit value={0} /><div className='pt-7'>天</div>
                <RollingDigit value={0} /><div className='pt-7'>时</div>
                <RollingDigit value={0} /><div className='pt-7'>分</div>
                <RollingDigit value={0} /><div className='pt-7'>秒</div>
            </div>
        </div>
    );
    if (timeLeft.isExpired) return <div className='text-[80px] font-bold'>活动已开始！</div>;

    return (
        <div className={`countdown ${audiowide.className} antialiased font-bold`}>
            <div className='flex flex-wrap flex-row justify-end'>
                <RollingDigit value={timeLeft.days} /><div className='pt-7'>天</div>
                <RollingDigit value={timeLeft.hours} /><div className='pt-7'>时</div>
                <RollingDigit value={timeLeft.minutes} /><div className='pt-7'>分</div>
                <RollingDigit value={timeLeft.seconds} /><div className='pt-7'>秒</div>
            </div>
        </div>
    );
};

export default Countdown;
