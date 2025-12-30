from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
import uvicorn
import io
import soundfile as sf
import numpy as np

# Try importing the model. 
try:
    from soprano import SopranoTTS as Soprano
except ImportError:
    Soprano = None
    print("WARNING: `soprano-tts` not found or import failed. Install it with `pip install soprano-tts`.")

app = FastAPI(title="Soprano TTS Service (OpenAI Compatible)")

class SpeechRequest(BaseModel):
    model: Optional[str] = "soprano-80m"
    input: str
    voice: Optional[str] = "default"
    response_format: Optional[str] = "wav"
    speed: Optional[float] = 1.0

# Global model instance
tts_model = None

@app.on_event("startup")
async def startup_event():
    global tts_model
    if Soprano:
        print("Initializing Soprano model...")
        # Assuming default initialization pulls the 80M model.
        # If arguments are needed, they should be added here.
        try:
            tts_model = Soprano(device='cpu')
            print("Soprano model initialized successfully.")
        except Exception as e:
            import traceback
            traceback.print_exc()
            print(f"Failed to initialize Soprano model: {e}")
    else:
        print("Soprano library unavailable. Service will not function correctly.")

@app.post("/v1/audio/speech")
async def generate_speech(request: SpeechRequest):
    global tts_model
    if not tts_model:
        raise HTTPException(status_code=503, detail="TTS Model is not active on this server.")

    try:
        text = request.input
        if not text:
            raise HTTPException(status_code=400, detail="Input text is empty.")

        # Synthesis
        # Method name `infer` is used in SopranoTTS.
        # Result is a torch tensor on CPU.
        audio_data = tts_model.infer(text)

        # Ensure audio is numpy array (if it's a tensor, convert it)
        if hasattr(audio_data, 'cpu'):
            audio_data = audio_data.cpu().numpy()
        
        # Audio parameters
        sample_rate = 32000

        # Output buffer
        buffer = io.BytesIO()

        # Format handling
        fmt = request.response_format.lower() if request.response_format else "wav"
        
        if fmt == "wav":
            sf.write(buffer, audio_data, sample_rate, format='WAV')
            media_type = "audio/wav"
        elif fmt == "pcm":
            # Raw INT16 or FLOAT32? standard is usually int16 for pcm or raw bytes of float
            # Let's write raw float32 bytes for now or use sf to write RAW
            sf.write(buffer, audio_data, sample_rate, format='RAW', subtype='PCM_16')
            media_type = "audio/pcm"
        elif fmt == "mp3":
             # Soundfile doesn't write MP3 directly usually without extra libs, 
             # but let's try or fallback to wav.
             # Ideally we use Pydub here or ffmpeg explicitly.
             # For MVP, we return WAV with a warning or try generic.
             # We will stick to WAV as default for safety if MP3 fails.
             sf.write(buffer, audio_data, sample_rate, format='WAV')
             media_type = "audio/wav" # Fallback
        else:
             sf.write(buffer, audio_data, sample_rate, format='WAV')
             media_type = "audio/wav"

        buffer.seek(0)
        return StreamingResponse(buffer, media_type=media_type)

    except Exception as e:
        print(f"Error during synthesis: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
