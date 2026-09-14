# Implementation roadmap

Status: planned work, not completed features. Primary demonstration: privileged SSH access. Video calling is retained only as the original model-testing harness.

## 1. Reproduce and preserve the baseline

- Preserve original credits and record the baseline commit.
- Add dependency/environment configuration and validated setup instructions.
- Document each model's provenance, digest, labels, input normalization, tensor layout, quantization and output semantics.
- Verify audio preprocessing against training records rather than inferred conventions.
- Add regression tests for preprocessing, classifications and rolling decisions.
- Review the tracked database for sensitive data without publishing its contents.

Acceptance: a clean, isolated environment reproduces documented fixture outputs; dependencies and model assumptions are recorded. Any unavailable training records or unverified behavior remain explicitly marked.

## 2. Extract a reusable detector package

- Separate inference and temporal decisions from Flask/Socket.IO.
- Select the model explicitly; choose hardware/backend independently.
- Return scores, validity, model identity and timing.
- Add timestamped windows, minimum coverage, expiry and missing-data handling.
- Add bounded queues, lifecycle cleanup and concurrency tests.
- Make audio optional and preserve the legacy harness via adapters.

Acceptance: package tests run without a browser; baseline differences are explained; overload, stale inputs and model failures do not become successful liveness evidence.

## 3. Implement local liveness

- Add local RGB capture and sensor health.
- Implement fresh randomized head-movement challenges with deadlines.
- Add synchronized depth capture and flat-presentation checks when hardware is available.
- Start with interpretable fusion rules and explicit inconclusive results.
- Keep login timing distinct from the original 75-frame monitoring window.

Acceptance: genuine, replay, wrong-action, expired-challenge and missing-sensor fixtures produce defined outcomes. Hardware-backed conclusions require hardware tests, not mocks.

## 4. Implement evidence and device verification

- Define canonical versioned evidence and account/device/target/session binding.
- Implement enrollment, revocation, fresh nonces and atomic replay rejection.
- Use a clearly test-only signer before adding TPM-backed keys.
- Separately define platform attestation and capture-integrity claims.
- Specify recovery and key lifecycle; defer WebAuthn integration until its binding is designed.

Acceptance: altered, stale, reused, wrong-device, wrong-session and revoked-key proofs are rejected. Test signatures cannot pass a hardware-required policy.

## 5. Enforce one protected SSH scenario

- Choose the gateway and credential mechanism; establish the account identity flow.
- Prevent direct target access outside the gateway in the testbed.
- Add least-privilege rules, initially deterministic; integrate OPA behind a policy interface.
- Bind approval to the actual connection and authorized target/role.
- Implement step-up deadlines and gateway-side termination.
- Add minimal session telemetry; use the planned 30-second risk evaluation cadence as an initial configurable setting, not a guaranteed detection bound.
- Record versioned, tamper-evident audit events with a protected external checkpoint design.

Acceptance: denial prevents connection; expired/replayed approval cannot open access; a client ignoring UI messages still loses access after revocation; gateway/verifier outages follow documented fail-safe behavior. Test forwarding, reconnects and concurrent sessions.

## 6. Adversarial and operational evaluation

- Test photos/screen replay, synthetic media, frame injection/OS tampering and session handoff.
- Test sensor loss, model crash, overload, network delay, proof expiry and unavailable audit storage.
- Split subjects and source videos across development and held-out evaluation; freeze models and thresholds before final testing.
- Report false acceptance/rejection, inconclusive rates, confidence intervals, authentication and revocation latency, resource use and demographic/environmental limitations.
- Evaluate each trust claim separately; document attacks not prevented.

Acceptance: reproducible evaluation artifacts distinguish model screening, liveness, device attestation and actual access enforcement. Research targets are not presented as achieved results.

## Deployment hardening alongside the stages

- Externalize signing secrets and bind address; reject placeholder secrets outside isolated tests.
- Restrict origins, restore appropriate CSRF defenses and validate every event's session/room authorization.
- Enforce input size/type/rate limits and explicit authentication expiration/revocation.
- Replace print-only failure handling with structured, privacy-conscious events.
- Review database handling, migrations, credential retention and certificate provisioning.
- Do not deploy the legacy application as a privileged-access boundary.

## First implementation increment

Reproducible environment, model manifests, regression fixtures, explicit model selection and structured detector results. No TPM or SSH grant logic until this baseline is understood.
