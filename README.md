# capstoneproject
My Senior Year Capstone Project, in collaboration with Jacob Massa, Vannmartin Leang, and Luke Schwartz

## Project direction

This repository preserves the original capstone and its credits while providing the baseline for **Zero Trust and Liveness-Verified Biometrics**.

The new primary use case is **privileged SSH access**: verify a live person as an additional check alongside account authentication, bind evidence to the enrolled device and access request, and enforce least-privilege access and session revocation at a server-side gateway.

Video calling was a convenient test harness for the original AI-detection models. It remains a legacy demonstration/regression harness, not the target product.

## Current versus planned

| Currently in source | Planned, not implemented |
|---|---|
| Flask login and Socket.IO/WebRTC call harness | Protected SSH gateway and policy enforcement |
| Image and audio model inference | Local depth and randomized liveness challenges |
| Per-reporter rolling binary-label windows | Structured, freshness-aware multimodal evidence |
| Browser notification requesting call closure | Server-side step-up and active-session revocation |
| GPU-dependent model selection | Explicit validated model and execution-backend selection |
| Bundled model artifacts | Model manifests, verified preprocessing and regression tests |
| Prototype authentication | Device enrollment, TPM evidence and replay verification |

This is a research prototype, not a production authentication system. Liveness does not establish account identity, and a TPM signature does not automatically prove genuine camera input or protected inference.

## Design documents

- [Architecture and component boundaries](docs/architecture.md)
- [Implementation roadmap and acceptance criteria](docs/roadmap.md)
- [Security assumptions, baseline findings and open decisions](docs/security-assumptions.md)

These documents record the agreed direction; they do not imply the implementation work is complete.

## Existing source map

- `server.py`: application configuration, login, signaling, media ingestion and detector integration.
- `ai_detector.py`: model loading, image/audio preprocessing and rolling decisions.
- `static/main.js`: call setup, remote-media sampling and browser-side call closure.
- `models/`: existing model artifacts.
- `templates/`, `static/login.js`: original interface.
- `app.db`: tracked prototype database; sensitivity review is pending.

## Setup status

A reproducible installation has not yet been validated. There is currently no dependency manifest or automated test suite in the reviewed baseline.

The existing entry point is `server.py`; it expects local `cert.pem` and `key.pem`, bundled models, and a hard-coded listen address. It uses Flask-related packages, Eventlet, NumPy, Pillow, a TFLite runtime or TensorFlow, audio preprocessing dependencies, and optionally PyTorch/Transformers for the GPU path. Exact compatible versions must be established before publishing installation commands.

Do not expose this application as a privileged-access service: placeholder signing secrets, origin/CSRF settings, input authorization and failure handling require remediation. Do not commit real secrets, private keys or participant data.

## Next implementation increment

Make the baseline reproducible, document model preprocessing and labels, add regression fixtures, then extract explicit model selection and structured detector results into a reusable package. Keep implementation changes separate from this documentation update.

Exact equipment inventory and deployment placement remain to be verified; hardware simulation will be clearly separated from hardware-backed security claims.
