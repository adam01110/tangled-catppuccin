{inputs, ...}: {
  imports = [inputs.treefmt-nix.flakeModule];

  perSystem = {pkgs, ...}: {
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
        command = "${pkgs.oxfmt}/bin/oxfmt";
        options = ["--write"];
        includes = ["*.css" "*.json" "*.less" "*.md" "*.toml" "*.ts"];
      };
    };
  };
}
