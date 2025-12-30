# Soprano 80M TTS Service Implementation Plan

## Goal
Host the Soprano-80M TTS model as an OpenAI-compatible API service.
This allows clients expecting OpenAI's `v1/audio/speech` endpoint to seamlessly use our self-hosted Soprano model.

## Research Findings

### Model: Soprano-80M
- **Source**: `ekwek/soprano-80m` (Hugging Face / GitHub).
- **Architecture**: 80M parameters (ultra-lightweight), Qwen-based.
- **Performance**: High RTF (Real Time Factor), low latency (~15ms).
- **Output**: 32kHz high-fidelity audio.
- **Dependencies**: `soprano-tts` python library.

### API Specification: OpenAI Compatible
- **Endpoint**: `POST /v1/audio/speech`
- **Request Parameters**:
  - `model` (string): e.g., "tts-1". We will accept this but route to Soprano.
  - `input` (string): The text to synthesize.
  - `voice` (string, optional): e.g., "alloy". Soprano is single-speaker (currently), so we will log this but likely ignore it or map all to the default speaker.
  - `response_format` (string, optional): "mp3", "opus", "aac", "flac", "wav", "pcm". Default is "mp3".
    - *MVP Strategy*: We will primarily support "wav" (native model output usually) and "mp3" (using `ffmpeg`/`pydub` if needed).
    - *Note*: Soprano outputs raw waveforms (likely float32 or int16 PCM).
  - `speed` (number, optional): 0.25 to 4.0. We will note this as "best effort" or "not implemented" for the initial version if the model doesn't natively support it.

## Implementation Approach

1.  **Service Framework**: FASTAPI (Python).
    - Lightweight, fast, easy to create async endpoints.
    - Native support for `StreamingResponse` which is crucial for TTS.

2.  **Environment**: `services/soprano/` directory.

3.  **Dependencies** (`requirements.txt`):
    - `fastapi`
    - `uvicorn`
    - `soprano-tts`  (The core library)
    - `soundfile` or `scipy` (For audio array handling)
    - `pydub` (Optional, if mp3 conversion is strictly required on the fly)

4.  **Code Structure**:
    - `main.py`: Entry point.
    - `lifespan`: Load the model into memory **once** on startup.
    - `POST /v1/audio/speech`:
        - Validate input.
        - Call `model.synthesize(input)`.
        - Convert in-memory audio buffer to requested format.
        - Return `Response` (with correct media type).

5.  **Hardware Considerations**:
    - Soprano is optimized for GPU but 80M is small enough to potentially run on CPU for testing if needed, though likely slower. We assume a CUDA environment or will test CPU fallbacks.

## Next Steps
1.  Create `requirements.txt`.
2.  Implement `main.py`.
3.  Test with a simple `curl` command mimicking OpenAI.
