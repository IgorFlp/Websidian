## ADDED Requirements

### Requirement: OpenAPI 3.1 Generation from Zod Schemas via fastify-swagger
The system SHALL generate OpenAPI 3.1 specification at startup from Zod schemas registered in Fastify routes via `fastify-swagger` plugin.

#### Scenario: Generated spec includes all endpoints
- **WHEN** generating OpenAPI document
- **THEN** all 30+ endpoints from original swagger.yaml appear in paths

#### Scenario: Components match Zod schemas
- **WHEN** inspecting `components.schemas`
- **THEN** each Zod schema used in route definitions appears as component

#### Scenario: Security scheme preserved
- **WHEN** inspecting `components.securitySchemes`
- **THEN** `sessionAuth` (apiKey in cookie `connect.sid`) is present

### Requirement: Swagger.json Endpoint
The system SHALL serve generated OpenAPI spec at `GET /swagger.json` with `Content-Type: application/json` via `fastify-swagger`.

#### Scenario: Swagger.json returns valid OpenAPI
- **WHEN** requesting `GET /swagger.json`
- **THEN** response 200 with valid OpenAPI 3.1 JSON

#### Scenario: Spec updates on schema changes
- **WHEN** Zod schema modified and server restarted (dev)
- **THEN** `/swagger.json` reflects changes

### Requirement: Swagger UI at /api-docs
The system SHALL serve Swagger UI at `GET /api-docs` loading spec from `/swagger.json` via `@fastify/swagger-ui`.

#### Scenario: Swagger UI loads
- **WHEN** navigating to `/api-docs`
- **THEN** Swagger UI renders with all endpoints explorable

#### Scenario: Try it out works
- **WHEN** using "Try it out" in Swagger UI
- **THEN** requests execute against running API

### Requirement: OpenAPI Metadata Completeness
All Zod schemas SHALL include `.openapi({ description, examples, ... })` for rich documentation consumed by fastify-swagger.

#### Scenario: Request schemas have examples
- **WHEN** viewing Swagger UI request body
- **THEN** example values shown for all fields

#### Scenario: Response schemas have descriptions
- **WHEN** viewing Swagger UI responses
- **THEN** each response code has description and schema