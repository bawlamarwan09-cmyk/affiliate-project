# Deal Card Design QA

- Source visual truth: `/var/folders/h4/vprdhsg14zj1hnccb0k4y6x40000gn/T/TemporaryItems/NSIRD_screencaptureui_fhpEmu/Screenshot 2026-08-28 at 8.05.15 PM.png`
- Browser-rendered implementation: `qa-deal-cards-implementation.png`
- Combined comparison evidence: `design-qa-deal-cards-comparison.png`
- Route: `https://bargainmom.net/deals`
- State: four active deal cards, desktop four-column layout
- Source pixels: 2000 × 914, treated as a 2× capture and normalized to 1000 × 457
- Implementation pixels: 1000 × 800 at a 1000 × 800 CSS viewport and 1× browser capture

## Comparison history

### Initial findings

- P1: Deal labels occupied nearly the full photo width and obscured product imagery.
- P1: “Scheduled through” dates appeared outside and below every product card.
- P2: The image-to-copy boundary did not clearly protect titles from the photo and overlay region.

### Fixes made

- Moved every editorial deal label to a compact bottom-right photo badge, capped at 150px/62% of the image width.
- Removed the public scheduling-date row from the Deals grid while retaining expiration behavior in the backend.
- Added image overflow containment and a solid, layered copy panel so titles always begin below the photo.

### Post-fix evidence

- Full and focused comparison: `design-qa-deal-cards-comparison.png` (problem state on the left, corrected live implementation on the right).
- All four deal cards keep their badges inside the photo without covering the product subject materially.
- Product titles start below the image boundary with consistent padding.
- No “Scheduled through” text is rendered.

## Required fidelity surfaces

- Fonts and typography: existing Bargain MOM type hierarchy and weights are preserved; compact badge text remains legible.
- Spacing and layout rhythm: four equal cards align cleanly, image and copy regions are separated, and no orphan date rows remain.
- Colors and visual tokens: existing navy, white, and orange tokens are unchanged.
- Image quality and asset fidelity: original database product images are retained without stretching; smaller badges reveal more image area.
- Copy and content: product titles, prices, ratings, store marks, and CTA labels remain dynamic; only the unwanted schedule copy is removed.

## Browser checks

- Product cards and CTA links rendered on the live Deals route.
- No horizontal card-grid overflow at the tested viewport.
- Browser console errors: 0.
- Affiliate CTAs were not opened because external navigation was not required for this visual change.

## Remaining findings

- No actionable P0, P1, or P2 findings remain within the requested deal-card scope.

final result: passed
