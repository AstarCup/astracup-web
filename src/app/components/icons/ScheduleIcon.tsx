import React from "react";

export default function ScheduleIcon({ className = "", color = "#E93B66" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="200"
      height="200"
      viewBox="0 0 200 200"
      className={className}
    >
      <g>
        <path
          className="main-fill"
          d="M51,149L145,153L155,52L65,57.5L51,149Z"
          fill={color}
        />
        <path d="M45,145L139,149L149,48L59,53.5L45,145Z" fill="#FFFFFF" />
        <path
          className="main-fill"
          d="M57,66.445621L145.500031,66.44555700000001L148,48.5L58.8846154,53.7624512L57,66.445621Z"
          fill={color}
        />
        <path
          className="main-fill"
          d="M59,88.945621L70,88.94555700000001L72.5,75L60.8846154,76.2624512L59,88.945621Z"
          fill={color}
        />
        <path
          className="main-fill"
          d="M75,102.945621L86,102.94555700000001L88.5,89L76.8846154,90.2624512L75,102.945621Z"
          fill={color}
        />
        <path
          className="main-fill"
          d="M96,88.945621L107,88.94555700000001L109.5,75L98.5,77L96,88.945621Z"
          fill={color}
        />
        <path
          d="M115,88.945621L126,88.94555700000001L128.5,75L116.8846154,76.2624512L115,88.945621Z"
          fill="#757575"
        />
      </g>
    </svg>
  );
}
