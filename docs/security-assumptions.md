# Security assumptions and limitations

Status: design document for future work; not a claim that these controls already exist. Source review only; no runtime validation has been performed.

## Protected scenario

An enrolled administrator requests scoped SSH access to one protected Linux server. Account authentication, liveness, device verification and authorization are distinct checks. The original video call was only a convenient model test.

## Trust boundaries

| Boundary | Required treatment |
|---|---|
| Physical sensor to inference | Explicit capture-integrity threat model; local capture alone does not resist a compromised OS |
| Inference to signer | A protected key can sign false caller-supplied results; define measurement/isolation requirements |
| Endpoint to verifier | Authenticated protected transport, fresh requests, audience/session binding and replay rejection |
| Verifier to policy/gateway | Authenticated decisions, least privilege, expiry and enforced revocation |
| Gateway to SSH target | Authenticated host, scoped credentials and prevention of bypass paths |
| Audit producer to storage | Restricted writes, integrity checking and externally protected checkpoints |

TPM-backed signatures establish use of an enrolled key, not automatically genuine sensor data or correct inference. Measured boot does not by itself establish runtime integrity. Claims about compromised-OS resistance remain unproven until a concrete trusted capture/execution design is tested.

## Baseline findings requiring remediation

Source references: [server.py](../server.py), [ai_detector.py](../ai_detector.py), [static/main.js](../static/main.js).

- Placeholder Flask/JWT signing secrets, wildcard Socket.IO origins and disabled JWT-cookie CSRF protection are present.
- Media/signaling handlers lack explicit room-membership authorization checks.
- The client submits remote media with its own socket ID; the server also accepts a supplied ID. Reporter and media subject are not securely distinguished.
- Detection emits a browser notification; JavaScript performs call closure. This is not authoritative server-side access revocation.
- Classification errors are printed without an explicit evidence-unavailable policy outcome.
- Model selection changes with GPU availability; preprocessing and output interpretation require model-specific validation.
- Sample-count windows have no evidence freshness bound.
- A database is tracked. Its contents have not been inspected; sensitive contents must not be assumed absent.
- The upload route is a placeholder, not a completed detector path.

These observations are not a complete security audit.

## Attacker and failure cases

Evaluate presentation replay, live synthetic media, camera/API injection, model/process tampering, session transfer, proof theft/replay, unauthorized room/session attribution and omission of required evidence. Browser notifications are advisory, never enforcement.

For new grants, missing required evidence or unavailable verification denies access. For active sessions, specify a bounded step-up/restriction policy and termination deadline. Do not silently downgrade required depth or hardware proof to optional. Allow explicit lower-assurance research configurations only when clearly labeled and separately evaluated.

Maintain a separately controlled, audited recovery process for device loss and accessibility needs; it must not become an untracked bypass.

## Privacy and evaluation

Default to transient biometric processing and minimal pseudonymous audit data. Define consent, retention, access and deletion before collecting participants. Hashes of biometric-derived data can remain sensitive and linkable; hashing is not anonymization. Do not publish raw participant samples, credentials or database contents.

Report failures and inconclusive results, not just successful attempts. Use subject/source-separated held-out tests and confidence intervals. Small attack sets cannot substantiate arbitrarily low false-acceptance claims.

## Open decisions before security claims

- Exact sensor/OS/inference trust design and verified hardware inventory.
- Identity credential and its binding to the liveness request and SSH connection.
- Gateway implementation, credential mechanism, bypass prevention and process-cleanup scope.
- TPM signing versus platform-attestation evidence and verification policy.
- Evidence canonicalization, key lifecycle, replay storage and outage behavior.
- Step-up telemetry, accessibility, privacy retention and audit anchoring.
