# Dailygram 2.0 — White Edition

This package contains the cleaned Dailygram 2.0 frontend and backend.

## Frontend

```bash
cd frontend
npm install
npm run dev
```

For production:

```bash
npm run build
npm run preview
```

Create `.env` from `.env.example` and set:

```text
VITE_API_URL=https://YOUR-BACKEND/api
VITE_SOCKET_URL=https://YOUR-BACKEND
VITE_RAZORPAY_KEY_ID=your_public_key
```

## Backend

```bash
cd backend
npm install
npm start
```

Create `.env` from `.env.example` and set:

```text
MONGO_DB=
JWT_SECRET=
JWT_REFRESH_SECRET=
GROQ_API_KEY=
CLIENT_URL=
MESSAGE_ENCRYPTION_KEY=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
```

## Dailygram 2.0 flow

- Learners can browse admin-approved mentors.
- Mentor search can filter by skill.
- Mentorship requests require a future session time.
- Mentor pricing can be ₹0/free or paid.
- Paid mentorship uses Razorpay before chat/video access.
- Mentor verification and marketplace approval are separate admin actions.
- Premium is separate from mentorship payments.
- Chat uses authenticated Socket.IO and encrypted message storage.
- Safi AI supports chat and study planning.
- Admin dashboard manages mentor verification, marketplace approval and premium status.

## Important

The supplied ZIPs contained local environment files. The packaged version intentionally excludes secret `.env` files. Use the included `.env.example` files instead.
