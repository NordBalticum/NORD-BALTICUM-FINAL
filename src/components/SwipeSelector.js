/* === NordBalticum Swipe + UI CSS === */

.wrapper {
  width: 100%;
  max-width: clamp(360px, 95vw, 1920px);
  padding: clamp(16px, 4vw, 64px);
  padding-bottom: calc(var(--nav-height) + 2rem);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(24px, 4vw, 48px);
  margin: 0 auto;
}

.title {
  font-size: clamp(28px, 6vw, 48px);
  font-weight: 900;
  text-align: center;
  font-family: var(--font-crypto);
  letter-spacing: 1px;
  background: linear-gradient(to right, #ffcc00, #ffffff, #ffcc00);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 16px rgba(255, 235, 120, 0.4);
  animation: glowTitle 2.5s infinite ease-in-out;
}

.subtext {
  font-size: clamp(14px, 2.5vw, 20px);
  color: rgba(255, 255, 255, 0.85);
  text-align: center;
  font-family: var(--font-crypto);
  font-weight: 500;
  opacity: 0.85;
  margin-top: -8px;
}

@keyframes glowTitle {
  0% { text-shadow: 0 0 10px #ffd700; }
  50% { text-shadow: 0 0 18px #fffacd; }
  100% { text-shadow: 0 0 10px #ffd700; }
}

.swipeWrapper {
  width: 100%;
  display: flex;
  flex-wrap: nowrap;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  gap: clamp(12px, 2vw, 20px);
  padding: clamp(12px, 3vw, 24px) 0;
  justify-content: flex-start;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.swipeWrapper::-webkit-scrollbar {
  display: none;
}

.card {
  flex: 0 0 auto;
  scroll-snap-align: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 28px;
  backdrop-filter: blur(16px);
  box-shadow: 0 0 35px rgba(255, 255, 255, 0.15);
  padding: clamp(20px, 3vw, 32px);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: pointer;
  width: clamp(140px, 20vw, 220px);
  text-align: center;
}

.card:hover {
  transform: scale(1.05);
  box-shadow: 0 0 45px rgba(255, 255, 255, 0.25);
}

.logo {
  width: clamp(40px, 8vw, 64px);
  height: clamp(40px, 8vw, 64px);
  margin: 0 auto clamp(12px, 2vw, 20px);
  filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.5));
}

.name {
  font-size: clamp(16px, 1.5vw, 20px);
  color: white;
  font-weight: 600;
  text-shadow: 0 0 4px rgba(255, 255, 255, 0.3);
}
