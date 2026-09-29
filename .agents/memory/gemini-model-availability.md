---
name: Gemini model availability
description: Current Gemini API access can reject older models or temporarily return capacity errors.
---

Use a current Gemini model and keep a short, bounded fallback for transient 429/503 responses.

**Why:** During the initial Crop Advisor integration, an older model returned a permanent 404 for new users and the current model briefly returned 503 during a demand spike.

**How to apply:** When adding Gemini-backed product flows, keep model selection centralized and distinguish permanent configuration errors from retryable provider capacity errors.