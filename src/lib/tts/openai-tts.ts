/**
 * OpenAI-compatible TTS Engine Implementation
 *
 * Uses HTMLAudioElement for playback and fetches audio from /api/tts endpoint.
 * Supports caching of audio blobs for repeated narrations.
 */

import { TTSEngine, TTSEvents, Voice } from './types';

/**
 * Available voices for OpenAI-compatible TTS
 */
const AVAILABLE_VOICES: Voice[] = [
  // OpenAI voices
  { id: 'nova', name: 'Nova', language: 'en-US' },
  { id: 'alloy', name: 'Alloy', language: 'en-US' },
  { id: 'echo', name: 'Echo', language: 'en-US' },
  { id: 'fable', name: 'Fable', language: 'en-US' },
  { id: 'onyx', name: 'Onyx', language: 'en-US' },
  { id: 'shimmer', name: 'Shimmer', language: 'en-US' },
  // VibeVoice voices
  { id: 'Carter', name: 'Carter', language: 'en-US' },
  { id: 'Davis', name: 'Davis', language: 'en-US' },
  { id: 'Emma', name: 'Emma', language: 'en-US' },
  { id: 'Frank', name: 'Frank', language: 'en-US' },
  { id: 'Grace', name: 'Grace', language: 'en-US' },
  { id: 'Mike', name: 'Mike', language: 'en-US' },
  { id: 'Samuel', name: 'Samuel', language: 'en-US' },
];

/**
 * Simple hash function for caching audio blobs
 * Note: rate is NOT included since we use audio.playbackRate for speed control
 */
function hashText(text: string, voice: string): string {
  const input = `${text}|${voice}`;
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(36);
}

/**
 * OpenAI-compatible TTS Engine
 *
 * Implements the TTSEngine interface using HTMLAudioElement for playback
 * and fetching audio from /api/tts endpoint.
 */
export class OpenAICompatibleTTS implements TTSEngine {
  private audio: HTMLAudioElement | null = null;
  private voice: string = 'nova';
  private rate: number = 1.0;
  private paused: boolean = false;
  private speaking: boolean = false;
  private events: TTSEvents = {};
  private cache: Map<string, Promise<string>> = new Map();
  private currentResolve: (() => void) | null = null;
  private currentReject: ((error: Error) => void) | null = null;
  private prefetchQueue: string[] = [];
  private activePrefetches: number = 0;
  private readonly MAX_CONCURRENT_PREFETCHES = 2;

  /**
   * Creates a new OpenAI TTS Engine instance
   * @param events - Optional event callbacks for TTS lifecycle events
   */
  constructor(events?: TTSEvents) {
    if (events) {
      this.events = events;
    }
  }

  /**
   * Sets the event callbacks
   * @param events - Event callbacks for TTS lifecycle events
   */
  setEvents(events: TTSEvents): void {
    this.events = events;
  }

  /**
   * Fetches audio from the TTS API
   * @param text - The text to convert to speech
   * @returns Promise that resolves to a blob URL
   */
  private async fetchAudio(text: string): Promise<string> {
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: text,
        voice: this.voice,
        response_format: 'mp3',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`TTS API error: ${response.status} - ${errorText}`);
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  }

  /**
   * Prefetches audio for multiple texts
   * @param texts - Array of texts to prefetch
   */
  async prefetch(texts: string[]): Promise<void> {
    for (const text of texts) {
      const cacheKey = hashText(text, this.voice);
      if (this.cache.has(cacheKey)) continue;
      if (this.prefetchQueue.includes(text)) continue;
      this.prefetchQueue.push(text);
    }
    this.processPrefetchQueue();
  }

  /**
   * Processes the prefetch queue with concurrency control
   */
  private processPrefetchQueue(): void {
    while (
      this.prefetchQueue.length > 0 &&
      this.activePrefetches < this.MAX_CONCURRENT_PREFETCHES
    ) {
      const text = this.prefetchQueue.shift()!;
      const cacheKey = hashText(text, this.voice);
      if (this.cache.has(cacheKey)) continue;

      this.activePrefetches++;
      const promise = this.fetchAudio(text)
        .catch((error) => {
          this.cache.delete(cacheKey);
          throw error;
        })
        .finally(() => {
          this.activePrefetches--;
          this.processPrefetchQueue();
        });

      this.cache.set(cacheKey, promise);
    }
  }

  /**
   * Cancels all pending prefetch operations
   */
  cancelPrefetch(): void {
    this.prefetchQueue = [];
  }

  /**
   * Speaks the provided text using OpenAI TTS
   * @param text - The text to speak
   * @returns Promise that resolves when speech completes
   */
  async speak(text: string): Promise<void> {
    // Stop any current playback
    this.stop();

    // Reset state
    this.paused = false;
    this.speaking = true;

    return new Promise<void>(async (resolve, reject) => {
      this.currentResolve = resolve;
      this.currentReject = reject;

      try {
        // Check cache first (rate not included - we use playbackRate for speed)
        const cacheKey = hashText(text, this.voice);
        let blobUrl: string;

        const cachedPromise = this.cache.get(cacheKey);
        if (cachedPromise) {
          blobUrl = await cachedPromise;
        } else {
          const fetchPromise = this.fetchAudio(text);
          this.cache.set(cacheKey, fetchPromise);
          try {
            blobUrl = await fetchPromise;
          } catch (error) {
            this.cache.delete(cacheKey);
            throw error;
          }
        }

        // Create audio element and set up playback
        this.audio = new Audio(blobUrl);
        this.audio.playbackRate = this.rate;

        // Set up event handlers
        this.audio.onplay = () => {
          this.events.onStart?.();
        };

        this.audio.onended = () => {
          this.speaking = false;
          this.paused = false;
          this.events.onEnd?.();
          this.currentResolve?.();
          this.currentResolve = null;
          this.currentReject = null;
        };

        this.audio.onerror = () => {
          const error = new Error('Audio playback error');
          this.speaking = false;
          this.paused = false;
          this.events.onError?.(error);
          this.currentReject?.(error);
          this.currentResolve = null;
          this.currentReject = null;
        };

        // Start playback
        await this.audio.play();
      } catch (error) {
        this.speaking = false;
        this.paused = false;
        const err = error instanceof Error ? error : new Error(String(error));
        this.events.onError?.(err);
        reject(err);
        this.currentResolve = null;
        this.currentReject = null;
      }
    });
  }

  /**
   * Stops current speech and clears the queue
   */
  stop(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio.onplay = null;
      this.audio.onended = null;
      this.audio.onerror = null;
      this.audio = null;
    }
    this.speaking = false;
    this.paused = false;

    // Resolve any pending promise
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
    if (this.audio && this.speaking && !this.paused) {
      this.audio.pause();
      this.paused = true;
      this.events.onPause?.();
    }
  }

  /**
   * Resumes paused speech
   */
  resume(): void {
    if (this.audio && this.speaking && this.paused) {
      this.audio.play();
      this.paused = false;
      this.events.onResume?.();
    }
  }

  /**
   * Checks if speech is currently paused
   * @returns true if paused, false otherwise
   */
  isPaused(): boolean {
    return this.paused;
  }

  /**
   * Checks if speech is currently active
   * @returns true if speaking, false otherwise
   */
  isSpeaking(): boolean {
    return this.speaking;
  }

  /**
   * Sets the speech rate
   * @param rate - Speech rate (0.25 - 4.0, where 1.0 is normal)
   */
  setRate(rate: number): void {
    // Clamp rate to valid range
    this.rate = Math.max(0.25, Math.min(4.0, rate));
    // Apply to currently playing audio if any
    if (this.audio) {
      this.audio.playbackRate = this.rate;
    }
  }

  /**
   * Sets the voice to use for speech
   * @param voice - Voice identifier
   */
  setVoice(voice: string): void {
    this.voice = voice;
  }

  /**
   * Gets the list of available voices
   * @returns Array of available voices
   */
  getVoices(): Voice[] {
    return [...AVAILABLE_VOICES];
  }

  /**
   * Clears the audio cache
   * Useful for freeing memory when cache is no longer needed
   */
  clearCache(): void {
    // Revoke all blob URLs to free memory
    for (const promise of this.cache.values()) {
      promise.then(blobUrl => URL.revokeObjectURL(blobUrl)).catch(() => {});
    }
    this.cache.clear();
    this.prefetchQueue = [];
  }

  /**
   * Gets the current voice
   * @returns Current voice identifier
   */
  getVoice(): string {
    return this.voice;
  }

  /**
   * Gets the current speech rate
   * @returns Current speech rate
   */
  getRate(): number {
    return this.rate;
  }
}
