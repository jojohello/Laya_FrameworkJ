# Common Design

`common` is a dependency leaf for reusable, service-neutral code.

- Add code only when at least two active modules share the same contract or behavior.
- Do not depend on a concrete server module or contain service orchestration.
- Keep public APIs small and deterministic; infrastructure configuration belongs to the consuming service.
- Sensitive values must be masked at the logging boundary. Masking is not a substitute for removing unnecessary secret logging.
