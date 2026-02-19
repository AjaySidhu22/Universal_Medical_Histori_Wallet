# 🏥 Universal Medical Wallet

A secure, HIPAA-ready medical records management system with role-based access control, emergency QR codes, and comprehensive patient-doctor workflow.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-13%2B-blue.svg)

---

## 🌟 Features

### **Authentication & Security**
- ✅ Email verification with OTP
- ✅ Two-Factor Authentication (2FA) with QR codes
- ✅ JWT-based authentication with refresh tokens
- ✅ Password reset functionality
- ✅ HTTPS/SSL encryption
- ✅ CSRF protection
- ✅ Rate limiting on sensitive endpoints

### **User Management**
- ✅ Unique username system (@username)
- ✅ Role-based access control (Patient/Doctor/Admin)
- ✅ Doctor profile verification by admin
- ✅ Patient & Doctor profile management
- ✅ Account deletion with cascade

### **Medical Records**
- ✅ Create, view, and delete medical records
- ✅ File attachments (images, PDFs up to 10MB)
- ✅ Diagnosis, prescription, notes, and description fields
- ✅ Search records by title, diagnosis, or description
- ✅ Pagination (5 records per page)
- ✅ HTTPS file viewing

### **Access Control**
- ✅ Doctor-to-patient access requests
- ✅ Patient approval/denial workflow
- ✅ Configurable access durations (30min - 30 days)
- ✅ Automatic expiry handling
- ✅ Search by username or email
- ✅ Email notifications for all actions

### **Emergency QR Codes**
- ✅ Generate time-limited emergency access QR codes
- ✅ No login required for emergency responders
- ✅ Configurable access levels (Emergency Info / Summary / All Records)
- ✅ View tracking and usage analytics
- ✅ Revoke capability
- ✅ Download and print QR codes

### **Admin Panel**
- ✅ User management dashboard
- ✅ Doctor verification system
- ✅ User deletion with confirmation
- ✅ System statistics

---

## 🛠️ Tech Stack

### **Backend**
- **Runtime:** Node.js 16+
- **Framework:** Express.js
- **Database:** PostgreSQL 13+
- **ORM:** Sequelize
- **Authentication:** JWT, bcrypt
- **Email:** Nodemailer (Gmail SMTP)
- **File Upload:** Multer
- **Security:** Helmet, CORS, express-rate-limit
- **Logging:** Winston

### **Frontend**
- **Framework:** React 18
- **Routing:** React Router v6
- **HTTP Client:** Axios
- **Styling:** Custom CSS with CSS Variables
- **QR Generation:** qrcode.react
- **2FA:** speakeasy, qrcode

### **DevOps**
- **Version Control:** Git & GitHub
- **SSL/TLS:** Self-signed certificates (dev), Let's Encrypt (prod)
- **Process Manager:** PM2 (production)

---

## 📋 Prerequisites

- **Node.js:** 16.x or higher
- **PostgreSQL:** 13.x or higher
- **npm:** 8.x or higher
- **Git:** Latest version

---

## 🚀 Installation & Setup

### **1. Clone the Repository**
```bash
git clone https://github.com/AjaySidhu22/Universal_Medical_Histori_Wallet.git
cd Universal_Medical_Histori_Wallet
```

### **2. Backend Setup**
```bash
cd backend

# Install dependencies
npm install

# Create .env file (copy from .env.example)
cp .env.example .env

# Edit .env with your credentials
notepad .env  # Windows
nano .env     # Linux/Mac
```

**Required Environment Variables:**
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=medical_wallet
DB_USER=postgres
DB_PASSWORD=your_password
DB_SSL=false

# Server
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# JWT
JWT_SECRET=your_super_secret_key_here
JWT_REFRESH_SECRET=your_refresh_secret_key_here

# Email (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM="Medical Wallet <your_email@gmail.com>"

# Encryption
ENCRYPTION_KEY=your_32_character_encryption_key
CSRF_SECRET=your_csrf_secret_here
```

**Create PostgreSQL Database:**
```sql
CREATE DATABASE medical_wallet;
```

**Run Migrations:**
```bash
npx sequelize-cli db:migrate
```

**Start Backend:**
```bash
npm run dev
```

Backend will run on: `https://localhost:5000`

---

### **3. Frontend Setup**
```bash
cd ../frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env
notepad .env  # Windows
```

**.env Configuration:**
```env
REACT_APP_API_URL=https://localhost:5000/api
REACT_APP_ENVIRONMENT=development
```

**Start Frontend:**
```bash
npm start
```

Frontend will run on: `http://localhost:3000`

---

## 📚 Usage

### **First-Time Setup**

1. **Register an Account**
   - Go to `http://localhost:3000`
   - Click "Create Account"
   - Enter email, username, password, and role (Patient/Doctor)
   - Verify email with OTP sent to inbox

2. **Create Profile**
   - After login, click "Create Profile Now"
   - Fill in required fields
   - Save profile

3. **For Doctors:**
   - Wait for admin verification
   - Once verified, you can request patient access

4. **For Patients:**
   - Approve/deny doctor access requests
   - Generate emergency QR codes
   - Enable 2FA for extra security

---

## 👥 User Roles

### **Patient**
- Manage personal profile
- Approve/deny doctor access requests
- View medical records
- Generate emergency QR codes
- Enable 2FA

### **Doctor**
- Manage professional profile
- Request patient access (by username/email)
- Create medical records for approved patients
- View patient records (with valid access)
- Enable 2FA

### **Admin**
- Verify doctor profiles
- Manage all users
- Delete users
- View system statistics

---

## 🔐 Security Features

- **Password Requirements:** 8+ characters, uppercase, lowercase, number
- **JWT Tokens:** 15-minute access tokens, 7-day refresh tokens
- **HTTPS:** All traffic encrypted with SSL/TLS
- **CSRF Protection:** Header-based token validation
- **Rate Limiting:** Prevents brute force attacks
- **Input Sanitization:** XSS and SQL injection prevention
- **2FA:** TOTP-based two-factor authentication
- **Atomic Operations:** Email-first registration prevents orphaned accounts
- **Audit Logs:** All critical actions logged

---

## 📊 Database Schema

**Main Tables:**
- `users` - User accounts and authentication
- `patient_profiles` - Patient medical information
- `doctor_profiles` - Doctor credentials and specialties
- `medical_records` - Patient medical records
- `access_requests` - Doctor-patient access control
- `share_tokens` - Emergency QR codes
- `audit_logs` - System audit trail

**Relations:**
- User → PatientProfile (1:1)
- User → DoctorProfile (1:1)
- PatientProfile → MedicalRecord (1:N)
- DoctorProfile → MedicalRecord (1:N)
- DoctorProfile → AccessRequest (1:N)
- PatientProfile → AccessRequest (1:N)
- PatientProfile → ShareToken (1:N)

---

## 🧪 Testing

Comprehensive testing guide available in `TESTING_GUIDE.md`

**Total Tests:** 188 across 11 categories
- Authentication (20 tests)
- Profiles (15 tests)
- Access Requests (20 tests)
- Medical Records (25 tests)
- Emergency QR (15 tests)
- Two-Factor Auth (10 tests)
- Admin (10 tests)
- UI/UX (15 tests)
- Security (10 tests)
- Pagination (8 tests)
- Edge Cases (15 tests)

---

## 📁 Project Structure
```
universal-medical-wallet/
├── backend/
│   ├── migrations/          # Database migrations
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # Route controllers
│   │   ├── middlewares/    # Express middlewares
│   │   ├── models/         # Sequelize models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utility functions
│   ├── ssl/                # SSL certificates (dev)
│   ├── uploads/            # User uploaded files
│   ├── .env.example        # Environment template
│   └── index.js            # Entry point
│
├── frontend/
│   ├── public/             # Static files
│   ├── src/
│   │   ├── api/           # API client
│   │   ├── components/    # React components
│   │   ├── App.js         # Main app component
│   │   └── index.js       # Entry point
│   └── .env.example       # Environment template
│
├── TESTING_GUIDE.md       # Comprehensive testing guide
└── README.md              # This file
```

---

## 🌐 API Endpoints

### **Authentication**
- `POST /api/auth/register` - Register new user
- `POST /api/auth/verify-email` - Verify email with OTP
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password/:token` - Reset password

### **Profiles**
- `GET /api/profile/profile` - Get user profile
- `POST /api/profile/profile` - Create profile
- `PUT /api/profile/profile` - Update profile

### **Medical Records**
- `GET /api/medical` - Get records (paginated)
- `POST /api/medical` - Create record
- `GET /api/medical/:id` - Get single record
- `DELETE /api/medical/:id` - Delete record

### **Access Requests**
- `POST /api/access-requests` - Create access request
- `GET /api/access-requests/my-requests` - Get requests (paginated)
- `PUT /api/access-requests/:id/respond` - Approve/deny request
- `DELETE /api/access-requests/:id` - Cancel request

### **Emergency QR**
- `POST /api/qr/generate` - Generate QR code
- `GET /api/qr/my-codes` - Get active QR codes
- `DELETE /api/qr/:id` - Revoke QR code
- `GET /api/qr/public/:token` - Access emergency data (no auth)

### **Admin**
- `GET /api/admin/users` - List all users
- `GET /api/admin/pending-doctors` - Pending verifications
- `PUT /api/admin/verify-doctor/:id` - Verify doctor
- `DELETE /api/admin/users/:id` - Delete user

### **Two-Factor Auth**
- `POST /api/auth/2fa/generate` - Generate 2FA QR
- `POST /api/auth/2fa/verify` - Verify 2FA code
- `POST /api/auth/2fa/disable` - Disable 2FA
- `POST /api/auth/2fa/backup-codes` - Regenerate backup codes

---

## 🐛 Known Issues & Limitations

- **File Storage:** Currently local storage (use AWS S3 for production)
- **Email Service:** Gmail SMTP (consider SendGrid/AWS SES for production)
- **SSL Certificates:** Self-signed for development (use Let's Encrypt for production)
- **Rate Limiting:** In-memory (use Redis for distributed systems)

---

## 🚀 Deployment

See `PRODUCTION.md` for detailed deployment instructions.

**Quick Deployment Options:**
1. **Free Tier:** Render.com (Backend) + Vercel (Frontend)
2. **Professional:** DigitalOcean Droplet + Domain
3. **Enterprise:** AWS/Azure/GCP with auto-scaling

---

## 👨‍💻 Author

**Ajay Sidhu**
- GitHub: [@AjaySidhu22](https://github.com/AjaySidhu22)
- Email: sidhuajay642@gmail.com

---

## 🙏 Acknowledgments

- Built with Node.js, React, and PostgreSQL
- Inspired by HIPAA compliance requirements
- Designed for emergency medical access scenarios

---

## 📞 Support

For issues, questions, or contributions:
- **GitHub Issues:** [Create an issue](https://github.com/AjaySidhu22/Universal_Medical_Histori_Wallet/issues)
- **Email:** sidhuajay642@gmail.com

---

## 🔄 Changelog

### Version 1.0.0 (February 2026)
- ✅ Initial release
- ✅ Complete authentication system
- ✅ Username-based identification
- ✅ Pagination for all lists
- ✅ Emergency QR codes
- ✅ Two-factor authentication
- ✅ Admin panel
- ✅ Comprehensive testing guide

---

**Made with ❤️ for better healthcare access**
