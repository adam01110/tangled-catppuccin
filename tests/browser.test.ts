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
<main class="bg-background-default text-foreground-default border-border-default" id="panel">
<h1>Repository</h1><a href="#">Link</a>
<button data-variant="primary" class="emphasis" id="create">Create</button>
<button class="bg-background-default text-foreground-default hover:bg-background-muted" id="neutral">Action</button>
<input id="input" placeholder="Search"><span><input type="checkbox" id="check" checked><svg id="check-icon" aria-hidden="true"></svg></span>
<div id="add" class="bg-background-success-subtle text-foreground-success">+ added</div>
<div id="delete" class="bg-background-danger-subtle text-foreground-danger">- removed</div>
<div class="markup"><h2>Readme</h2><a id="prose-link" href="#">Documentation</a><pre><code><span class="syntax-function" id="syntax">function</span></code></pre></div>
<p class="nf" id="ordinary">Ordinary content</p>
<div class="markup"><div class="markdown-alert-important" id="alert"><p class="markdown-alert-title" id="alert-title">Important</p></div></div>
<span class="ansi-red-fg" id="sv-log">Error</span><span id="truecolor-log" style="color: rgb(12, 34, 56)">Custom log</span>
<div id="search-shell" class="input-field"><input id="header-search" placeholder="Search..."></div>
<a href="#" id="join" data-variant="primary" class="emphasis">Join now</a>
<button id="join-disabled" disabled data-variant="primary" class="emphasis">Join now</button>
<div id="success-status" class="bg-background-success-emphasis">Success</div>
<button class="emphasis" data-variant="destructive" id="destructive">Delete</button>
<a class="emphasis" data-variant="primary" aria-disabled="true" id="aria-disabled">Unavailable</a>
<span><input type="checkbox" id="disabled-check" disabled checked></span>
<span><input type="checkbox" id="mixed-check"><svg id="mixed-check-icon"></svg><svg class="minus" id="minus-icon"></svg></span>
<span><input type="radio" id="radio" checked><span id="radio-dot"></span></span>
<div class="input-field error" id="error-field"><input id="error-input"></div>
<div class="input-field disabled" id="disabled-field"><input id="disabled-input" disabled></div>
<diffs-container id="diff"></diffs-container>
</main>`;
const controls = await readFile(new URL("fixtures/controls.css", import.meta.url), "utf8");
const upstream = await readFile(new URL("fixtures/svelte.css", import.meta.url), "utf8");
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
  await page.mouse.move(1000, 1000);
  await page.setContent(`<html${siteTheme ? ` data-theme="${siteTheme}"` : ""}><head><style>${upstream}\n${controls}
  body { font-family: "TimelessSans", sans-serif; }
  input { color: inherit; background: transparent; } .nf { font-weight: bold; }
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
          assert.equal(await style(page, "#create", "--btn-brand"), p.mauve);
          assert.match(await style(page, "#create", "background-image"), /linear-gradient/);
          assert.equal(await style(page, "#create", "color"), rgb(p.base));
          assert.equal(await style(page, "#input", "color"), rgb(p.text));
          assert.equal(await style(page, "#check", "background-color"), rgb(p.mauve));
          assert.equal(await style(page, "#check", "background-image"), "none");
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
          assert.equal(await style(page, "#truecolor-log", "color"), "rgb(12, 34, 56)");
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
test("ANSI classes use the semantic palette", async () => {
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
    for (const color of colors) {
      const actual = await page.evaluate((color) => {
        const log = document.createElement("span");
        log.className = `ansi-${color}-fg ansi-${color}-bg`;
        const semantic = document.createElement("span");
        semantic.style.color = `var(--color-ansi-${color})`;
        semantic.style.backgroundColor = `var(--color-ansi-${color})`;
        document.body.append(log, semantic);
        const logStyle = getComputedStyle(log);
        const semanticStyle = getComputedStyle(semantic);
        const result = {
          foreground: logStyle.color,
          background: logStyle.backgroundColor,
          expected: semanticStyle.color,
        };
        log.remove();
        semantic.remove();
        return result;
      }, color);
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
    assert.equal(await style(page, "#create", "--btn-brand"), palettes.mocha.blue);
    assert.match(await style(page, "body", "font-family"), /system-ui/);
    assert.equal(await style(page, "#neutral", "background-color"), rgb(palettes.mocha.base));
    await page.locator("#neutral").hover();
    assert.equal(await style(page, "#neutral", "background-color"), "rgb(49, 50, 68)");
    const resting = await style(page, "#create", "background-image");
    await page.locator("#create").hover();
    assert.notEqual(await style(page, "#create", "background-image"), resting);
    assert.equal(await style(page, "#create", "--btn-brand"), palettes.mocha.blue);
    await page.locator("#input").focus();
    assert.equal(await style(page, "#input", "outline-color"), rgb(palettes.mocha.blue));
    await mount(page, browserCSS(await compile({ font: 0 })), "light");
    assert.match(await style(page, "body", "font-family"), /TimelessSans/);
  } finally {
    await page.close();
  }
});

for (const flavor of flavors) {
  test(`${flavor}: primary actions and search focus use theme colors`, async () => {
    const page = await browser.newPage();
    try {
      const css = browserCSS(await compile({ light: flavor, dark: flavor, accent: "blue" }));
      for (const siteTheme of ["light", "dark"] as const) {
        await mount(page, css, siteTheme);
        const p = palettes[flavor];
        assert.equal(await style(page, "#join", "--btn-brand"), p.blue);
        assert.equal(await style(page, "#join", "color"), rgb(p.base));
        const resting = await style(page, "#join", "background-image");
        await page.locator("#join").hover();
        assert.notEqual(await style(page, "#join", "background-image"), resting);
        assert.equal(await style(page, "#join", "color"), rgb(p.base));
        assert.equal(await style(page, "#success-status", "background-color"), rgb(p.green));
        assert.notEqual(await style(page, "#join-disabled", "color"), rgb(p.base));
        await mount(page, css, siteTheme);
        const searchRing = () => style(page, "#search-shell", "box-shadow");
        assert.equal(await style(page, "#search-shell", "background-color"), rgb(p.base));
        const unfocused = await searchRing();
        await page.locator("#header-search").focus();
        assert.notEqual(await searchRing(), unfocused);
        await page.locator("#header-search").blur();
        assert.equal(await searchRing(), unfocused);
      }
    } finally {
      await page.close();
    }
  });
}

test("current controls retain disabled states, peer indicators, and field backgrounds", async () => {
  const page = await browser.newPage();
  try {
    await mount(page, browserCSS(await compile()), "dark");
    await page.locator("#mixed-check").evaluate((element) => {
      (element as HTMLInputElement).indeterminate = true;
    });
    assert.equal(await style(page, "#destructive", "--btn-brand"), palettes.mocha.red);
    assert.equal(await style(page, "#destructive", "color"), rgb(palettes.mocha.base));
    assert.match(await style(page, "#destructive", "background-image"), /linear-gradient/);
    for (const selector of ["#join-disabled", "#aria-disabled"]) {
      assert.equal(await style(page, selector, "opacity"), "0.5");
      assert.equal(await style(page, selector, "pointer-events"), "none");
    }
    assert.equal(await style(page, "#check-icon", "display"), "block");
    assert.equal(await style(page, "#mixed-check-icon", "display"), "none");
    assert.equal(await style(page, "#minus-icon", "display"), "block");
    assert.equal(await style(page, "#radio-dot", "display"), "block");
    assert.equal(await style(page, "#radio", "box-shadow"), "none");
    assert.notEqual(
      await style(page, "#disabled-check", "background-color"),
      rgb(palettes.mocha.mauve),
    );
    for (const selector of ["#check", "#mixed-check", "#radio"]) {
      assert.equal(await style(page, selector, "background-image"), "none");
    }
    for (const selector of ["#error-input", "#disabled-input"]) {
      assert.equal(await style(page, selector, "background-color"), "rgba(0, 0, 0, 0)");
    }
    assert.notEqual(
      await style(page, "#error-field", "background-color"),
      rgb(palettes.mocha.base),
    );
    assert.notEqual(
      await style(page, "#disabled-field", "background-color"),
      rgb(palettes.mocha.base),
    );
  } finally {
    await page.close();
  }
});
