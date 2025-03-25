"use client";

import { useEffect, useRef } from "react";

export default function StarsBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    let stars = [];
    const numStars = 160;
    const maxSize = 1.6;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      stars = Array.from({ length: numStars }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * maxSize,
        alpha: Math.random() * 0.45 + 0.15, // ✅ 25% ryškiau nei prieš tai
        speedY: Math.random() * 0.08 + 0.01,
        flicker: Math.random() * 0.025 + 0.01, // švelnus gyvumas
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach((star) => {
        star.alpha += (Math.random() - 0.5) * star.flicker;
        star.alpha = Math.max(0.08, Math.min(star.alpha, 0.6)); // šiek tiek padidinta riba
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, 2 * Math.PI);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
        ctx.shadowBlur = 22;
        ctx.shadowColor = "rgba(255, 255, 255, 0.45)";
        ctx.fill();
        star.y += star.speedY;
        if (star.y > canvas.height) {
          star.y = 0;
          star.x = Math.random() * canvas.width;
        }
      });
      requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        opacity: 0.22, // ✅ šiek tiek padidintas matomumas
        mixBlendMode: "screen",
        filter: "blur(0.45px)",
      }}
    />
  );
}
