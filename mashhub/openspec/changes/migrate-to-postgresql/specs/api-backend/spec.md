## ADDED Requirements

### Requirement: Express.js Backend Server
The system SHALL provide a Node.js/Express backend API server that handles all database operations and serves data to the frontend.

#### Scenario: Server starts successfully
- **WHEN** the backend server is started with `npm run dev`
- **THEN** the Express server listens on the configured port (default 3001)
- **AND** the server logs startup confirmation
- **AND** the database connection is established

#### Scenario: Server handles errors gracefully
- **WHEN** an unhandled error occurs in the server
- **THEN** the error is caught by error handling middleware
- **AND** an appropriate HTTP error response is returned
- **AND** error details are logged for debugging

### Requirement: RESTful API Endpoints
The system SHALL provide RESTful API endpoints for songs, following standard HTTP methods and status codes.

#### Scenario: Get all songs
- **WHEN** a GET request is made to `/api/songs`
- **THEN** all songs are returned with their associated sections
- **AND** sections are ordered by sectionOrder
- **AND** the response includes proper JSON formatting
- **AND** HTTP status 200 is returned

#### Scenario: Get song by ID
- **WHEN** a GET request is made to `/api/songs/:id`
- **THEN** the song with matching ID is returned with sections
- **AND** if the song does not exist, HTTP status 404 is returned
- **AND** the response includes all song metadata

#### Scenario: Create new song
- **WHEN** a POST request is made to `/api/songs` with valid song data
- **THEN** a new song is created in the database
- **AND** associated sections are created if provided
- **AND** HTTP status 201 is returned with the created song
- **AND** the response includes the generated song ID

#### Scenario: Update existing song
- **WHEN** a PUT request is made to `/api/songs/:id` with updated data
- **THEN** the song is updated in the database
- **AND** HTTP status 200 is returned with the updated song
- **AND** if the song does not exist, HTTP status 404 is returned

#### Scenario: Delete song
- **WHEN** a DELETE request is made to `/api/songs/:id`
- **THEN** the song is deleted from the database
- **AND** associated sections are cascade deleted
- **AND** HTTP status 204 (No Content) is returned
- **AND** if the song does not exist, HTTP status 404 is returned

### Requirement: API Request Validation
The system SHALL validate all API requests using Zod schemas to ensure data integrity and type safety.

#### Scenario: Invalid request data rejected
- **WHEN** a POST or PUT request contains invalid or missing required fields
- **THEN** HTTP status 400 (Bad Request) is returned
- **AND** error details describe the validation failures
- **AND** no database changes are made

#### Scenario: Type validation enforced
- **WHEN** request data contains incorrect types (e.g., string instead of number)
- **THEN** validation fails with appropriate error messages
- **AND** the request is rejected before database access

### Requirement: CORS Configuration
The system SHALL enable Cross-Origin Resource Sharing (CORS) to allow frontend requests from different origins.

#### Scenario: Frontend can access API
- **WHEN** a request is made from the frontend application
- **THEN** CORS headers are included in the response
- **AND** the request is allowed regardless of origin (development)
- **AND** appropriate CORS headers are set

### Requirement: Health Check Endpoint
The system SHALL provide a health check endpoint to verify server and database connectivity.

#### Scenario: Health check returns status
- **WHEN** a GET request is made to `/health`
- **THEN** HTTP status 200 is returned
- **AND** the response includes server status and timestamp
- **AND** the response format is: `{ status: "ok", timestamp: "ISO8601" }`

### Requirement: API Error Handling
The system SHALL provide consistent error responses with appropriate HTTP status codes and error messages.

#### Scenario: Database error handling
- **WHEN** a database operation fails
- **THEN** HTTP status 500 is returned
- **AND** a generic error message is returned to the client
- **AND** detailed error information is logged server-side

#### Scenario: Not found error handling
- **WHEN** a resource is requested that does not exist
- **THEN** HTTP status 404 is returned
- **AND** an appropriate error message is included in the response

### Requirement: Service Layer Architecture
The system SHALL use a service layer pattern to separate business logic from HTTP request handling.

#### Scenario: Controller delegates to service
- **WHEN** a controller method is called
- **THEN** it delegates business logic to the corresponding service method
- **AND** the controller handles only HTTP-specific concerns (status codes, request/response)
- **AND** the service handles database operations and business rules

#### Scenario: Service methods are reusable
- **WHEN** business logic is needed in multiple contexts
- **THEN** service methods can be called directly without HTTP layer
- **AND** service methods are testable in isolation
