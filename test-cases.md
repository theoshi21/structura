# Structura — Test Case Document

---

## Part 1: Traceability Matrix

| Requirement ID | Requirement Description | Test Case ID(s) |
|---|---|---|
| UF1 | Create user accounts with hashed passwords | UTC1.1, UTC1.2, UTC1.3 |
| UF2 | User login with valid credentials | UTC2.1, UTC2.2 |
| UF3 | User logout functionality | UTC3.1 |
| UF4 | Prevent unauthenticated access to platform features | UTC4.1 |
| UF5 | Display error messages for invalid login attempts | UTC2.2 |
| RF1 | Assign exactly one role per user | RTC1.1 |
| RF2 | Update user roles by Admin | RTC2.1, RTC2.2 |
| RF3 | Enforce role-based permissions for all actions | RTC3.1, RTC3.2, RTC3.3 |
| RF4 | Deny unauthorized actions and display an appropriate message | RTC4.1 |
| RF5 | Display features and navigation based on the user's role | RTC5.1 |
| EF1 | Create event proposals | ETC1.1, ETC1.2 |
| EF2 | Update event proposals | ETC2.1 |
| EF3 | View event details with associated documents, checklists, and budget | ETC3.1 |
| EF4 | Delete event proposals | ETC4.1 |
| EF5 | Change event status | ETC5.1, ETC5.2 |
| DF1 | Upload documents and link to events | DTC1.1, DTC1.2 |
| DF2 | View all documents associated with an event | DTC2.1 |
| DF3 | Support document types | DTC3.1 |
| DF4 | Delete documents | DTC4.1 |
| DF5 | Validate file format and size on upload | DTC5.1, DTC5.2 |
| CF1 | Create checklist templates | CTC1.1 |
| CF2 | Apply checklist templates to events | CTC2.1 |
| CF3 | Create custom checklists for events | CTC3.1 |
| CF4 | Add, modify, or remove checklist items | CTC4.1, CTC4.2 |
| CF5 | Mark checklist items as complete | CTC5.1 |
| CF6 | Calculate and display completion percentage | CTC6.1 |
| BF1 | Maintain organizational budget with total available funds | BTC1.1 |
| BF2 | Allocate funds to events | BTC2.1, BTC2.2 |
| BF3 | Record expenditures against events | BTC3.1, BTC3.2 |
| BF4 | Display allocated budget, total expenditures, and remaining funds | BTC4.1 |
| BF5 | Prevent over-allocation of funds | BTC5.1 |
| BF6 | Require financial document for each expenditure | BTC6.1 |
| AF1 | Record user ID, action type, and timestamp for critical operations | ATC1.1 |
| AF2 | Display audit logs for budget allocations, expenditures, and status changes | ATC2.1 |
| AF3 | Prevent modification or deletion of audit log entries | ATC3.1 |
| AF4 | Maintain audit logs for role changes and user management actions | ATC4.1 |
| AF5 | Display last modified timestamp and user for events and budget records | ATC5.1 |

---

## Part 2: Test Cases


### User Authentication Module

---

**UTC1.1 Successful User Registration (User Authentication)**

Description: Verifies that a new user can register with valid credentials and that the account is created successfully.

Test Inputs:
- Email: "newuser@example.com"
- Username: "newuser"
- Password: "securepass123"
- Role: "organizer"

Expected Results: A new user account is created and returned. The returned user object contains the provided email, username, and role. The password is not exposed in the response. No exception is thrown.

Dependencies: None

Initialization: The database is empty. No user with the given email or username exists.

Test Steps:
1. Submit a registration request with the inputs above via POST /api/auth/register.
2. Verify that the response status is 201 Created.
3. Verify that the response body contains `success: true`.
4. Verify that the returned user object has the correct email, username, and role.
5. Verify that no `password` or `password_hash` field is present in the response.

---

**UTC1.2 Registration Rejected for Duplicate Email (User Authentication)**

Description: Verifies that the system rejects a registration attempt when the email address is already in use.

Test Inputs:
- Email: "newuser@example.com" (same email used in UTC1.1)
- Username: "differentuser"
- Password: "securepass123"
- Role: "organizer"

Expected Results: The registration is rejected with a 409 Conflict response. An error message indicating the email already exists is returned. No new user account is created.

Dependencies: UTC1.1 (the user registered in UTC1.1 is already in the system — reuse the same email)

Initialization: UTC1.1 has already been executed. The email "newuser@example.com" exists in the system.

Test Steps:
1. Submit a registration request with the same email from UTC1.1 but a different username via POST /api/auth/register.
2. Verify that the response status is 409 Conflict.
3. Verify that the response body contains `success: false`.
4. Verify that the error message contains "already exists".

---

**UTC1.3 Registration Rejected for Short Password (User Authentication)**

Description: Verifies that the system rejects a registration attempt when the password is fewer than 8 characters.

Test Inputs:
- Email: "shortpass@example.com"
- Username: "shortpassuser"
- Password: "abc123" (6 characters)
- Role: "organizer"

Expected Results: The registration is rejected with a 400 Bad Request response. An error message indicating the password must be at least 8 characters is returned. No user account is created.

Dependencies: None

Initialization: No user with the given email or username exists.

Test Steps:
1. Submit a registration request with the inputs above via POST /api/auth/register.
2. Verify that the response status is 400 Bad Request.
3. Verify that the response body contains `success: false`.
4. Verify that the error message references the password length requirement.

---

**UTC2.1 Successful Login with Valid Credentials (User Authentication)**

Description: Verifies that a registered user can log in with correct credentials and receive a valid session.

Test Inputs:
- Email: "newuser@example.com" (same email from UTC1.1)
- Password: "securepass123" (same password from UTC1.1)

Expected Results: Login succeeds. A session is created containing the user's ID and role. The session expiry timestamp is greater than the creation timestamp. No exception is thrown.

Dependencies: UTC1.1 (the user registered in UTC1.1 is already in the system — reuse the same credentials)

Initialization: UTC1.1 has already been executed. The user "newuser@example.com" exists with password "securepass123".

Test Steps:
1. Submit a login request with the email and password from UTC1.1 via POST /api/auth/login.
2. Verify that the response status is 200 OK.
3. Verify that the response body contains `success: true`.
4. Verify that the returned session data includes `userId` and `role`.
5. Verify that `expiresAt` is greater than `createdAt`.

---

**UTC2.2 Login Rejected for Invalid Password (User Authentication)**

Description: Verifies that the system rejects a login attempt when the password is incorrect and displays an appropriate error message.

Test Inputs:
- Email: "newuser@example.com" (same email from UTC1.1)
- Password: "wrongpassword" (intentionally incorrect)

Expected Results: Login is rejected with a 401 Unauthorized response. An error message indicating invalid credentials is returned. No session is created.

Dependencies: UTC1.1 (the user registered in UTC1.1 is already in the system — reuse the same email)

Initialization: UTC1.1 has already been executed. The user "newuser@example.com" exists with password "securepass123".

Test Steps:
1. Submit a login request with the email from UTC1.1 but with "wrongpassword" via POST /api/auth/login.
2. Verify that the response status is 401 Unauthorized.
3. Verify that the response body contains `success: false`.
4. Verify that the error message is "Invalid email or password" or equivalent.

---

**UTC3.1 Successful Logout (User Authentication)**

Description: Verifies that a logged-in user can log out and that their session is destroyed.

Test Inputs: None

Expected Results: Logout succeeds. The session is destroyed. A subsequent request to a protected route returns 401 Unauthorized. No exception is thrown.

Dependencies: UTC2.1 (the user must be logged in)

Initialization: A user is currently authenticated with an active session.

Test Steps:
1. Submit a logout request via POST /api/auth/logout.
2. Verify that the response status is 200 OK.
3. Verify that the response body contains `success: true`.
4. Submit a request to GET /api/auth/me using the same session.
5. Verify that the response status is 401 Unauthorized.

---

**UTC4.1 Unauthenticated Access Denied (User Authentication)**

Description: Verifies that the system prevents access to protected routes when no session exists.

Test Inputs: None (no session cookie)

Expected Results: The request is rejected with a 401 Unauthorized response. No data is returned. No exception is thrown.

Dependencies: None

Initialization: No active session exists in the system.

Test Steps:
1. Submit a GET request to /api/events without any session cookie.
2. Verify that the response status is 401 Unauthorized.
3. Verify that the response body contains `success: false` and an appropriate error message.


---

### Role-Based Access Control Module

---

**RTC1.1 Every Registered User Has Exactly One Role (Role-Based Access Control)**

Description: Verifies that every user account created in the system is assigned exactly one role from the valid set (organizer, officer, admin).

Test Inputs:
- User A: role "organizer"
- User B: role "officer"
- User C: role "admin"

Expected Results: Each user is created with exactly one role. The role field is a single string value, not an array. Each role value is one of: "organizer", "officer", "admin". No exception is thrown.

Dependencies: None

Initialization: The database is empty.

Test Steps:
1. Register User A with role "organizer" via the registration form or console:
```js
fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'usera@example.com', username: 'usera', password: 'password123', role: 'organizer' })
}).then(r => r.json()).then(console.log)
```
2. Register User B with role "officer":
```js
fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'userb@example.com', username: 'userb', password: 'password123', role: 'officer' })
}).then(r => r.json()).then(console.log)
```
3. Register User C with role "admin" (requires access code):
```js
fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'userc@example.com', username: 'userc', password: 'password123', role: 'admin', accessCode: 'ACCESS_CODE_HERE' })
}).then(r => r.json()).then(console.log)
```
4. Log in as admin and retrieve all users — verify each has exactly one `role` field:
```js
fetch('/api/users').then(r => r.json()).then(console.log)
```
5. Verify that each role value in the response is one of: "organizer", "officer", "admin".
6. Verify that no user object has an array for the `role` field.

---

**RTC2.1 Admin Successfully Updates a User's Role (Role-Based Access Control)**

Description: Verifies that an Admin can change another user's role and that the change takes effect immediately.

Test Inputs:
- Target user ID: (ID of an existing organizer)
- New role: "officer"

Expected Results: The user's role is updated to "officer". The updated user object is returned with the new role. A subsequent retrieval of the user reflects the new role. No exception is thrown.

Dependencies: UTC1.1 (an organizer user must exist), UTC2.1 (admin must be logged in)

Initialization: An admin user is authenticated. An organizer user exists in the system.

Test Steps:
1. Log in as admin via the sign-in page.
2. Submit a PATCH request to update the target user's role — verify 200 OK:
```js
fetch('/api/users/{USER_ID}/role', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ role: 'officer' })
}).then(r => r.json()).then(console.log)
```
3. Verify that the returned user object has `role: "officer"`.
4. Retrieve the full user list and confirm the change persisted:
```js
fetch('/api/users').then(r => r.json()).then(console.log)
```
5. Verify that the target user's role in the list is "officer".

---

**RTC2.2 Non-Admin Cannot Update a User's Role (Role-Based Access Control)**

Description: Verifies that a non-admin user (organizer or officer) cannot update another user's role.

Test Inputs:
- Target user ID: (ID of any existing user)
- New role: "admin"
- Requesting user role: "organizer"

Expected Results: The role update is rejected with a 403 Forbidden response. The target user's role remains unchanged. An appropriate error message is returned.

Dependencies: UTC1.1 (both users must exist), UTC2.1 (organizer must be logged in)

Initialization: An organizer user is authenticated. Another user exists in the system.

Test Steps:
1. Log in as an organizer via the sign-in page.
2. Attempt to update a user's role — verify 403 Forbidden:
```js
fetch('/api/users/{USER_ID}/role', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ role: 'admin' })
}).then(r => r.json()).then(console.log)
```
3. Verify that the response body contains `success: false` and an error message indicating insufficient permissions.
4. Retrieve the target user and confirm their role has not changed:
```js
fetch('/api/users').then(r => r.json()).then(console.log)
```

---

**RTC3.1 Organizer Permissions Are Correctly Enforced (Role-Based Access Control)**

Description: Verifies that an organizer can perform permitted actions and is denied actions outside their role.

Test Inputs: Organizer user session

Expected Results: The organizer can create events and view the budget. The organizer cannot allocate funds, delete events, or manage users. Denied actions return 403 Forbidden.

Dependencies: UTC2.1 (organizer must be logged in)

Initialization: An organizer user is authenticated.

Test Steps:
1. Submit a POST request to /api/events — verify 201 Created:
```js
fetch('/api/events', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Test Event', eventDate: '2026-12-01' })
}).then(r => r.json()).then(console.log)
```
2. Submit a GET request to /api/budget — verify 200 OK:
```js
fetch('/api/budget').then(r => r.json()).then(console.log)
```
3. Submit a POST request to /api/budget/allocations — verify 403 Forbidden:
```js
fetch('/api/budget/allocations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ eventId: 'any-id', organizationId: 'any-id', amount: 1000 })
}).then(r => r.json()).then(console.log)
```
4. Submit a DELETE request to /api/events/{id} — verify 403 Forbidden (use the event ID from step 1):
```js
fetch('/api/events/{EVENT_ID}', {
  method: 'DELETE'
}).then(r => r.json()).then(console.log)
```
5. Submit a GET request to /api/users — verify 403 Forbidden:
```js
fetch('/api/users').then(r => r.json()).then(console.log)
```

---

**RTC3.2 Officer Permissions Are Correctly Enforced (Role-Based Access Control)**

Description: Verifies that an officer can perform their permitted actions and is denied admin-only actions.

Test Inputs: Officer user session

Expected Results: The officer can create events, upload documents, and record expenditures. The officer cannot allocate funds or manage users. Denied actions return 403 Forbidden.

Dependencies: UTC2.1 (officer must be logged in)

Initialization: An officer user is authenticated. An event with an allocation exists.

Test Steps:
1. Submit a POST request to /api/events — verify 201 Created:
```js
fetch('/api/events', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Officer Test Event', eventDate: '2026-12-01' })
}).then(r => r.json()).then(console.log)
```
2. Submit a GET request to /api/budget — verify 200 OK:
```js
fetch('/api/budget').then(r => r.json()).then(console.log)
```
3. Submit a POST request to record an expenditure — verify 201 Created:
```js
fetch('/api/budget/expenditures', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ eventId: '{EVENT_ID}', amount: 500, description: 'Test expense', documentId: '{DOCUMENT_ID}' })
}).then(r => r.json()).then(console.log)
```
4. Submit a POST request to /api/budget/allocations — verify 403 Forbidden:
```js
fetch('/api/budget/allocations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ eventId: 'any-id', organizationId: 'any-id', amount: 1000 })
}).then(r => r.json()).then(console.log)
```
5. Submit a POST request to upload a document — verify 403 Forbidden:
```js
const form = new FormData()
form.append('documentType', 'permit')
fetch('/api/events/{EVENT_ID}/documents', {
  method: 'POST',
  body: form
}).then(r => r.json()).then(console.log)
```

---

**RTC3.3 Admin Has Full System Access (Role-Based Access Control)**

Description: Verifies that an admin can perform all system operations without restriction.

Test Inputs: Admin user session

Expected Results: The admin can allocate funds, manage users, approve events, and view the audit trail. All requests return success responses. No 403 Forbidden responses are returned.

Dependencies: UTC2.1 (admin must be logged in)

Initialization: An admin user is authenticated. At least one event and one user exist in the system.

Test Steps:
1. Submit a POST request to allocate funds — verify 201 Created:
```js
fetch('/api/budget/allocations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ eventId: '{EVENT_ID}', organizationId: '{ORG_ID}', amount: 5000 })
}).then(r => r.json()).then(console.log)
```
2. Submit a PATCH request to update a user's role — verify 200 OK:
```js
fetch('/api/users/{USER_ID}/role', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ role: 'officer' })
}).then(r => r.json()).then(console.log)
```
3. Submit a PATCH request to approve an event — verify 200 OK:
```js
fetch('/api/events/{EVENT_ID}', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status: 'approved' })
}).then(r => r.json()).then(console.log)
```
4. Submit a GET request to view the audit trail — verify 200 OK:
```js
fetch('/api/audit').then(r => r.json()).then(console.log)
```

---

**RTC4.1 Unauthorized Action Returns Appropriate Error Message (Role-Based Access Control)**

Description: Verifies that when a user attempts an action not permitted by their role, the system returns a clear error message.

Test Inputs: Organizer user session, POST /api/budget/allocations

Expected Results: The response status is 403 Forbidden. The response body contains `success: false` and an error message indicating insufficient permissions.

Dependencies: UTC2.1 (organizer must be logged in)

Initialization: An organizer user is authenticated.

Test Steps:
1. Log in as an organizer via the sign-in page.
2. Submit a POST request to /api/budget/allocations — verify 403 Forbidden:
```js
fetch('/api/budget/allocations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ eventId: 'any-id', organizationId: 'any-id', amount: 1000 })
}).then(r => r.json()).then(console.log)
```
3. Verify that the response body contains `success: false`.
4. Verify that the error message clearly indicates the action is not permitted (e.g., "Insufficient permissions" or "Admin access required").

---

**RTC5.1 Navigation Reflects User Role (Role-Based Access Control)**

Description: Verifies that the application displays only the navigation items and routes appropriate for the user's role.

Test Inputs: Organizer user session

Expected Results: The organizer is redirected to the student portal (/student/dashboard). The admin portal (/admin/dashboard) is not accessible. Attempting to navigate to /admin/dashboard returns a redirect or 403 response.

Dependencies: UTC2.1 (organizer must be logged in)

Initialization: An organizer user is authenticated.

Test Steps:
1. Log in as an organizer via the sign-in page and verify the browser redirects to `/student/dashboard`.
2. Attempt to navigate directly to the admin portal in the browser address bar:
```
https://structura-system.vercel.app/admin/dashboard
```
3. Verify that access is denied — the page redirects to sign-in or shows an unauthorized message.
4. Confirm via the console that the API also blocks admin routes:
```js
fetch('/api/audit').then(r => r.json()).then(console.log)
```
5. Verify the response contains `success: false` with a 403 or 401 status.


---

### Event Management Module

---

**ETC1.1 Successful Event Proposal Creation (Event Management)**

Description: Verifies that an authenticated organizer can create a new event proposal and that it is stored with the correct initial status.

Test Inputs:
- Name: "Tech Summit 2026"
- Description: "Annual technology conference"
- Event Date: "2026-08-15"
- Location: "Main Auditorium"

Expected Results: A new event is created and returned with a unique ID. The event status is set to "proposed". All provided fields are stored correctly. An audit log entry for "event_created" is recorded. No exception is thrown.

Dependencies: UTC2.1 (organizer must be logged in)

Initialization: An organizer user is authenticated.

Test Steps:
1. Submit a POST request to /api/events with the inputs above.
2. Verify that the response status is 201 Created.
3. Verify that the returned event has a unique `id`.
4. Verify that `status` is "proposed".
5. Verify that `name`, `description`, `eventDate`, and `location` match the inputs.

---

**ETC1.2 Event Creation Rejected When Required Fields Are Missing (Event Management)**

Description: Verifies that the system rejects an event creation request when required fields (name or date) are absent.

Test Inputs:
- Name: (empty)
- Event Date: "2026-08-15"

Expected Results: The event creation is rejected with a 400 Bad Request response. An error message indicating the missing field is returned. No event is created.

Dependencies: UTC2.1 (organizer must be logged in)

Initialization: An organizer user is authenticated.

Test Steps:
1. Submit a POST request to /api/events with an empty name field.
2. Verify that the response status is 400 Bad Request.
3. Verify that the response body contains `success: false`.
4. Verify that the error message references the missing required field.

---

**ETC2.1 Successful Event Update (Event Management)**

Description: Verifies that an authorized user can update an existing event's fields and that the changes are persisted.

Test Inputs:
- Event ID: (ID of an existing proposed event)
- Updated Name: "Tech Summit 2026 — Updated"
- Updated Location: "Conference Hall B"

Expected Results: The event is updated with the new name and location. The returned event reflects the changes. An audit log entry for "event_updated" is recorded. No exception is thrown.

Dependencies: ETC1.1 (an event must exist), UTC2.1 (organizer must be logged in)

Initialization: An organizer is authenticated. An event with status "proposed" exists.

Test Steps:
1. Submit a PATCH request to /api/events/{id} with the updated name and location.
2. Verify that the response status is 200 OK.
3. Verify that the returned event has the updated `name` and `location`.
4. Submit a GET request to /api/events/{id} and verify the changes are persisted.

---

**ETC3.1 View Event Details Including Associated Data (Event Management)**

Description: Verifies that retrieving an event returns all associated information including documents, checklist, and budget data.

Test Inputs:
- Event ID: (ID of an event with documents, a checklist, and a budget allocation)

Expected Results: The event details are returned. The response includes the event's documents list, checklist with items, and budget allocation. No exception is thrown.

Dependencies: ETC1.1, DTC1.1, CTC2.1, BTC2.1

Initialization: An event exists with at least one document uploaded, a checklist applied, and a budget allocation assigned.

Test Steps:
1. Submit a GET request to /api/events/{id}.
2. Verify that the response status is 200 OK.
3. Verify that the event fields (name, description, date, location, status) are present.
4. Submit a GET request to /api/events/{id}/documents and verify at least one document is returned.
5. Submit a GET request to /api/events/{id}/checklist and verify the checklist and its items are returned.

---

**ETC4.1 Successful Event Deletion (Event Management)**

Description: Verifies that an admin or officer can delete an event and that all associated data is removed.

Test Inputs:
- Event ID: (ID of an existing event)

Expected Results: The event is deleted. A subsequent GET request for the same event returns 404 Not Found. Associated documents and checklists are also removed. No exception is thrown.

Dependencies: ETC1.1 (an event must exist), UTC2.1 (officer or admin must be logged in)

Initialization: An officer or admin is authenticated. An event exists in the system.

Test Steps:
1. Submit a DELETE request to /api/events/{id}.
2. Verify that the response status is 200 OK.
3. Submit a GET request to /api/events/{id}.
4. Verify that the response status is 404 Not Found.

---

**ETC5.1 Event Status Transition: Proposed to Approved (Event Management)**

Description: Verifies that an admin can approve a proposed event and that the status is updated correctly.

Test Inputs:
- Event ID: (ID of an event with status "proposed")
- New Status: "approved"

Expected Results: The event status is updated to "approved". An audit log entry for "event_status_changed" is recorded. No exception is thrown.

Dependencies: ETC1.1 (a proposed event must exist), UTC2.1 (admin must be logged in)

Initialization: An admin is authenticated. An event with status "proposed" exists.

Test Steps:
1. Submit a PATCH request to /api/events/{id} with body `{ "status": "approved" }`.
2. Verify that the response status is 200 OK.
3. Verify that the returned event has `status: "approved"`.

---

**ETC5.2 Event Status Transition: Approved to Cancelled (Event Management)**

Description: Verifies that an admin can cancel an approved event.

Test Inputs:
- Event ID: (ID of an event with status "approved")
- New Status: "cancelled"

Expected Results: The event status is updated to "cancelled". An audit log entry for "event_status_changed" is recorded. No exception is thrown.

Dependencies: ETC5.1 (an approved event must exist), UTC2.1 (admin must be logged in)

Initialization: An admin is authenticated. An event with status "approved" exists.

Test Steps:
1. Submit a PATCH request to /api/events/{id} with body `{ "status": "cancelled" }`.
2. Verify that the response status is 200 OK.
3. Verify that the returned event has `status: "cancelled"`.


---

### Document Management Module

---

**DTC1.1 Successful Document Upload Linked to Event (Document Management)**

Description: Verifies that an organizer can upload a document and that it is stored and linked to the correct event.

Test Inputs:
- Event ID: (ID of an existing event)
- File: "venue_permit.pdf" (valid PDF, 500 KB)
- Document Type: "permit"

Expected Results: The document is uploaded and stored. A document record is created in the database linked to the event. The returned document contains the correct file name, document type, and event ID. No exception is thrown.

Dependencies: ETC1.1 (an event must exist), UTC2.1 (organizer must be logged in)

Initialization: An organizer is authenticated. An event exists in the system.

Test Steps:
1. Submit a POST request to /api/events/{id}/documents with the file and document type as multipart/form-data.
2. Verify that the response status is 201 Created.
3. Verify that the returned document has the correct `fileName`, `documentType`, and `eventId`.
4. Submit a GET request to /api/events/{id}/documents and verify the document appears in the list.

---

**DTC1.2 Document Upload Rejected for Unauthorized Role (Document Management)**

Description: Verifies that an officer (who lacks upload_document permission) cannot upload documents.

Test Inputs:
- Event ID: (ID of an existing event)
- File: "contract.pdf"
- Document Type: "contract"

Expected Results: The upload is rejected with a 403 Forbidden response. No document is stored. An appropriate error message is returned.

Dependencies: ETC1.1 (an event must exist), UTC2.1 (officer must be logged in)

Initialization: An officer is authenticated. An event exists in the system.

Test Steps:
1. Log in as an officer and run the following in the browser console:
```js
const form = new FormData()
form.append('documentType', 'contract')
fetch('/api/events/{EVENT_ID}/documents', {
  method: 'POST',
  body: form
}).then(r => r.json()).then(console.log)
```
2. Verify that the response status is 403 Forbidden.
3. Verify that the response body contains `success: false`.

---

**DTC2.1 View All Documents for an Event (Document Management)**

Description: Verifies that all documents associated with an event are returned when the event's documents are requested.

Test Inputs:
- Event ID: (ID of an event with 3 documents uploaded)

Expected Results: A list of 3 documents is returned. Each document contains the file name, document type, upload date, and event ID. No exception is thrown.

Dependencies: DTC1.1 (documents must be uploaded to the event)

Initialization: An authenticated user exists. An event with exactly 3 documents (one permit, one contract, one receipt) is set up.

Test Steps:
1. Submit a GET request to /api/events/{id}/documents.
2. Verify that the response status is 200 OK.
3. Verify that the returned list contains exactly 3 documents.
4. Verify that each document has `fileName`, `documentType`, `uploadedAt`, and `eventId` fields.

---

**DTC3.1 All Supported Document Types Are Accepted (Document Management)**

Description: Verifies that the system accepts all five supported document types: permit, contract, promotional, receipt, and financial.

Test Inputs:
- Five separate upload requests, one for each document type
- Event ID: (ID of an existing event)

Expected Results: All five uploads succeed with 201 Created responses. Each document is stored with the correct document type. No exception is thrown.

Dependencies: ETC1.1 (an event must exist), UTC2.1 (officer must be logged in)

Initialization: An officer is authenticated. An event exists in the system.

Test Steps:
1. Upload a file with `documentType: "permit"` — verify 201 Created.
2. Upload a file with `documentType: "contract"` — verify 201 Created.
3. Upload a file with `documentType: "promotional"` — verify 201 Created.
4. Upload a file with `documentType: "receipt"` — verify 201 Created.
5. Upload a file with `documentType: "financial"` — verify 201 Created.
6. Submit a GET request to /api/events/{id}/documents and verify all 5 documents are present.

---

**DTC4.1 Successful Document Deletion (Document Management)**

Description: Verifies that an officer or admin can delete a document and that it is removed from both storage and the database.

Test Inputs:
- Document ID: (ID of an existing document)

Expected Results: The document is deleted from storage and the database. A subsequent GET request for the document returns 404 Not Found. No exception is thrown.

Dependencies: DTC1.1 (a document must exist), UTC2.1 (organizer must be logged in)

Initialization: An organizer is authenticated. A document exists in the system.

Test Steps:
1. Submit a DELETE request to /api/documents/{id}.
2. Verify that the response status is 200 OK.
3. Submit a GET request to /api/documents/{id}.
4. Verify that the response status is 404 Not Found.

---

**DTC5.1 Upload Rejected for Invalid File Type (Document Management)**

Description: Verifies that the system rejects a document upload when the file type is not supported.

Test Inputs:
- File: "script.exe" (executable file)
- Document Type: "permit"

Expected Results: The upload is rejected with a 400 Bad Request response. An error message indicating the invalid file type is returned. No document is stored.

Dependencies: ETC1.1 (an event must exist), UTC2.1 (officer must be logged in)

Initialization: An officer is authenticated. An event exists in the system.

Test Steps:
1. Submit a POST request to /api/events/{id}/documents with the .exe file.
2. Verify that the response status is 400 Bad Request.
3. Verify that the response body contains `success: false`.
4. Verify that the error message references the invalid file type.

---

**DTC5.2 Upload Rejected When File Exceeds Size Limit (Document Management)**

Description: Verifies that the system rejects a document upload when the file size exceeds the 10 MB limit.

Test Inputs:
- File: "large_file.pdf" (15 MB)
- Document Type: "financial"

Expected Results: The upload is rejected with a 400 Bad Request response. An error message indicating the file size limit is returned. No document is stored.

Dependencies: ETC1.1 (an event must exist), UTC2.1 (officer must be logged in)

Initialization: An officer is authenticated. An event exists in the system.

Test Steps:
1. Submit a POST request to /api/events/{id}/documents with the oversized file.
2. Verify that the response status is 400 Bad Request.
3. Verify that the response body contains `success: false`.
4. Verify that the error message references the file size limit.


---

### Checklist Management Module

---

**CTC1.1 Successful Checklist Template Creation (Checklist Management)**

Description: Verifies that an admin can create a checklist template with a name and a list of items.

Test Inputs:
- Template Name: "Event Readiness Checklist"
- Items: ["Book venue", "Confirm speakers", "Send invitations", "Prepare materials"]

Expected Results: A checklist template is created and returned with a unique ID. The template contains exactly 4 items in the correct order. No exception is thrown.

Dependencies: UTC2.1 (admin must be logged in)

Initialization: An admin is authenticated.

Test Steps:
1. Submit a POST request to the checklist templates endpoint with the template name and items.
2. Verify that the response status is 201 Created.
3. Verify that the returned template has a unique `id` and the correct `name`.
4. Verify that the template contains exactly 4 items.
5. Verify that the items are in the same order as provided.

---

**CTC2.1 Apply Checklist Template to an Event (Checklist Management)**

Description: Verifies that applying a checklist template to an event copies all template items to the event's checklist.

Test Inputs:
- Event ID: (ID of an existing event with no checklist)
- Template ID: (ID of a template with 4 items)

Expected Results: A checklist is created for the event. The checklist contains exactly 4 items copied from the template. All items have `isCompleted: false`. No exception is thrown.

Dependencies: CTC1.1 (a template must exist), ETC1.1 (an event must exist), UTC2.1 (organizer must be logged in)

Initialization: An organizer is authenticated. An event with no checklist exists. A checklist template with 4 items exists.

Test Steps:
1. Submit a POST request to /api/events/{id}/checklist with body `{ "templateId": "<templateId>" }`.
2. Verify that the response status is 201 Created.
3. Verify that the returned checklist has exactly 4 items.
4. Verify that all items have `isCompleted: false`.
5. Verify that the item descriptions match the template items.

---

**CTC3.1 Create Custom Checklist for an Event (Checklist Management)**

Description: Verifies that a user can create a custom checklist for an event without using a template.

Test Inputs:
- Event ID: (ID of an existing event with no checklist)
- Items: ["Reserve equipment", "Notify participants"]

Expected Results: A checklist is created for the event with the 2 custom items. All items have `isCompleted: false`. No template is referenced. No exception is thrown.

Dependencies: ETC1.1 (an event must exist), UTC2.1 (organizer must be logged in)

Initialization: An organizer is authenticated. An event with no checklist exists.

Test Steps:
1. Submit a POST request to /api/events/{id}/checklist with body `{ "items": ["Reserve equipment", "Notify participants"] }`.
2. Verify that the response status is 201 Created.
3. Verify that the returned checklist has exactly 2 items.
4. Verify that the item descriptions match the provided inputs.
5. Verify that `createdFromTemplate` is null.

---

**CTC4.1 Add a New Item to an Existing Checklist (Checklist Management)**

Description: Verifies that a user can add a new item to an existing event checklist.

Test Inputs:
- Checklist ID: (ID of an existing checklist)
- New Item Description: "Arrange catering"

Expected Results: The new item is added to the checklist. The checklist now contains one more item than before. The new item has `isCompleted: false`. No exception is thrown.

Dependencies: CTC2.1 or CTC3.1 (a checklist must exist), UTC2.1 (organizer must be logged in)

Initialization: An organizer is authenticated. An event checklist with 2 items exists.

Test Steps:
1. Submit a POST request to /api/checklists/{id}/items with body `{ "description": "Arrange catering" }`.
2. Verify that the response status is 201 Created.
3. Verify that the returned item has the correct description and `isCompleted: false`.
4. Submit a GET request to /api/events/{eventId}/checklist and verify the checklist now has 3 items.

---

**CTC4.2 Remove an Item from an Existing Checklist (Checklist Management)**

Description: Verifies that a user can remove an item from an event checklist without affecting other items.

Test Inputs:
- Checklist Item ID: (ID of an existing checklist item)

Expected Results: The item is removed from the checklist. The checklist contains one fewer item. The remaining items are unaffected. No exception is thrown.

Dependencies: CTC4.1 (a checklist with items must exist), UTC2.1 (organizer must be logged in)

Initialization: An organizer is authenticated. An event checklist with 3 items exists.

Test Steps:
1. Submit a DELETE request to /api/checklists/items/{id}.
2. Verify that the response status is 200 OK.
3. Submit a GET request to /api/events/{eventId}/checklist and verify the checklist now has 2 items.
4. Verify that the deleted item is no longer present.

---

**CTC5.1 Mark a Checklist Item as Complete (Checklist Management)**

Description: Verifies that toggling a checklist item marks it as complete and records the completion timestamp.

Test Inputs:
- Checklist Item ID: (ID of an incomplete checklist item)

Expected Results: The item's `isCompleted` is updated to `true`. The `completedAt` timestamp is set to the current time. The `completedBy` field is set to the user's ID. No exception is thrown.

Dependencies: CTC2.1 (a checklist with items must exist), UTC2.1 (organizer must be logged in)

Initialization: An organizer is authenticated. An event checklist with at least one incomplete item exists.

Test Steps:
1. Submit a PATCH request to /api/checklists/items/{id}.
2. Verify that the response status is 200 OK.
3. Verify that the returned item has `isCompleted: true`.
4. Verify that `completedAt` is a valid timestamp.
5. Verify that `completedBy` matches the authenticated user's ID.

---

**CTC6.1 Completion Percentage Is Calculated Correctly (Checklist Management)**

Description: Verifies that the system correctly calculates and returns the checklist completion percentage.

Test Inputs:
- Checklist with 4 items, 2 of which are marked complete

Expected Results: The completion percentage returned is 50%. When all 4 items are marked complete, the percentage is 100%. No exception is thrown.

Dependencies: CTC5.1 (items must be toggleable), CTC2.1 (a checklist must exist)

Initialization: An organizer is authenticated. An event checklist with 4 items exists, 2 of which are already marked complete.

Test Steps:
1. Submit a GET request to /api/events/{id}/checklist.
2. Verify that the completion percentage is 50%.
3. Mark the remaining 2 items as complete via PATCH /api/checklists/items/{id}.
4. Submit a GET request to /api/events/{id}/checklist again.
5. Verify that the completion percentage is now 100%.


---

### Budget Management Module

---

**BTC1.1 Organizational Budget Is Initialized and Retrievable (Budget Management)**

Description: Verifies that the system maintains an organizational budget and returns the correct total, allocated, and available funds.

Test Inputs:
- Organization ID: (ID of an existing organization)
- Total Funds Set: ₱100,000

Expected Results: The budget record is returned with `totalFunds: 100000`. The `allocatedFunds` and `availableFunds` fields are present and correct. No exception is thrown.

Dependencies: UTC2.1 (admin must be logged in)

Initialization: An admin is authenticated. An organization exists. The admin has set the budget to ₱100,000.

Test Steps:
1. Submit a GET request to /api/budget.
2. Verify that the response status is 200 OK.
3. Verify that `totalFunds` is 100000.
4. Verify that `allocatedFunds` and `availableFunds` are present.
5. Verify that `totalFunds = allocatedFunds + availableFunds`.

---

**BTC2.1 Successful Fund Allocation to an Event (Budget Management)**

Description: Verifies that an admin can allocate funds from the organizational budget to a specific event.

Test Inputs:
- Event ID: (ID of an existing event with no allocation)
- Organization ID: (ID of the organization)
- Amount: ₱20,000

Expected Results: An allocation record is created for the event. The organization's available funds are reduced by ₱20,000. The allocation is returned with the correct event ID and amount. No exception is thrown.

Dependencies: BTC1.1 (budget must be set), ETC1.1 (an event must exist), UTC2.1 (admin must be logged in)

Initialization: An admin is authenticated. An organization budget of ₱100,000 is set. An event with no allocation exists.

Test Steps:
1. Submit a POST request to /api/budget/allocations with body `{ "eventId": "<id>", "organizationId": "<orgId>", "amount": 20000 }`.
2. Verify that the response status is 201 Created.
3. Verify that the returned allocation has `amount: 20000` and the correct `eventId`.
4. Submit a GET request to /api/budget and verify that `availableFunds` is now ₱80,000.

---

**BTC2.2 Duplicate Allocation for the Same Event Is Rejected (Budget Management)**

Description: Verifies that the system rejects a second allocation attempt for an event that already has an allocation.

Test Inputs:
- Event ID: (ID of an event that already has an allocation)
- Amount: ₱5,000

Expected Results: The allocation is rejected with an error response. The existing allocation is unchanged. An appropriate error message is returned.

Dependencies: BTC2.1 (an allocation must already exist for the event)

Initialization: An admin is authenticated. An event with an existing allocation of ₱20,000 exists.

Test Steps:
1. Submit a POST request to /api/budget/allocations for the same event with amount ₱5,000.
2. Verify that the response status is 4xx (conflict or bad request).
3. Verify that the response body contains `success: false`.
4. Verify that the error message indicates an allocation already exists.

---

**BTC3.1 Successful Expenditure Recording (Budget Management)**

Description: Verifies that an officer can record an expenditure against an event's allocated budget with a supporting document.

Test Inputs:
- Event ID: (ID of an event with a ₱20,000 allocation)
- Amount: ₱5,000
- Description: "Venue rental fee"
- Document ID: (ID of an existing financial document for the event)

Expected Results: An expenditure record is created. The event's remaining funds are reduced by ₱5,000. The expenditure is returned with the correct amount, description, and document ID. An audit log entry for "expenditure_recorded" is created. No exception is thrown.

Dependencies: BTC2.1 (an allocation must exist), DTC1.1 (a document must exist), UTC2.1 (officer must be logged in)

Initialization: An officer is authenticated. An event with a ₱20,000 allocation exists. A financial document is uploaded for the event.

Test Steps:
1. Submit a POST request to /api/budget/expenditures with the inputs above.
2. Verify that the response status is 201 Created.
3. Verify that the returned expenditure has `amount: 5000`, the correct `description`, and `documentId`.
4. Submit a GET request to /api/budget/expenditures/{eventId} and verify the expenditure appears.

---

**BTC3.2 Expenditure Recording Rejected Without Supporting Document (Budget Management)**

Description: Verifies that the system rejects an expenditure that does not include a supporting financial document.

Test Inputs:
- Event ID: (ID of an event with an allocation)
- Amount: ₱3,000
- Description: "Printing costs"
- Document ID: (none / empty)

Expected Results: The expenditure is rejected with a 400 Bad Request response. An error message indicating a supporting document is required is returned. No expenditure record is created.

Dependencies: BTC2.1 (an allocation must exist), UTC2.1 (officer must be logged in)

Initialization: An officer is authenticated. An event with an allocation exists.

Test Steps:
1. Submit a POST request to /api/budget/expenditures without a `documentId` field.
2. Verify that the response status is 400 Bad Request.
3. Verify that the response body contains `success: false`.
4. Verify that the error message references the missing document requirement.

---

**BTC4.1 Budget Summary Displays Correct Financial Figures (Budget Management)**

Description: Verifies that the budget summary for an event correctly shows allocated budget, total expenditures, and remaining funds.

Test Inputs:
- Event ID: (ID of an event with ₱20,000 allocated and ₱5,000 spent)

Expected Results: The financial summary shows `allocatedAmount: 20000`, `totalSpent: 5000`, and `remainingFunds: 15000`. No exception is thrown.

Dependencies: BTC2.1 (allocation must exist), BTC3.1 (expenditure must exist)

Initialization: An authenticated user exists. An event has ₱20,000 allocated and one expenditure of ₱5,000 recorded.

Test Steps:
1. Submit a GET request to /api/budget/expenditures/{eventId}.
2. Verify that the response status is 200 OK.
3. Verify that `summary.allocatedAmount` is 20000.
4. Verify that `summary.totalSpent` is 5000.
5. Verify that `summary.remainingFunds` is 15000.

---

**BTC5.1 Over-Allocation Is Rejected (Budget Management)**

Description: Verifies that the system rejects a fund allocation when the requested amount exceeds the organization's available funds.

Test Inputs:
- Organization Budget: ₱10,000 (total)
- Already Allocated: ₱8,000
- New Allocation Amount: ₱5,000 (exceeds the ₱2,000 available)

Expected Results: The allocation is rejected with an error response. An error message indicating insufficient funds is returned. The organization's available funds remain ₱2,000. No allocation record is created.

Dependencies: BTC1.1 (budget must be set), BTC2.1 (an existing allocation must consume most of the budget)

Initialization: An admin is authenticated. The organization budget is ₱10,000. ₱8,000 is already allocated to another event.

Test Steps:
1. Submit a POST request to /api/budget/allocations with `amount: 5000` for a new event.
2. Verify that the response status is 4xx (bad request or conflict).
3. Verify that the response body contains `success: false`.
4. Verify that the error message references insufficient funds.
5. Submit a GET request to /api/budget and verify `availableFunds` is still ₱2,000.

---

**BTC6.1 Expenditure Without Document Is Rejected (Budget Management)**

Description: Verifies that the system enforces the requirement for a financial document on every expenditure record.

Test Inputs:
- Event ID: (ID of an event with an allocation)
- Amount: ₱1,500
- Description: "Refreshments"
- Document ID: (omitted)

Expected Results: The expenditure is rejected. An error message stating a supporting document is required is returned. No expenditure is recorded.

Dependencies: BTC2.1 (an allocation must exist), UTC2.1 (officer must be logged in)

Initialization: An officer is authenticated. An event with an allocation exists. No document is provided.

Test Steps:
1. Submit a POST request to /api/budget/expenditures omitting the `documentId` field.
2. Verify that the response status is 400 Bad Request.
3. Verify that the error message states a supporting document is required.
4. Submit a GET request to /api/budget/expenditures/{eventId} and verify no new expenditure was recorded.


---

### Audit Trail Module

---

**ATC1.1 Critical Actions Are Recorded in the Audit Trail (Audit Trail)**

Description: Verifies that performing a critical action (budget allocation) creates an audit log entry with the correct user ID, action type, and timestamp.

Test Inputs:
- Action: Allocate ₱10,000 to an event
- Performing User: Admin (user ID known)

Expected Results: An audit log entry is created with `action: "funds_allocated"`, the correct `userId`, and a valid `createdAt` timestamp. The entry is retrievable via the audit API. No exception is thrown.

Dependencies: BTC2.1 (a fund allocation must be performed)

Initialization: An admin is authenticated. An event and organization budget exist.

Test Steps:
1. Submit a POST request to /api/budget/allocations to allocate ₱10,000 to an event.
2. Submit a GET request to /api/audit.
3. Verify that the most recent entry has `action: "funds_allocated"`.
4. Verify that the entry's `userId` matches the admin's user ID.
5. Verify that `createdAt` is a valid recent timestamp.

---

**ATC2.1 Admin Can View Audit Logs Filtered by Category (Audit Trail)**

Description: Verifies that an admin can retrieve audit logs and filter them by entity type (e.g., budget, event, document).

Test Inputs:
- Filter: entityType = "budget"

Expected Results: Only audit entries with `entityType: "budget"` are returned. Entries for other entity types (event, document) are excluded. No exception is thrown.

Dependencies: ATC1.1 (audit entries must exist for multiple entity types)

Initialization: An admin is authenticated. Audit entries exist for budget, event, and document actions.

Test Steps:
1. Submit a GET request to /api/audit?entityType=budget.
2. Verify that the response status is 200 OK.
3. Verify that all returned entries have `entityType: "budget"`.
4. Verify that no entries with `entityType: "event"` or `entityType: "document"` are present.

---

**ATC3.1 Audit Log Entries Cannot Be Modified or Deleted (Audit Trail)**

Description: Verifies that audit log entries are immutable — no update or delete operation can alter them.

Test Inputs:
- Audit Entry ID: (ID of an existing audit log entry)

Expected Results: Any attempt to modify or delete an audit entry is rejected. The entry remains unchanged after the attempt. No exception is thrown on retrieval.

Dependencies: ATC1.1 (an audit entry must exist)

Initialization: An admin is authenticated. At least one audit log entry exists.

Test Steps:
1. Attempt a DELETE request against any exposed audit entry endpoint.
2. Verify that no delete endpoint exists, or that the response is 405 Method Not Allowed / 403 Forbidden.
3. Attempt a PATCH or PUT request to modify the audit entry.
4. Verify that no update endpoint exists, or that the response is 405 / 403.
5. Submit a GET request to /api/audit and verify the original entry is still present and unchanged.

---

**ATC4.1 Role Change Is Recorded in the Audit Trail (Audit Trail)**

Description: Verifies that when an admin changes a user's role, an audit log entry is created capturing the old and new roles.

Test Inputs:
- Target User ID: (ID of an organizer)
- New Role: "officer"
- Performing User: Admin

Expected Results: An audit log entry is created with `action: "user_role_updated"`. The entry's `details` field contains the old role ("organizer") and new role ("officer"). The `userId` matches the admin who performed the change. No exception is thrown.

Dependencies: RTC2.1 (a role update must be performed), UTC2.1 (admin must be logged in)

Initialization: An admin is authenticated. An organizer user exists in the system.

Test Steps:
1. Submit a PATCH request to /api/users/{id}/role with body `{ "role": "officer" }`.
2. Submit a GET request to /api/audit.
3. Verify that an entry with `action: "user_role_updated"` exists.
4. Verify that `details.oldRole` is "organizer" and `details.newRole` is "officer".
5. Verify that the entry's `userId` matches the admin's ID.

---

**ATC5.1 Event Record Displays Last Modified Timestamp and User (Audit Trail)**

Description: Verifies that after updating an event, the event record reflects the correct last modified timestamp and the user who made the change.

Test Inputs:
- Event ID: (ID of an existing event)
- Update: name changed to "Updated Event Name"

Expected Results: The event's `updatedAt` timestamp is updated to the current time. The audit trail contains an entry for "event_updated" with the correct user ID and timestamp. No exception is thrown.

Dependencies: ETC2.1 (an event update must be performed), UTC2.1 (organizer must be logged in)

Initialization: An organizer is authenticated. An event exists with a known `updatedAt` timestamp.

Test Steps:
1. Record the current `updatedAt` value of the event.
2. Submit a PATCH request to /api/events/{id} to update the event name.
3. Submit a GET request to /api/events/{id}.
4. Verify that `updatedAt` is more recent than the previously recorded value.
5. Submit a GET request to /api/audit and verify an "event_updated" entry exists with the correct `userId` and a matching recent timestamp.

---

*Document Version: 1.0*
*Total Test Cases: 36*
*Modules Covered: User Authentication (7), Role-Based Access Control (5), Event Management (6), Document Management (6), Checklist Management (6), Budget Management (7), Audit Trail (5)*
