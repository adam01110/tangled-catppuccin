# Tangled Catppuccin

A [Catppuccin](https://catppuccin.com) userstyle for [Tangled](https://tangled.org),
adapted from [csw.im's original style](https://tangled.org/csw.im/tangled-catppuccin)
for use in [nix-userstyles](https://github.com/adam01110/nix-userstyles).

It themes the current Go frontend and the Svelte rewrite's color tokens.
The site's layout, images, label colors, and truecolor logs are unchanged.

## Install

1. Install [Stylus](https://github.com/openstyles/stylus).
2. Copy [`tangled.user.less`](./tangled.user.less) into Stylus using **Import**,
   including the metadata block. The preprocessor must be **Less**.
3. Save the style and open Tangled.

The style applies to `tangled.org` and its subdomains. Compilation imports the
[Catppuccin Less library](https://github.com/catppuccin/userstyles), so it needs
network access. The original project's install link does not include this
repository's changes.

## Settings

| Setting         | Default | Effect                                                      |
| --------------- | ------- | ----------------------------------------------------------- |
| Light Flavor    | Latte   | Palette for the site's light theme                          |
| Dark Flavor     | Mocha   | Palette for the site's dark theme                           |
| Accent          | Mauve   | Links, primary actions, selection, and focus                |
| Use System Font | Off     | System sans-serif and monospace instead of the site's fonts |

Both flavor settings accept Latte, Frappé, Macchiato, and Mocha. Tangled's theme
preference takes priority over the OS; automatic mode follows the OS.
Native controls use a light color scheme for Latte and a dark one otherwise.

## Development

The Nix development shell provides Bun and Chromium:

```console
nix develop
bun install --frozen-lockfile
bun run ci
```

Run `nix fmt` to format the repository and `nix flake check` to check formatting.
CI runs these flake checks and the Bun checks through the same pinned Nix shell.
Without Nix, install Bun and Chromium and set `CHROMIUM_PATH` if Chromium is not
on `PATH`.

CI checks formatting, lint, types, Less compilation, and browser rendering.
Tests use local fixtures and do not need a running Tangled instance.
Run `bun run compile` to write default CSS without the Stylus document wrapper
to `.test-output/theme.css`.

## Compatibility

The fixtures are based on Tangled core `master` at `e0ef7981`, `sv-fe` at
`b567c47c`, and `next-dev` at `6598d2fc`. See
[`tests/fixtures/README.md`](./tests/fixtures/README.md) for sources and optional
checks against a local upstream checkout.

Browser tests cover representative components, not the full Svelte application
or authenticated pages. Svelte styling uses semantic tokens rather than generated
class names; Pierre diff colors inherit those tokens into its shadow DOM.
