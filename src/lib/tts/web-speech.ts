/**
 * Web Speech API TTS Implementation
 *
 * Implements the TTSEngine interface using the browser's SpeechSynthesis API.
 */

import type { TTSEngine, Voice, TTSEvents } from "./types";

/**
 * TTS implementation using the Web Speech API (SpeechSynthesis)
 */
export class WebSpeechTTS implements TTSEngine {
  private synthesis: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private currentResolve: (() => void) | null = null;
  private currentReject: ((error: Error) => void) | null = null;
  private rate: number = 1.0;
  private voiceId: string | null = null;
  private events: TTSEvents;
  private paused: boolean = false;
  private stopped: boolean = false; // Track if stop() was called intentionally
  private voicesLoaded: boolean = false;
  private voicesLoadPromise: Promise<void> | null = null;

  constructor(events: TTSEvents = {}) {
    this.events = events;

    // Check if browser supports SpeechSynthesis
    if (typeof window !== "undefined" && window.speechSynthesis) {
      this.synthesis = window.speechSynthesis;

      // Set up voiceschanged listener for Chrome
      // Chrome requires waiting for this event before getVoices() returns values
      if (this.synthesis) {
        this.synthesis.addEventListener('voiceschanged', () => {
          this.voicesLoaded = true;
        });

        // Check if voices are already loaded (Firefox doesn't fire voiceschanged)
        const voices = this.synthesis.getVoices();
        if (voices.length > 0) {
          this.voicesLoaded = true;
        }
      }
    }
  }

  /**
   * Checks if Web Speech API is supported in the current environment
   */
  private isSupported(): boolean {
    return this.synthesis !== null;
  }

  /**
   * Waits for voices to be loaded
   * This is necessary in Chrome where getVoices() returns empty until voiceschanged fires
   * In Firefox, voices are available immediately, so this resolves instantly
   */
  async waitForVoices(): Promise<void> {
    if (!this.isSupported()) {
      return;
    }

    // If voices are already loaded, return immediately
    if (this.voicesLoaded) {
      return;
    }

    // If we already have a pending promise, return it
    if (this.voicesLoadPromise) {
      return this.voicesLoadPromise;
    }

    // Create a new promise that resolves when voices are loaded
    this.voicesLoadPromise = new Promise<void>((resolve) => {
      // Check if voices became available while we were setting up
      const voices = this.synthesis!.getVoices();
      if (voices.length > 0) {
        this.voicesLoaded = true;
        resolve();
        return;
      }

      // Set up a one-time listener for voiceschanged
      const handleVoicesChanged = () => {
        this.voicesLoaded = true;
        this.synthesis!.removeEventListener('voiceschanged', handleVoicesChanged);
        resolve();
      };

      this.synthesis!.addEventListener('voiceschanged', handleVoicesChanged);

      // Fallback timeout in case voiceschanged never fires (shouldn't happen, but be safe)
      setTimeout(() => {
        if (!this.voicesLoaded) {
          this.voicesLoaded = true;
          this.synthesis!.removeEventListener('voiceschanged', handleVoicesChanged);
          resolve();
        }
      }, 1000);
    });

    return this.voicesLoadPromise;
  }

  /**
   * Speaks the provided text
   */
  async speak(text: string): Promise<void> {
    if (!this.isSupported()) {
      const error = new Error("SpeechSynthesis API is not supported in this browser");
      this.events.onError?.(error);
      throw error;
    }

    // Stop any current speech
    this.stop();

    // Reset stopped flag for new speech
    this.stopped = false;

    // Wait for voices to be loaded before proceeding
    // This fixes the race condition in Chrome where voices aren't immediately available
    if (this.voiceId) {
      await this.waitForVoices();
    }

    return new Promise<void>((resolve, reject) => {
      this.currentResolve = resolve;
      this.currentReject = reject;

      const utterance = new SpeechSynthesisUtterance(text);
      this.currentUtterance = utterance;

      // Set rate
      utterance.rate = this.rate;

      // Set voice if specified
      if (this.voiceId) {
        const voices = this.synthesis!.getVoices();
        const voice = voices.find((v) => v.voiceURI === this.voiceId || v.name === this.voiceId);
        if (voice) {
          utterance.voice = voice;
        }
      }

      // Attach event handlers
      utterance.onstart = () => {
        this.paused = false;
        this.events.onStart?.();
      };

      utterance.onend = () => {
        this.currentUtterance = null;
        this.paused = false;
        this.events.onEnd?.();
        this.currentResolve?.();
        this.currentResolve = null;
        this.currentReject = null;
      };

      utterance.onerror = (event) => {
        this.currentUtterance = null;
        this.paused = false;

        // "interrupted" and "canceled" are expected when stop() is called
        // Don't treat these as errors
        if (this.stopped || event.error === "interrupted" || event.error === "canceled") {
          // Resolve normally since this was an intentional stop
          this.currentResolve?.();
          this.currentResolve = null;
          this.currentReject = null;
          return;
        }

        const error = new Error(`Speech synthesis error: ${event.error}`);
        this.events.onError?.(error);
        this.currentReject?.(error);
        this.currentResolve = null;
        this.currentReject = null;
      };

      utterance.onpause = () => {
        this.paused = true;
        this.events.onPause?.();
      };

      utterance.onresume = () => {
        this.paused = false;
        this.events.onResume?.();
      };

      // Start speaking
      this.synthesis!.speak(utterance);
    });
  }

  /**
   * Stops current speech and clears the queue
   */
  stop(): void {
    if (!this.isSupported()) return;

    // Mark as intentionally stopped before canceling
    this.stopped = true;

    this.synthesis!.cancel();
    this.currentUtterance = null;
    this.paused = false;

    // Resolve the pending promise (intentional stop is not an error)
    if (this.currentResolve) {
      this.currentResolve();
      this.currentResolve = null;
      this.currentReject = null;
    }
  }

  /**
   * Pauses current speech
   */
  pause(): void {
    if (!this.isSupported()) return;

    if (this.isSpeaking() && !this.paused) {
      this.synthesis!.pause();
    }
  }

  /**
   * Resumes paused speech
   */
  resume(): void {
    if (!this.isSupported()) return;

    if (this.paused) {
      this.synthesis!.resume();
    }
  }

  /**
   * Checks if speech is currently paused
   */
  isPaused(): boolean {
    if (!this.isSupported()) return false;
    return this.paused;
  }

  /**
   * Checks if speech is currently active
   */
  isSpeaking(): boolean {
    if (!this.isSupported()) return false;
    return this.synthesis!.speaking;
  }

  /**
   * Sets the speech rate
   * @param rate - Speech rate (0.5 - 2.0, where 1.0 is normal)
   */
  setRate(rate: number): void {
    // Clamp rate between 0.5 and 2.0
    this.rate = Math.max(0.5, Math.min(2.0, rate));
  }

  /**
   * Sets the voice to use for speech
   * @param voice - Voice identifier (voiceURI or name)
   */
  setVoice(voice: string): void {
    this.voiceId = voice;
  }

  /**
   * Gets the list of available voices
   *
   * Note: In Chrome, this may return an empty array if called immediately after construction.
   * Call waitForVoices() first if you need to ensure voices are loaded.
   * In Firefox, voices are available immediately.
   */
  getVoices(): Voice[] {
    if (!this.isSupported()) return [];

    const voices = this.synthesis!.getVoices();
    return voices.map((voice) => ({
      id: voice.voiceURI,
      name: voice.name,
      language: voice.lang,
    }));
  }
}
