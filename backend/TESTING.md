# Safe backend test execution

The integration suites reset their database with `sequelize.sync({ force: true })`.
They must only run against a separately provisioned, disposable PostgreSQL database.
The migration test also alters schemas and drops every object in its target schema at
the end. This guard does not provision a database and is not a substitute for an
operator independently verifying the target.

## Required disposable database contract

Before a destructive integration or migration test can connect, configure these
database values in the process environment or the ignored `backend/.env.test` file:

```text
DB_HOST=<PostgreSQL server IP address>
DB_PORT=<PostgreSQL port>
DB_NAME=<dedicated disposable database name>
DB_USER=<dedicated disposable database role>
DB_PASSWORD=<role password>

TEST_DB_EXPECTED_HOST=<same server IP address>
TEST_DB_EXPECTED_PORT=<same port>
TEST_DB_EXPECTED_NAME=<same disposable database name>
TEST_DB_EXPECTED_ROLE=<same disposable database role>
TEST_DB_EXPECTED_MARKER=<exact database comment marker>
```

Set `ALLOW_DESTRUCTIVE_TEST_DB=true` explicitly for the command that runs a
destructive suite. Do not add this opt-in to a shared shell profile.

The database must already exist on an isolated test-only PostgreSQL instance. An
operator must set the PostgreSQL database comment to the exact
`TEST_DB_EXPECTED_MARKER` value during provisioning, then independently verify the
connected database name, server IP and port, current role, and comment before
allowing the destructive command. A name containing `test` does not satisfy the
guard.

Provision the marker using a database-owner or administrator session, after the
database identity has been confirmed. The database identifier must be the specific
disposable database being provisioned, and the marker must be the exact configured
value:

```sql
COMMENT ON DATABASE "<dedicated disposable database name>"
  IS '<exact TEST_DB_EXPECTED_MARKER value>';
```

From a connection made with the dedicated test role, verify the contract before
running Jest. Do not use this query as a substitute for confirming the server is the
isolated test instance:

```sql
SELECT current_database(), inet_server_addr()::text, inet_server_port(),
       current_user,
       shobj_description(d.oid, 'pg_database') AS database_marker
FROM pg_database d
WHERE d.datname = current_database();
```

The application keeps dotenv's existing behavior: values already present in the
environment override `.env.test`. The guard compares the configured `DB_*` values
with the `TEST_DB_EXPECTED_*` contract and then checks PostgreSQL's connection-local
identity values, so inherited database settings cause a failure unless they match.

For destructive integration suites, also configure:

```text
TEST_FILE_STORAGE_PARENT=<existing absolute directory reserved for test artifacts>
```

`TEST_FILE_STORAGE_PARENT` must already exist, be an absolute path, and be separate
from `backend/uploads` after canonical path resolution. Symlinks and junctions that
resolve into `backend/uploads` are rejected. Jest creates a unique child directory
there, records its filesystem identity and a per-run marker, sets `FILE_STORAGE_DIR`
before server modules load, and removes only that verified child after the suite. If
ownership verification fails, cleanup refuses to delete anything; remove the
leftover directory manually only after confirming it is the generated test directory.
The symlink and junction assertions have conditional coverage on Windows: hosts
without the required link-creation privilege skip those fixtures, while production
path validation still rejects links when they are present.

Set `TEST_FILE_STORAGE_PARENT` only for destructive integration suites; migration
testing does not create application uploads.

## Jest version and suite mapping

The backend declares and has installed Jest `19.0.2`. The npm scripts use JSON
configuration files because Jest 19 parses `--config` file paths as JSON.
Configuration uses Jest 19 options only (`testRegex`, `testPathIgnorePatterns`,
`setupTestFrameworkScriptFile`). Do not use `testMatch`, `setupFilesAfterEnv`, or
`--runTestsByPath` with this runner.

| Command | Config file | Files selected | Loads `src/tests/setup.js` |
|---|---|---|---|
| `npm test` | `jest.config.json` | `src/tests/**/*.test.js` except safety helpers and `file-storage.test.js` | Yes, before destructive `sync({ force: true })` |
| `npm run test:watch` | `jest.config.json` | Same as `npm test` | Yes |
| `npm run test:safety` | `jest.safety.config.json` | `src/tests/safety/*.test.js` only | No |
| `npm run test:storage` | `jest.storage.config.json` | `src/tests/integration/file-storage.test.js` only | No |
| `npm run migrate:test` | none (Node script) | `src/database/migration-test.js` | No |

`package.json`'s `jest` block mirrors `jest.config.json`, including the ignore list,
so a bare `jest` invocation still keeps safety and file-storage tests off the
destructive setup. Dedicated `--config` files do not set
`setupTestFrameworkScriptFile`.

`npm test` and `npm run test:watch` still require the disposable-database contract
and `TEST_FILE_STORAGE_PARENT`. They include authorization and other integration
suites under `src/tests/integration/`, not only
`backend-authorization-mutations.test.js`.

## Commands for a future operator

Safety-helper and file-storage suites do not use PostgreSQL or shared Jest setup:

```powershell
Set-Location 'C:\Users\hp\Desktop\Fil Rouge\backend'
npm run test:safety
npm run test:storage
```

Do not run the following commands until the isolated database and its marker have
been provisioned and independently verified.

```powershell
Set-Location 'C:\Users\hp\Desktop\Fil Rouge\backend'
$env:ALLOW_DESTRUCTIVE_TEST_DB = 'true'
npm test
```

To limit a destructive Jest run to the authorization mutation suite after the
guarded setup has loaded:

```powershell
Set-Location 'C:\Users\hp\Desktop\Fil Rouge\backend'
$env:ALLOW_DESTRUCTIVE_TEST_DB = 'true'
npm test -- --testPathPattern=backend-authorization-mutations
```

Run migration testing separately and only against a distinct disposable target that
satisfies the same guard contract:

```powershell
Set-Location 'C:\Users\hp\Desktop\Fil Rouge\backend'
$env:ALLOW_DESTRUCTIVE_TEST_DB = 'true'
npm run migrate:test
```

`npm run migrate:status` is read-only. When `schema_migrations` does not exist, it
reports every migration as pending and does not create the tracking table.
