# Compatibility fixtures

`palette.less` is the local library entrypoint used by compilation tests.

- `std-v1.less`: Catppuccin’s versioned [standard
  library](https://userstyles.catppuccin.com/lib/std/v1.less), captured for
  offline compilation tests. The userstyle itself retains the remote import.
- `svelte-tokens.json`: semantic color-token names from Tangled core `sv-fe` at
  `b567c47c` (`web/src/app.css`) and `next-dev` at `6598d2fc`
  (`web/src/theme.css`).
- `svelte.css`: color declarations from that file, the inherited Pierre variable
  interface from `web/src/pierre.css`, and representative semantic utility
  rules. This tests the theme interface, not the complete Svelte application or
  Pierre renderer.

Set `TANGLED_SVELTE_SOURCE` to a checkout’s `web/src/theme.css` (or `app.css` on
sv-fe) to also check its live token inventory. Set `LEGACY_CSS_PATH` to compiled
`input.css` from the current Go frontend to run browser assertions against its
real cascade. Neither is required by the offline suite.
