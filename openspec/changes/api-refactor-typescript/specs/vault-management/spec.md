## ADDED Requirements

### Requirement: List Configured Vaults
The system SHALL return array of vault objects from `VAULT_PATH` environment variable (comma-separated paths).

#### Scenario: Single vault returns array with one entry
- **WHEN** `VAULT_PATH=/vault` and GET `/vaults`
- **THEN** response 200 with `[{ id: 0, name: "vault", fullPath: "/vault" }]`

#### Scenario: Multiple vaults returns array with multiple entries
- **WHEN** `VAULT_PATH=/vault1,/vault2` and GET `/vaults`
- **THEN** response 200 with two entries, id 0 and 1

### Requirement: Vault Index Parameter
File/content/download endpoints SHALL accept optional `vault` query parameter (integer, default 0) to select vault.

#### Scenario: Default vault index 0
- **WHEN** GET `/api/files` without vault param
- **THEN** uses first vault path

#### Scenario: Explicit vault index
- **WHEN** GET `/api/files?vault=1` with multiple vaults
- **THEN** uses second vault path