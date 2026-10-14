{inputs, ...}: {
  imports = [inputs.treefmt-nix.flakeModule];

  perSystem = {
    # keep-sorted start
    lib,
    pkgs,
    # keep-sorted end
    ...
  }: let
    inherit (lib) getExe;
  in {
    treefmt = {
      projectRootFile = "flake.nix";
      settings.global.excludes = ["node_modules/**" ".test-output/**" "tests/fixtures/**"];

      programs = {
        alejandra.enable = true;
        deadnix.enable = true;
        statix.enable = true;
        yamlfmt.enable = true;
      };

      settings.formatter.oxfmt = {
        command = getExe pkgs.oxfmt;
        options = ["--write"];
        includes = ["*.css" "*.json" "*.less" "*.md" "*.toml" "*.ts"];
      };
    };
  };
}
