# Compatibility fixtures

The frontend fixtures follow Tangled core `next-dev` at
[`7a507b7739c9aca91be292ed2a0c1e885e42da79`](https://tangled.org/tangled.org/core/tree/7a507b7739c9aca91be292ed2a0c1e885e42da79).
They cover the deployed Svelte frontend, not the retired Go appview.

- `palette.less` loads `std-v1.less`, a local copy of the Catppuccin
  [standard library](https://userstyles.catppuccin.com/lib/std/v1.less), for
  offline compilation. The userstyle keeps its remote import.
- `svelte-tokens.json` lists the 109 audited semantic color tokens from
  [`web/src/theme.css`](https://tangled.org/tangled.org/core/raw/7a507b7739c9aca91be292ed2a0c1e885e42da79/web/src/theme.css).
- `svelte.css` contains browser-compatible light color declarations from that
  theme, the inherited variable bridge from
  [`web/src/pierre.css`](https://tangled.org/tangled.org/core/raw/7a507b7739c9aca91be292ed2a0c1e885e42da79/web/src/pierre.css),
  and representative semantic utilities. Tailwind directives and application
  layout rules are omitted.
- `controls.css` models the color and state rules from
  [`web/src/lib/components/ui`](https://tangled.org/tangled.org/core/tree/7a507b7739c9aca91be292ed2a0c1e885e42da79/web/src/lib/components/ui)
  (`Button.svelte`, `Checkbox.svelte`, `Radio.svelte`, and `inputField.ts`),
  plus ANSI classes from
  [`web/src/logs.css`](https://tangled.org/tangled.org/core/raw/7a507b7739c9aca91be292ed2a0c1e885e42da79/web/src/logs.css).

These fixtures test the color interface and representative control states,
not the full application, authenticated pages, or the Pierre renderer.
Set `TANGLED_SVELTE_SOURCE` to a checkout’s `web/src/theme.css` to also check
its live semantic-token inventory during compilation tests.
