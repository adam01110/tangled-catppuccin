import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "bun:test";
import { compile, flavors, accents } from "../scripts/compile.ts";

for (const flavor of flavors) {
  test(`compile ${flavor} with every accent and both font settings`, async () => {
    for (const accent of accents) {
      for (const font of [0, 1] as const) {
        const css = await compile({
          light: flavor,
          dark: flavor,
          accent,
          font,
        });
        assert.match(css, /@-moz-document domain\("tangled\.org"\)/);
        assert.match(css, /--color-background-default: #[a-f0-9]+ !important/);
        assert.equal(css.includes("--font-sans: system-ui"), font === 1);
        assert.doesNotMatch(css, /@[a-zA-Z]+Flavor|@@|undefined/);
      }
    }
  });
}
test("every audited Svelte semantic token is exported", async () => {
  const tokens: string[] = JSON.parse(
    await readFile(new URL("fixtures/svelte-tokens.json", import.meta.url), "utf8"),
  );
  if (process.env.TANGLED_SVELTE_SOURCE) {
    const upstream = await readFile(process.env.TANGLED_SVELTE_SOURCE, "utf8");
    const liveTokens = [
      ...new Set(
        upstream.match(
          /--color-(?:background|foreground|border|shadow|inverse|ansi|syntax|drawing)-[\w-]+(?=:)/g,
        ),
      ),
    ];
    tokens.push(...liveTokens);
  }
  const css = await compile();
  for (const token of tokens) assert.ok(css.includes(`${token}:`), token);
});
test("syntax selectors cannot leak into ordinary elements", async () => {
  const css = await compile();
  assert.match(css, /\.chroma :is\(\.c,/);
  assert.doesNotMatch(css, /^:is\(\.c,/m);
});
