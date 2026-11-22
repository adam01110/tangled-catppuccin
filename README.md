<!-- rumdl-disable MD023 MD033 MD041 -->

<div align="center">

  # Tangled Catppuccin

  A [Catppuccin](https://catppuccin.com) userstyle for
  [Tangled](https://tangled.org), adapted from [csw.im's original
  style](https://tangled.org/csw.im/tangled-catppuccin) for use in
  [nix-userstyles](https://github.com/adam01110/nix-userstyles).

  [![Repo Size](https://img.shields.io/github/repo-size/adam01110/tangled-catppuccin?style=flat-square&labelColor=504945&label=repo%20size&color=3c3836)](https://github.com/adam01110/tangled-catppuccin)
  <br />
  [![Nix](https://img.shields.io/badge/Nix-flakes-689d6a?style=flat-square&labelColor=504945&logo=nixos&logoColor=ebdbb2)](https://nixos.wiki/wiki/Flakes)
  [![Catppuccin](https://img.shields.io/badge/Catppuccin-userstyle-b16286?style=flat-square&labelColor=504945)](https://github.com/catppuccin/userstyles)
  [![Tangled](https://img.shields.io/badge/Tangled-Svelte%20appview-458588?style=flat-square&labelColor=504945&logo=tangled&logoColor=ebdbb2)](https://tangled.org)

  [Install](#install) - [Settings](#settings) - [Development](#development) - [Compatibility](#compatibility)
</div>

<!-- rumdl-enable MD023 MD033 MD041 -->

The style themes Tangled's Svelte frontend. It leaves the layout, images, label
colors, and truecolor logs unchanged. Support for the retired Go appview has
been removed.

## Install

1. Install [Stylus](https://github.com/openstyles/stylus).
2. Import [`tangled.user.less`](./tangled.user.less) into Stylus, including the
   metadata block. Select **Less** as the preprocessor.
3. Save the style and open Tangled.

The style applies to `tangled.org` and its subdomains. Compilation needs network
access to the [Catppuccin Less
library](https://github.com/catppuccin/userstyles). The original project's
install link doesn't include this repository's changes.

## Settings

| Setting         | Default | Effect                                                               |
| --------------- | ------- | -------------------------------------------------------------------- |
| Light Flavor    | Latte   | Palette for Tangled's light theme                                    |
| Dark Flavor     | Mocha   | Palette for Tangled's dark theme                                     |
| Accent          | Mauve   | Links, primary actions, selection, and focus                         |
| Use System Font | Off     | Use system sans-serif and monospace fonts instead of Tangled's fonts |

Both flavor settings accept Latte, Frappé, Macchiato, and Mocha. Tangled's theme
preference takes priority over the OS. Automatic mode follows the OS. Native
controls use a light color scheme for Latte and a dark one for the other
flavors.

## Development

The Nix development shell provides Bun and Chromium:

```console
nix develop
bun install --frozen-lockfile
bun run ci
```

Without Nix, install Bun and Chromium and set `CHROMIUM_PATH` if Chromium isn't
on `PATH`. Run `nix fmt` to format the repository. `nix flake check` checks
formatting and runs `bun run ci` in a sandbox with pinned dependencies and
Chromium. The Tangled pipeline runs this same flake check.

The Bun checks cover formatting, lint, types, Less compilation, and browser
rendering. Tests use local fixtures, so they don't need a running Tangled
instance. Run `bun run compile` to write the default CSS without the Stylus
document wrapper to `.test-output/theme.css`.

## Compatibility

The style uses Tangled's semantic color tokens. Pierre diff colors inherit those
tokens into its shadow DOM. Browser tests cover representative components, not
the full application or authenticated pages. See
[`tests/fixtures/README.md`](./tests/fixtures/README.md) for fixture sources and
optional checks against a local upstream checkout.
