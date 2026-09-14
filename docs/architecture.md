# Planned architecture: liveness-verified privileged SSH

Status: approved direction; not implemented. The existing video-call application remains a legacy model-testing harness, not the target product. This documentation does not establish security or performance guarantees.

## Scope and deployment

The initial use case is an enrolled administrator requesting least-privilege SSH access to one protected Linux server. Liveness supplements an established identity credential; a live face alone does not establish account identity.

Start with a modular Python package, not a microservice per detector. Proposed package responsibilities:

| Module | Responsibility |
|---|---|
| capture | Local webcam/RealSense adapters, timestamps, synchronization, sensor health |
| detectors | Explicitly selected image/audio models, depth and challenge checks |
| fusion | Validity-aware signal combination and timestamped temporal evidence |
| challenges | Server-issued randomized prompts, deadlines and response evaluation |
| evidence | Versioned event schema, canonical encoding, session binding |
| attestation | Signer interface, TPM integration and verification |
| policy | Grant, deny, step-up and revoke decisions |
| enforcement | Apply decisions to the actual protected SSH session |
| evaluation | Reproducible fixtures, attack cases, metrics and regression tests |

Existing files stay in place until regression coverage supports migration. Preserve original credits during moves.

## End-to-end flow

1. Authenticate the account using a separate established credential and select the authorized target.
2. The verifier creates a fresh nonce, challenge ID, pending session ID and deadline.
3. The enrolled endpoint captures local evidence and performs RGB, active-challenge and depth checks.
4. Fusion produces pass, fail or inconclusive, preserving per-signal validity and provenance.
5. The signer binds the event digest to the pending request. The verifier checks enrollment, signature, freshness, replay protection and any separately required platform measurements.
6. Server-side policy authorizes a restricted SSH session through the enforcement gateway.
7. Session monitoring can request step-up or revoke the session; the gateway enforces the result and records an audit event.

Browser UI is optional and untrusted as a source of capture provenance. Local capture is not automatically trustworthy under OS compromise either.

## SSH enforcement boundary

Proposed first implementation: a gateway-controlled SSH session with no direct client route to the protected target. Exact gateway software and credential mechanism remain implementation decisions.

Bind authorization to account, enrolled device, target, permitted role and the actual SSH connection. Avoid reusable bearer approvals that another connection can redeem. Restrict forwarding and alternate access paths in the initial scenario. Independently authenticate the protected SSH host.

Use explicit session states: pending, active, step-up-required, revoked and closed. Denied requests never open a session. Step-up has a deadline and a defined restriction behavior. Revocation must close active access at the gateway, not merely notify the client. Credential expiry alone is not an active-session termination mechanism. Define treatment of background processes separately; closing a connection does not prove all spawned work stopped.

## Evidence contract

Proposed fields: schema version, event ID, server nonce, challenge ID, session ID, verifier audience, account reference, device/key reference, target/role, capture interval, challenge result, per-modality score and validity, fused decision, model/configuration digests, and expiry.

Specify canonical serialization, signature algorithm and replay-consumption semantics before implementation. Verify freshness using server-held request state; do not trust a client timestamp alone. Reject unknown required schema versions, altered fields, mismatched sessions and reused evidence.

Scores are not necessarily calibrated probabilities. Evidence stores no raw frames by default. Event hashes are not stable biometric identity templates.

## Baseline changes

- Model selection must be explicit, separate from CPU/GPU execution selection.
- Verify preprocessing, label order and quantization against training/export records.
- Return structured results rather than only binary labels.
- Replace count-only timing assumptions with timestamped windows, minimum evidence and stale-data checks.
- Keep short login challenges separate from continuous-monitoring windows.
- Use bounded queues, backpressure and explicit failure states.
- Make audio optional; defer rPPG and learned behavioral/fusion models until the core path works.
- Bind reporter, subject, device and session server-side; never trust a supplied socket ID as identity.

## Hardware and simulation

Use adapters and clearly labeled simulators while hardware is unavailable. Simulation must never satisfy production attestation policy. Exact procurement models, quantities, compatibility and inference placement remain to be verified; the four equipment PDFs have not been successfully inventoried in this review. Do not mandate Orin, Pi or another device as the inference host before benchmarking and defining its trust boundary.

## Deferred work

FIDO2/WebAuthn interoperability, rPPG, synthetic-audio fusion and learned behavioral scoring are subsequent extensions. Choose a standards-compatible evidence binding before implementing WebAuthn; do not insert arbitrary fields into authenticator data.
