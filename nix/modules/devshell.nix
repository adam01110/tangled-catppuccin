{
  perSystem = {
    # keep-sorted start
    lib,
    pkgs,
    # keep-sorted end
    ...
  }: let
    inherit (lib) getExe;
    inherit (pkgs) mkShell;
  in {
    devShells.default = mkShell {
      packages = with pkgs; [
        # keep-sorted start
        bun
        chromium
        # keep-sorted end
      ];
      CHROMIUM_PATH = getExe pkgs.chromium;
    };
  };
}
