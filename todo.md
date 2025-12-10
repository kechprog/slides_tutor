# Slides Tutor - TODO

## TTS Integration

- [ ] Refactor TTS to generic interface supporting multiple backends
- [ ] Implement ElevenLabs adapter
- [ ] Implement Vibe Voice self-hosted adapter
  - Reference: https://github.com/marhensa/vibevoice-realtime-openai-api
- [ ] Add TTS provider selection in settings

## Code Quality (from review)

- [ ] Simplify `usePlayback` dual state management
- [ ] Replace `SlideContent` switch with `React.createElement`
- [ ] Consolidate parser validation functions
- [ ] Extract navigation helper in `usePlayback`

## Tests

- [ ] Add `expectSuccessfulParse()` helper
- [ ] Use `test.each()` for repetitive tests
- [ ] Create test factories for Slideshow/Slide objects
