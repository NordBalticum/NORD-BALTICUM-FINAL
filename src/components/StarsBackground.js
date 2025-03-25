"use client";

import { useEffect, useRef } from "react";

export default function StarsBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    let stars = [];
    const numStars = 200; // ✅ Daugiau žvaigždžių, bet subtiliai paskirstytos
    const maxSize = 1.7;  // ✅ Šiek tiek didesnės
    const maxAlpha = 0.75; // ✅ Padidintas maksimumas

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      stars = Array.from({ length: numStars }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * maxSize + 0.4,
        alpha: Math.random() * 0.55 + 0.2, // ✅ 19% ryškesnės nei tavo paskutinės
        speedY: Math.random() * 0.08 + 0.01,
        flicker: Math.random() * 0.03 + 0.008,
        baseAlpha: Math.random() * 0.3 + 0.25,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach((star) => {
        star.alpha += (Math.random() - 0.5) * star.flicker;
        star.alpha = Math.max(0.08, Math.min(star.alpha, maxAlpha));

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, 2 * Math.PI);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
        ctx.shadowBlur = 24; // ✅ intensyvesnis glow
        ctx.shadowColor = "rgba(255, 255, 255, 0.6)";
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
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        opacity: 0.26, // ✅ galutinis švytėjimas – dabar bus žiauriai premium
        zIndex: 0,
        mixBlendMode: "screen",
        filter: "blur(0.35px) contrast(120%)", // ✅ ultra smooth + ryškumo priedas
      }}
    />
  );
}
