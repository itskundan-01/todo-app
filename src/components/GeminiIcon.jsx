import React from 'react';

const GeminiIcon = ({ width = 24, height = 24, className = '' }) => {
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 192 192" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path 
        d="M96 16C64.0392 16 38 42.0392 38 74C38 89.9938 44.7818 104.433 55.666 114.733L37.5904 168H96H154.41L136.334 114.733C147.218 104.433 154 89.9938 154 74C154 42.0392 127.961 16 96 16Z" 
        fill="url(#paint0_linear)" 
      />
      <path 
        d="M96 144C127.961 144 154 117.961 154 86C154 70.0062 147.218 55.567 136.334 45.267L154.41 -8H96H37.5904L55.666 45.267C44.7818 55.567 38 70.0062 38 86C38 117.961 64.0392 144 96 144Z" 
        fill="url(#paint1_linear)" 
      />
      <defs>
        <linearGradient id="paint0_linear" x1="38" y1="16" x2="154" y2="168" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1E8E3E" />
          <stop offset="1" stopColor="#34A853" />
        </linearGradient>
        <linearGradient id="paint1_linear" x1="154" y1="144" x2="38" y2="-8" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FBBC05" />
          <stop offset="1" stopColor="#FA7B17" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export default GeminiIcon;
