# TTS Abstraction Layer

A flexible Text-to-Speech abstraction layer for the Slides Tutor application.

## Overview

This module provides a unified interface for Text-to-Speech engines, currently implemented using the Web Speech API (SpeechSynthesis). The abstraction allows for easy swapping of TTS engines in the future.

## Files

- `types.ts` - TypeScript interfaces and types
- `web-speech.ts` - Web Speech API implementation
- `index.ts` - Main entry point with exports and factory function
- `tts.test.ts` - Comprehensive test suite

## Usage

### Basic Usage

```typescript
import { createTTSEngine } from '@/lib/tts';

const tts = createTTSEngine();

// Speak some text
await tts.speak("Hello, world!");
```

### With Event Callbacks

```typescript
import { createTTSEngine, TTSEvents } from '@/lib/tts';

const events: TTSEvents = {
  onStart: () => console.log("Speech started"),
  onEnd: () => console.log("Speech ended"),
  onPause: () => console.log("Speech paused"),
  onResume: () => console.log("Speech resumed"),
  onError: (error) => console.error("Speech error:", error),
};

const tts = createTTSEngine(events);
await tts.speak("This will trigger events");
```

### Controlling Playback

```typescript
const tts = createTTSEngine();

// Start speaking
tts.speak("This is a long sentence that can be controlled.");

// Pause speech
tts.pause();

// Resume speech
tts.resume();

// Stop speech (and reject the promise)
tts.stop();

// Check state
if (tts.isSpeaking()) {
  console.log("Currently speaking");
}

if (tts.isPaused()) {
  console.log("Currently paused");
}
```

### Adjusting Speech Rate

```typescript
const tts = createTTSEngine();

// Set speech rate (0.5 - 2.0)
tts.setRate(1.5); // 1.5x speed
tts.setRate(0.75); // 0.75x speed (slower)

await tts.speak("This will be spoken at the set rate");
```

### Voice Selection

```typescript
const tts = createTTSEngine();

// Get available voices
const voices = tts.getVoices();
console.log("Available voices:", voices);

// Set voice by ID or name
tts.setVoice("Google US English");
// or
tts.setVoice(voices[0].id);

await tts.speak("This will be spoken in the selected voice");
```

## API Reference

### TTSEngine Interface

#### Methods

- `speak(text: string): Promise<void>` - Speaks the provided text. Returns a Promise that resolves when speech ends.
- `stop(): void` - Stops current speech and clears the queue
- `pause(): void` - Pauses current speech
- `resume(): void` - Resumes paused speech
- `isPaused(): boolean` - Checks if speech is currently paused
- `isSpeaking(): boolean` - Checks if speech is currently active
- `setRate(rate: number): void` - Sets the speech rate (0.5 - 2.0)
- `setVoice(voice: string): void` - Sets the voice to use for speech
- `getVoices(): Voice[]` - Gets the list of available voices

### Voice Interface

```typescript
interface Voice {
  id: string;        // Unique voice identifier
  name: string;      // Human-readable voice name
  language: string;  // Language code (e.g., "en-US")
}
```

### TTSEvents Interface

```typescript
interface TTSEvents {
  onStart?: () => void;
  onEnd?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onError?: (error: Error) => void;
}
```

## Browser Compatibility

The Web Speech API is supported in:
- Chrome 33+
- Edge 14+
- Safari 7+
- Firefox 49+

The implementation gracefully handles unsupported browsers by throwing an error when attempting to speak.

## Testing

Run the tests with:

```bash
npm run test -- src/lib/tts
```

The test suite includes comprehensive coverage of:
- Constructor and initialization
- Speaking text with promise resolution
- Error handling
- Pause and resume functionality
- Rate and voice control
- State management
- Browser compatibility safeguards

## Future Enhancements

- Support for additional TTS engines (e.g., cloud-based services)
- Voice detection based on content language
- Queue management for multiple speech requests
- Fine-grained control over pitch and volume
- Word-level highlighting callbacks
