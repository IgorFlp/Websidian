## ADDED Requirements

### Requirement: Domain Error Classes
The system SHALL define domain error classes in `src/domain/errors/` extending `Error` with `code: string` and `statusCode: number` properties.

#### Scenario: NotFoundError has 404 status
- **WHEN** `throw new NotFoundError('Preset')`
- **THEN** error has `statusCode === 404` and `code === 'NOT_FOUND'`

#### Scenario: ValidationError carries Zod issues
- **WHEN** `throw new ValidationError(zodError.issues)`
- **THEN** error has `statusCode === 400`, `code === 'VALIDATION_ERROR'`, and `issues` array

#### Scenario: UnauthorizedError has 401 status
- **WHEN** `throw new UnauthorizedError()`
- **THEN** error has `statusCode === 401` and `code === 'UNAUTHORIZED'`

#### Scenario: InternalError defaults to 500
- **WHEN** `throw new InternalError(cause)`
- **THEN** error has `statusCode === 500` and `code === 'INTERNAL_ERROR'`

### Requirement: HTTP Translation at Route Boundary
Domain errors SHALL be caught in route handlers and translated to HTTP responses with appropriate status codes and JSON bodies.

#### Scenario: NotFoundError → 404 JSON
- **WHEN** service throws `NotFoundError('File')`
- **THEN** route responds 404 with `{ error: "File not found" }`

#### Scenario: ValidationError → 400 JSON with issues
- **WHEN** service throws `ValidationError(issues)`
- **THEN** route responds 400 with `{ error: "Validation error", issues }`

#### Scenario: UnauthorizedError → 401 JSON
- **WHEN** auth middleware throws `UnauthorizedError()`
- **THEN** route responds 401 with `{ error: "unauthorized" }`

#### Scenario: Unknown error → 500 JSON
- **WHEN** unexpected error thrown
- **THEN** route responds 500 with `{ error: "Internal server error" }`

### Requirement: Services Throw Only Domain Errors
Service layer SHALL throw only `DomainError` subclasses — never raw `Error`, strings, or HTTP-specific constructs.

#### Scenario: Service throws typed errors
- **WHEN** service encounters business rule violation
- **THEN** throws `NotFoundError`, `ValidationError`, or `ForbiddenError`

#### Scenario: Service never accesses HTTP objects
- **WHEN** inspecting service code
- **THEN** no references to `Request`, `Response`, `statusCode`, or Express types