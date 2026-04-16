import React from "react";

export default function ContactIcon({ className = "", color = "#E93B66" }) {
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
          d="M83,78L121,78L121,55L90.5,50L83,78Z"
          fill={color}
        />
        <path
          className="main-fill"
          d="M76.5,110L109,155.5L132,103.5L104,88.5L76.5,110Z"
          fill={color}
        />
        <path d="M75.5,73L113.5,73L113.5,50L83,45L75.5,73Z" fill="#FFFFFF" />
        <path
          d="M69,105L101.5,150.5L124.5,98.5L96.5,83.5L69,105Z"
          fill="#FFFFFF"
        />
      </g>
    </svg>
  );
}
