/**
 * TTS Abstraction Layer - Main Entry Point
 *
 * Exports all types and provides a factory function for creating TTS engines.
 */

// Export all types
export type { TTSEngine, Voice, TTSEvents } from "./types";

// Export implementations
export { WebSpeechTTS } from "./web-speech";
export { OpenAICompatibleTTS } from "./openai-tts";

// Import for factory function
import { WebSpeechTTS } from "./web-speech";
import { OpenAICompatibleTTS } from "./openai-tts";
import type { TTSEngine, TTSEvents } from "./types";

/**
 * Configuration for TTS engine creation
 */
export interface TTSConfig {
  provider: 'web-speech' | 'openai';
  voice?: string;
}

/**
 * Factory function to create a TTS engine
 *
 * Returns the appropriate TTS engine based on the provider configuration.
 *
 * @param config - Configuration specifying which provider to use
 * @param events - Optional event callbacks for TTS lifecycle events
 * @returns A TTS engine instance
 */
export function createTTSEngine(config: TTSConfig = { provider: 'web-speech' }, events?: TTSEvents): TTSEngine {
  switch (config.provider) {
    case 'openai':
      return new OpenAICompatibleTTS(events);
    case 'web-speech':
    default:
      return new WebSpeechTTS(events);
  }
}
