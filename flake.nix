{
  description = "Node.js development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};

        pg_start = pkgs.writeShellScriptBin "pg_start" ''
          pg_ctl -l "$PGHOST/postgres.log" -o "-p $PGPORT -k $PGHOST" start
          if ! psql -lqt | cut -d \| -f 1 | grep -qw "$PGDATABASE"; then
            createdb "$PGDATABASE"
          fi
        '';

        pg_stop = pkgs.writeShellScriptBin "pg_stop" ''
          pg_ctl stop
        '';
      in {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            svelte-language-server
            nodejs_22
            nixd
            alejandra
            postgresql_16
            pg_start
            pg_stop
          ];

          shellHook = ''
            export PGDATA="$PWD/.postgres/data"
            export PGHOST="$PWD/.postgres"
            export PGPORT=5433
            export PGDATABASE=neon_chess
            export PGUSER=neon_chess
            export DATABASE_URL="postgresql://$PGUSER@localhost:$PGPORT/$PGDATABASE?host=$PGHOST"

            if [ ! -d "$PGDATA" ]; then
              echo "Initializing PostgreSQL cluster in $PGDATA"
              mkdir -p "$PGDATA"
              initdb --auth=trust --username="$PGUSER" --encoding=UTF8 >/dev/null
              cat >> "$PGDATA/postgresql.conf" <<EOF
            listen_addresses = 'localhost'
            unix_socket_directories = '$PGHOST'
            EOF
            fi

            echo "Postgres available. Run 'pg_start' to start, 'pg_stop' to stop."
            echo "Connect with: psql"
            echo "DATABASE_URL=$DATABASE_URL"
          '';
        };
      });
}
