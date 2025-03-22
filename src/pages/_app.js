// src/pages/_app.js

import "@/styles/globals.css";
import "@/styles/theme.css";
import "@/styles/fullscreen-ui.css"; // ✅ Fullscreen scaling UI
import { useAutoScale } from "@/hooks/useAutoScale";
import { MagicLinkProvider } from "@/contexts/MagicLinkContext";

export default function MyApp({ Component, pageProps }) {
  useAutoScale(); // ✅ Auto scaling: 0.44–1 range on screen width

  return (
    <MagicLinkProvider>
      <Component {...pageProps} />
    </MagicLinkProvider>
  );
}
