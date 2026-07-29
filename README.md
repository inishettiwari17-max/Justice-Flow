# LegalConnect — Legal Services Platform

A full-stack platform connecting party-involved users with verified advocates.

**🔗 Deployed Backend:** https://justice-flow.onrender.com

## Tech Stack
- **Frontend**: React.js 18, React Router, Socket.io-client, Axios
- **Backend**: Node.js, Express.js, Socket.io, MongoDB (Mongoose)
- **Auth**: JWT + bcrypt
- **File Uploads**: Multer
- **Deployment**: Render (backend)

## Project Structure
```
legal-platform/
├── client/          # React frontend (port 3000)
│   └── src/
│       ├── context/     # Auth + Socket providers
│       ├── pages/       # All page components
│       ├── components/  # Reusable UI
│       └── utils/       # API, helpers
└── server/          # Express backend (port 5000)
    ├── models/      # MongoDB schemas
    ├── routes/      # API endpoints
    ├── middleware/  # Auth, upload
    ├── socket/      # Real-time chat
    └── uploads/     # User files
```

## Environment Variables

### Client (`.env`)
```env
REACT_APP_API_URL=https://justice-flow.onrender.com/api
REACT_APP_SOCKET_URL=https://justice-flow.onrender.com
```

### Server (`.env`)
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/legalplatform
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=7d
CLIENT_URL=https://your-frontend-url.com
```

## Quick Start (Local Development)

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
✅ Advocate & user registration/login (JWT)  
✅ Advocate profiles with verification system  
✅ Document upload for verification  
✅ Advanced search & filters (specialty, location, rating, fee)  
✅ Save/favorite advocates  
✅ Rating & review system with admin moderation  
✅ Real-time one-to-one chat with file sharing  
✅ Consultation request workflow  
✅ Admin panel for verification & moderation  

## Custom Branding
- **Favicon**: Scale of justice SVG icon (gold on blue background)
- **Theme Color**: #1a3c6e (legal blue)
- **Accent Color**: #c9a84c (professional gold)
