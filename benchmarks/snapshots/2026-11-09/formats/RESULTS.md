# TOON on real RN data

Complete strings including final newline; identical JSON values in three serializations; decode round trip checked. No model calls, provider cache, billing, model output or answer-quality measurements. Format instructions and tool-protocol overhead are excluded.

TOON 4.4.0; o200k_base; all 12 round trips pass. A negative saving means more text tokens.

| Case | Pretty JSON | Compact JSON | TOON | Saving vs compact |
| --- | ---: | ---: | ---: | ---: |
| native-modules | 216 | 130 | 82 | 36.9% |
| demo-tasks | 767 | 467 | 314 | 32.8% |
| direct-dependencies | 448 | 276 | 227 | 17.8% |
| full-autolinking | 6764 | 5159 | 5423 | -5.1% |
