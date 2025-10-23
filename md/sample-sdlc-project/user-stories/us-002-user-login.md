# US-002: User Login

## Story Information
- **Story ID**: US-002
- **Title**: User Login
- **Epic**: Customer Registration & Authentication
- **Status**: Ready
- **Story Points**: 3
- **Sprint**: Sprint 1
- **Priority**: High
- **Author**: Jane Smith
- **Last Updated**: 2024-02-08

## User Story
**As a** registered customer  
**I want to** log into my account  
**So that** I can access my profile and order history

## Acceptance Criteria
- [ ] User can access login form from any page
- [ ] Login requires valid email and password
- [ ] Failed login attempts are limited to 5 per hour
- [ ] Successful login redirects to user dashboard
- [ ] User session persists across browser sessions
- [ ] User can log out from any page

## Detailed Requirements

### Form Fields
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Email | Text | Yes | Valid email format |
| Password | Password | Yes | Must match stored hash |

### Business Rules
- Session timeout after 24 hours of inactivity
- JWT tokens with 15-minute expiration for security
- Refresh tokens for seamless session renewal
- Account lockout after 5 failed attempts (temporary, 1 hour)

### Success Flow
1. User enters valid email and password
2. System validates credentials against database
3. System creates JWT access token and refresh token
4. User is redirected to dashboard
5. Session is established and persisted

### Error Handling
- Display "Invalid credentials" for failed login
- Show remaining attempts before lockout
- Handle expired sessions gracefully
- Provide password reset option

## Technical Considerations

### Frontend
- Login form with validation
- Session management with secure token storage
- Auto-logout on token expiration
- Protected route handling

### Backend
- API endpoint: `POST /auth/login`
- Password verification using bcrypt
- JWT token generation and validation
- Rate limiting for login attempts

### Security
- HTTPS enforcement for all authentication
- Secure cookie settings for tokens
- CSRF protection
- XSS prevention

## Dependencies
- JWT library for token management
- Frontend routing and state management
- Backend authentication middleware
- Database user table

## Test Scenarios

### Happy Path
- User logs in with correct credentials
- Session is created successfully
- User can access protected routes

### Edge Cases
- User enters incorrect password multiple times
- Session token expires during use
- Network failure during login
- User tries to access protected route without login
