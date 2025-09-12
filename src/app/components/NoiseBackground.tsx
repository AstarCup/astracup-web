"use client";

import { useEffect, useState } from 'react';

const NoiseBackground = () => {
  const [dots, setDots] = useState<Array<{id: number, x: number, y: number, delay: number}>>([]);

  useEffect(() => {
    // 生成随机分布的小白点
    const generateDots = () => {
      const dotArray = [];
      const dotCount = 20; // 控制点的数量，保持性能友好
      
      for (let i = 0; i < dotCount; i++) {
        dotArray.push({
          id: i,
          x: Math.random() * 100, // 0-100% 位置
          y: Math.random() * 100,
          delay: Math.random() * 4, // 0-4秒的随机延迟
        });
      }
      
      setDots(dotArray);
    };

    generateDots();
  }, []);

  return (
    <div 
      className="fixed inset-0 pointer-events-none z-0"
      style={{
        background: 'transparent',
        overflow: 'hidden'
      }}
    >
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            opacity: 0.1;
            transform: translateY(0px) scale(0.8);
          }
          50% {
            opacity: 0.3;
            transform: translateY(-10px) scale(1.2);
          }
        }
        
        @keyframes twinkle {
          0%, 100% {
            opacity: 0.05;
          }
          50% {
            opacity: 0.25;
          }
        }
        
        .noise-dot {
          position: absolute;
          width: 4px;
          height: 4px;
          background: rgba(255, 255, 255, 0.2);
          animation: float 6s ease-in-out infinite, twinkle 3s ease-in-out infinite;
        }
        
        .noise-dot:nth-child(odd) {
          animation-direction: alternate;
        }
        
        .noise-dot:nth-child(3n) {
          width: 1px;
          height: 1px;
          animation-duration: 8s, 4s;
        }
        
        .noise-dot:nth-child(4n) {
          width: 3px;
          height: 3px;
          opacity: 0.6;
          animation-duration: 4s, 2s;
        }
      `}</style>
      
      {dots.map((dot) => (
        <div
          key={dot.id}
          className="noise-dot"
          style={{
            left: `${dot.x}%`,
            top: `${dot.y}%`,
            animationDelay: `${dot.delay}s, ${dot.delay * 0.7}s`,
          }}
        />
      ))}
    </div>
  );
};

export default NoiseBackground;
