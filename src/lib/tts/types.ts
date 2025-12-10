/**
 * TTS Abstraction Layer - Type Definitions
 *
 * Provides a unified interface for Text-to-Speech engines.
 */

/**
 * Represents a voice available for speech synthesis
 */
export interface Voice {
  id: string;
  name: string;
  language: string;
}

/**
 * Event callbacks for TTS lifecycle events
 */
export interface TTSEvents {
  onStart?: () => void;
  onEnd?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Main TTS engine interface
 *
 * Provides methods for controlling text-to-speech playback.
 */
export interface TTSEngine {
  /**
   * Speaks the provided text. Returns a Promise that resolves when speech ends.
   * @param text - The text to speak
   * @returns Promise that resolves when speech completes
   */
  speak(text: string): Promise<void>;

  /**
   * Stops current speech and clears the queue
   */
  stop(): void;

  /**
   * Pauses current speech
   */
  pause(): void;

  /**
   * Resumes paused speech
   */
  resume(): void;

  /**
   * Checks if speech is currently paused
   * @returns true if paused, false otherwise
   */
  isPaused(): boolean;

  /**
   * Checks if speech is currently active
   * @returns true if speaking, false otherwise
   */
  isSpeaking(): boolean;

  /**
   * Sets the speech rate
   * @param rate - Speech rate (0.5 - 2.0, where 1.0 is normal)
   */
  setRate(rate: number): void;

  /**
   * Sets the voice to use for speech
   * @param voice - Voice identifier
   */
  setVoice(voice: string): void;

  /**
   * Gets the list of available voices
   * @returns Array of available voices
   */
  getVoices(): Voice[];
}
