# Local model: latency measurements on 9 November 2026

Qwen3-Coder 30B / Q4_K_M (`qwen3-coder:30b`, digest `06c1097efce0…`), Ollama 0.40.15, Apple M5 Pro, 48 GiB RAM. The model was selected from the local Continue configuration and installed Ollama models. Context 16,384; temperature 0; seed 42; maximum output 384. These are individual extraction requests to a local model, not a complete coding agent workflow.

Loading/initializing the previously nonresident model: **14.72 s**, recorded separately from A/B timing. The OS filesystem cache was not controlled. Resident allocation reported by Ollama: **18.7 GiB**, 100% GPU according to `size_vram == size`. This does not measure whole-system peak RAM.

## 48 primary requests

Medians of three paired repetitions. Full time = baseline reading or CLI filtering + HTTP inference until the response completes. OS load and thermal conditions were not isolated; these are examples, not a guarantee of speedup.

| Case | Mode | Input raw / filter | Output raw / filter | TTFT raw / filter, s | Full time raw / filter, s | Correct raw / filter |
| --- | --- | --- | --- | --- | --- | --- |
| rtk-status | fresh | 375 / 269 | 26 / 26 | 0.300 / 0.242 | 0.634 / 0.572 | 2/3 / 3/3 |
| rtk-status | repeat | 375 / 269 | 26 / 26 | 0.022 / 0.022 | 0.340 / 0.368 | 2/3 / 3/3 |
| rg-navigation | fresh | 4882 / 188 | 25 / 25 | 4.395 / 0.261 | 4.802 / 0.616 | 3/3 / 3/3 |
| rg-navigation | repeat | 4882 / 188 | 25 / 25 | 0.032 / 0.023 | 0.386 / 0.331 | 2/3 / 3/3 |
| jq-autolinking | fresh | 6804 / 212 | 224 / 224 | 7.676 / 0.440 | 11.499 / 3.202 | 3/3 / 3/3 |
| jq-autolinking | repeat | 6804 / 212 | 224 / 224 | 0.055 / 0.039 | 3.994 / 2.852 | 3/3 / 3/3 |
| rtk-tsc-errors | fresh | 160 / 215 | 26 / 26 | 0.188 / 0.208 | 0.492 / 0.521 | 3/3 / 3/3 |
| rtk-tsc-errors | repeat | 160 / 215 | 26 / 26 | 0.027 / 0.146 | 0.351 / 0.460 | 3/3 / 3/3 |

`fresh`: weights are already in RAM, the early marker changes, and most input is uncached. This is not a cold SSD/model load. `repeat`: the CLI operation and task are repeated; actual cache hits are checked through the API. For status, navigation and jq, repeat pairs have matching SHA-256 hashes; RTK tsc changed its group order. The original runner description inaccurately called repeats "identical": the methodology was clarified after an audit, while numeric measurements and answers remain unchanged. Historical runner source files are preserved with the SHA-256 hashes recorded in metadata.

Input is the full Qwen runtime input including instructions/template, **not the o200k_base** used in the original CLI charts. Cached input is a subset and must not be added again. Output in the primary jq case is 224 tokens in both variants. All 48 latency records contribute to the medians, including incorrect answers; correctness is shown alongside them. 45/48 answers are correct: baseline 21/24, filter 24/24. This is insufficient for a general claim about model quality.

## Identical-payload control: 12 additional requests

TypeScript case only, with `--freeze-repeat`: the repeat uses the exact previous text without running the CLI again. Repeated cached counts are raw 159/160 and filtered 214/215. Median request wall time: **0.317 / 0.323 s**. All 12 answers are correct. The control's first requests are not interpreted as cold: the model was already resident and some prefixes were cached.

In the normal CLI repeat, RTK tsc reused only 106–121 cached tokens out of 215 because group order changed, versus 159 out of 160 for raw input. Full repeat time increased from **0.351 to 0.460 s**. The control demonstrates why input stability and overhead matter alongside token counts.

## Reproduction and data

[Guide](../../../../docs/LOCAL-MODEL.md). `primary.json` and `frozen-repeat-control.json` contain all requests, answers, checks, runtime usage, timings and hashes. `summary.json` and CSV contain medians. `tsc-filter-variant-*.txt` captures actual group-order variants of the same log. Provider API fee: $0; electricity and hardware costs were not estimated.

Sources: [Ollama usage](https://docs.ollama.com/api/usage), [generate](https://docs.ollama.com/api/generate), [model](https://ollama.com/library/qwen3-coder:30b).
