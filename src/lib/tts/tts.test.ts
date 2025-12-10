/**
 * TTS Abstraction Layer - Test Suite
 *
 * Tests the WebSpeechTTS implementation with mocked SpeechSynthesis API.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { WebSpeechTTS } from "./web-speech";
import { createTTSEngine } from "./index";
import type { TTSEvents } from "./types";

// Mock SpeechSynthesisUtterance
class MockSpeechSynthesisUtterance {
  text: string = "";
  rate: number = 1;
  voice: SpeechSynthesisVoice | null = null;
  onstart: ((event: SpeechSynthesisEvent) => void) | null = null;
  onend: ((event: SpeechSynthesisEvent) => void) | null = null;
  onerror: ((event: SpeechSynthesisErrorEvent) => void) | null = null;
  onpause: ((event: SpeechSynthesisEvent) => void) | null = null;
  onresume: ((event: SpeechSynthesisEvent) => void) | null = null;

  constructor(text: string) {
    this.text = text;
  }
}

// Mock SpeechSynthesis
class MockSpeechSynthesis {
  speaking: boolean = false;
  pending: boolean = false;
  paused: boolean = false;
  private utterances: MockSpeechSynthesisUtterance[] = [];
  private voices: SpeechSynthesisVoice[] = [];
  private eventListeners: Map<string, Set<EventListener>> = new Map();

  speak(utterance: MockSpeechSynthesisUtterance): void {
    this.speaking = true;
    this.utterances.push(utterance);

    // Simulate async speech start
    setTimeout(() => {
      if (utterance.onstart) {
        utterance.onstart({} as SpeechSynthesisEvent);
      }
    }, 0);
  }

  cancel(): void {
    this.speaking = false;
    this.paused = false;
    this.utterances = [];
  }

  pause(): void {
    if (this.speaking && !this.paused) {
      this.paused = true;
      const utterance = this.utterances[this.utterances.length - 1];
      if (utterance?.onpause) {
        utterance.onpause({} as SpeechSynthesisEvent);
      }
    }
  }

  resume(): void {
    if (this.paused) {
      this.paused = false;
      const utterance = this.utterances[this.utterances.length - 1];
      if (utterance?.onresume) {
        utterance.onresume({} as SpeechSynthesisEvent);
      }
    }
  }

  getVoices(): SpeechSynthesisVoice[] {
    return this.voices;
  }

  setVoices(voices: SpeechSynthesisVoice[]): void {
    this.voices = voices;
  }

  // Helper method to trigger speech end
  triggerEnd(): void {
    const utterance = this.utterances[this.utterances.length - 1];
    if (utterance?.onend) {
      this.speaking = false;
      utterance.onend({} as SpeechSynthesisEvent);
    }
  }

  // Helper method to trigger speech error
  triggerError(error: string): void {
    const utterance = this.utterances[this.utterances.length - 1];
    if (utterance?.onerror) {
      this.speaking = false;
      utterance.onerror({ error } as SpeechSynthesisErrorEvent);
    }
  }

  // Event listener methods (for Chrome voiceschanged event)
  addEventListener(event: string, callback: EventListener): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  removeEventListener(event: string, callback: EventListener): void {
    this.eventListeners.get(event)?.delete(callback);
  }

  // Helper method to trigger voiceschanged event
  triggerVoicesChanged(): void {
    const listeners = this.eventListeners.get('voiceschanged');
    if (listeners) {
      listeners.forEach(callback => callback(new Event('voiceschanged')));
    }
  }
}

// Create mock voices
function createMockVoice(
  voiceURI: string,
  name: string,
  lang: string
): SpeechSynthesisVoice {
  return {
    voiceURI,
    name,
    lang,
    default: false,
    localService: true,
  } as SpeechSynthesisVoice;
}

describe("WebSpeechTTS", () => {
  let mockSynthesis: MockSpeechSynthesis;
  let originalWindow: typeof globalThis.window;
  let originalSpeechSynthesisUtterance: typeof SpeechSynthesisUtterance;

  beforeEach(() => {
    // Create mock synthesis
    mockSynthesis = new MockSpeechSynthesis();

    // Setup mock voices
    const voices = [
      createMockVoice("en-US-1", "Google US English", "en-US"),
      createMockVoice("en-GB-1", "Google UK English", "en-GB"),
      createMockVoice("es-ES-1", "Google Spanish", "es-ES"),
    ];
    mockSynthesis.setVoices(voices);

    // Mock global window object
    originalWindow = global.window;
    originalSpeechSynthesisUtterance = global.SpeechSynthesisUtterance;

    // @ts-expect-error - Mocking global
    global.window = {
      speechSynthesis: mockSynthesis,
    };

    // @ts-expect-error - Mocking global
    global.SpeechSynthesisUtterance = MockSpeechSynthesisUtterance;
  });

  afterEach(() => {
    // Restore original window
    global.window = originalWindow;
    global.SpeechSynthesisUtterance = originalSpeechSynthesisUtterance;
  });

  describe("Constructor and Initialization", () => {
    it("creates instance successfully", () => {
      const tts = new WebSpeechTTS();
      expect(tts).toBeDefined();
      expect(tts.isSpeaking()).toBe(false);
      expect(tts.isPaused()).toBe(false);
    });

    it("accepts event callbacks", () => {
      const events: TTSEvents = {
        onStart: vi.fn(),
        onEnd: vi.fn(),
        onError: vi.fn(),
      };
      const tts = new WebSpeechTTS(events);
      expect(tts).toBeDefined();
    });
  });

  describe("speak()", () => {
    it("speaks text successfully", async () => {
      const tts = new WebSpeechTTS();
      const speakPromise = tts.speak("Hello, world!");

      // Verify speaking started
      expect(tts.isSpeaking()).toBe(true);

      // Trigger end event
      mockSynthesis.triggerEnd();

      // Wait for promise to resolve
      await speakPromise;

      // Verify speaking ended
      expect(tts.isSpeaking()).toBe(false);
    });

    it("resolves promise when speech ends", async () => {
      const tts = new WebSpeechTTS();
      const speakPromise = tts.speak("Test");

      setTimeout(() => {
        mockSynthesis.triggerEnd();
      }, 10);

      await expect(speakPromise).resolves.toBeUndefined();
    });

    it("rejects promise on error", async () => {
      const tts = new WebSpeechTTS();
      const speakPromise = tts.speak("Test");

      setTimeout(() => {
        mockSynthesis.triggerError("network");
      }, 10);

      await expect(speakPromise).rejects.toThrow("Speech synthesis error: network");
    });

    it("triggers onStart event", async () => {
      const onStart = vi.fn();
      const tts = new WebSpeechTTS({ onStart });

      tts.speak("Test");

      // Wait for async start event
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(onStart).toHaveBeenCalledTimes(1);

      // Cleanup
      mockSynthesis.triggerEnd();
    });

    it("triggers onEnd event", async () => {
      const onEnd = vi.fn();
      const tts = new WebSpeechTTS({ onEnd });

      const speakPromise = tts.speak("Test");
      mockSynthesis.triggerEnd();

      await speakPromise;

      expect(onEnd).toHaveBeenCalledTimes(1);
    });

    it("triggers onError event on error", async () => {
      const onError = vi.fn();
      const tts = new WebSpeechTTS({ onError });

      const speakPromise = tts.speak("Test");

      setTimeout(() => {
        // Use "network" error (not "interrupted" or "canceled" which are handled gracefully)
        mockSynthesis.triggerError("network");
      }, 10);

      await expect(speakPromise).rejects.toThrow();
      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("network"),
        })
      );
    });

    it("handles interrupted error gracefully when stop is called", async () => {
      const onError = vi.fn();
      const tts = new WebSpeechTTS({ onError });

      const speakPromise = tts.speak("Test");

      // Trigger interrupted error (like when stop() is called)
      setTimeout(() => {
        mockSynthesis.triggerError("interrupted");
      }, 10);

      // Should resolve, not reject (interrupted is expected behavior)
      await expect(speakPromise).resolves.toBeUndefined();
      // onError should NOT be called for interrupted
      expect(onError).not.toHaveBeenCalled();
    });

    it("stops previous speech when speaking new text", async () => {
      const tts = new WebSpeechTTS();

      const firstPromise = tts.speak("First");
      expect(tts.isSpeaking()).toBe(true);

      // Start second speech (should stop first)
      const secondPromise = tts.speak("Second");

      // First should resolve (intentional stop is not an error)
      await expect(firstPromise).resolves.toBeUndefined();

      // Second should succeed
      mockSynthesis.triggerEnd();
      await expect(secondPromise).resolves.toBeUndefined();
    });

    it("throws error when SpeechSynthesis is not supported", async () => {
      // Remove speechSynthesis from window
      // @ts-expect-error - Mocking global
      global.window = {};

      const tts = new WebSpeechTTS();

      await expect(tts.speak("Test")).rejects.toThrow(
        "SpeechSynthesis API is not supported"
      );
    });
  });

  describe("stop()", () => {
    it("stops current speech", async () => {
      const tts = new WebSpeechTTS();

      const speakPromise = tts.speak("Test");
      expect(tts.isSpeaking()).toBe(true);

      tts.stop();

      // Promise should resolve (intentional stop is not an error)
      await expect(speakPromise).resolves.toBeUndefined();

      // Speaking should be stopped
      expect(tts.isSpeaking()).toBe(false);
    });

    it("clears pause state", async () => {
      const tts = new WebSpeechTTS();

      tts.speak("Test");
      tts.pause();
      expect(tts.isPaused()).toBe(true);

      tts.stop();
      expect(tts.isPaused()).toBe(false);
    });

    it("does nothing when SpeechSynthesis is not supported", () => {
      // @ts-expect-error - Mocking global
      global.window = {};

      const tts = new WebSpeechTTS();
      expect(() => tts.stop()).not.toThrow();
    });
  });

  describe("pause() and resume()", () => {
    it("pauses and resumes speech", async () => {
      const onPause = vi.fn();
      const onResume = vi.fn();
      const tts = new WebSpeechTTS({ onPause, onResume });

      tts.speak("Test");

      // Wait for speech to start
      await new Promise((resolve) => setTimeout(resolve, 10));

      tts.pause();
      expect(tts.isPaused()).toBe(true);
      expect(onPause).toHaveBeenCalledTimes(1);

      tts.resume();
      expect(tts.isPaused()).toBe(false);
      expect(onResume).toHaveBeenCalledTimes(1);

      // Cleanup
      tts.stop();
    });

    it("pause() does nothing when not speaking", () => {
      const tts = new WebSpeechTTS();
      expect(() => tts.pause()).not.toThrow();
      expect(tts.isPaused()).toBe(false);
    });

    it("resume() does nothing when not paused", () => {
      const tts = new WebSpeechTTS();
      expect(() => tts.resume()).not.toThrow();
    });

    it("pause/resume do nothing when SpeechSynthesis is not supported", () => {
      // @ts-expect-error - Mocking global
      global.window = {};

      const tts = new WebSpeechTTS();
      expect(() => tts.pause()).not.toThrow();
      expect(() => tts.resume()).not.toThrow();
    });
  });

  describe("setRate()", () => {
    it("sets speech rate", () => {
      const tts = new WebSpeechTTS();
      tts.setRate(1.5);

      // Verify rate is applied by checking utterance
      tts.speak("Test");

      // Check the utterance that was created
      const utterances = (mockSynthesis as any).utterances;
      expect(utterances[0].rate).toBe(1.5);

      // Cleanup
      tts.stop();
    });

    it("clamps rate to minimum 0.5", () => {
      const tts = new WebSpeechTTS();
      tts.setRate(0.1);

      tts.speak("Test");

      const utterances = (mockSynthesis as any).utterances;
      expect(utterances[0].rate).toBe(0.5);

      tts.stop();
    });

    it("clamps rate to maximum 2.0", () => {
      const tts = new WebSpeechTTS();
      tts.setRate(3.0);

      tts.speak("Test");

      const utterances = (mockSynthesis as any).utterances;
      expect(utterances[0].rate).toBe(2.0);

      tts.stop();
    });
  });

  describe("setVoice()", () => {
    it("sets voice by voiceURI", async () => {
      const tts = new WebSpeechTTS();
      tts.setVoice("en-US-1");

      // speak() is async because it waits for voices to load when a voice is set
      const speakPromise = tts.speak("Test");

      // Wait a tick for the speak to start (voices are already loaded in mock)
      await Promise.resolve();

      const utterances = (mockSynthesis as any).utterances;
      expect(utterances[0].voice).toBeDefined();
      expect(utterances[0].voice.voiceURI).toBe("en-US-1");

      tts.stop();
      await speakPromise;
    });

    it("sets voice by name", async () => {
      const tts = new WebSpeechTTS();
      tts.setVoice("Google UK English");

      // speak() is async because it waits for voices to load when a voice is set
      const speakPromise = tts.speak("Test");

      // Wait a tick for the speak to start (voices are already loaded in mock)
      await Promise.resolve();

      const utterances = (mockSynthesis as any).utterances;
      expect(utterances[0].voice).toBeDefined();
      expect(utterances[0].voice.name).toBe("Google UK English");

      tts.stop();
      await speakPromise;
    });

    it("handles invalid voice gracefully", async () => {
      const tts = new WebSpeechTTS();
      tts.setVoice("invalid-voice");

      // speak() is async because it waits for voices to load when a voice is set
      const speakPromise = tts.speak("Test");

      // Wait a tick for the speak to start (voices are already loaded in mock)
      await Promise.resolve();

      const utterances = (mockSynthesis as any).utterances;
      expect(utterances[0].voice).toBeNull();

      tts.stop();
      await speakPromise;
    });
  });

  describe("getVoices()", () => {
    it("returns list of available voices", () => {
      const tts = new WebSpeechTTS();
      const voices = tts.getVoices();

      expect(voices).toHaveLength(3);
      expect(voices[0]).toEqual({
        id: "en-US-1",
        name: "Google US English",
        language: "en-US",
      });
      expect(voices[1]).toEqual({
        id: "en-GB-1",
        name: "Google UK English",
        language: "en-GB",
      });
      expect(voices[2]).toEqual({
        id: "es-ES-1",
        name: "Google Spanish",
        language: "es-ES",
      });
    });

    it("returns empty array when SpeechSynthesis is not supported", () => {
      // @ts-expect-error - Mocking global
      global.window = {};

      const tts = new WebSpeechTTS();
      const voices = tts.getVoices();

      expect(voices).toEqual([]);
    });
  });

  describe("isSpeaking() and isPaused()", () => {
    it("isSpeaking() returns correct state", async () => {
      const tts = new WebSpeechTTS();

      expect(tts.isSpeaking()).toBe(false);

      const speakPromise = tts.speak("Test");
      expect(tts.isSpeaking()).toBe(true);

      mockSynthesis.triggerEnd();
      await speakPromise;

      expect(tts.isSpeaking()).toBe(false);
    });

    it("isPaused() returns correct state", async () => {
      const tts = new WebSpeechTTS();

      expect(tts.isPaused()).toBe(false);

      tts.speak("Test");
      await new Promise((resolve) => setTimeout(resolve, 10));

      tts.pause();
      expect(tts.isPaused()).toBe(true);

      tts.resume();
      expect(tts.isPaused()).toBe(false);

      tts.stop();
    });

    it("return false when SpeechSynthesis is not supported", () => {
      // @ts-expect-error - Mocking global
      global.window = {};

      const tts = new WebSpeechTTS();

      expect(tts.isSpeaking()).toBe(false);
      expect(tts.isPaused()).toBe(false);
    });
  });
});

describe("createTTSEngine()", () => {
  let mockSynthesis: MockSpeechSynthesis;
  let originalWindow: typeof globalThis.window;
  let originalSpeechSynthesisUtterance: typeof SpeechSynthesisUtterance;

  beforeEach(() => {
    mockSynthesis = new MockSpeechSynthesis();

    originalWindow = global.window;
    originalSpeechSynthesisUtterance = global.SpeechSynthesisUtterance;

    // @ts-expect-error - Mocking global
    global.window = {
      speechSynthesis: mockSynthesis,
    };

    // @ts-expect-error - Mocking global
    global.SpeechSynthesisUtterance = MockSpeechSynthesisUtterance;
  });

  afterEach(() => {
    global.window = originalWindow;
    global.SpeechSynthesisUtterance = originalSpeechSynthesisUtterance;
  });

  it("creates a TTS engine instance", () => {
    const engine = createTTSEngine();
    expect(engine).toBeDefined();
    expect(engine).toBeInstanceOf(WebSpeechTTS);
  });

  it("passes events to the engine", () => {
    const events: TTSEvents = {
      onStart: vi.fn(),
      onEnd: vi.fn(),
    };
    const engine = createTTSEngine(events);
    expect(engine).toBeDefined();
  });

  it("created engine implements TTSEngine interface", () => {
    const engine = createTTSEngine();

    // Check all required methods exist
    expect(typeof engine.speak).toBe("function");
    expect(typeof engine.stop).toBe("function");
    expect(typeof engine.pause).toBe("function");
    expect(typeof engine.resume).toBe("function");
    expect(typeof engine.isPaused).toBe("function");
    expect(typeof engine.isSpeaking).toBe("function");
    expect(typeof engine.setRate).toBe("function");
    expect(typeof engine.setVoice).toBe("function");
    expect(typeof engine.getVoices).toBe("function");
  });
});
