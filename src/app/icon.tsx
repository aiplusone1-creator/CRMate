import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#292D32',
          borderRadius: '8px',
        }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 100 100"
          fill="none"
        >
          {/* Top Wing - Sky Blue */}
          <path
            d="M 52 16 L 80 28"
            stroke="#8FC2F0"
            strokeWidth="15"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Bottom Wing - Sky Blue */}
          <path
            d="M 52 84 L 80 72"
            stroke="#8FC2F0"
            strokeWidth="15"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* C-Chevron Body - White */}
          <path
            d="M 52 16 L 20 50 L 52 84"
            stroke="#FFFFFF"
            strokeWidth="15"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Signature Dot - Green */}
          <circle cx="58" cy="50" r="9.5" fill="#77CE69" />
        </svg>
      </div>
    ),
    { ...size }
  );
}

