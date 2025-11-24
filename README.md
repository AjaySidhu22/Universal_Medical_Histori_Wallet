# 🏥 Universal Medical Wallet

> A secure, full-stack application designed to give patients control over their medical history and enable time-bound sharing with verified healthcare professionals.

## ✨ Key Features & Architectural Highlights

* **Secure Authentication (Dual-Token):** Implements JWT Access Tokens (short-lived) and HTTP-only Refresh Tokens (long-lived) with **Token Rotation** for enhanced session security.
* **Role-Based Access Control (RBAC):** Users are assigned one of three roles (`patient`, `doctor`, `admin`). Access to critical routes (e.g., record creation) is strictly enforced via middleware.
* **Medical Record Sharing (Security Focus):** Patients can generate temporary, revocable links to share their records. The system uses **SHA256 hashing** of the token before storage to prevent database breaches from revealing active share links.
* **Cloud Scalability (AWS S3 Migration):** File uploads (lab reports, images) are streamed directly to **AWS S3**, ensuring the backend remains **stateless** and horizontally scalable. File access is secured via **Pre-Signed S3 URLs**.
* **Doctor Verification Flow:** Doctors must complete a profile and pass an internal `isVerified` check (manually set by Admin) before they are authorized to create official records.
* **Data Integrity:** Uses **Sequelize Transactions** for atomic updates and **DataTypes.ENUM** to restrict critical fields (like `role` and `bloodGroup`) to valid values.

## 🛠️ Tech Stack

### Backend (`/backend`)
* **Runtime:** Node.js (Express)
* **Database (Dev):** SQLite (via `database.sqlite`)
* **Database (Prod):** PostgreSQL (via `pg` driver, configured using `DATABASE_URL`)
* **ORM:** Sequelize
* **Authentication:** `jsonwebtoken`, `bcryptjs`, `cookie-parser`
* **Security/Utility:** `express-rate-limit`, `multer-s3`, `nodemailer`

### Frontend (`/frontend`)
* **Framework:** React
* **Routing:** `react-router-dom`
* **HTTP Client:** Axios (configured with credentials and interceptors)

## 🚀 Quick Start (Running Locally)

### Prerequisites

You need **Node.js (v18+)** and **npm** installed.

### 1. Setup Backend

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create the `.env` file for local secrets (do not push this to Git!):
    ```
    # universal-medical-wallet/backend/.env
    JWT_SECRET=MySuperSecretToken_UMHW@2025!
    PORT=5000
    FRONTEND_URL=http://localhost:3000
    
    # Optional: For Email Service Testing
    EMAIL_USER=...
    EMAIL_PASS=...
    
    # If using AWS S3 for local testing:
    # AWS_ACCESS_KEY_ID=...
    # AWS_SECRET_ACCESS_KEY=...
    # AWS_S3_REGION=us-east-1
    # AWS_S3_BUCKET_NAME=your-local-bucket
    ```
4.  Start the backend server: (It will automatically create the `database.sqlite` file)
    ```bash
    npm run dev
    ```

### 2. Setup Frontend

1.  Open a **new terminal** and navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the React development server:
    ```bash
    npm start
    ```

The application should be accessible in your browser at `http://localhost:3000`.

## 🔒 Initial Credentials for Testing

You can use the Register page to create initial accounts:

| Role | Email | Password | Note |
| :--- | :--- | :--- | :--- |
| **Patient** | `patient@test.com` | `password123` | Can view own profile/records and generate share links. |
| **Doctor** | `doctor@test.com` | `password123` | Can create profiles/records for patients (requires admin verification to be active). |

***

*(End of README.md content)*