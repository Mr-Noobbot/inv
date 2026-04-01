"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

export default function HomePage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const bubblesRef = useRef<
    { x: number; y: number; vx: number; vy: number; size: number; alpha: number }[]
  >([]);
  const numBubbles = 15; // number of bubbles

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Create bubbles without overlapping
    const createBubbles = () => {
      bubblesRef.current = [];
      let attempts = 0;
      while (bubblesRef.current.length < numBubbles && attempts < 1000) {
        const size = 40 + Math.random() * 50;
        const x = size + Math.random() * (canvas.width - 2 * size);
        const y = size + Math.random() * (canvas.height - 2 * size);
        const alpha = 0.15 + Math.random() * 0.25;
        const vx = (Math.random() - 0.5) * 0.5; // random initial speed
        const vy = (Math.random() - 0.5) * 0.5;

        let overlapping = false;
        for (let b of bubblesRef.current) {
          const dx = b.x - x;
          const dy = b.y - y;
          if (Math.sqrt(dx * dx + dy * dy) < b.size + size + 5) overlapping = true;
        }

        if (!overlapping) bubblesRef.current.push({ x, y, vx, vy, size, alpha });
        attempts++;
      }
    };

    const drawBubble = (bubble: typeof bubblesRef.current[0]) => {
      ctx.shadowColor = `rgba(255,255,255,${bubble.alpha * 0.6})`;
      ctx.shadowBlur = 15;

      const gradient = ctx.createRadialGradient(
        bubble.x - bubble.size * 0.3,
        bubble.y - bubble.size * 0.3,
        bubble.size * 0.1,
        bubble.x,
        bubble.y,
        bubble.size
      );
      gradient.addColorStop(0, `rgba(255,255,255,${bubble.alpha})`);
      gradient.addColorStop(0.3, `rgba(255,255,255,${bubble.alpha * 0.4})`);
      gradient.addColorStop(0.7, `rgba(200,220,255,${bubble.alpha * 0.1})`);
      gradient.addColorStop(1, "rgba(255,255,255,0)");

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(bubble.x, bubble.y, bubble.size, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineWidth = 2;
      ctx.stroke();
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update positions
      for (let i = 0; i < bubblesRef.current.length; i++) {
        const b1 = bubblesRef.current[i];

        // gentle floating drift
        b1.vx += (Math.random() - 0.5) * 0.02;
        b1.vy += (Math.random() - 0.5) * 0.02;

        b1.x += b1.vx;
        b1.y += b1.vy;

        // damping
        b1.vx *= 0.99;
        b1.vy *= 0.99;

        // bounce viewport
        if (b1.x - b1.size < 0) {
          b1.x = b1.size;
          b1.vx *= -1;
        }
        if (b1.x + b1.size > canvas.width) {
          b1.x = canvas.width - b1.size;
          b1.vx *= -1;
        }
        if (b1.y - b1.size < 0) {
          b1.y = b1.size;
          b1.vy *= -1;
        }
        if (b1.y + b1.size > canvas.height) {
          b1.y = canvas.height - b1.size;
          b1.vy *= -1;
        }

        // bubble collision
        for (let j = i + 1; j < bubblesRef.current.length; j++) {
          const b2 = bubblesRef.current[j];
          const dx = b2.x - b1.x;
          const dy = b2.y - b1.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const minDist = b1.size + b2.size + 2;
          if (dist < minDist) {
            const angle = Math.atan2(dy, dx);
            const overlap = minDist - dist;

            // separate bubbles
            b1.x -= Math.cos(angle) * overlap / 2;
            b1.y -= Math.sin(angle) * overlap / 2;
            b2.x += Math.cos(angle) * overlap / 2;
            b2.y += Math.sin(angle) * overlap / 2;

            // bounce effect
            const vxTotal = b1.vx - b2.vx;
            const vyTotal = b1.vy - b2.vy;
            b1.vx -= vxTotal * 0.5;
            b1.vy -= vyTotal * 0.5;
            b2.vx += vxTotal * 0.5;
            b2.vy += vyTotal * 0.5;
          }
        }

        drawBubble(b1);
      }

      requestAnimationFrame(animate);
    };

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      createBubbles();
    };

    handleResize();
    animate();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-[#0F111A] px-6 overflow-hidden text-center text-white">
      <canvas
        ref={canvasRef}
        className="fixed top-0 left-0 w-full h-full pointer-events-none"
      />

      <div className="z-10 animate-fadeIn max-w-4xl">
        <h1 className="text-5xl sm:text-6xl font-extrabold mb-4 tracking-wide leading-tight">
          FreelanceBill
        </h1>
        <p className="text-gray-300 text-lg sm:text-xl mb-8 leading-relaxed">
          Generate professional invoices directly from your Excel or Google Sheets data.<br /> Fast, simple, and accurate.
        </p>
       <Link
  href="/dashboard"
  className="inline-block px-10 py-4 bg-[#10B981] hover:bg-[#34D399] text-white rounded-xl text-lg font-semibold shadow-lg transition-all transform hover:scale-105"
>
  Create Invoice
</Link>
      </div>

      <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-10 max-w-5xl z-10">
        {[
          { title: "Excel & Sheets", desc: "Import data from Excel or Google Sheets in one click." },
          { title: "Automatic Invoices", desc: "Your data is instantly converted into professional invoices." },
          { title: "Download & Send", desc: "Export to PDF and share with clients immediately." },
        ].map((f, idx) => (
          <div
            key={idx}
            className="p-6 bg-[#1A1C2B] rounded-2xl shadow-xl backdrop-blur-md hover:scale-105 transition-transform duration-300"
          >
            <h3 className="font-semibold text-white mb-2">{f.title}</h3>
            <p className="text-gray-400 text-sm">{f.desc}</p>
          </div>
        ))}
      </div>

      <style jsx>{`
        .animate-fadeIn {
          animation: fadeIn 1.2s ease forwards;
          opacity: 0;
        }
        @keyframes fadeIn {
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}