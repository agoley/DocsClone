import React from "react";

const SkyWriteLogo = ({ size = "normal", showTagline = true }) => {
  const dimensions = {
    small: { width: 120, height: 60, fontSize: 18, taglineSize: 8 },
    normal: { width: 160, height: 80, fontSize: 24, taglineSize: 10 },
    large: { width: 200, height: 100, fontSize: 32, taglineSize: 14 },
  };

  const { width, height, fontSize, taglineSize } =
    dimensions[size] || dimensions.normal;

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 200 100"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* SkyWrite Text */}
      <text
        x="20"
        y="45"
        fontFamily="Google Sans, Roboto, Arial, sans-serif"
        fontSize={fontSize}
        fontWeight="600"
        fill="var(--gust-navy, #1565c0)"
      >
        Sky
      </text>
      <text
        x="20"
        y="75"
        fontFamily="Google Sans, Roboto, Arial, sans-serif"
        fontSize={fontSize}
        fontWeight="600"
        fill="var(--gust-navy, #1565c0)"
      >
        Write
      </text>

      {/* Paper Airplane */}
      <g>
        <path
          d="M130 25 L160 35 L145 42 L155 50 L130 45 L115 50 L130 42 L110 35 Z"
          fill="var(--breeze-teal, #4fc3f7)"
        />
        <path d="M130 25 L160 35 L145 42 Z" fill="var(--wind-blue, #90caf9)" />
        <path
          d="M130 25 L145 42 L130 45 L115 50 L130 42 L110 35 Z"
          fill="var(--gust-navy, #1565c0)"
          opacity="0.8"
        />
      </g>

      {/* "by Air" tagline */}
      {showTagline && (
        <text
          x="115"
          y="70"
          fontFamily="Google Sans, Roboto, Arial, sans-serif"
          fontSize={taglineSize}
          fill="var(--storm-gray, #546e7a)"
          fontWeight="400"
        >
          by Air
        </text>
      )}
    </svg>
  );
};

export default SkyWriteLogo;
