# Local model: context processing time

This experiment runs real local inference through Ollama on RN data. It is separate from the local o200k_base text counts in the original 24 cases.

## Reproduction

You need [Ollama](https://ollama.com/download), an already downloaded local model, RTK, ripgrep, jq and the benchmark dependencies. If the weights are not available, separately run `ollama pull qwen3-coder:30b` (approximately 19 GB) and check the digest with `ollama list`; downloading is not part of the measurements. The script does not download models or call cloud endpoints. Only loopback HTTP is allowed; `:cloud` tags are rejected.

```sh
npm ci
npm --prefix benchmarks ci
npm --prefix benchmarks run bench:local -- \
  --model qwen3-coder:30b --repeats 3 --num-ctx 16384
```

For other installed local models, pass the exact name through `--model`. Do not extrapolate these figures to another quantization, RAM capacity, runtime or context size. If another model is already loaded, the runner stops to avoid displacing it.

## What is measured

Four tasks: Git status from a recreated real RN change set, finding the native stack, listing native modules from RN config, and extracting two TypeScript diagnostic codes. Each task has raw and filtered text. Questions and JSON schemas are identical, temperature is 0, seed is 42, execution is sequential, raw/filtered order alternates, and there are three paired repetitions.

Each variant has a first request with a new early trial marker, immediately followed by a repeat of the same CLI operation and task. CLI output can change line order, so the payload is not always identical. `--freeze-repeat` keeps the first request's text unchanged and skips the second CLI invocation. SHA-256 checks establish exact input equality. Cache status comes from `prompt_eval_cached_count`, rather than an assumption that a repeated request must be cached. The current runner adds a unique run namespace to avoid inheriting cache hits from an earlier run. To reproduce the historical markers, pass `--namespace ""`; always check the actual cache counters. Model weights stay in RAM. Initial preload is recorded separately; the OS filesystem cache is not controlled.

- `prompt_eval_count`: full input according to the runtime tokenizer, including instructions and template;
- `prompt_eval_cached_count`: the subset of input reused from cache;
- `eval_count`: model output;
- `firstVisibleMs`: time until the first nonempty visible response fragment;
- `requestWallMs`: duration of the complete HTTP inference request;
- `toolMs`: baseline reading or CLI filtering time;
- `endToEndMs`: `toolMs + requestWallMs`;
- `correct`: the answer exactly matches ground truth; errors and unfavorable results are retained.

`prompt_eval_duration` and `eval_duration` separately report prefill and decode when returned by the runtime. API durations are in nanoseconds. Medians include failed answers; correctness is reported alongside them. Three repetitions do not provide a statistical guarantee.

Preparing the shared capture / temporary Git fixture is excluded from the paired timing. Both variants use already available data. These are individual extraction requests, not a complete autonomous coding agent: there are no file edits, correction loops or Claude/Codex tool-calling protocols.

## Interpretation

Less uncached input can reduce prefill and time to first token. Full response time also depends on output length, decode, KV reuse and CLI overhead. With short output or a nearly complete cache hit, an extra filter can slow the result down. Losing required information can trigger additional calls and outweigh the savings.

There is no provider charge per local API token, but context-window capacity, RAM/VRAM, time, electricity and hardware resources remain limited. Electricity and hardware costs are not measured in this experiment.

The model stays loaded until `keep_alive: 10m` expires. The script does not overwrite global settings or unload other models. Benchmark data is public; do not replace it with private code before publishing results. Keep the local endpoint on loopback without exposing its port to the LAN.

## Sources

- https://docs.ollama.com/api/usage
- https://docs.ollama.com/api/generate
- https://docs.ollama.com/context-length
- https://ollama.com/library/qwen3-coder:30b
- https://huggingface.co/Qwen/Qwen3-Coder-30B-A3B-Instruct

## Published measurement: 9 November 2026

[Medians, correctness and all 60 records](../benchmarks/snapshots/2026-11-09/local-model/RESULTS.md). The 48 primary requests repeat real CLI operations; 12 additional requests check an unchanged TypeScript payload. The meaning of repeat was clarified after an audit found changing group order in RTK tsc. Original counters, timings, answers and SHA-256 hashes are preserved.

Running a model locally does not restrict an agent's shell actions. Keep sandboxing and permission checks enabled, download weights from a trusted source and verify the digest.
