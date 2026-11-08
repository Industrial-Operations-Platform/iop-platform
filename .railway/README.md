# Railway infrastructure

The current installation is development, deployed from the develop branch to the
IOP-development project and development environment. There is no production
installation; a future production app belongs in a separate Railway workspace
with independent data and credentials.

railway.ts defines the two IOP services, forward migrations, resource limits and persistent volumes.
Service variables are unmanaged: secrets stay in Railway and private ignored files.

Use npm run railway -- config plan to review changes.
Use npm run railway:deploy to validate and publish the current committed revision.
The deploy command refuses destructive infrastructure changes. Never move or delete a data volume as part of an ordinary code release.

Only railway.ts and this README are committed from this directory.
target.json, variable files, SSH material, snapshots and transfer records remain private.

See docs/development/railway.md for setup, initial data transfer, backups and recovery.
