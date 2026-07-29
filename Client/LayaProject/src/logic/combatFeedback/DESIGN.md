# Combat feedback design

- Requests contain only target ID, text and hit-position/time snapshots; no queued request may retain a scene object.
- Every target has a minimum 0.1-second emission interval. Results are never merged, and later results receive a higher display order.
- Views are pooled. The manager bounds both visible views and queued requests, and can be disabled globally.
- Animation uses battle scene time rather than engine wall time, so pause and battle speed remain consistent.
