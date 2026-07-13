# Database Server Placeholder

This directory is not part of the parent Maven reactor and does not currently provide an active Framework-J service. Its `pom.xml` and source stub must not be treated as production architecture.

Shared persistence responsibilities currently live in `central-data-server` and gameplay storage belongs to `game-server`. Promote this directory to a real module only after its ownership boundary, API, persistence model, and reactor integration are explicitly designed.
