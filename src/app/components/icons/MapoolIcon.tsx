import React from "react";

export default function MapoolIcon({ className = "", color = "#E93B66" }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200" className={className}>
            <g>
                <path className="main-fill" d="M39,77L140.5,71.5L140.5,51.5L39,47L39,77Z" fill={color} />
                <path className="main-fill" d="M45,153.5L140.5,138L140.5,118L45,123.5L45,153.5Z" fill={color} />
                <path d="M51,76L152.5,70.5L152.5,50.5L51,46L51,76Z" fill="#FFFFFF" />
                <path d="M65,116L160.5,100.5L160.5,80.5L65,86L65,116Z" fill="#D8D8D8" />
                <path className="main-fill" d="M65,116L160.5,100.5L160.5,80.5L65,86L65,116Z" fill={color} />
                <path d="M57,152.5L152.5,137L152.5,117L57,122.5L57,152.5Z" fill="#FFFFFF" />
            </g>
        </svg>
    );
}
