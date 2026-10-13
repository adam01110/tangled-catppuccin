{
  perSystem = {pkgs, ...}: {
    devShells.default = pkgs.mkShell {
      packages = [pkgs.bun pkgs.chromium];
      CHROMIUM_PATH = "${pkgs.chromium}/bin/chromium";
    };
  };
}
