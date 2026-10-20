'use client';

import React, { useEffect, useRef } from 'react';

interface AudioWaveformProps {
  isActive: boolean;
  frequencyData?: Uint8Array;
}

export function AudioWaveform({ isActive }: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      // Draw background center line
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.stroke();

      if (isActive) {
        // Multi-frequency glowing sine wave harmonics
        const waves = [
          { amplitude: 22, frequency: 0.03, color: 'rgba(16, 185, 129, 0.95)', lineWidth: 3 },
          { amplitude: 14, frequency: 0.05, color: 'rgba(52, 211, 153, 0.7)', lineWidth: 2 },
          { amplitude: 8, frequency: 0.08, color: 'rgba(20, 184, 166, 0.5)', lineWidth: 1.5 },
        ];

        waves.forEach((wave, waveIdx) => {
          ctx.beginPath();
          ctx.strokeStyle = wave.color;
          ctx.lineWidth = wave.lineWidth;
          ctx.shadowColor = '#10b981';
          ctx.shadowBlur = waveIdx === 0 ? 12 : 6;

          for (let x = 0; x < width; x++) {
            // Envelope so ends taper smoothly to zero
            const envelope = Math.sin((x / width) * Math.PI);
            const y = centerY + Math.sin(x * wave.frequency + phase + waveIdx) * wave.amplitude * envelope;

            if (x === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
          ctx.stroke();
          ctx.shadowBlur = 0;
        });

        phase += 0.08;
      } else {
        // Subtle resting baseline pulse
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.3)';
        ctx.lineWidth = 1.5;

        for (let x = 0; x < width; x++) {
          const envelope = Math.sin((x / width) * Math.PI);
          const y = centerY + Math.sin(x * 0.02 + phase) * 3 * envelope;

          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
        phase += 0.02;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isActive]);

  return (
    <div className="relative w-full h-24 flex items-center justify-center">
      <canvas
        ref={canvasRef}
        width={600}
        height={96}
        className="w-full h-full max-w-xl"
      />
    </div>
  );
}
