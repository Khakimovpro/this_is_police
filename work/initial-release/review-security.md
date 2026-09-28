# Security review — wave 1

Reviewer found no demonstrated vulnerability or exposed credential. Pattern scan: 98 Git candidate files and 6 ignored logs, no credential matches. Root npm audit: 0 known vulnerabilities across 68 dependencies. Browser has no external API, save-import or URL-to-HTML path. Generation script sends Authorization only to fixed Polza endpoints; artifact downloads use separate requests without credentials.

Limits: Python dependency scanner unavailable. HyperFrames npx dependency graph was outside the root npm audit. Pattern scanning cannot identify every possible credential format. Rechecked in wave 2 after final edits.

# Wave 2

Clean. Scanned 167 candidate files including the static distribution, no credential patterns. Nested video dependency audit: 106 dependencies, 0 known vulnerabilities; @hyperframes/core 0.8.82 locked. New HTML subtitle values escaped, focus selectors use CSS.escape, release copy uses fixed subprocess arguments. Python generator dependency was subsequently pinned to the current version published by PyPI; Python vulnerability scanner remains unavailable.
