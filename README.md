# LegalConnect — Legal Services Platform

A full-stack platform connecting party-involved users with verified advocates.

## Tech Stack
- **Frontend**: React.js, React Router, Socket.io-client, Axios
- **Backend**: Node.js, Express.js, Socket.io
- **Database**: MongoDB (Mongoose)
- **Auth**: JWT + bcrypt
- **File Uploads**: Multer

## Project Structure
```
legal-platform/
├── server/          # Express backend
│   ├── models/      # MongoDB schemas (User, Advocate, Review, Message, Consultation)
│   ├── routes/      # API routes (auth, advocates, users, reviews, chat, consultations, admin)
│   ├── middleware/  # JWT auth, file upload (Multer)
│   ├── socket/      # Socket.io real-time chat
│   └── uploads/     # Uploaded files (profiles, documents, chat)
└── client/          # React frontend
    └── src/
        ├── context/ # Auth + Socket context providers
        ├── pages/   # All page components
        ├── components/  # Reusable UI components
        └── utils/   # API instance, helpers
```

## Quick Start

### 1. Prerequisites
- Node.js v18+
- MongoDB running locally on port 27017

### 2. Start the Backend
```bash
cd server
npm install
npm run dev       # starts on http://localhost:5000
```

### 3. Start the Frontend
```bash
cd client
npm install
npm start         # starts on http://localhost:3000
```

## Features
- Advocate & user registration/login (JWT)
- Advocate profile with specialty, experience, fee, languages, bio, education, case history
- Document upload for verification
- Advocate search & filter (specialty, location, language, rating, fee, availability)
- Save/favorite advocates
- Rating & review system with admin moderation
- Real-time one-to-one chat with file sharing (Socket.io)
- Consultation request system
- Admin panel: verify advocates, manage users, moderate reviews

## Default Admin Account
To create an admin, register normally then manually update the role in MongoDB:
```js
db.users.updateOne({ email: "admin@example.com" }, { $set: { role: "admin" } })
```
