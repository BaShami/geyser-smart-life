## Why you can't see them on mobile

In `src/routes/index.tsx` the nav (`Benefits`, `How it works`, `Pricing`, `FAQ`) uses `hidden md:flex`, so it only appears at ≥768px. On phones only the logo and "Message us" button render — there's no menu trigger, so the links are unreachable.

## Fix

Add a compact mobile menu inside the existing floating nav pill. Nothing else on the page changes.

1. Add a hamburger button (lucide `Menu` / `X` icon) shown only below `md` (`md:hidden`), placed just before the "Message us" button.
2. Add local `useState` for `menuOpen`.
3. When open, render a small dropdown panel anchored under the pill (rounded, same white/70 backdrop-blur, border, shadow) containing the four links stacked vertically. Tapping a link closes the menu and scrolls to the anchor.
4. Close the menu on link click and on route hash change.
5. Keep the desktop nav (`hidden md:flex`) untouched.

No copy, styling tokens, or other sections are modified.
