# PfotenTechnik 34.4 — Repository delta

Status: **COMPLETE**  
Measurement scope: repository and `apps/pfotentechnik`, before cleanup versus the final 34.4 working tree.

## Before → after

| Measure | Before | After | Delta |
|---|---:|---:|---:|
| Effective tracked files | 4,051 | 3,515 | −536 |
| PfotenTechnik files (`rg --files`) | 2,611 | 2,087 | −524 |
| Application source files | 1,295 | 1,283 | −12 |
| Application source LOC | 47,855 | 46,064 | −1,791 |
| Test files | 230 | 140 | −90 |
| Test LOC | 13,417 | 8,575 | −4,842 |
| Script files | 137 | 120 | −17 |
| Script LOC | 22,630 | 20,074 | −2,556 |
| Versioned capture/audit scripts | 17 | 0 | −17 |
| Current generic Foundation audit | 0 | 1 | +1 |
| Report screenshots | 338 / 279,084,481 bytes | 0 / 0 bytes | −338 / −279,084,481 bytes |
| Report JSON/log artifacts | 130 / 8,833,109 bytes | 64 / 5,582,914 bytes | −66 / −3,250,195 bytes* |
| Backup/temp/`.DS_Store` artifacts | 38 | 0 | −38 |
| Proven obsolete components/styles | 18 | 0 | −18 |
| Repository workspace size | 2,818,972 KiB | 2,541,336 KiB | −277,636 KiB |
| PfotenTechnik workspace size | 1,533,208 KiB | 1,255,712 KiB | −277,496 KiB |
| Reports workspace size | 283,756 KiB | 7,136 KiB | −276,620 KiB |
| Generated HTML routes | 367 | 367 | 0 |

\* The deletion manifest's 3,233,989-byte JSON/log figure is the size of deleted files. The slightly larger net delta also includes regenerated current reports becoming smaller during final validation.

## Interpretation

- The route surface is unchanged: the production build still emits 367 pages.
- Nearly all recovered disk space came from historical screenshots and raw audit output, not production/editorial assets.
- Source reduction is intentionally conservative: only zero-consumer components and retired Comparison CSS tombstones were deleted.
- Test reduction removes completed migration snapshots while retaining 704 current-contract assertions.
- Version-specific browser capture scripts were removed; one stable Foundation audit remains for operational reuse.

## Measurement notes

- “Effective tracked files” is the Git index count adjusted for this change set's tracked deletions and additions.
- LOC counts cover the app's source/test/script file types used by the existing repository metrics.
- Workspace size includes generated/build dependencies already present locally, so it is reported as a cleanup delta rather than a source-control size claim.
- Screenshot and JSON/log byte counts cover report artifacts, not production media.
