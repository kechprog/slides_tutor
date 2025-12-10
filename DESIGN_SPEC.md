# Slides Tutor - Application Design Specification

Version: 1.0.0

## Overview

Slides Tutor is a Next.js application that presents narrated slideshow tutorials. It parses `.sld` files, renders slides, and uses text-to-speech (TTS) to read narration while highlighting the current element.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Next.js App                          │
├─────────────────────────────────────────────────────────────┤
│  Pages                                                      │
│  ├── / (Home)           - File upload / demo selection      │
│  └── /present           - Slideshow presentation view       │
├─────────────────────────────────────────────────────────────┤
│  Components                                                 │
│  ├── SlideRenderer      - Renders slide content             │
│  ├── SlideContent       - Renders individual elements       │
│  ├── PlaybackControls   - Play/pause/next/prev controls     │
│  ├── ProgressBar        - Slide progress indicator          │
│  └── FileUploader       - .sld file upload component        │
├─────────────────────────────────────────────────────────────┤
│  Hooks                                                      │
│  ├── useSlideshow       - Slideshow state management        │
│  ├── useNarration       - TTS playback control              │
│  └── usePlayback        - Orchestrates narration + slides   │
├─────────────────────────────────────────────────────────────┤
│  Lib                                                        │
│  ├── parser/            - .sld parser (existing)            │
│  ├── tts/               - TTS abstraction layer             │
│  └── narration/         - Narration tree traversal          │
└─────────────────────────────────────────────────────────────┘
```

---

## Core Data Flow

```
.sld File → Parser → Slideshow AST → Presentation State → UI
                                           ↓
                                    Narration Queue
                                           ↓
                                    TTS Engine → Audio
                                           ↓
                                    Element Highlighting
```

---

## Module Specifications

### 1. Narration System (`src/lib/narration/`)

#### 1.1 Narration Tree Builder

Transforms parsed slide content into a flat narration queue for playback.

```typescript
// src/lib/narration/types.ts

interface NarrationItem {
  id: string;                    // Unique ID for highlighting
  text: string;                  // Narration text to speak
  delay: number;                 // Delay after speaking (ms)
  elementPath: number[];         // Path to element in slide tree
  slideIndex: number;            // Which slide this belongs to
}

interface NarrationQueue {
  items: NarrationItem[];
  currentIndex: number;
}
```

#### 1.2 Traversal Algorithm

```typescript
// src/lib/narration/builder.ts

function buildNarrationQueue(slideshow: Slideshow): NarrationItem[]

// Traverses each slide's content tree in order:
// 1. Sort children by `order` attribute
// 2. For each ordered child:
//    a. If has `narration`, add to queue
//    b. Recursively process children
// 3. Return flat array of NarrationItems
```

---

### 2. TTS Abstraction (`src/lib/tts/`)

#### 2.1 TTS Interface

```typescript
// src/lib/tts/types.ts

interface TTSEngine {
  speak(text: string): Promise<void>;
  stop(): void;
  pause(): void;
  resume(): void;
  isPaused(): boolean;
  isSpeaking(): boolean;
  setRate(rate: number): void;      // 0.5 - 2.0
  setVoice(voice: string): void;
  getVoices(): Voice[];
}

interface Voice {
  id: string;
  name: string;
  language: string;
}

interface TTSEvents {
  onStart?: () => void;
  onEnd?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onError?: (error: Error) => void;
}
```

#### 2.2 Web Speech Implementation

```typescript
// src/lib/tts/web-speech.ts

class WebSpeechTTS implements TTSEngine {
  // Uses browser's SpeechSynthesis API
  // Handles utterance lifecycle
  // Provides voice selection
}
```

---

### 3. Playback Hook (`src/hooks/usePlayback.ts`)

Orchestrates the entire presentation playback.

```typescript
interface PlaybackState {
  status: 'idle' | 'playing' | 'paused' | 'finished';
  currentSlideIndex: number;
  currentNarrationIndex: number;
  highlightedElementId: string | null;
}

interface PlaybackControls {
  play(): void;
  pause(): void;
  stop(): void;
  nextSlide(): void;
  prevSlide(): void;
  goToSlide(index: number): void;
  setAutoAdvance(enabled: boolean): void;
  setPlaybackRate(rate: number): void;
}

function usePlayback(slideshow: Slideshow): {
  state: PlaybackState;
  controls: PlaybackControls;
}
```

#### Playback Flow

```
1. User clicks Play
2. Build narration queue for current slide
3. Start TTS for first narration item
4. Highlight corresponding element
5. On TTS end:
   a. Wait for delay (if any)
   b. Clear highlight
   c. Move to next narration item
   d. If no more items on slide:
      - If autoAdvance: go to next slide, repeat from step 2
      - Else: pause and wait for user
6. On last slide complete: set status to 'finished'
```

---

### 4. UI Components

#### 4.1 SlideRenderer (`src/components/SlideRenderer.tsx`)

```typescript
interface SlideRendererProps {
  slide: Slide;
  highlightedElementId: string | null;
  transition: TransitionType;
}

// Responsibilities:
// - Renders slide content recursively
// - Applies highlight styling to active element
// - Handles slide transitions (CSS animations)
```

#### 4.2 SlideContent (`src/components/SlideContent.tsx`)

```typescript
interface SlideContentProps {
  node: ContentNode;
  path: number[];
  highlightedElementId: string | null;
}

// Renders individual content elements:
// - div, p, h1-h6, ul, ol, li, etc.
// - Applies appropriate HTML tags
// - Adds highlight class when element is active
// - Generates unique IDs for highlighting
```

#### 4.3 PlaybackControls (`src/components/PlaybackControls.tsx`)

```typescript
interface PlaybackControlsProps {
  state: PlaybackState;
  controls: PlaybackControls;
  totalSlides: number;
}

// UI elements:
// - Play/Pause button
// - Stop button
// - Previous/Next slide buttons
// - Slide counter (e.g., "2 / 10")
// - Playback speed selector
// - Auto-advance toggle
```

#### 4.4 ProgressBar (`src/components/ProgressBar.tsx`)

```typescript
interface ProgressBarProps {
  currentSlide: number;
  totalSlides: number;
  narrationProgress: number;  // 0-1 within current slide
}

// Visual progress indicator:
// - Overall slide progress
// - Current slide narration progress
```

---

### 5. Pages

#### 5.1 Home Page (`src/app/page.tsx`)

```typescript
// Features:
// - File upload dropzone for .sld files
// - Demo slideshow selection
// - Recent files (localStorage)
// - Brief instructions

// Flow:
// 1. User uploads/selects .sld file
// 2. Parse file, validate
// 3. On success: redirect to /present?file=<id>
// 4. On error: show validation errors
```

#### 5.2 Presentation Page (`src/app/present/page.tsx`)

```typescript
// Features:
// - Full-screen slideshow view
// - Playback controls overlay
// - Keyboard shortcuts
// - Exit button

// Layout:
// ┌─────────────────────────────────────┐
// │  [Exit]              [Settings]     │
// │                                     │
// │                                     │
// │         Slide Content               │
// │                                     │
// │                                     │
// │  ┌─────────────────────────────┐   │
// │  │   Playback Controls         │   │
// │  └─────────────────────────────┘   │
// │  ════════════════════════════════  │  <- Progress bar
// └─────────────────────────────────────┘
```

---

### 6. State Management

#### 6.1 Slideshow Context

```typescript
// src/context/SlideshowContext.tsx

interface SlideshowContextValue {
  slideshow: Slideshow | null;
  setSlideshow: (slideshow: Slideshow) => void;
  isLoading: boolean;
  error: string | null;
}
```

#### 6.2 Settings Context

```typescript
// src/context/SettingsContext.tsx

interface Settings {
  playbackRate: number;         // 0.5 - 2.0
  autoAdvance: boolean;         // Auto-advance slides
  voiceId: string | null;       // Selected TTS voice
  highlightColor: string;       // Highlight color
  theme: 'light' | 'dark';      // UI theme
}

interface SettingsContextValue {
  settings: Settings;
  updateSettings: (partial: Partial<Settings>) => void;
}
```

---

### 7. Styling

#### 7.1 Slide Styling

```css
/* Base slide styles */
.slide {
  /* Full viewport, centered content */
  /* Typography scale for headings */
  /* List styling */
}

/* Element highlighting */
.slide-element.highlighted {
  /* Visual emphasis */
  background-color: var(--highlight-color);
  transition: background-color 0.2s;
}

/* Transitions */
.slide-enter { /* Entry animation */ }
.slide-exit { /* Exit animation */ }
.slide-transition-fade { /* Fade transition */ }
.slide-transition-slide-left { /* Slide left transition */ }
/* ... other transitions */
```

#### 7.2 Tailwind Configuration

```typescript
// tailwind.config.ts additions
{
  theme: {
    extend: {
      colors: {
        highlight: 'var(--highlight-color)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in-left': 'slideInLeft 0.3s ease-in-out',
        // ... other transitions
      }
    }
  }
}
```

---

### 8. Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play/Pause |
| `→` or `N` | Next slide |
| `←` or `P` | Previous slide |
| `Escape` | Exit presentation |
| `F` | Toggle fullscreen |
| `M` | Mute/unmute |
| `+` / `-` | Increase/decrease speed |

---

### 9. File Handling

#### 9.1 File Upload Flow

```
1. User drops/selects .sld file
2. Read file as text
3. Parse with parseSld()
4. If success:
   a. Store in memory (or localStorage for persistence)
   b. Generate unique ID
   c. Navigate to /present?id=<id>
5. If error:
   a. Display validation errors
   b. Allow user to fix and retry
```

#### 9.2 Demo Files

```typescript
// src/lib/demos/index.ts

const DEMO_SLIDESHOWS = {
  'intro-to-react': { title: 'Introduction to React', content: '...' },
  'css-basics': { title: 'CSS Basics', content: '...' },
};

function loadDemo(id: string): Slideshow | null
```

---

### 10. Error Handling

#### 10.1 Parse Errors

Display validation errors from parser with line numbers:
```
Error E008 at line 15: Element with 'narration' requires 'order' attribute
```

#### 10.2 TTS Errors

- Voice not available: Fall back to default voice
- Speech synthesis error: Show toast, allow retry
- Browser not supported: Show message with alternatives

#### 10.3 Runtime Errors

- Wrap presentation in error boundary
- Show friendly error message
- Offer to restart presentation

---

### 11. Browser Support

| Browser | Support |
|---------|---------|
| Chrome 90+ | Full |
| Firefox 90+ | Full |
| Safari 15+ | Full (some voices limited) |
| Edge 90+ | Full |

**Required APIs:**
- Web Speech API (SpeechSynthesis)
- File API
- CSS Animations

---

### 12. Implementation Phases

#### Phase 1: Core Playback
- [ ] Narration queue builder
- [ ] TTS integration (Web Speech)
- [ ] Basic slide renderer
- [ ] Play/pause functionality

#### Phase 2: UI Polish
- [ ] Playback controls component
- [ ] Progress bar
- [ ] Element highlighting
- [ ] Slide transitions

#### Phase 3: File Handling
- [ ] File upload component
- [ ] Demo slideshows
- [ ] Error display

#### Phase 4: Settings & Polish
- [ ] Settings panel
- [ ] Keyboard shortcuts
- [ ] Fullscreen mode
- [ ] Voice selection
- [ ] Playback speed

---

## File Structure

```
src/
├── app/
│   ├── page.tsx                 # Home page
│   ├── present/
│   │   └── page.tsx             # Presentation page
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── SlideRenderer.tsx
│   ├── SlideContent.tsx
│   ├── PlaybackControls.tsx
│   ├── ProgressBar.tsx
│   ├── FileUploader.tsx
│   └── ui/                      # Generic UI components
├── hooks/
│   ├── usePlayback.ts
│   ├── useSlideshow.ts
│   └── useNarration.ts
├── context/
│   ├── SlideshowContext.tsx
│   └── SettingsContext.tsx
├── lib/
│   ├── parser/                  # Existing parser
│   ├── tts/
│   │   ├── types.ts
│   │   ├── web-speech.ts
│   │   └── index.ts
│   ├── narration/
│   │   ├── types.ts
│   │   ├── builder.ts
│   │   └── index.ts
│   └── demos/
│       └── index.ts
└── types/
    └── index.ts                 # Shared types
```

---

## API Summary

### Parser (Existing)
```typescript
parseSld(content: string): ParseOutput
```

### Narration
```typescript
buildNarrationQueue(slideshow: Slideshow): NarrationItem[]
```

### TTS
```typescript
createTTSEngine(): TTSEngine
```

### Hooks
```typescript
usePlayback(slideshow: Slideshow): { state, controls }
useSlideshow(): { slideshow, load, error }
```

---

## Open Questions

1. **Persistence**: Should we persist uploaded slideshows to localStorage or keep them in memory only?
   - Recommendation: Memory only for simplicity; add persistence later if needed

2. **Mobile Support**: Do we need touch controls for mobile?
   - Recommendation: Basic responsive design; full mobile support in future version

3. **Voice Selection**: Should we auto-detect language from content?
   - Recommendation: Default to browser language; allow manual override

4. **Offline Support**: Do we need service worker for offline use?
   - Recommendation: Not in v1; consider for future
