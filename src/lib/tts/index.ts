/**
 * TTS Abstraction Layer - Main Entry Point
 *
 * Exports all types and provides a factory function for creating TTS engines.
 */

// Export all types
export type { TTSEngine, Voice, TTSEvents } from "./types";

// Export implementations
export { WebSpeechTTS } from "./web-speech";

// Import for factory function
import { WebSpeechTTS } from "./web-speech";
import type { TTSEngine, TTSEvents } from "./types";

/**
 * Factory function to create a TTS engine
 *
 * Currently returns a WebSpeechTTS instance. In the future, this could be
 * extended to support different TTS engines based on environment or configuration.
 *
 * @param events - Optional event callbacks for TTS lifecycle events
 * @returns A TTS engine instance
 */
export function createTTSEngine(events?: TTSEvents): TTSEngine {
  return new WebSpeechTTS(events);
}
