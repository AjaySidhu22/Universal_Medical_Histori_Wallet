# 🧪 Universal Medical Wallet - Complete Testing Guide

**Version:** 1.0  
**Date:** February 18, 2026  
**Total Tests:** 188  
**Estimated Time:** 6-8 hours for complete testing

---

## 📋 Table of Contents

1. [Testing Prerequisites](#testing-prerequisites)
2. [Testing Environment Setup](#testing-environment-setup)
3. [Section 1: Authentication Testing (20 tests)](#section-1-authentication-testing)
4. [Section 2: Profile Testing (15 tests)](#section-2-profile-testing)
5. [Section 3: Access Request Testing (20 tests)](#section-3-access-request-testing)
6. [Section 4: Medical Records Testing (25 tests)](#section-4-medical-records-testing)
7. [Section 5: Emergency QR Testing (15 tests)](#section-5-emergency-qr-testing)
8. [Section 6: Two-Factor Authentication (10 tests)](#section-6-two-factor-authentication)
9. [Section 7: Admin Testing (10 tests)](#section-7-admin-testing)
10. [Section 8: UI/UX Testing (15 tests)](#section-8-uiux-testing)
11. [Section 9: Security Testing (10 tests)](#section-9-security-testing)
12. [Section 10: Pagination Testing (8 tests)](#section-10-pagination-testing)
13. [Section 11: Edge Cases (15 tests)](#section-11-edge-cases)
14. [Bug Reporting Template](#bug-reporting-template)
15. [Testing Summary Sheet](#testing-summary-sheet)

---

## Testing Prerequisites

### Required Tools:
- [ ] Chrome/Firefox/Safari browsers
- [ ] Incognito/Private browsing windows
- [ ] Mobile device (iPhone/Android) or browser DevTools
- [ ] Google Authenticator or Authy app (for 2FA testing)
- [ ] QR code scanner app
- [ ] Test image files (JPG, PNG - under 10MB)
- [ ] Test PDF file (under 10MB)
- [ ] Large file (over 10MB - for size limit testing)

### Test User Accounts:
Create these test accounts before starting:

1. **Admin User:**
   - Email: `admin@test.com`
   - Password: `Admin123!`
   - Role: Admin

2. **Doctor User 1:**
   - Email: `doctor1@test.com`
   - Username: `dr_john`
   - Password: `Doctor123!`
   - Role: Doctor

3. **Doctor User 2:**
   - Email: `doctor2@test.com`
   - Username: `dr_sarah`
   - Password: `Doctor123!`
   - Role: Doctor

4. **Patient User 1:**
   - Email: `patient1@test.com`
   - Username: `patient_alice`
   - Password: `Patient123!`
   - Role: Patient

5. **Patient User 2:**
   - Email: `patient2@test.com`
   - Username: `patient_bob`
   - Password: `Patient123!`
   - Role: Patient

---

## Testing Environment Setup

### 1. Start Backend Server:
```bash
cd C:\Users\ASUS\universal-medical-wallet\backend
npm run dev
```

**Expected Output:**
```
✅ SSL/TLS encryption enabled
🔒 HTTPS Server running on port 5000
✅ Email service is ready to send emails
```

### 2. Start Frontend Server:
```bash
cd C:\Users\ASUS\universal-medical-wallet\frontend
npm start
```

**Expected Output:**

Compiled successfully!
webpack compiled with 0 warnings

### 3. Verify Both Running:
- Backend: https://localhost:5000 (should show "Cannot GET /")
- Frontend: http://localhost:3000 (should show login page)

---

## Section 1: Authentication Testing

**Priority:** CRITICAL  
**Estimated Time:** 45 minutes  
**Tests:** 20

### Test 1.1: Register with Valid Data ✅

**Steps:**
1. Open `http://localhost:3000` in incognito browser
2. Click "Create Account"
3. Fill in form:
   - Email: `test1@gmail.com`
   - Username: `testuser1`
   - Password: `Test1234!`
   - Role: Patient
4. Click "Create Account"

**Expected Result:**
- ✅ Redirects to email verification page
- ✅ Shows message: "Verification email sent! Please check your inbox..."
- ✅ 6-digit OTP sent to email
- ✅ Backend logs show: "Verification email sent"

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 1.2: Register with Existing Email ❌

**Steps:**
1. Go to registration page
2. Use email from Test 1.1: `test1@gmail.com`
3. Different username: `testuser2`
4. Click "Create Account"

**Expected Result:**
- ❌ Error message: "User already exists"
- ❌ No redirect
- ❌ No email sent

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 1.3: Register with Existing Username ❌

**Steps:**
1. Go to registration page
2. Different email: `test2@gmail.com`
3. Same username from Test 1.1: `testuser1`
4. Type in username field

**Expected Result:**
- ❌ Real-time check shows: "Username is already taken"
- ❌ Suggestions appear (testuser1123, testuser1456, etc.)
- ❌ Submit button should fail if clicked

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 1.4: Username Availability - Real-time Check ✅

**Steps:**
1. Go to registration page
2. Type username slowly: `n` → `ne` → `new` → `newu` → `newuser`
3. Watch for real-time feedback

**Expected Result:**
- ⏳ Shows "Checking..." while typing
- ✅ Shows green checkmark "✓ Username is available!"
- ✅ Border turns green

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 1.5: Email Verification with Correct OTP ✅

**Steps:**
1. Complete registration (Test 1.1)
2. Check email for OTP
3. Enter 6-digit code
4. Click "Verify Email"

**Expected Result:**
- ✅ Success message: "Email verified successfully!"
- ✅ Redirects to login page
- ✅ Can now login with credentials

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 1.6: Email Verification with Wrong OTP ❌

**Steps:**
1. Complete registration
2. Enter incorrect OTP: `000000`
3. Click "Verify Email"

**Expected Result:**
- ❌ Error: "Invalid OTP. Please try again."
- ❌ No redirect
- ❌ Can try again

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 1.7: Resend OTP Functionality ✅

**Steps:**
1. On verification page
2. Click "Resend Code"
3. Wait for confirmation

**Expected Result:**
- ✅ New OTP sent to email
- ✅ Message: "Verification OTP sent to your email"
- ✅ Old OTP becomes invalid

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 1.8: Login with Correct Credentials ✅

**Steps:**
1. Go to login page
2. Enter verified email: `test1@gmail.com`
3. Enter password: `Test1234!`
4. Click "Login"

**Expected Result:**
- ✅ Redirects to dashboard
- ✅ Shows "Welcome, test1@gmail.com"
- ✅ Shows role badge (Patient)
- ✅ Profile section appears

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 1.9: Login with Wrong Password ❌

**Steps:**
1. Go to login page
2. Enter email: `test1@gmail.com`
3. Enter wrong password: `WrongPass123!`
4. Click "Login"

**Expected Result:**
- ❌ Error: "Invalid credentials"
- ❌ No redirect
- ❌ Can try again

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 1.10: Login Before Email Verification ❌

**Steps:**
1. Register new account but DON'T verify email
2. Try to login immediately

**Expected Result:**
- ❌ Error: "Please verify your email before logging in"
- ❌ Shows email address
- ❌ Option to resend verification

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 1.11: Logout Functionality ✅

**Steps:**
1. Login successfully
2. Click "Logout" button
3. Observe behavior

**Expected Result:**
- ✅ Redirects to login page
- ✅ Session cleared
- ✅ Cannot access dashboard by typing URL
- ✅ Must login again

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 1.12: Session Persistence ✅

**Steps:**
1. Login successfully
2. Refresh page (F5)
3. Close and reopen browser
4. Navigate to `http://localhost:3000`

**Expected Result:**
- ✅ After refresh: Still logged in
- ✅ After reopening browser: Session maintained (refresh token works)
- ✅ Dashboard loads automatically

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 1.13: Password Reset Request ✅

**Steps:**
1. On login page, click "Forgot Password?"
2. Enter email: `test1@gmail.com`
3. Click "Send Reset Link"

**Expected Result:**
- ✅ Message: "If this email exists, a password reset link has been sent"
- ✅ Email received with reset link
- ✅ Link format: `http://localhost:3000/reset-password/{token}`

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 1.14: Password Reset with Valid Token ✅

**Steps:**
1. Click reset link from email
2. Enter new password: `NewPass123!`
3. Confirm password: `NewPass123!`
4. Click "Reset Password"

**Expected Result:**
- ✅ Success: "Password has been reset successfully"
- ✅ Redirects to login
- ✅ Can login with new password
- ❌ Old password no longer works

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 1.15: Password Reset with Expired Token ❌

**Steps:**
1. Request password reset
2. Wait for token to expire (1 hour)
3. Try to use expired link

**Expected Result:**
- ❌ Error: "Invalid or expired token"
- ❌ Cannot reset password
- ❌ Must request new link

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________
- [ ] Skipped (time constraint)

---

### Test 1.16: Atomic Registration - Email Fails ✅ CRITICAL

**Steps:**
1. Temporarily disable email service (or use invalid SMTP)
2. Try to register new account
3. Check database for account creation

**Expected Result:**
- ❌ Error: "Failed to send verification email. Please check your email address and try again."
- ❌ NO account created in database
- ❌ Email address remains available
- ✅ Can try again with correct settings

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 1.17: Invalid Email Format ❌

**Steps:**
1. Go to registration
2. Enter invalid emails one by one:
   - `notanemail`
   - `missing@domain`
   - `@nodomain.com`
   - `spaces in@email.com`

**Expected Result:**
- ❌ HTML5 validation prevents submission
- ❌ Error message appears

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 1.18: Weak Password Validation ❌

**Steps:**
1. Go to registration
2. Try weak passwords:
   - `abc` (too short)
   - `password` (no uppercase, no number)
   - `PASSWORD` (no lowercase, no number)
   - `Pass1` (too short)

**Expected Result:**
- ❌ Error: "Must be 8+ characters with uppercase, lowercase, and number"
- ❌ Cannot submit

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 1.19: Rate Limiting on Login ✅

**Steps:**
1. Attempt login with wrong password 6 times rapidly
2. Try 7th attempt

**Expected Result:**
- ⏰ After 5-6 attempts: "Too many requests. Please try again later."
- ⏰ Must wait before trying again
- ✅ Prevents brute force attacks

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 1.20: CSRF Token Protection ✅

**Steps:**
1. Open browser DevTools (F12)
2. Go to Network tab
3. Register or login
4. Inspect POST request headers

**Expected Result:**
- ✅ Request includes `x-csrf-token` header
- ✅ Token is unique per session
- ❌ Request without token fails

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

## Section 2: Profile Testing

**Priority:** HIGH  
**Estimated Time:** 30 minutes  
**Tests:** 15

### Test 2.1: Create Patient Profile - Complete ✅

**Setup:** Login as `patient1@test.com`

**Steps:**
1. Click "Create Profile Now" button
2. Fill ALL fields:
   - Date of Birth: `2000-01-15`
   - Blood Group: `O+`
   - Gender: `Male`
   - Phone: `+1234567890`
   - Emergency Contact Name: `John Doe`
   - Emergency Contact Number: `+0987654321`
   - Address: `123 Main St, City, State, 12345`
   - Allergies: `Peanuts, Shellfish`
3. Click "Save Profile"

**Expected Result:**
- ✅ Success: "Patient profile created"
- ✅ Dashboard shows all entered information
- ✅ Username displays: `@patient_alice`
- ✅ "Create Profile Now" button changes to "Update Profile"

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 2.2: Create Profile with Missing Optional Fields ✅

**Setup:** New patient account

**Steps:**
1. Fill only REQUIRED fields:
   - Date of Birth: `1995-06-20`
   - Blood Group: `A+`
   - Gender: `Female`
2. Leave optional fields blank:
   - Address (leave empty)
   - Allergies (leave empty)
3. Save profile

**Expected Result:**
- ✅ Profile created successfully
- ✅ Required fields display
- ✅ Optional fields show "Not set" or are hidden
- ✅ No errors

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 2.3: Update Existing Profile ✅

**Setup:** Profile from Test 2.1

**Steps:**
1. Click "Update Profile"
2. Change:
   - Blood Group: `O+` → `AB+`
   - Allergies: Add `Latex`
3. Save

**Expected Result:**
- ✅ Success: "Profile updated"
- ✅ Changes reflected immediately
- ✅ No data loss for unchanged fields

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 2.4: Create Doctor Profile - Complete ✅

**Setup:** Login as `doctor1@test.com`

**Steps:**
1. Click "Create Profile Now"
2. Fill all fields:
   - Name: `Dr. Jane Smith`
   - Specialty: `Cardiology`
   - License Number: `MD123456`
   - Hospital/Clinic: `City General Hospital`
   - Phone: `+1234567890`
   - Years of Experience: `10`
   - Bio: `Board-certified cardiologist...`
3. Save

**Expected Result:**
- ✅ Profile created
- ✅ Status: "⏳ Pending Verification"
- ⚠️ Note: "You must be verified by an admin before you can create medical records"
- ✅ Username displays: `@dr_john`

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 2.5: Unverified Doctor Cannot Create Records ❌

**Setup:** Doctor from Test 2.4 (not yet verified)

**Steps:**
1. Go to Medical Records page
2. Try to access patient search/create

**Expected Result:**
- ❌ Cannot request patient access
- ⚠️ Warning: "Your profile must be verified before requesting access"

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 2.6: Admin Verifies Doctor Profile ✅

**Setup:** Login as admin

**Steps:**
1. Go to Admin Dashboard
2. Click "Pending Verifications" tab
3. Find Dr. Jane Smith
4. Click "Verify"
5. Confirm verification

**Expected Result:**
- ✅ Success: "Doctor verified successfully"
- ✅ Doctor removed from pending list
- ✅ Email sent to doctor

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 2.7: Verified Doctor Can Now Create Records ✅

**Setup:** Doctor verified in Test 2.6

**Steps:**
1. Logout and login as `doctor1@test.com`
2. Go to dashboard
3. Check verification status
4. Go to Medical Records

**Expected Result:**
- ✅ Status: "✅ Verified"
- ✅ Can access patient search
- ✅ Can request patient access

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 2.8: Invalid Date of Birth ❌

**Steps:**
1. Create/edit profile
2. Enter future date of birth: `2030-01-01`
3. Try to save

**Expected Result:**
- ❌ Error: "Date of birth cannot be in the future"
- ❌ Cannot save

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 2.9: Invalid Blood Group ❌

**Steps:**
1. Check blood group dropdown
2. Verify available options

**Expected Result:**
- ✅ Only valid options: `A+, A-, B+, B-, AB+, AB-, O+, O-`
- ❌ Cannot enter invalid value

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 2.10: Invalid Phone Number Format ❌

**Steps:**
1. Enter invalid phone numbers:
   - `abc123`
   - `123` (too short)
   - `++1234567890`
2. Try to save

**Expected Result:**
- ❌ Validation error
- ❌ Cannot save

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 2.11: Emergency Contact Validation ✅

**Steps:**
1. Fill emergency contact fields:
   - Name: `Emergency Contact`
   - Number: `+1234567890`
2. Save

**Expected Result:**
- ✅ Both fields save correctly
- ✅ Display on dashboard
- ✅ Available for emergency QR

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 2.12: Allergies Field (Optional) ✅

**Steps:**
1. Leave allergies blank → Save
2. Edit → Add "Peanuts" → Save
3. Edit → Clear allergies → Save

**Expected Result:**
- ✅ Blank saves as "None listed"
- ✅ Can add allergies
- ✅ Can remove allergies
- ✅ Shows in emergency QR

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 2.13: Username Display Consistency ✅

**Steps:**
1. Check username appears on:
   - Dashboard header
   - Profile section
   - Access requests (when doctor searches)
   - Medical records

**Expected Result:**
- ✅ Shows `@username` format everywhere
- ✅ Consistent styling
- ✅ No UUIDs visible to user

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 2.14: Profile Picture Upload ⚠️

**Note:** If feature exists

**Steps:**
1. Try to upload profile picture
2. Select image file
3. Save

**Expected Result:**
- ✅ Image uploads successfully
- ✅ Displays on dashboard
- ✅ Size limit enforced

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________
- [X] Feature not implemented

---

### Test 2.15: Profile Data Persistence ✅

**Steps:**
1. Create profile with all fields
2. Logout
3. Login again
4. Check dashboard

**Expected Result:**
- ✅ All data persists
- ✅ No data loss
- ✅ Displays correctly

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

## Section 3: Access Request Testing

**Priority:** CRITICAL  
**Estimated Time:** 1 hour  
**Tests:** 20

### Test 3.1: Doctor Search Patient by Username ✅

**Setup:**
- Login as `doctor1@test.com` (verified)
- Patient `patient_alice` must exist

**Steps:**
1. Go to Medical Records page
2. In "Patient Username or Email" field, type: `@patient_alice`
3. Fill other fields:
   - Access Type: `View & Create`
   - Duration: `48 Hours`
   - Reason: `Routine consultation`
4. Click "Send Access Request"

**Expected Result:**
- ✅ Success: "Access request sent to patient. They have been notified via email."
- ✅ Email sent to patient
- ✅ Form clears after submission

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 3.2: Doctor Search Patient by Email ✅

**Steps:**
1. Same as Test 3.1, but use email: `patient1@test.com`
2. Send request

**Expected Result:**
- ✅ Works same as username search
- ✅ Finds patient correctly
- ✅ Request sent successfully

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 3.3: Search Non-Existent Patient ❌

**Steps:**
1. Search for: `@nonexistentuser`
2. Try to send request

**Expected Result:**
- ❌ Error: "Patient not found with identifier: @nonexistentuser"
- ❌ No request created

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 3.4: Doctor View "My Requests" ✅

**Setup:** Request from Test 3.1 sent

**Steps:**
1. Click "View My Requests" button
2. Modal opens
3. Observe request list

**Expected Result:**
- ✅ Modal shows with title "My Access Requests (1)"
- ✅ Shows request card with:
  - Patient email
  - Patient username: `@patient_alice`
  - Status: `⏳ PENDING`
  - Type: `both`
  - Duration: `48 Hours (2 Days)`
  - Sent date
  - Expires date

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 3.5: Patient Views Incoming Request ✅

**Setup:** Logout doctor, login as `patient1@test.com`

**Steps:**
1. Go to Dashboard
2. Scroll to "Access Requests from Doctors"
3. Check "Pending" tab

**Expected Result:**
- ✅ Shows 1 pending request
- ✅ Doctor info shows:
  - `Dr. Jane Smith`
  - `Cardiology`
  - Email: `doctor1@test.com`
- ✅ Status: `⏳ Pending`
- ✅ Approve/Deny buttons visible

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 3.6: Patient Approves with Default Duration ✅

**Steps:**
1. On pending request from Test 3.5
2. Leave duration as requested: `48 Hours`
3. Click "Approve Access"
4. Confirm dialog

**Expected Result:**
- ✅ Success: "Request approved for 48 Hours (2 Days)"
- ✅ Status changes to `✅ APPROVED`
- ✅ Shows: "✅ You approved this request on [timestamp]"
- ✅ Email sent to doctor
- ✅ Approve/Deny buttons disappear

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 3.7: Patient Approves with Custom Duration ✅

**Setup:** New request from doctor

**Steps:**
1. On pending request
2. Change dropdown: `48 Hours` → `1 Hour`
3. Click "Approve Access"
4. Confirm

**Expected Result:**
- ✅ Approved for 1 Hour (not requested 48 hours)
- ✅ Shows: "✅ Approved for: 1 Hour"
- ✅ Expiry time = approval time + 1 hour

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 3.8: Patient Denies Request ❌

**Setup:** New request from doctor

**Steps:**
1. On pending request
2. Click "Deny Access"
3. Confirm dialog

**Expected Result:**
- ❌ Success: "Request denied successfully"
- ❌ Status: `❌ DENIED`
- ❌ Shows: "❌ You denied this request on [timestamp]"
- ❌ Email sent to doctor
- ❌ No access granted

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 3.9: Doctor Sees Approved Status ✅

**Setup:** Approval from Test 3.6

**Steps:**
1. Login as `doctor1@test.com`
2. Click "View My Requests"
3. Find approved request

**Expected Result:**
- ✅ Status: `✅ APPROVED`
- ✅ Shows: "✅ Approved for: 48 Hours (2 Days)"
- ✅ Shows expiry time
- ✅ "Create Record" section appears
- ✅ Patient appears in dropdown

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 3.10: Doctor Sees Denied Status ❌

**Setup:** Denial from Test 3.8

**Steps:**
1. Check "My Requests"
2. Find denied request

**Expected Result:**
- ❌ Status: `❌ DENIED`
- ❌ No access granted
- ❌ Cannot create records for this patient

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 3.11: Duplicate Request Prevention ❌

**Setup:** Existing pending request

**Steps:**
1. Try to send another request to same patient
2. Same doctor, same patient

**Expected Result:**
- ❌ Error: "You already have a pending request for this patient"
- ❌ No duplicate request created

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 3.12: Cancel Pending Request ✅

**Setup:** Doctor has pending request

**Steps:**
1. Doctor views "My Requests"
2. Find pending request
3. Click "❌ Cancel Request"
4. Confirm

**Expected Result:**
- ✅ Success: "Request cancelled"
- ✅ Request removed from list
- ✅ Patient no longer sees it

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 3.13: Request Expiry Calculation ✅ CRITICAL

**Setup:** Patient approves with 30 minutes duration

**Steps:**
1. Note approval time: `2:00 PM`
2. Check expiry time displayed
3. Do the math

**Expected Result:**
- ✅ Expiry = Approval time + Duration
- ✅ Example: Approved at 2:00 PM for 30 min → Expires 2:30 PM
- ✅ NOT: Expiry = Request creation time + Duration

**Actual Result:**
- Approval time: __________
- Expected expiry: __________
- Actual expiry: __________
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 3.14: Expired Request Shows Correctly ⏰

**Setup:** Request with 30 min duration, wait 31 minutes

**Steps:**
1. Create request, approve for 30 min
2. Wait 31 minutes (or change system clock)
3. Refresh both doctor and patient views

**Expected Result:**
- ⏰ Status: `⏱️ EXPIRED`
- ❌ Doctor cannot access records
- ⚠️ Patient sees expired status

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________
- [ ] Skipped (time constraint)

---

### Test 3.15: Filter Requests - All Tab ✅

**Setup:** Multiple requests (pending, approved, denied)

**Steps:**
1. Patient dashboard
2. Click "All" tab

**Expected Result:**
- ✅ Shows ALL requests
- ✅ Count badge shows total: `(3)`

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 3.16: Filter Requests - Pending Tab ✅

**Steps:**
1. Click "Pending" tab

**Expected Result:**
- ✅ Shows only pending requests
- ✅ Badge shows count
- ✅ Excludes

approved/denied

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 3.17: Filter Requests - Approved Tab ✅

**Steps:**
1. Click "Approved" tab

**Expected Result:**
- ✅ Shows only approved requests
- ✅ Excludes pending/denied
- ✅ Shows expiry times

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 3.18: Filter Requests - Denied Tab ❌

**Steps:**
1. Click "Denied" tab

**Expected Result:**
- ❌ Shows only denied requests
- ❌ No action buttons
- ❌ Shows denial timestamp

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 3.19: Pagination in Access Requests ✅

**Setup:** Create 7 access requests

**Steps:**
1. View "My Requests" (doctor or patient)
2. Check pagination appears
3. Click "Next" button

**Expected Result:**
- ✅ Shows 5 requests per page
- ✅ Page 1 shows first 5
- ✅ Page 2 shows remaining 2
- ✅ Navigation: `« First ‹ Prev 1 [2] Next › Last »`

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 3.20: Email Notifications ✅

**Setup:** Monitor email inbox during tests

**Steps:**
1. Doctor creates request
2. Patient approves request
3. Patient denies request

**Expected Result:**

**Request Created:**
- ✅ Patient receives email
- ✅ Subject: "New Access Request from Dr. [Name]"
- ✅ Contains doctor info
- ✅ Contains reason
- ✅ Link to dashboard

**Request Approved:**
- ✅ Doctor receives email
- ✅ Subject: "Access Request Approved"
- ✅ Contains patient info
- ✅ Contains expiry time

**Request Denied:**
- ✅ Doctor receives email
- ✅ Subject: "Access Request Denied"
- ✅ Professional message

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

## Section 4: Medical Records Testing

**Priority:** CRITICAL  
**Estimated Time:** 1.5 hours  
**Tests:** 25

### Test 4.1: Doctor Creates Record with All Fields ✅

**Setup:**
- Doctor has approved access to patient
- Prepare test image file (test.jpg, < 10MB)

**Steps:**
1. Login as doctor
2. Go to Medical Records
3. Click "View My Requests"
4. Select approved patient from dropdown
5. Click "Create New Record"
6. Fill all fields:
   - Title: `Annual Physical Examination`
   - Record Date: Today's date
   - Diagnosis: `Patient is in good health. No significant findings.`
   - Prescription: `Multivitamin daily, Drink 8 glasses of water`
   - Notes: `Patient reports occasional headaches. Recommend stress management.`
   - Description: `Comprehensive annual checkup including vital signs, blood pressure, heart rate.`
7. Upload file (test.jpg)
8. Click "Create Record"

**Expected Result:**
- ✅ Modal closes
- ✅ Success message: "✅ Medical record created successfully!"
- ✅ Record appears in patient's list
- ✅ File shows with filename and size
- ✅ All fields saved correctly

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 4.2: Create Record - Minimal Required Fields ✅

**Steps:**
1. Create new record
2. Fill ONLY required fields:
   - Title: `Follow-up Visit`
   - Record Date: Today
3. Leave optional fields blank
4. No file upload
5. Submit

**Expected Result:**
- ✅ Record created
- ✅ Optional fields show as empty or "Not set"
- ✅ No errors

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 4.3: Upload Image File (PNG) ✅

**Steps:**
1. Create record
2. Upload PNG file (< 10MB)
3. Submit

**Expected Result:**
- ✅ File uploads successfully
- ✅ Shows: `🖼️ filename.png (XX KB)`
- ✅ "View File" button appears
- ✅ Clicking opens image in new tab

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 4.4: Upload PDF File ✅

**Steps:**
1. Create record
2. Upload PDF file (< 10MB)
3. Submit

**Expected Result:**
- ✅ File uploads successfully
- ✅ Shows: `📑 filename.pdf (XX KB)`
- ✅ "View File" button works
- ✅ PDF opens in new tab

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 4.5: File Size Limit - Over 10MB ❌

**Setup:** Prepare file > 10MB

**Steps:**
1. Try to upload 11MB file
2. Attempt to submit

**Expected Result:**
- ❌ Error: "File size must be less than 10MB"
- ❌ File not uploaded
- ❌ Cannot submit

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 4.6: Unsupported File Type ❌

**Steps:**
1. Try to upload .exe, .zip, or .docx file
2. Check behavior

**Expected Result:**
- ❌ Error: "Only JPEG, PNG, WEBP, and PDF files are allowed"
- ❌ File rejected

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 4.7: Patient Views Own Records ✅

**Setup:** Records created in Tests 4.1-4.4

**Steps:**
1. Logout doctor
2. Login as patient
3. Go to Medical Records page
4. Check list

**Expected Result:**
- ✅ Shows all records created by doctors
- ✅ Shows record details:
  - Title
  - Date
  - Doctor name
  - Doctor specialty
  - File attachment (if any)
- ✅ View and Delete buttons visible

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 4.8: Doctor Views Patient Records (With Access) ✅

**Setup:** Doctor has active approved access

**Steps:**
1. Login as doctor
2. Go to Medical Records
3. View records

**Expected Result:**
- ✅ Shows records for approved patients only
- ✅ Shows patient email/username
- ✅ Can view files
- ✅ Can delete own records
- ❌ Cannot delete other doctor's records

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 4.9: Doctor Cannot View Without Access ❌

**Setup:** Doctor with NO approved access to patient

**Steps:**
1. Login as doctor without any approvals
2. Go to Medical Records

**Expected Result:**
- ❌ Empty state: "No records available"
- ❌ Message: "Request patient access to view and create medical records"
- ❌ No patient records visible

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 4.10: Doctor Cannot Create After Access Expires ❌

**Setup:** Access approved for 30 minutes, wait 31 minutes

**Steps:**
1. Try to create record after expiry
2. Check patient dropdown

**Expected Result:**
- ❌ Patient removed from dropdown
- ❌ Cannot select expired access
- ⚠️ Warning about expired access

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________
- [ ] Skipped (time constraint)

---

### Test 4.11: Records Pagination - 5 Per Page ✅

**Setup:** Create 7 medical records

**Steps:**
1. Go to Medical Records page
2. Check pagination appears
3. Click through pages

**Expected Result:**
- ✅ Page 1: Shows first 5 records
- ✅ Page 2: Shows remaining 2 records
- ✅ Navigation: `« First ‹ Prev 1 [2] Next › Last »`
- ✅ Page info: "Page 1 of 2"

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 4.12: Search Records by Title ✅

**Setup:** Multiple records with different titles

**Steps:**
1. In search box, type: `Annual`
2. Check filtered results

**Expected Result:**
- ✅ Shows only records with "Annual" in title
- ✅ Other records hidden
- ✅ Search is case-insensitive
- ✅ Real-time filtering

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 4.13: Search Records by Diagnosis ✅

**Steps:**
1. Search for text from diagnosis field
2. Example: `headache`

**Expected Result:**
- ✅ Shows records containing "headache" in diagnosis
- ✅ Filters correctly

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 4.14: Search Records by Description ✅

**Steps:**
1. Search for description text
2. Check results

**Expected Result:**
- ✅ Filters by description content
- ✅ Multiple fields searched

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 4.15: Search No Results ❌

**Steps:**
1. Search for non-existent text: `zzzzzzz`
2. Check display

**Expected Result:**
- ❌ Shows empty state
- 🔍 Icon and message: "No matching records"
- 💡 Hint: "Try adjusting your search terms"

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 4.16: View File - Image ✅

**Setup:** Record with image attachment

**Steps:**
1. Click "👁️ View File" button
2. Check opened file

**Expected Result:**
- ✅ Opens in new tab
- ✅ HTTPS URL: `https://localhost:5000/uploads/medical-records/...`
- ✅ Image displays correctly
- ✅ Full resolution visible

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 4.17: View File - PDF ✅

**Setup:** Record with PDF attachment

**Steps:**
1. Click "View File" for PDF
2. Check behavior

**Expected Result:**
- ✅ Opens in new tab
- ✅ PDF renders in browser
- ✅ Can scroll through pages
- ✅ Can download if needed

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 4.18: File Not Found Error Handling ❌

**Setup:** Manually delete file from uploads folder

**Steps:**
1. Delete actual file but keep record
2. Click "View File"

**Expected Result:**
- ❌ Error: "File not found" or 404
- ❌ Graceful error handling
- ⚠️ User notified

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 4.19: Patient Deletes Own Record ✅

**Steps:**
1. Login as patient
2. Find a record
3. Click "🗑️ Delete"
4. Confirm dialog

**Expected Result:**
- ⚠️ Confirmation: "Are you sure you want to delete this medical record? This action cannot be undone."
- ✅ After confirm: Record deleted
- ✅ Removed from list immediately
- ✅ File also deleted from server

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 4.20: Doctor Deletes Own Record ✅

**Steps:**
1. Login as doctor
2. Find record YOU created
3. Delete it

**Expected Result:**
- ✅ Can delete own records
- ✅ Confirmation dialog appears
- ✅ Record deleted successfully

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 4.21: Doctor Cannot Delete Other Doctor's Records ❌

**Setup:** Two doctors, both with access to same patient

**Steps:**
1. Doctor A creates record
2. Logout, login as Doctor B
3. Try to delete Doctor A's record

**Expected Result:**
- ❌ Delete button not visible OR
- ❌ Error if attempted: "Access denied"
- ❌ Record not deleted

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 4.22: Cancel Delete Operation ✅

**Steps:**
1. Click "Delete"
2. In confirmation dialog, click "Cancel"

**Expected Result:**
- ✅ Dialog closes
- ✅ Record NOT deleted
- ✅ Remains in list

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 4.23: Record Count Stats ✅

**Setup:** Create multiple records

**Steps:**
1. Check top stats bar on records page
2. Verify counts

**Expected Result:**
- ✅ Shows: "📊 X Total Records"
- ✅ Count updates after create/delete
- ✅ Patient sees: Healthcare providers count

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 4.24: Record Display - All Fields Present ✅

**Setup:** Record with all fields filled

**Steps:**
1. View record card
2. Check all sections display

**Expected Result:**
- ✅ Title with icon
- ✅ Record date
- ✅ File attachment badge (if any)
- ✅ Doctor/Patient info
- ✅ Diagnosis section
- ✅ Prescription section
- ✅ Notes section
- ✅ Description section
- ✅ Action buttons (View File, Delete)

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 4.25: Empty State - No Records ✅

**Setup:** Patient with zero records

**Steps:**
1. View medical records page
2. Check display

**Expected Result:**
- 📋 Empty state icon
- 📋 Message: "No medical records yet"
- 💡 Hint: "Your doctor will create records for you after receiving your approval"

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

## Section 5: Emergency QR Testing

**Priority:** HIGH  
**Estimated Time:** 45 minutes  
**Tests:** 15

### Test 5.1: Generate QR with 1 Hour Expiry ✅

**Setup:** Login as patient

**Steps:**
1. Scroll to "Emergency QR Code" section
2. Select duration: `1 Hour`
3. Select access level: `Emergency Info (Allergies, Blood Group, Recent Records)`
4. Click "🚨 Generate Emergency QR Code"

**Expected Result:**
- ✅ QR code image appears
- ✅ Shareable link shown
- ✅ Expiry time = Current time + 1 hour
- ✅ Details show:
  - Expires: [timestamp]
  - Duration: 1 hours
  - Access Level: emergency
- ✅ Download and Print buttons appear

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 5.2: Generate QR with 24 Hours (Recommended) ✅

**Steps:**
1. Select: `24 Hours (Recommended)`
2. Generate

**Expected Result:**
- ✅ Expiry = Current time + 24 hours
- ✅ Duration shows: 24 hours
- ✅ Works correctly

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 5.3: Generate QR with 7 Days ✅

**Steps:**
1. Select: `7 Days`
2. Generate

**Expected Result:**
- ✅ Expiry = Current time + 7 days (168 hours)
- ✅ Works correctly

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 5.4: Access Level - Emergency Info ✅

**Steps:**
1. Select: `Emergency Info (Allergies, Blood Group, Recent Records)`
2. Generate QR
3. Open link in incognito browser

**Expected Result:**
- ✅ Shows patient info:
  - Email
  - Date of birth
  - Blood group
  - Allergies
  - Emergency contact name & number
- ❌ Does NOT show all medical records
- ✅ Read-only access message

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 5.5: Access Level - Summary ✅

**Steps:**
1. Select: `Summary (Last 5 Records Only)`
2. Generate and test

**Expected Result:**
- ✅ Shows emergency info
- ✅ Shows last 5 medical records only
- ❌ Older records not visible

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 5.6: Access Level - All Records ⚠️

**Steps:**
1. Select: `All Records (Complete Medical History)`
2. Generate and test

**Expected Result:**
- ✅ Shows all patient info
- ✅ Shows ALL medical records
- ⚠️ Warning displayed about full access

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 5.7: QR Link Opens Without Login ✅ CRITICAL

**Steps:**
1. Copy emergency link
2. Open in incognito/private browser (NOT logged in)
3. Access page

**Expected Result:**
- ✅ Page loads without login
- ✅ No authentication required
- ✅ Shows emergency medical info
- ✅ Header shows: "🚨 Emergency Medical Records - Read-Only Access"
- ✅ Footer: "🔒 This is a secure, time-limited view..."

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 5.8: View Tracking - Usage Count ✅

**Steps:**
1. Generate QR
2. Open link 3 times in different browsers
3. Check "Active Emergency QR Codes" section

**Expected Result:**
- ✅ "Used: 3 times" increments correctly
- ✅ Each view tracked
- ✅ Real-time updates

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 5.9: Active QR Codes List ✅

**Setup:** Generate 2-3 different QR codes

**Steps:**
1. Check "Active Emergency QR Codes" section
2. Verify list displays

**Expected Result:**
- ✅ Shows all active QR codes
- ✅ Each shows:
  - Created: [timestamp]
  - Expires: [timestamp]
  - Used: X times
  - Revoke button
- ✅ Most recent at top

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 5.10: Revoke QR Code ✅

**Steps:**
1. Find active QR code
2. Click "🗑️ Revoke"
3. Confirm

**Expected Result:**
- ✅ QR removed from active list
- ✅ Link no longer works
- ❌ Accessing revoked link shows error

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 5.11: Expired QR Shows Error ⏰

**Setup:** QR with 1 hour expiry, wait 61 minutes

**Steps:**
1. Access expired QR link

**Expected Result:**
- ❌ Error page: "This emergency access link has expired"
- ❌ No data shown
- 💡 Suggestion to contact patient for new link

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________
- [ ] Skipped (time constraint)

---

### Test 5.12: Copy Link Button ✅

**Steps:**
1. Generate QR
2. Click "📋 Copy Link" button
3. Paste in new browser

**Expected Result:**
- ✅ Link copied to clipboard
- ✅ Notification: "Link copied!"
- ✅ Pasted link works

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 5.13: Download QR Code ✅

**Steps:**
1. Click "💾 Download QR Code"
2. Check downloaded file

**Expected Result:**
- ✅ PNG file downloads
- ✅ Filename includes date/time
- ✅ QR code is scannable
- ✅ Good resolution

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 5.14: Print QR Code ✅

**Steps:**
1. Click "🖨️ Print QR Code"
2. Check print preview

**Expected Result:**
- ✅ Print dialog opens
- ✅ QR code visible in preview
- ✅ Includes patient info
- ✅ Includes expiry time

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 5.15: QR Code Scanning with Mobile ✅

**Steps:**
1. Generate QR code
2. Use phone camera or QR scanner app
3. Scan the QR

**Expected Result:**
- ✅ QR scans successfully
- ✅ Opens emergency link in mobile browser
- ✅ Page is mobile-responsive
- ✅ All info readable on small screen

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

## Section 6: Two-Factor Authentication

**Priority:** HIGH  
**Estimated Time:** 30 minutes  
**Tests:** 10

### Test 6.1: Enable 2FA - QR Generation ✅

**Setup:** Login as any user

**Steps:**
1. Go to Dashboard
2. Click "🔐 2FA Settings"
3. Modal opens with QR code

**Expected Result:**
- ✅ QR code displays
- ✅ Instructions: "Use Google Authenticator or Authy to scan this QR code"
- ✅ "Next: Verify Code →" button visible
- ✅ QR is scannable

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 6.2: Scan QR with Authenticator App ✅

**Setup:** Google Authenticator or Authy installed on phone

**Steps:**
1. Open authenticator app
2. Add new account
3. Scan QR code from screen

**Expected Result:**
- ✅ App recognizes QR
- ✅ Adds account: "Universal Medical Wallet (email@example.com)"
- ✅ Generates 6-digit codes
- ✅ Code changes every 30 seconds

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 6.3: Verify 2FA with Correct Code ✅

**Steps:**
1. After scanning QR
2. Click "Next: Verify Code →"
3. Enter current 6-digit code from app
4. Submit

**Expected Result:**
- ✅ Success: "Two-factor authentication enabled successfully!"
- ✅ Shows backup codes
- ✅ Prompt to save backup codes
- ✅ Modal shows "2FA is now active"

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 6.4: 2FA Enabled Confirmation ✅

**Steps:**
1. After enabling 2FA
2. Check dashboard
3. Check 2FA settings

**Expected Result:**
- ✅ Dashboard shows: "Two-Factor Auth: ✅ Enabled"
- ✅ 2FA Settings button shows status
- ✅ Option to disable 2FA appears

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 6.5: Login Requires 2FA Code ✅

**Setup:** 2FA enabled account

**Steps:**
1. Logout
2. Login with email & password
3. Check next screen

**Expected Result:**
- ⏸️ After password: "Enter 2FA Code" screen
- 🔢 Input field for 6-digit code
- 💡 Hint: "Enter code from your authenticator app"
- 🔑 "Use Backup Code" link visible

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 6.6: Login with Correct 2FA Code ✅

**Steps:**
1. At 2FA code prompt
2. Enter current code from app
3. Submit

**Expected Result:**
- ✅ Login successful
- ✅ Redirects to dashboard
- ✅ Full access granted

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 6.7: Login with Wrong 2FA Code ❌

**Steps:**
1. Enter incorrect code: `000000`
2. Submit

**Expected Result:**
- ❌ Error: "Invalid authentication code"
- ❌ Remains on 2FA screen
- ❌ Can try again
- ⚠️ After 3-5 attempts: Rate limiting

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 6.8: Use Backup Code ✅

**Setup:** Save backup codes when enabling 2FA

**Steps:**
1. At 2FA login screen
2. Click "Use Backup Code"
3. Enter one of the backup codes
4. Submit

**Expected Result:**
- ✅ Login successful with valid backup code
- ⚠️ Backup code is consumed (can't reuse)
- 💡 Warning: "You have X backup codes remaining"

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 6.9: Regenerate Backup Codes ✅

**Steps:**
1. Login with 2FA
2. Go to 2FA Settings
3. Click "Regenerate Backup Codes"
4. Confirm

**Expected Result:**
- ✅ New set of backup codes generated
- ⚠️ Old backup codes invalidated
- 💾 Prompt to save new codes
- ✅ Shows 10 new codes

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 6.10: Disable 2FA ✅

**Steps:**
1. Go to 2FA Settings
2. Click "Disable 2FA"
3. Enter password to confirm
4. Submit

**Expected Result:**
- ⚠️ Confirmation required
- ✅ Success: "Two-factor authentication disabled"
- ✅ Login no longer requires code
- ✅ Backup codes invalidated
- ✅ Can re-enable later

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

## Section 7: Admin Testing

**Priority:** MEDIUM  
**Estimated Time:** 30 minutes  
**Tests:** 10

### Test 7.1: Admin Login ✅

**Steps:**
1. Login with admin credentials
2. Check access

**Expected Result:**
- ✅ Login successful
- ✅ Dashboard shows "Admin" role
- ✅ Access to Admin menu/page

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 7.2: View All Users List ✅

**Steps:**
1. Go to Admin Dashboard
2. Check users list

**Expected Result:**
- ✅ Shows all registered users
- ✅ Displays: Email, Role, Status
- ✅ Separate sections for Patients/Doctors
- ✅ Search functionality

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 7.3: View Pending Doctor Verifications ✅

**Steps:**
1. Check "Pending Verifications" tab
2. View unverified doctors

**Expected Result:**
- ✅ Lists all unverified doctors
- ✅ Shows doctor details:
  - Name
  - Specialty
  - License number
  - Hospital
- ✅ "Verify" button for each

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 7.4: Verify Doctor Profile ✅

**Steps:**
1. Find pending doctor
2. Review information
3. Click "Verify"
4. Confirm

**Expected Result:**
- ✅ Success: "Doctor verified successfully"
- ✅ Doctor removed from pending list
- ✅ Email sent to doctor
- ✅ Doctor can now request patient access

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 7.5: Verified Doctor Can Create Records ✅

**Steps:**
1. Logout admin
2. Login as newly verified doctor
3. Check capabilities

**Expected Result:**
- ✅ Status shows: "✅ Verified"
- ✅ Can search for patients
- ✅ Can request access
- ✅ Can create records (after approval)

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 7.6: Delete User - Confirmation Required ⚠️

**Steps:**
1. As admin, find a user
2. Click "Delete" button
3. Check confirmation

**Expected Result:**
- ⚠️ Confirmation dialog: "Are you sure you want to delete this user? This will delete all their data."
- ⚠️ Requires typing user email to confirm
- ❌ Cancel option available

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 7.7: Delete User - Complete Deletion ✅

**Steps:**
1. Confirm user deletion
2. Check database
3. Try to login as deleted user

**Expected Result:**
- ✅ User removed from list
- ✅ All associated data deleted:
  - Profile
  - Medical records
  - Access requests
  - QR codes
- ❌ Cannot login anymore
- ❌ Email becomes available for new registration

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 7.8: User Count Stats ✅

**Steps:**
1. Check admin dashboard header
2. Verify counts

**Expected Result:**
- ✅ Total Users: X
- ✅ Patients: Y
- ✅ Doctors: Z
- ✅ Pending Verifications: W
- ✅ Counts update after actions

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 7.9: Cannot Delete Admin Account ❌

**Steps:**
1. As admin, try to delete own account
2. Attempt deletion

**Expected Result:**
- ❌ Error: "Cannot delete your own admin account"
- ❌ Delete button disabled for self
- ⚠️ Safety measure

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 7.10: Non-Admin Cannot Access Admin Page ❌

**Steps:**
1. Login as patient or doctor
2. Try to access: `http://localhost:3000/admin`

**Expected Result:**
- ❌ Redirect to dashboard
- ❌ Error: "Access denied"
- ❌ Cannot view admin features

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

## Section 8: UI/UX Testing

**Priority:** MEDIUM  
**Estimated Time:** 1 hour  
**Tests:** 15

### Test 8.1: Mobile View - iPhone (375px) ✅

**Steps:**
1. Open DevTools (F12)
2. Toggle device toolbar
3. Select "iPhone 12 Pro"
4. Navigate through all pages

**Expected Result:**
- ✅ All pages responsive
- ✅ No horizontal scroll
- ✅ Buttons accessible
- ✅ Forms usable
- ✅ Text readable
- ✅ Modals work correctly

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 8.2: Tablet View - iPad (768px) ✅

**Steps:**
1. Select "iPad" in device toolbar
2. Test all pages

**Expected Result:**
- ✅ Layout adapts to tablet
- ✅ Two-column layouts where appropriate
- ✅ Touch-friendly buttons
- ✅ Good use of space

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 8.3: Desktop View - Full HD (1920x1080) ✅

**Steps:**
1. Test on full desktop resolution
2. Check all pages

**Expected Result:**
- ✅ Content centered
- ✅ Proper max-width containers
- ✅ No wasted space
- ✅ Professional appearance

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 8.4: Small Laptop (1366x768) ✅

**Steps:**
1. Resize browser to 1366x768
2. Test navigation

**Expected Result:**
- ✅ Everything fits
- ✅ No scrolling issues
- ✅ Modals fit on screen

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 8.5: Navigation - Dashboard Link ✅

**Steps:**
1. From any page, click "Dashboard"
2. Check redirect

**Expected Result:**
- ✅ Goes to dashboard
- ✅ Active link highlighted
- ✅ Correct page loads

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 8.6: Navigation - Records Link ✅

**Steps:**
1. Click "Records" in nav
2. Check page

**Expected Result:**
- ✅ Goes to Medical Records page
- ✅ Active link highlighted
- ✅ Correct role-based view

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 8.7: Logout Functionality ✅

**Steps:**
1. Click "Logout" button
2. Observe behavior

**Expected Result:**
- ✅ Redirects to login
- ✅ Session cleared
- ✅ Cannot go back to dashboard

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 8.8: Browser Back Button ✅

**Steps:**
1. Navigate: Login → Dashboard → Records
2. Click browser back button twice
3. Check behavior

**Expected Result:**
- ✅ Goes to previous pages correctly
- ✅ No app crashes
- ✅ State maintained
- ❌ Cannot go back to login when logged in

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 8.9: Page Refresh Maintains State ✅

**Steps:**
1. Login and navigate to any page
2. Press F5 (refresh)
3. Check state

**Expected Result:**
- ✅ Stays logged in
- ✅ Page reloads correctly
- ✅ Data persists
- ✅ No errors

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 8.10: Loading Spinner During API Calls ✅

**Steps:**
1. Perform actions that trigger API calls:
   - Login
   - Load records
   - Create record
2. Watch for loading indicators

**Expected Result:**
- ✅ Spinner shows during loading
- ✅ UI blocked during load
- ✅ Spinner disappears when complete
- ✅ No flash of content

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 8.11: Error Messages Display ❌

**Steps:**
1. Trigger errors:
   - Wrong password
   - Invalid form data
   - Network error
2. Check error display

**Expected Result:**
- ❌ Clear error messages
- ❌ Red color / danger styling
- ❌ Specific error text
- ❌ User understands what went wrong

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 8.12: Success Messages Display ✅

**Steps:**
1. Complete successful actions:
   - Create record
   - Approve request
   - Update profile
2. Check success messages

**Expected Result:**
- ✅ Green success messages
- ✅ Clear confirmation
- ✅ Auto-dismiss after 3-5 seconds
- ✅ Doesn't block UI

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 8.13: Form Validation - Required Fields ❌

**Steps:**
1. Try to submit forms without required fields:
   - Registration
   - Login
   - Create record
2. Check validation

**Expected Result:**
- ❌ Cannot submit
- ❌ Required fields marked with *
- ❌ HTML5 validation messages
- ❌ Clear indication of what's missing

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 8.14: Helpful Placeholder Text ✅

**Steps:**
1. Check all input fields
2. Verify placeholder text

**Expected Result:**
- ✅ All inputs have helpful placeholders
- ✅ Examples provided where useful
- ✅ Clear formatting hints
- ✅ Not too wordy

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 8.15: Cancel Buttons Work ✅

**Steps:**
1. Open modals/forms
2. Click "Cancel" or "Close" buttons
3. Check behavior

**Expected Result:**
- ✅ Modal closes
- ✅ No data saved
- ✅ Form resets
- ✅ Returns to previous state

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

## Section 9: Security Testing

**Priority:** CRITICAL  
**Estimated Time:** 45 minutes  
**Tests:** 10

### Test 9.1: Patient Cannot Access Admin Page ❌

**Steps:**
1. Login as patient
2. Manually navigate to: `http://localhost:3000/admin`
3. Check response

**Expected Result:**
- ❌ Access denied
- ❌ Redirects to dashboard
- ❌ Error message shown

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 9.2: Doctor Cannot Access Admin Page ❌

**Steps:**
1. Login as doctor
2. Try to access admin page

**Expected Result:**
- ❌ Access denied
- ❌ Cannot view admin features

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 9.3: Cannot View Other Patient's Records ❌

**Setup:** Two patient accounts

**Steps:**
1. Login as Patient A
2. Note a record ID from Patient B
3. Try to access: `/api/medical/{patient_B_record_id}`

**Expected Result:**
- ❌ 403 Forbidden or 404 Not Found
- ❌ No data returned
- ❌ Access denied

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 9.4: CSRF Token Protection ✅

**Steps:**
1. Open DevTools → Network
2. Attempt form submission
3. Inspect request

**Expected Result:**
- ✅ Request includes `x-csrf-token` header
- ❌ Request without token fails with 403

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 9.5: SQL Injection Attempt ❌

**Steps:**
1. In login form, try:
   - Email: `admin@test.com' OR '1'='1`
   - Password: `anything`
2. Submit

**Expected Result:**
- ❌ Login fails
- ❌ Error: "Invalid credentials"
- ❌ No database error shown
- ✅ Input sanitized

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 9.6: XSS (Cross-Site Scripting) Attempt ❌

**Steps:**
1. In profile fields, try entering:
```
   <script>alert('XSS')</script>
```
2. Save and view profile

**Expected Result:**
- ❌ Script does NOT execute
- ✅ Displayed as plain text
- ✅ Input sanitized/escaped

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 9.7: Rate Limiting on Login ⏰

**Steps:**
1. Attempt login with wrong password 10 times rapidly
2. Check response

**Expected Result:**
- ⏰ After 5-10 attempts: "Too many requests"
- ⏰ Must wait before trying again
- ✅ Prevents brute force

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 9.8: Session Expiry After Inactivity ⏰

**Steps:**
1. Login
2. Leave browser open for 1+ hours
3. Try to access protected page

**Expected Result:**
- ⏰ Session expires
- ❌ Redirects to login
- 💡 Message: "Session expired. Please login again."

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________
- [ ] Skipped (time constraint)

---

### Test 9.9: Refresh Token Rotation ✅

**Steps:**
1. Login
2. Check localStorage/cookies for tokens
3. Refresh page
4. Check if tokens rotate

**Expected Result:**
- ✅ Access token refreshes
- ✅ Refresh token rotates
- ✅ Security best practice

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 9.10: HTTPS Enforced ✅

**Steps:**
1. Try to access: `http://localhost:5000/...`
2. Check behavior

**Expected Result:**
- ✅ HTTP redirects to HTTPS
- ✅ Backend only serves HTTPS
- ✅ SSL certificate warning (expected for localhost)

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

## Section 10: Pagination Testing

**Priority:** MEDIUM  
**Estimated Time:** 20 minutes  
**Tests:** 8

### Test 10.1: Access Requests - 5 Per Page ✅

**Setup:** Create 7 access requests

**Steps:**
1. View access requests (doctor or patient side)
2. Check pagination

**Expected Result:**
- ✅ Page 1: Shows requests 1-5
- ✅ Pagination appears
- ✅ "Next" button enabled
- ✅ "Prev" button disabled

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 10.2: Click "Next" Button ✅

**Steps:**
1. On page 1, click "Next ›"
2. Check result

**Expected Result:**
- ✅ Goes to page 2
- ✅ Shows requests 6-7
- ✅ Page 2 highlighted: `[2]`
- ✅ "Prev" now enabled

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 10.3: Click "First" Button ✅

**Steps:**
1. From page 2, click "« First"
2. Check result

**Expected Result:**
- ✅ Goes to page 1
- ✅ Shows first 5 items
- ✅ Page 1 highlighted

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 10.4: Click "Last" Button ✅

**Steps:**
1. From page 1, click "Last »"
2. Check result

**Expected Result:**
- ✅ Goes to last page
- ✅ Shows remaining items
- ✅ "Next" disabled

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 10.5: Page Info Display ✅

**Steps:**
1. Check pagination info text
2. Navigate between pages

**Expected Result:**
- ✅ Shows: "Page 1 of 2"
- ✅ Updates when navigating
- ✅ Accurate page count

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 10.6: Medical Records - 5 Per Page ✅

**Setup:** Create 8 medical records

**Steps:**
1. Go to Medical Records page
2. Check pagination

**Expected Result:**
- ✅ Shows 5 records per page
- ✅ 2 pages total
- ✅ Pagination works same as requests

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 10.7: Pagination Hides When ≤5 Items ✅

**Setup:** Only 3-4 records/requests

**Steps:**
1. View page with few items
2. Check for pagination

**Expected Result:**
- ✅ No pagination shown
- ✅ All items on one page
- ✅ Clean UI

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 10.8: Direct Page Number Click ✅

**Setup:** 15+ items (3+ pages)

**Steps:**
1. Click page number: `3`
2. Check result

**Expected Result:**
- ✅ Jumps directly to page 3
- ✅ Shows correct items
- ✅ Page 3 highlighted

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

## Section 11: Edge Cases & Error Handling

**Priority:** MEDIUM  
**Estimated Time:** 1 hour  
**Tests:** 15

### Test 11.1: Very Long Username (30 chars) ✅

**Steps:**
1. Register with username: `abcdefghijklmnopqrstuvwxyz1234`
2. Check display

**Expected Result:**
- ✅ Accepts 30 characters
- ✅ Displays correctly everywhere
- ✅ No truncation issues

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 11.2: Very Short Username (3 chars) ✅

**Steps:**
1. Register with username: `abc`
2. Check acceptance

**Expected Result:**
- ✅ Accepts 3 characters (minimum)
- ✅ Works correctly

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 11.3: Username with Special Characters ❌

**Steps:**
1. Try usernames:
   - `test_user` (✅ allowed)
   - `test-user` (✅ allowed)
   - `test.user` (❌ not allowed)
   - `test@user` (❌ not allowed)
   - `test user` (❌ not allowed)

**Expected Result:**
- ✅ Underscore and dash allowed
- ❌ Other special chars rejected
- ❌ Spaces not allowed

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 11.4: Empty Search Returns All ✅

**Steps:**
1. In records search, clear search box
2. Check results

**Expected Result:**
- ✅ Shows all records
- ✅ No filtering applied
- ✅ Works normally

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 11.5: Network Error During Upload ❌

**Steps:**
1. Start uploading large file
2. Disable network mid-upload (DevTools → Offline)
3. Check behavior

**Expected Result:**
- ❌ Error message: "Network error. Please check your connection."
- ❌ Upload fails gracefully
- ✅ Can retry

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 11.6: File Upload Interrupted ❌

**Steps:**
1. Start upload
2. Click "Cancel" or close browser
3. Check server

**Expected Result:**
- ❌ Partial file not saved
- ✅ Server cleanup works
- ✅ No orphaned files

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 11.7: Concurrent Access by Multiple Doctors ✅

**Setup:** 2 doctors, same patient

**Steps:**
1. Doctor A gets approved access
2. Doctor B gets approved access
3. Both create records simultaneously

**Expected Result:**
- ✅ Both can access
- ✅ Both can create records
- ✅ No conflicts
- ✅ Records saved correctly

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 11.8: Request Approved While Doctor Viewing ⏰

**Steps:**
1. Doctor sends request
2. Doctor views "My Requests" (stays on page)
3. Patient approves in another browser
4. Doctor refreshes

**Expected Result:**
- ✅ Status updates after refresh
- ✅ Shows as approved
- ✅ Create section appears

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 11.9: Access Expires While Viewing Records ⏰

**Setup:** 30-minute access, wait 31 minutes

**Steps:**
1. Doctor viewing records
2. Access expires
3. Try to create new record

**Expected Result:**
- ❌ Error: "Access expired"
- ❌ Cannot create record
- 💡 Prompt to request again

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________
- [ ] Skipped (time constraint)

---

### Test 11.10: Delete Already-Deleted Record ❌

**Steps:**
1. Delete a record
2. In another browser tab (same user), try to delete same record
3. Check error handling

**Expected Result:**
- ❌ Error: "Record not found"
- ❌ Graceful handling
- ✅ No crash

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 11.11: Invalid QR Token ❌

**Steps:**
1. Access: `http://localhost:3000/emergency/invalidtoken123`
2. Check response

**Expected Result:**
- ❌ Error page: "Invalid emergency access link"
- ❌ No data shown
- 💡 Helpful message

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 11.12: Malformed API Request ❌

**Steps:**
1. Using browser console or Postman
2. Send invalid JSON to API
3. Check response

**Expected Result:**
- ❌ 400 Bad Request
- ❌ Clear error message
- ❌ No server crash

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 11.13: Missing CSRF Token ❌

**Steps:**
1. Intercept request (DevTools)
2. Remove `x-csrf-token` header
3. Send request

**Expected Result:**
- ❌ 403 Forbidden
- ❌ Error: "Invalid CSRF token"
- ❌ Request rejected

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 11.14: Expired Session Handling ⏰

**Steps:**
1. Login
2. Manually expire JWT token (wait or modify)
3. Try to access protected resource

**Expected Result:**
- ❌ 401 Unauthorized
- ❌ Redirects to login
- 💡 Message: "Session expired"

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________
- [ ] Skipped (time constraint)

---

### Test 11.15: Browser Back/Forward During Forms ✅

**Steps:**
1. Fill out form halfway
2. Click browser back button
3. Click forward button
4. Check form state

**Expected Result:**
- ✅ Form data preserved OR
- ⚠️ Warning about losing data
- ✅ No crashes

**Actual Result:**
- [ ] Pass
- [ ] Fail - Details: _______________

---

## Bug Reporting Template

When you find a bug, document it using this template:

### Bug Report Format:
```
Bug ID: BUG-001
Title: [Short description]
Severity: Critical / High / Medium / Low
Test Section: [Section number and name]
Test Number: [e.g., Test 4.5]

Steps to Reproduce:
1. [Step 1]
2. [Step 2]
3. [Step 3]

Expected Result:
[What should happen]

Actual Result:
[What actually happens]

Environment:
- Browser: [Chrome/Firefox/Safari] Version: [XX]
- OS: [Windows/Mac/Linux]
- Screen Size: [Desktop/Tablet/Mobile]

Screenshots:
[Attach if applicable]

Console Errors:
[Copy any error messages]

Additional Notes:
[Any other relevant information]
```

### Example Bug Report:
```
Bug ID: BUG-001
Title: Username not displaying in access requests
Severity: Medium
Test Section: Section 3 - Access Request Testing
Test Number: Test 3.4

Steps to Reproduce:
1. Login as doctor
2. Create access request
3. Click "View My Requests"
4. Check patient username display

Expected Result:
Should show: @patient_alice

Actual Result:
Shows: @No username

Environment:
- Browser: Chrome Version: 120
- OS: Windows 11
- Screen Size: Desktop (1920x1080)

Screenshots:
[screenshot.png]

Console Errors:
None

Additional Notes:
Backend is returning username correctly, frontend not displaying it.
```

---

## Testing Summary Sheet

Use this to track overall progress:

### Overall Testing Progress:

| Section | Tests | Passed | Failed | Skipped | % Complete |
|---------|-------|--------|--------|---------|------------|
| 1. Authentication | 20 | __ | __ | __ | __% |
| 2. Profiles | 15 | __ | __ | __ | __% |
| 3. Access Requests | 20 | __ | __ | __ | __% |
| 4. Medical Records | 25 | __ | __ | __ | __% |
| 5. Emergency QR | 15 | __ | __ | __ | __% |
| 6. Two-Factor Auth | 10 | __ | __ | __ | __% |
| 7. Admin | 10 | __ | __ | __ | __% |
| 8. UI/UX | 15 | __ | __ | __ | __% |
| 9. Security | 10 | __ | __ | __ | __% |
| 10. Pagination | 8 | __ | __ | __ | __% |
| 11. Edge Cases | 15 | __ | __ | __ | __% |
| **TOTAL** | **188** | **__** | **__** | **__** | **__%** |

### Critical Issues Found: __
### High Priority Issues: __
### Medium Priority Issues: __
### Low Priority Issues: __

### Sign-Off:

- [ ] All critical tests passed
- [ ] All high-priority tests passed
- [ ] Security tests passed
- [ ] Ready for deployment

**Tested By:** _______________  
**Date:** _______________  
**Signature:** _______________

---

## Appendix: Quick Reference

### Test Accounts:
```
Admin: admin@test.com / Admin123!
Doctor1: doctor1@test.com / Doctor123!
Doctor2: doctor2@test.com / Doctor123!
Patient1: patient1@test.com / Patient123!
Patient2: patient2@test.com / Patient123!
```

### Important URLs:
```
Frontend: http://localhost:3000
Backend: https://localhost:5000
Admin: http://localhost:3000/admin
```

### Common Test Data:
```
Blood Groups: A+, A-, B+, B-, AB+, AB-, O+, O-
Phone: +1234567890
Emergency Contact: John Doe
Allergies: Peanuts, Shellfish
License: MD123456
Hospital: City General Hospital
```

---

**END OF TESTING GUIDE**

---

**Version Control:**
- v1.0 - February 18, 2026 - Initial comprehensive testing guide
- Created by: Universal Medical Wallet Team
- Total Tests: 188
- Estimated Testing Time: 6-8 hours

---