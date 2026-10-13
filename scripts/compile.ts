import { mkdir, readFile, writeFile } from "node:fs/promises";
import less from "less";
import { fileURLToPath } from "node:url";

export const flavors = ["latte", "frappe", "macchiato", "mocha"] as const;
export const accents = [
  "rosewater",
  "flamingo",
  "pink",
  "mauve",
  "red",
  "maroon",
  "peach",
  "yellow",
  "green",
  "teal",
  "blue",
  "sapphire",
  "sky",
  "lavender",
  "subtext0",
] as const;

type CompileOptions = {
  light?: (typeof flavors)[number];
  dark?: (typeof flavors)[number];
  accent?: (typeof accents)[number];
  font?: 0 | 1;
};

export async function compile(options: CompileOptions = {}) {
  const { light = "latte", dark = "mocha", accent = "mauve", font = 0 } = options;
  const style = await readFile(new URL("../tangled.user.less", import.meta.url), "utf8");
  const library = await readFile(
    new URL("../tests/fixtures/palette.less", import.meta.url),
    "utf8",
  );
  const input = style.replace(
    '@import "https://userstyles.catppuccin.com/lib/std/v1.less";',
    library,
  );
  const { css } = await less.render(input, {
    globalVars: {
      lightFlavor: light,
      darkFlavor: dark,
      accentColor: accent,
      systemFont: String(font),
    },
    paths: [fileURLToPath(new URL("../tests/fixtures/", import.meta.url))],
    javascriptEnabled: false,
  });
  return css;
}
export function browserCSS(css: string) {
  const marker = '@-moz-document domain("tangled.org") {';
  if (!css.includes(marker)) throw new Error("Missing Tangled domain scope");
  return css.slice(css.indexOf(marker) + marker.length, css.lastIndexOf("}"));
}

if (import.meta.main) {
  await mkdir(".test-output", { recursive: true });
  await writeFile(".test-output/theme.css", browserCSS(await compile()));
  console.log("Wrote .test-output/theme.css");
}
