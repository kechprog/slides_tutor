# Cost & Performance Analysis: Soprano-80M on AWS Lambda

## 1. Cost Estimate (AWS Lambda)

**Assumptions:**
*   **Compute:** AWS Lambda (ARM/Graviton2), which is ~20% cheaper/faster for this workload.
*   **Memory:** 1024 MB (1 GB) allocated.
    *   *Why?* Model is ~320MB (float32) or ~160MB (float16). 1GB ensures enough overhead for Runtime + OS without hitting swap/OOM, and grants a decent slice of CPU time.
*   **Pricing (US-East-1):** ~$0.0000133334 per GB-second.
    *   Cost per second of execution: **$0.00001333**

### Scenario A: Current Python Implementation (PyTorch)
*   **Cold Start:** ~5-8 seconds (Loading Python interpreter, importing massive `torch` library, loading model weights).
*   **Warm Inference (Sentence):** ~2-4 seconds (based on local CPU observation).
    *   *Note:* Python is single-threaded limited by GIL often, and PyTorch overhead is non-trivial for tiny models.
*   **Cost per Query (Warm):**
    *   2s * $0.00001333 = **$0.000026**
*   **Cost per 1 Million Queries:**
    *   **~$26.66**

### Scenario B: Optimized "Light" Implementation (C/C++ / ONNX / GGUF)
*   **Cold Start:** < 0.5 seconds (Binary is tiny, `mmap` loads model instantly).
*   **Warm Inference (Sentence):** < 0.3 seconds.
    *   *Why?* An 80M parameter model is extremely small. For comparison, 7B models run at decent speeds on CPU. 80M is ~100x smaller. With quantization (q4_0 or q8_0), it fits in L3 cache of some CPUs.
*   **Cost per Query (Warm):**
    *   0.3s * $0.00001333 = **$0.000004**
*   **Cost per 1 Million Queries:**
    *   **~$4.00**

---

## 2. Is it worth implementing in C (Edge/Lambda)?

**YES, definitely.** But primarily for **Latency**, not just cost.

1.  **The Latency Problem:**
    *   On a Python Lambda, your user hits a "Cold Start" of 8s+ (waiting for Torch). This is a bad UX for TTS.
    *   Even warm, 2-4s latency is noticeable.
    *   An optimized C runtime reduces Cold Starts to near-zero (< 500ms), making the Lambda feel "always on".

2.  **The Cost Argument:**
    *   While ~$26/million requests is cheap, dropping it to ~$4 is an ~85% reduction.
    *   If you scale to 10M+ requests, the savings become significant.

## 3. Recommended Approach

**Phase 1 (Now):** Stick with Python on a cheap VPS (e.g., $5/mo Droplet/EC2).
*   Keeps the process in RAM (no cold starts).
*   Sufficient for testing and MVP.

**Phase 2 (Production):** Port to ONNX Runtime or GGUF (llama.cpp engine).
*   **Export:** Convert `soprano-80m` to ONNX format.
*   **Runtime:** Use `onnxruntime` (C++, C#, or Rust bindings) or `candle` (Rust) on AWS Lambda.
*   **Deployment:** Package as a single binary or container instructions. This removes the 700MB+ PyTorch dependency, making your Lambda deployment package tiny (~50MB vs ~1GB).

## Summary
For a test environment, the cost difference is negligible. For a production user-facing app, the **Latency** improvement of a C-based runtime is critical and well worth the engineering effort.
