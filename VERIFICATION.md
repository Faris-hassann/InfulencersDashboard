# CMS verification

The October 14 dashboard login fix was verified against the hosted backend: direct sign-in succeeded, while the same credentials with the dashboard Origin were rejected with 403. The proxy no longer forwards browser Origin after checking it locally, and its same-origin check uses the public Host/protocol rather than Next's internal URL. Responsive logo images use lazy loading to avoid React's unused automatic preloads.

The updated Next.js production build and all five proxy integration checks pass. A locally running production dashboard also successfully signed in through the live backend, read the admin identity, summary and all six collections, rendered the authenticated tips-and-tricks page, and signed out to revoke the test session. No content records were changed. The current live proxy can reach the backend (an empty login request returns validation status 400); the earlier 503 was not reproduced. These dashboard changes still require deployment.

- Next.js production build passed, including TypeScript checks, the login route, protected CMS routes, the request proxy, and authentication proxy middleware.
- Express production build passed with the PostgreSQL Prisma client.
- Both PostgreSQL migrations were applied to the configured database: the six original collections and the administrator/session tables.
- The supplied administrator account was created with a salted scrypt password hash. Its password is not included in tracked source or the browser bundle.
- All 20 backend tests passed: authenticated CRUD, PUT/PATCH semantics, validation, rich-text sanitization, search/pagination, Swagger setup, password hashing, unauthenticated access, role enforcement, disabled accounts, generic credential errors, login throttling, cookie flags, session rotation, expiry, logout revocation, and CSRF protection.
- Real PostgreSQL HTTP smoke tests passed for the supplied administrator login, admin identity, all six collection reads, summary counts, session checks, and logout revocation.
- Real dashboard HTTP smoke tests passed for the branded login page, logo asset delivery, anonymous redirects, same-origin sign-in/sign-out, all 24 collection/create/view/edit routes, all six proxied API collections, forged-session rejection, unknown proxy paths, and origin/header checks. No content records were created or deleted by these live checks.
- Browser UI inspection was unavailable in this session. HTTP checks confirm server rendering, routing, cookies, and authorization, not browser interactions or visual layout.
- Backend dependencies retain the previously verified overrides. Quill 2.0.3 has the previously documented HTML-export advisory; editor import/export, server storage, and rich-content rendering sanitize HTML. See https://github.com/advisories/GHSA-v3m3-f69x-jf25.
