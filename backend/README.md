# THE SNOOGUMS ACADEMY — BACKEND

## HOW TO RUN THE BACKEND (Step by Step)

### BEFORE YOUR FIRST RUN — Do these once only

**1. Install MySQL**
Download from: https://dev.mysql.com/downloads/installer/
During installation, set a root password. Remember it — you'll need it.

**2. Create the database**
Open MySQL Workbench (or your terminal), then run:
```
mysql -u root -p < models/db.sql
```
This creates the `tsa_academy` database and all tables.

**3. Fill in your .env file**
Open the `.env` file and replace the placeholder values:
- DB_PASSWORD = your MySQL root password
- JWT_SECRET  = run this in your terminal and paste the output:
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
- EMAIL_PASS  = your Gmail App Password (see .env file for instructions)
- PAYSTACK_SECRET_KEY = from your Paystack dashboard
- PAYSTACK_PUBLIC_KEY = from your Paystack dashboard

**4. Install dependencies**
```
npm install
```


### EVERY DAY — Start the server

```
npm run dev
```

You should see:
```
✅ Database connected successfully
╔═══════════════════════════════════════════╗
║   🎓  THE SNOOGUMS ACADEMY - BACKEND       ║
╠═══════════════════════════════════════════╣
║   Server running on port 5000              ║
╚═══════════════════════════════════════════╝
```

Then open your frontend `index.html` with VS Code Live Server (port 5500).


### TEST THE API
Open your browser and visit:
http://localhost:5000/api/health

You should see: {"success":true,"message":"TSA Backend is running"}


### FOLDER STRUCTURE
```
backend/
├── server.js              ← Start here. Runs the server.
├── .env                   ← Your secrets. Never share this file.
├── .gitignore             ← Protects .env from being uploaded to GitHub
├── package.json           ← Lists all npm dependencies
├── config/
│   └── db.js              ← Database connection pool
├── routes/
│   ├── auth.js            ← /api/auth/register, /api/auth/login
│   ├── careers.js         ← /api/careers/apply
│   ├── contact.js         ← /api/contact
│   └── payment.js         ← /api/payment/paystack/*, /api/payment/manual
├── controllers/
│   ├── authController.js     ← Register + Login logic
│   ├── careersController.js  ← CV application logic
│   ├── contactController.js  ← Contact form logic
│   └── paymentController.js  ← Paystack + manual payment logic
├── middleware/
│   ├── auth.js            ← JWT verification (protect + restrictTo)
│   └── upload.js          ← CV file upload handler (Multer)
├── models/
│   └── db.sql             ← All database table definitions
└── uploads/
    └── cvs/               ← Uploaded CV files stored here
```


### DEFAULT ADMIN LOGIN
Email:    admin@snoogums.com
Password: Admin@TSA2025
⚠️  CHANGE THIS PASSWORD immediately after first login.


### API ENDPOINTS SUMMARY

| Method | URL                                   | Auth    | Description                  |
|--------|---------------------------------------|---------|------------------------------|
| POST   | /api/auth/register                    | Public  | Student registration         |
| POST   | /api/auth/login                       | Public  | Login (all roles)            |
| GET    | /api/auth/profile                     | 🔒 JWT  | Get own profile              |
| PATCH  | /api/auth/change-password             | 🔒 JWT  | Change password              |
| POST   | /api/careers/apply                    | Public  | Submit teaching application  |
| POST   | /api/contact                          | Public  | Send contact message         |
| POST   | /api/payment/paystack/initialize      | 🔒 JWT  | Start Paystack payment       |
| GET    | /api/payment/paystack/verify/:ref     | 🔒 JWT  | Verify Paystack payment      |
| POST   | /api/payment/manual                   | 🔒 JWT  | Submit manual payment        |
| GET    | /api/payment/history                  | 🔒 JWT  | View payment history         |
| GET    | /api/health                           | Public  | Server health check          |
