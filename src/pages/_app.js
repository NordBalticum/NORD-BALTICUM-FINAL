// src/pages/_app.js

import "@/styles/globals.css";
import "@/styles/theme.css";
import "@/styles/fullscreen-ui.css";
import { useAutoScale } from "@/hooks/useAutoScale";
import { MagicLinkProvider } from "@/contexts/MagicLinkContext";

export default function MyApp({ Component, pageProps }) {
  useAutoScale(); // ✅ natūralus zoom efektas be iškraipymų

  return (
    <MagicLinkProvider>
      <Component {...pageProps} />
    </MagicLinkProvider>
  );
}
