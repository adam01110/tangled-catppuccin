import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { test, beforeAll, afterAll } from "bun:test";
import { chromium, type Browser, type Page } from "playwright";
import { compile, browserCSS, flavors } from "../scripts/compile.ts";

let browser: Browser;
beforeAll(async () => {
  const executablePath =
    process.env.CHROMIUM_PATH || execFileSync("which", ["chromium"], { encoding: "utf8" }).trim();
  browser = await chromium.launch({ executablePath, headless: true });
});
afterAll(async () => {
  await browser?.close();
});
const fixture = `
<main class="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700" id="panel">
<h1>Repository</h1><a href="#">Link</a>
<button class="btn btn-create" id="create">Create</button>
<button class="btn" id="neutral">Action</button>
<input id="input" placeholder="Search"><input type="checkbox" id="check" checked>
<div id="add" class="bg-green-100 dark:bg-green-800/30 text-green-700 dark:text-green-400">+ added</div>
<div id="delete" class="bg-red-100 dark:bg-red-800/30 text-red-700 dark:text-red-400">- removed</div>
<div class="prose"><h2>Readme</h2><a id="prose-link" href="#">Documentation</a><pre><code><span class="chroma"><span class="nf" id="syntax">function</span></span></code></pre></div>
<p class="nf" id="ordinary">Ordinary content</p>
<div class="bg-background-default text-foreground-default border-border-default" id="svelte">Svelte component</div>
<div class="markup"><div class="markdown-alert-important" id="alert"><p class="markdown-alert-title" id="alert-title">Important</p></div></div>
<span class="term-fg31" id="go-log">Error</span><span class="ansi-red-fg" id="sv-log">Error</span>
<div id="search-shell" class="bg-gray-100/50 dark:bg-gray-800/50 focus-within:bg-gray-100 dark:focus-within:bg-gray-800/80"><input id="header-search" placeholder="Search..."></div>
<a href="#" id="join" data-variant="primary" class="bg-background-success-emphasis text-foreground-on-emphasis border-border-success hover:bg-background-success-emphasis-hover">Join now</a>
<button id="join-disabled" disabled data-variant="primary" class="disabled:text-foreground-success-disabled">Join now</button>
<div id="success-status" class="bg-background-success-emphasis">Success</div>
<div class="btn-group"><button id="star-action" class="btn-group-item active">Star</button><a id="star-count" class="btn-group-item" href="#">0</a></div>
<diffs-container id="diff"></diffs-container>
</main>`;
const controls = await readFile(new URL("fixtures/controls.css", import.meta.url), "utf8");
const upstream = await readFile(new URL("fixtures/svelte.css", import.meta.url), "utf8");
const legacy = process.env.LEGACY_CSS_PATH
  ? await readFile(process.env.LEGACY_CSS_PATH, "utf8")
  : "";
const palettes = {
  latte: {
    base: "#eff1f5",
    mantle: "#e6e9ef",
    text: "#4c4f69",
    mauve: "#8839ef",
    blue: "#1e66f5",
    green: "#40a02b",
    red: "#d20f39",
  },
  frappe: {
    base: "#303446",
    mantle: "#292c3c",
    text: "#c6d0f5",
    mauve: "#ca9ee6",
    blue: "#8caaee",
    green: "#a6d189",
    red: "#e78284",
  },
  macchiato: {
    base: "#24273a",
    mantle: "#1e2030",
    text: "#cad3f5",
    mauve: "#c6a0f6",
    blue: "#8aadf4",
    green: "#a6da95",
    red: "#ed8796",
  },
  mocha: {
    base: "#1e1e2e",
    mantle: "#181825",
    text: "#cdd6f4",
    mauve: "#cba6f7",
    blue: "#89b4fa",
    green: "#a6e3a1",
    red: "#f38ba8",
  },
};
function rgb(hex: string) {
  return `rgb(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(", ")})`;
}
async function mount(page: Page, css: string, siteTheme: "light" | "dark" | null) {
  await page.setContent(`<html${siteTheme ? ` data-theme="${siteTheme}"` : ""}><head><style>${legacy}\n${upstream}\n${controls}
  body { font-family: "InterVariable", sans-serif; } .btn { background: white; color: black; }
  .chroma .nf { color: black; } .nf { font-weight: bold; }
  </style><style>${css}</style></head><body>${fixture}</body></html>`);
  await page.evaluate(() => {
    document.querySelector("diffs-container")!.attachShadow({ mode: "open" }).innerHTML = `
      <style>span { color: var(--diffs-token-function); background: var(--diffs-bg-addition-override); }</style><span>Shadow code</span>`;
  });
}
async function style(page: Page, selector: string, property: string) {
  return page
    .locator(selector)
    .evaluate(
      (element, property) => getComputedStyle(element).getPropertyValue(property).trim(),
      property,
    );
}
for (const flavor of flavors) {
  test(`${flavor}: light/dark/automatic and OS preference`, async () => {
    const css = browserCSS(await compile({ light: flavor, dark: flavor }));
    const p = palettes[flavor];
    const page = await browser.newPage();
    try {
      for (const system of ["light", "dark"] as const) {
        await page.emulateMedia({ colorScheme: system });
        for (const siteTheme of ["light", "dark", null] as const) {
          await mount(page, css, siteTheme);
          assert.equal(await style(page, "body", "background-color"), rgb(p.mantle));
          assert.equal(await style(page, "#panel", "background-color"), rgb(p.base));
          assert.equal(await style(page, "#panel", "color"), rgb(p.text));
          assert.equal(await style(page, "#svelte", "background-color"), rgb(p.base));
          assert.equal(await style(page, "#svelte", "color"), rgb(p.text));
          assert.equal(await style(page, "#create", "background-color"), rgb(p.mauve));
          assert.equal(await style(page, "#create", "color"), rgb(p.base));
          assert.equal(await style(page, "#input", "color"), rgb(p.text));
          assert.equal(await style(page, "#check", "background-color"), rgb(p.mauve));
          assert.notEqual(await style(page, "#check", "background-image"), "none");
          assert.equal(await style(page, "#add", "color"), rgb(p.green));
          assert.equal(await style(page, "#delete", "color"), rgb(p.red));
          assert.notEqual(
            await style(page, "#add", "background-color"),
            await style(page, "#delete", "background-color"),
          );
          assert.equal(await style(page, "#syntax", "color"), rgb(p.blue));
          assert.equal(await style(page, "#ordinary", "color"), rgb(p.text));
          assert.equal(await style(page, "#prose-link", "color"), rgb(p.mauve));
          assert.equal(await style(page, "#alert-title", "color"), rgb(p.mauve));
          assert.equal(await style(page, "#go-log", "color"), rgb(p.red));
          assert.equal(await style(page, "#sv-log", "color"), rgb(p.red));
          assert.equal(await style(page, "#diff span", "color"), rgb(p.blue));
          assert.equal(
            await style(page, "html", "color-scheme"),
            flavor === "latte" ? "light" : "dark",
          );
        }
      }
    } finally {
      await page.close();
    }
  });
}
test("legacy ANSI classes use the semantic palette", async () => {
  const page = await browser.newPage();
  try {
    await mount(page, browserCSS(await compile()), "dark");
    const colors = [
      "black",
      "red",
      "green",
      "yellow",
      "blue",
      "magenta",
      "cyan",
      "white",
      "bright-black",
      "bright-red",
      "bright-green",
      "bright-yellow",
      "bright-blue",
      "bright-magenta",
      "bright-cyan",
      "bright-white",
    ];
    for (const [index, color] of colors.entries()) {
      const foreground = index < 8 ? 30 + index : 82 + index;
      const actual = await page.evaluate(
        ({ foreground, color }) => {
          const legacy = document.createElement("span");
          legacy.className = `term-fg${foreground} term-bg${foreground + 10}`;
          const semantic = document.createElement("span");
          semantic.style.color = `var(--color-ansi-${color})`;
          semantic.style.backgroundColor = `var(--color-ansi-${color})`;
          document.body.append(legacy, semantic);
          const legacyStyle = getComputedStyle(legacy);
          const semanticStyle = getComputedStyle(semantic);
          const result = {
            foreground: legacyStyle.color,
            background: legacyStyle.backgroundColor,
            expected: semanticStyle.color,
          };
          legacy.remove();
          semantic.remove();
          return result;
        },
        { foreground, color },
      );
      assert.equal(actual.foreground, actual.expected, color);
      assert.equal(actual.background, actual.expected, color);
    }
  } finally {
    await page.close();
  }
});

test("site preference wins over OS; automatic and live changes resolve flavors", async () => {
  const page = await browser.newPage();
  try {
    const css = browserCSS(await compile());
    await page.emulateMedia({ colorScheme: "dark" });
    await mount(page, css, "light");
    assert.equal(await style(page, "#panel", "background-color"), rgb(palettes.latte.base));
    await page.evaluate(() => (document.documentElement.dataset.theme = "dark"));
    assert.equal(await style(page, "#panel", "background-color"), rgb(palettes.mocha.base));
    await page.emulateMedia({ colorScheme: "light" });
    assert.equal(await style(page, "#panel", "background-color"), rgb(palettes.mocha.base));
    await page.evaluate(() => delete document.documentElement.dataset.theme);
    assert.equal(await style(page, "#panel", "background-color"), rgb(palettes.latte.base));
    await page.emulateMedia({ colorScheme: "dark" });
    assert.equal(await style(page, "#panel", "background-color"), rgb(palettes.mocha.base));
  } finally {
    await page.close();
  }
});
test("custom accent, font toggle, focus and hover are applied without activating inactive states", async () => {
  const page = await browser.newPage();
  try {
    await mount(page, browserCSS(await compile({ accent: "blue", font: 1 })), "dark");
    assert.equal(await style(page, "#create", "background-color"), rgb(palettes.mocha.blue));
    assert.match(await style(page, "body", "font-family"), /system-ui/);
    assert.equal(await style(page, "#neutral", "background-color"), rgb(palettes.mocha.base));
    await page.locator("#neutral").hover();
    await page.waitForFunction(
      () =>
        getComputedStyle(document.querySelector("#neutral")!).backgroundColor === "rgb(49, 50, 68)",
    );
    assert.equal(await style(page, "#neutral", "background-color"), "rgb(49, 50, 68)");
    await page.locator("#create").hover();
    await page.waitForFunction(
      () =>
        getComputedStyle(document.querySelector("#create")!).backgroundColor ===
        "rgb(137, 180, 250)",
    );
    assert.equal(await style(page, "#create", "background-color"), rgb(palettes.mocha.blue));
    await page.locator("#input").focus();
    assert.equal(await style(page, "#input", "outline-color"), rgb(palettes.mocha.blue));
    await mount(page, browserCSS(await compile({ font: 0 })), "light");
    assert.match(await style(page, "body", "font-family"), /InterVariable/);
  } finally {
    await page.close();
  }
});

for (const flavor of flavors) {
  test(`${flavor}: primary actions and unfocused search use theme colors`, async () => {
    const page = await browser.newPage();
    try {
      const css = browserCSS(await compile({ light: flavor, dark: flavor, accent: "blue" }));
      for (const siteTheme of ["light", "dark"] as const) {
        await mount(page, css, siteTheme);
        const p = palettes[flavor];
        assert.equal(await style(page, "#join", "background-color"), rgb(p.blue));
        assert.equal(await style(page, "#join", "color"), rgb(p.base));
        assert.equal(await style(page, "#join", "border-color"), rgb(p.blue));
        await page.locator("#join").hover();
        assert.equal(await style(page, "#join", "background-color"), rgb(p.blue));
        assert.equal(await style(page, "#join", "color"), rgb(p.base));
        assert.equal(await style(page, "#success-status", "background-color"), rgb(p.green));
        assert.notEqual(await style(page, "#join-disabled", "color"), rgb(p.base));
        assert.notEqual(
          await style(page, "#star-action", "background-color"),
          await style(page, "#star-count", "background-color"),
        );
        const searchColor = () => style(page, "#search-shell", "background-color");
        const base = await page.evaluate((color) => {
          const probe = document.createElement("div");
          probe.style.backgroundColor = `color-mix(in srgb, ${color} 50%, transparent)`;
          document.body.append(probe);
          const result = getComputedStyle(probe).backgroundColor;
          probe.remove();
          return result;
        }, p.base);
        if (siteTheme === "dark") assert.equal(await searchColor(), base);
        const unfocused = await searchColor();
        await page.locator("#header-search").focus();
        assert.notEqual(await searchColor(), unfocused);
        await page.locator("#header-search").blur();
        assert.equal(await searchColor(), unfocused);
      }
    } finally {
      await page.close();
    }
  });
}
