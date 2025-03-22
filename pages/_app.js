import "../styles/globals.css";
import { MagicLinkProvider } from "../contexts/MagicLinkContext";

function MyApp({ Component, pageProps }) {
  return (
    <MagicLinkProvider>
      <Component {...pageProps} />
    </MagicLinkProvider>
  );
}

export default MyApp;
