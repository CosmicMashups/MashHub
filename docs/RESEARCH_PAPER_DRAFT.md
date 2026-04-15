# MashHub Research Paper Draft

## Introduction

MashHub is a music intelligence platform for DJs, producers, and mashup creators. The system addresses a practical challenge in creative music workflows: finding harmonically compatible tracks quickly while preserving section-level context (Intro, Verse, Chorus, Bridge) rather than relying on a single global BPM/key per song.

The project combines modern web engineering with applied fuzzy logic. Instead of binary pass/fail filtering, MashHub computes compatibility as a graded score using BPM similarity, key-distance relationships, and section-aware matching. This yields more realistic recommendations for real-world transitions, where musical compatibility is often approximate and context dependent.

## Topic Research and Innovation

The core research topic is fuzzy decision support for music compatibility. Existing DJ tools commonly emphasize exact key/BPM constraints or manual curation. MashHub introduces an interpretable fuzzy inference pipeline with explicit rule weights, section normalization, and transparent match reasons.

Key innovations include:
- a section-first data model that captures intra-song variation;
- dual fuzzy layers (text retrieval with Fuse.js and rule-based harmonic matching);
- a hybrid online/offline persistence model (Supabase primary with IndexedDB fallback);
- human-readable recommendation rationale for each score.

## Existing Application Analysis

Conventional library managers provide metadata filtering and playlist organization but usually have limited support for section-level harmonic logic. Tools that do offer compatibility suggestions often operate as black boxes or with rigid heuristics that do not expose scoring components.

MashHub improves on these limitations by:
- representing songs as multi-section entities;
- scoring compatibility with weighted, inspectable components;
- enabling part-specific constraints (for example, Verse-to-Verse matching);
- maintaining usability under connectivity failures through local fallback mode.

## Proposed System Design

The proposed system design contains five major layers:
- Presentation layer: React-based UI for search, filtering, project planning, and recommendations.
- Domain layer: typed models for songs, song sections, projects, project sections, and project entries.
- Matching layer: fuzzy scoring services for BPM, key, and section compatibility.
- Data access layer: service abstractions (`songService`, `projectService`) to decouple UI from storage implementation.
- Persistence layer: Supabase-backed cloud mode with Dexie/IndexedDB fallback mode.

This structure preserves separation of concerns and supports incremental enhancement of the fuzzy model without disruptive UI rewrites.

## System Architecture

MashHub follows a frontend-first architecture with resilient data operations:
- Supabase mode: authenticated, cloud-backed CRUD and user-scoped project data.
- Local mode: IndexedDB CRUD when Supabase is unavailable, with non-blocking connection status feedback.
- Fallback orchestration: `withFallback(supabaseOp, localOp)` for each public service method.
- Context-driven mode state: `BackendContext` performs health checks and broadcasts availability transitions.

Data flow summary:
1. Health probe on startup determines backend mode.
2. Services fetch and mutate songs/projects through shared interfaces.
3. Matching logic computes ranked results from in-memory song + section data.
4. UI renders ranked outputs and explanatory reasons.

## AI Model Description

MashHub uses an interpretable fuzzy inference model rather than a trained neural network. The model has four canonical fuzzy components:
- Fuzzification: transform BPM/key/section relationships into membership scores in [0,1].
- Rule base: weighted IF-THEN rules for BPM, key, type, year, text, artist, and origin.
- Inference: weighted aggregation (Sugeno-style singleton consequents).
- Defuzzification: convert aggregate score to crisp ranking (`matchScore`) with reason strings.

The model supports two modes:
- Standard matching (`evaluateMatch`) for broad filtering and ranking.
- Quick Match (`getQuickMatches`) for section-focused recommendations with dedicated BPM/key scoring curves.

Because weights and thresholds are explicit constants, the model is tunable, auditable, and suitable for research reporting.

## Testing and Evaluation

Evaluation combines software validation and algorithmic behavior checks:
- Unit tests (Vitest): utility functions, CRUD contracts, and fuzzy scoring components.
- Integration tests: service-layer behavior across Supabase and fallback pathways.
- UI tests (Testing Library): filter workflows, recommendation rendering, and state transitions.
- End-to-end tests (Playwright): full user flows for search, project management, and export.

Recommended research metrics:
- Top-k relevance for candidate matching lists (expert-judged labels).
- Mean compatibility score alignment with human pairwise preference.
- Robustness under degraded connectivity (successful fallback and recovery time).
- Latency for search and recommendation on medium and large libraries.

## Conclusion and Future Enhancements

MashHub demonstrates that a transparent fuzzy inference approach can outperform rigid filtering for music compatibility workflows while remaining understandable to end users and maintainers. The architecture also proves resilient through online/offline mode switching.

Future enhancements include:
- calibrated or adaptive rule weighting from expert feedback datasets;
- conflict-aware sync for offline-created artifacts after reconnection;
- optional embedding-based similarity features as a complementary signal;
- expanded evaluation with larger annotated benchmark sets and user studies.

