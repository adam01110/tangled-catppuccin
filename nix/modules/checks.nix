{
  perSystem = {
    # keep-sorted start
    lib,
    pkgs,
    # keep-sorted end
    ...
  }: let
    inherit (builtins) elem;
    inherit
      (lib)
      # keep-sorted start
      cleanSourceFilter
      cleanSourceWith
      getExe
      # keep-sorted end
      ;
    inherit
      (pkgs)
      # keep-sorted start
      chromium
      makeFontsConf
      runCommand
      # keep-sorted end
      ;

    source = cleanSourceWith {
      src = ../..;
      filter = path: type:
        cleanSourceFilter path type
        && !(elem (baseNameOf path) [".jj" "node_modules" ".test-output"]);
    };

    dependencies =
      runCommand "tangled-catppuccin-dependencies"
      {
        nativeBuildInputs = with pkgs; [
          # keep-sorted start
          bun
          cacert
          # keep-sorted end
        ];

        outputHash = "sha256-WxfJZ1STQleNvxyZ5FhaSeI6JN0rx4F7RMHiw3NbTyo=";
        outputHashAlgo = "sha256";
        outputHashMode = "recursive";
      }
      ''
        export HOME="$TMPDIR/home"
        export BUN_INSTALL_CACHE_DIR="$TMPDIR/bun-cache"
        mkdir -p "$HOME" work
        cd work
        cp ${../../package.json} package.json
        cp ${../../bun.lock} bun.lock
        bun install --frozen-lockfile --ignore-scripts --no-progress --cpu="*" --os="*"
        mkdir -p "$out"
        cp -R node_modules "$out/"
      '';
  in {
    checks.tests =
      runCommand "tangled-catppuccin-tests"
      {
        nativeBuildInputs = with pkgs; [
          # keep-sorted start
          bun
          nodejs
          # keep-sorted end
        ];

        CHROMIUM_PATH = getExe chromium;
        PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD = "1";
        FONTCONFIG_FILE = makeFontsConf {
          fontDirectories = [pkgs.dejavu_fonts];
        };
      }
      ''
        export HOME="$TMPDIR/home"
        mkdir -p "$HOME"
        cp -R ${source} source
        chmod -R u+w source
        cd source
        cp -R ${dependencies}/node_modules .
        chmod -R u+w node_modules
        patchShebangs node_modules
        bun run ci
        touch "$out"
      '';
  };
}
