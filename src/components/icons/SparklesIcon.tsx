import React from 'react';

export const SparklesIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M9.315 7.584C10.12 6.81 11.168 6.3 12.25 6.3c1.082 0 2.13.51 2.935 1.284l1.36-1.36A8.96 8.96 0 0012.25 4.5a8.96 8.96 0 00-4.328 1.132l1.393 1.393zM12.25 21a8.96 8.96 0 004.328-1.132l-1.393-1.393A6.479 6.479 0 0112.25 19.2c-1.082 0-2.13-.51-2.935-1.284l-1.36 1.36A8.96 8.96 0 0012.25 21z"
      clipRule="evenodd"
    />
    <path
      fillRule="evenodd"
      d="M10.5 12.535a1.28 1.28 0 01-1.284-1.285 1.28 1.28 0 011.284-1.285h3.5a1.28 1.28 0 011.284 1.285 1.28 1.28 0 01-1.284 1.285h-3.5z"
      clipRule="evenodd"
    />
    <path
      fillRule="evenodd"
      d="M7.584 16.435a6.479 6.479 0 01-1.284-2.935v-3.5a6.479 6.479 0 011.284-2.935l-1.36-1.36A8.96 8.96 0 004.5 10.25v3.5a8.96 8.96 0 001.724 5.688l1.36-1.36zM16.416 7.565a6.479 6.479 0 011.284 2.935v3.5a6.479 6.479 0 01-1.284 2.935l1.36 1.36A8.96 8.96 0 0019.5 13.75v-3.5a8.96 8.96 0 00-1.724-5.688l-1.36 1.36z"
      clipRule="evenodd"
    />
  </svg>
);
