# KONSol

The backend of the KONSol screen written in express. Also contains a React-client to interact with the database and upload slides to the screen.

## Run with docker-compose

To run this project, a file `/.env` needs to be made according to the template in `/.env_template`. A `service_account_auth_file.json` also needs to be created at the path specified in `.env`.

To run with docker compose, run `docker compose up` in the root directory of the repository. This will build and start a container with the backend and client, and another contaner with the mongodb database.

To stop and remove the containers, run `docker compose down --rmi local`. If `--rmi local` is omitted, the backend image will not be removed and will be reused next time the container starts.