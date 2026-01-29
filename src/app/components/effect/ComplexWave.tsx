"use client"
import React from 'react';

interface ComplexWaveProps {
  className?: string;
  colors?: string[];
}

const ComplexWave: React.FC = ({className}:ComplexWaveProps) => {
    return (
    <div className={`relative h-12 overflow-hidden ${className}`}>
      <style jsx>{`
        @keyframes wave1 {
          0%, 100% { transform: translateY(-30px); }
          75% { transform: translateY(-20px); }
        }

        @keyframes wave2 {
          0%, 100% { transform: translateY(-35px); }
          66% { transform: translateY(-30px); }
        }

        @keyframes wave3 {
          0%, 100% { transform: translateY(-40px); }
          50% { transform: translateY(-35px); }
        }

        
        .wave-container {
          position: absolute;
          bottom: 0;
          width: 200%;
          height: 100%;
        }
        
        .wave-1 {
          animation-delay: 0s;
          animation: wave1 10s ease-in-out infinite;
          border-bottom: 3px solid rgb(238, 185, 11);
          background: transparent;
        }

        .wave-2 {
          animation-delay: -2s;
          animation-duration: 8s;
          animation: wave2 10s ease-in-out infinite;
          border-bottom: 3px solid rgb(243, 43, 103);
          background: transparent;
        }

        .wave-3 {
          animation-delay: -4s;
          animation-duration: 12s;
          animation: wave3 10s ease-in-out infinite;
          border-bottom: 3px solid rgb(59, 131, 246);
          background: transparent;
        }

      `}</style>
      
      <div className="wave-container wave-1"></div>
      <div className="wave-container wave-2"></div>
      <div className="wave-container wave-3"></div>
    </div>
  );
};

export default ComplexWave;