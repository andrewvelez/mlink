---
id: "restore-one-year-cache-only-service-worker-2026-09-11"
status: "in-progress"
priority: "high"
assignee: null
epic: null
dueDate: null
created: "2026-09-11T21:33:41.000Z"
modified: "2026-09-13T16:04:02.458Z"
completedAt: null
labels: ["regression", "pwa", "service-worker"]
order: "a0"
---
# Restore one-year CacheOnly service-worker caching

`src/web/sw.js` has regressed to network-first handling for application-shell and
navigation requests. Restore the required PWA caching design:

- load the minimal shell from the network while the complete application cache is prepared;
- serve the completed application from one versioned CacheOnly cache;
- version `app.js` and the service-worker registration URL for each release;
