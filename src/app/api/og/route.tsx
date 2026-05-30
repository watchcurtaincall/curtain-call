import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    // Dynamic params
    const title = searchParams.get('title') || 'Curtain Call';
    const venue = searchParams.get('venue') || 'Live Stage Production';
    const posterUrl = searchParams.get('posterUrl') || '';
    const status = searchParams.get('status') || 'Currently Showing';

    // The image template
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#09090b', // zinc-950
            backgroundImage: 'linear-gradient(to bottom right, #450a0a, #000000)',
            color: 'white',
            fontFamily: 'sans-serif',
            position: 'relative',
          }}
        >
          {/* Subtle overlay border for premium feel */}
          <div
            style={{
              position: 'absolute',
              top: '20px',
              left: '20px',
              right: '20px',
              bottom: '20px',
              border: '2px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '24px',
              display: 'flex',
            }}
          />

          <div style={{ display: 'flex', width: '100%', padding: '60px', alignItems: 'center' }}>
            {/* Left Side: Poster (if any) */}
            {posterUrl ? (
              <div
                style={{
                  display: 'flex',
                  width: '400px',
                  height: '550px',
                  borderRadius: '24px',
                  overflow: 'hidden',
                  marginRight: '60px',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={posterUrl}
                  alt="Poster"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  width: '400px',
                  height: '550px',
                  borderRadius: '24px',
                  backgroundColor: '#18181b', // zinc-900
                  marginRight: '60px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '120px'
                }}
              >
                🎭
              </div>
            )}

            {/* Right Side: Details */}
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              {/* Status Badge */}
              <div
                style={{
                  backgroundColor: status === 'Currently Showing' || status === 'Coming Soon' ? 'rgba(220, 38, 38, 0.8)' : 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  padding: '8px 24px',
                  borderRadius: '40px',
                  fontSize: '24px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginBottom: '20px',
                  border: status === 'Currently Showing' || status === 'Coming Soon' ? '1px solid rgba(248, 113, 113, 0.5)' : '1px solid rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {status}
              </div>

              {/* Title */}
              <h1
                style={{
                  fontSize: '72px',
                  fontWeight: 900,
                  margin: '0 0 20px 0',
                  lineHeight: 1.1,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {title}
              </h1>

              {/* Venue */}
              <p
                style={{
                  fontSize: '32px',
                  color: '#a1a1aa', // zinc-400
                  margin: '0 0 40px 0',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                📍 {venue}
              </p>

              {/* Spacer */}
              <div style={{ flex: 1, display: 'flex' }} />

              {/* Footer / Brand */}
              <div style={{ display: 'flex', alignItems: 'center', marginTop: 'auto' }}>
                <span
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    color: 'black',
                    padding: '8px 20px',
                    borderRadius: '8px',
                    fontSize: '24px',
                    fontWeight: 'bold',
                    marginRight: '20px'
                  }}
                >
                  Curtain Call
                </span>
                <span style={{ fontSize: '24px', color: '#d4d4d8' }}>
                  Live Box Office & Admissions
                </span>
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    return new Response(`Failed to generate image`, {
      status: 500,
    });
  }
}
