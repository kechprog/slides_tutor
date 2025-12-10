# Slides Tutor

A narrated slideshow tutorial app. Upload `.sld` files and the app presents slides with text-to-speech narration, highlighting elements as they're read.

## Features

- Custom `.sld` file format (HTML subset with narration attributes)
- Text-to-speech narration with element highlighting
- Playback controls (play/pause/stop, speed adjustment)
- Auto-advance between slides
- Keyboard shortcuts (Space, Arrow keys)
- Progress tracking

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:3000

## .sld File Format

```html
<slideshow title="My Tutorial">
  <slide order="1">
    <h1 order="1" narration="Welcome to the tutorial">Introduction</h1>
    <p order="2" narration="Let's get started" delay="500">Content here</p>
  </slide>
</slideshow>
```

**Attributes:**
- `order` - Narration sequence (required with narration)
- `narration` - Text to speak
- `delay` - Pause before narration (ms)

## Tech Stack

Next.js 16 | TypeScript | Tailwind CSS | Web Speech API
