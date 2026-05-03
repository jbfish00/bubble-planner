// Platform-aware voice capture wrapper.
//
//  - On web: uses the browser's SpeechRecognition (webkit-prefixed in
//    Chrome/Edge/Safari; not available in Firefox).
//  - On native (Capacitor): would call @capacitor-community/speech-recognition.
//    We only stub that path here — install the plugin in the Android shell
//    when we run `npm run android:init`.
//
// Returns a "session" object the caller can `.cancel()`. Recognition is
// streaming; `onPartial` fires as the user speaks, `onFinal` fires once at
// the end with the best transcript.

import { isNative } from './platform';

export interface VoiceSession {
  cancel: () => void;
}

export interface VoiceHandlers {
  onPartial?: (text: string) => void;
  onFinal: (text: string) => void;
  onError?: (message: string) => void;
}

interface BrowserSpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: { error?: string; message?: string }) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [index: number]: { transcript: string; confidence: number };
    };
  };
}

interface SpeechRecognitionCtor {
  new (): BrowserSpeechRecognition;
}

function getBrowserCtor(): SpeechRecognitionCtor | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition) as SpeechRecognitionCtor | null;
}

export function isVoiceSupported(): boolean {
  if (isNative()) return true; // Capacitor plugin path; assume available
  return getBrowserCtor() !== null;
}

export async function startVoiceCapture(handlers: VoiceHandlers): Promise<VoiceSession | null> {
  if (isNative()) {
    // Native path — to be wired with @capacitor-community/speech-recognition
    // after `npm run android:init`. For now, fail gracefully so the UI shows
    // a helpful message rather than appearing to hang.
    handlers.onError?.('Voice capture not yet wired up on Android. Coming in v1.1.');
    return null;
  }

  const Ctor = getBrowserCtor();
  if (!Ctor) {
    handlers.onError?.("This browser doesn't support voice input. Try Chrome or Safari.");
    return null;
  }

  const rec = new Ctor();
  rec.continuous = false;
  rec.interimResults = true;
  rec.lang = navigator.language || 'en-US';

  let lastFinal = '';
  rec.onresult = (e: SpeechRecognitionEvent) => {
    let interim = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i];
      const transcript = r[0].transcript;
      if (r.isFinal) {
        lastFinal = (lastFinal + ' ' + transcript).trim();
      } else {
        interim += transcript;
      }
    }
    if (interim) handlers.onPartial?.(interim);
  };
  rec.onerror = (e) => {
    handlers.onError?.(e.error ?? e.message ?? 'Voice capture failed');
  };
  rec.onend = () => {
    if (lastFinal) handlers.onFinal(lastFinal);
  };

  try {
    rec.start();
  } catch (err) {
    handlers.onError?.((err as Error).message);
    return null;
  }

  return {
    cancel: () => {
      try { rec.abort(); } catch { /* ignore */ }
    },
  };
}
