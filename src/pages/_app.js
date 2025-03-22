// src/pages/_app.js

import "@/styles/globals.css";
import "@/styles/theme.css";
import "@/styles/fullscreen-ui.css"; // ✅ Global fullscreen layout
import { MagicLinkProvider } from "@/contexts/MagicLinkContext";

export default function MyApp({ Component, pageProps }) {
  return (
    <MagicLinkProvider>
      <Component {...pageProps} />
    </MagicLinkProvider>
  );
}
