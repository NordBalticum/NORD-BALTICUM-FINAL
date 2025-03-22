import "@/styles/globals.css";
import "@/styles/theme.css";
import "@/styles/fullscreen-ui.css";

import { useAutoScale } from "@/hooks/useAutoScale";
import { MagicLinkProvider } from "@/contexts/MagicLinkContext";

export default function MyApp({ Component, pageProps }) {
  useAutoScale(); // Default 1440x900, scale 0.44–1
  return (
    <MagicLinkProvider>
      <Component {...pageProps} />
    </MagicLinkProvider>
  );
}
