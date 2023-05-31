import "../styles/globals.css";

export const PreloadWorker =
  typeof window === "undefined" ? null : new Worker("preload-worker.js");

function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}

export default MyApp;
