"use client";

import { useEffect, useState } from "react";
import { RollState } from "../types/match";

interface RollDisplayProps {
    rollState: RollState;
}

export default function RollDisplay({ rollState }: RollDisplayProps) {
    const [redDisplayValue, setRedDisplayValue] = useState<number>(0);
    const [blueDisplayValue, setBlueDisplayValue] = useState<number>(0);
    const [animationInterval, setAnimationInterval] = useState<NodeJS.Timeout | null>(null);

    // 数字动画效果
    useEffect(() => {
        // 清理之前的动画
        if (animationInterval) {
            clearInterval(animationInterval);
            setAnimationInterval(null);
        }

        if (rollState.isRolling && !rollState.showResult) {
            // 开始动画 - 快速随机变化
            const interval = setInterval(() => {
                setRedDisplayValue(Math.floor(Math.random() * 100) + 1);
                setBlueDisplayValue(Math.floor(Math.random() * 100) + 1);
            }, 50);
            setAnimationInterval(interval);

            return () => {
                if (interval) clearInterval(interval);
            };
        } else if (!rollState.isRolling && rollState.showResult) {
            // 显示最终结果 - 直接显示结果值
            setRedDisplayValue(rollState.redRoll);
            setBlueDisplayValue(rollState.blueRoll);
        } else if (!rollState.isVisible) {
            // 组件隐藏时重置显示值
            setRedDisplayValue(0);
            setBlueDisplayValue(0);
        }
    }, [rollState.isRolling, rollState.showResult, rollState.redRoll, rollState.blueRoll, rollState.isVisible]);

    // 如果不可见，不渲染任何内容
    if (!rollState.isVisible) {
        return null;
    }

    const getWinnerStyle = (team: 'red' | 'blue') => {
        if (rollState.winner === team) {
            return {
                // boxShadow: '0 0 30px rgba(255, 255, 255, 0.8)',
                transform: 'scale(1.3)',
            };
        }
        return {};
    };

    return (
        <div style={{
            position: 'absolute',
            top: '300px',
            left: '50%',
            width: '1200px',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px',
            padding: '30px 50px',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s ease-in-out'
        }}>
            {/* 标题 */}
            <div style={{
                fontSize: '3rem',
                fontWeight: 'bold',
                color: 'white',
                textShadow: '0 0 10px rgba(233, 59, 102, 0.8)',
                marginBottom: '10px'
            }}>
                ROLL POINT
            </div>

            {/* 队伍roll点显示 */}
            <div style={{
                display: 'flex',
                gap: '80px',
                alignItems: 'center'
            }}>
                {/* 红队 */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '15px'
                }}>
                    <div style={{
                        fontSize: '2rem',
                        fontWeight: 'bold',
                        color: '#E93B66'
                    }}>
                        红方
                    </div>
                    <div style={{
                        width: '200px',
                        height: '120px',
                        backgroundColor: '#E93B66',
                        // borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '3.5rem',
                        fontWeight: 'bold',
                        color: 'white',
                        transition: 'all 0.3s ease-in-out',
                        ...getWinnerStyle('red')
                    }}>
                        {redDisplayValue}
                    </div>
                </div>

                {/* VS 分隔符 */}
                <div style={{
                    fontSize: '2.5rem',
                    fontWeight: 'bold',
                    color: 'white',
                    margin: '0 50px'
                }}>
                    VS
                </div>

                {/* 蓝队 */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '15px'
                }}>
                    <div style={{
                        fontSize: '2rem',
                        fontWeight: 'bold',
                        color: '#0FAAE7'
                    }}>
                        蓝方
                    </div>
                    <div style={{
                        width: '200px',
                        height: '120px',
                        backgroundColor: '#0FAAE7',
                        // borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '3.5rem',
                        fontWeight: 'bold',
                        color: 'white',
                        transition: 'all 0.3s ease-in-out',
                        ...getWinnerStyle('blue')
                    }}>
                        {blueDisplayValue}
                    </div>
                </div>
            </div>

            {/* 结果文本 */}
            {rollState.showResult && (
                <div style={{
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    color: 'white',
                    textAlign: 'center',
                    marginTop: '20px',
                    padding: '15px 30px',
                    backgroundColor: rollState.winner === 'red' ? 'rgba(233, 59, 102, 0.3)' : 'rgba(15, 170, 231, 0.3)',
                    // borderRadius: '10px',
                    // border: `2px solid ${rollState.winner === 'red' ? '#E93B66' : '#0FAAE7'}`,
                    animation: 'fadeIn 0.5s ease-in-out'
                }}>
                    {rollState.resultText}
                </div>
            )}

            <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
        </div>
    );
}
