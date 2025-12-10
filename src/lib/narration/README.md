# Narration System

This module implements the narration queue builder for the Slides Tutor application. It transforms parsed slideshow content into a flat array of narration items for sequential TTS playback.

## Files

### `types.ts`
Defines the `NarrationItem` interface:
```typescript
interface NarrationItem {
  id: string;                    // Unique ID for highlighting (e.g., "slide-0-elem-1-0")
  text: string;                  // Narration text to speak
  delay: number;                 // Delay after speaking (ms)
  elementPath: number[];         // Path to element in slide tree [0, 1, 2]
  slideIndex: number;            // Which slide this belongs to
}
```

### `builder.ts`
Contains the `buildNarrationQueue()` function that:
1. Sorts slides by their `order` attribute
2. For each slide, traverses the content tree recursively
3. Processes only elements with an `order` attribute
4. Sorts sibling elements by their `order` value
5. For each ordered element:
   - If it has `narration`, adds it to the queue
   - Recursively processes its children (depth-first)
6. Returns a flat array of `NarrationItem` objects

### `index.ts`
Exports the public API:
- `NarrationItem` type
- `buildNarrationQueue` function

### `narration.test.ts`
Comprehensive test suite covering:
- Basic functionality (empty queues, single items, delays)
- Element ordering (sorting, non-sequential orders, skipping unordered elements)
- Nested traversal (depth-first, deeply nested structures)
- Element paths (correct path generation, unique IDs)
- Multiple slides (correct ordering, slide index tracking)
- Complex examples from the spec

## Usage

```typescript
import { buildNarrationQueue } from '@/lib/narration';
import type { Slideshow } from '@/lib/parser/types';

const slideshow: Slideshow = /* parsed slideshow */;
const queue = buildNarrationQueue(slideshow);

// Play narration sequentially
for (const item of queue) {
  // 1. Highlight element with ID: item.id
  // 2. Speak text: item.text
  // 3. Wait for delay: item.delay ms
  // 4. Clear highlight
}
```

## Algorithm Details

### Traversal Order
The algorithm follows these rules:
1. **Slides** are processed in ascending `order` value
2. **Elements** are processed only if they have an `order` attribute
3. **Siblings** are sorted by their `order` value (ascending)
4. **Children** are processed depth-first after their parent

### Example
Given this slide structure:
```html
<slide order="1">
  <h1 order="1" narration="Title">Title</h1>
  <ul order="2" narration="List intro">
    <li order="1" narration="First item">Item 1</li>
    <li order="2" narration="Second item">Item 2</li>
  </ul>
</slide>
```

The narration order will be:
1. "Title"
2. "List intro"
3. "First item"
4. "Second item"

### Element Paths
Element paths are zero-indexed arrays representing the position in the tree:
- `[0]` - First ordered element at root level
- `[0, 0]` - First ordered child of first ordered element
- `[1, 2]` - Third ordered child of second ordered element

These paths are used to generate unique IDs for element highlighting.

## Testing

Run tests with:
```bash
npm run test -- src/lib/narration
```

Or use the provided batch file:
```bash
run-narration-tests.bat
```

## Integration

This module is designed to integrate with:
- **Parser** (`@/lib/parser`) - Provides the `Slideshow` AST
- **TTS Engine** (`@/lib/tts`) - Consumes the narration queue
- **Playback Hook** (`@/hooks/usePlayback`) - Orchestrates playback and highlighting
