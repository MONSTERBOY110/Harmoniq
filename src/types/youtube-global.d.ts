// The IFrame Player API attaches itself to window; @types/youtube provides the YT namespace.
interface Window {
  YT?: typeof YT;
  onYouTubeIframeAPIReady?: () => void;
  __harmoniqDebug?: Record<string, unknown>;
}
