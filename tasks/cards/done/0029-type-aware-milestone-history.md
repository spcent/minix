## D29 Type-Aware Milestone History

### Summary
Make milestone history lanes distinguish volume completion, archive milestones, and chapter recap states instead of rendering every saved milestone as one flat category.

### Outcome
- Added shared milestone `type` support in the reading-center continuity types.
- Updated `reader`, `toc`, and `bookshelf` to persist explicit milestone types.
- Updated H5 and WeChat history lanes to show milestone type labels alongside source and recency context.
- Extended feature tests to cover typed milestone hydration and persistence.

### Notes
- `reader` now persists `chapter-recap` when a chapter completes without a new volume milestone, and `volume-complete` when a volume milestone exists.
- `toc` persists `volume-complete`.
- `bookshelf` persists `archive-milestone`.
