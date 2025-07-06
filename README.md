# 🎫 SlotBooking System

A real-time seat booking application built with React, Node.js, Express, MongoDB, and Socket.io. This system allows users to book seats in real-time with concurrency control to prevent double bookings.

![SlotBooking System](src/assets/images/SlotBooking.png)

## ✨ Features

### 🔐 Authentication & Authorization

- User registration and login system
- JWT-based authentication
- Role-based access control (Admin/User)
- Secure password hashing with bcrypt

![User Registration](src/assets/images/Register.png)

### 🪑 Seat Management

- Real-time seat booking with concurrency control
- Bulk seat creation for administrators
- Seat deletion capabilities
- Booking cancellation functionality
- One seat per user policy

### 🌐 Real-time Updates

- Live seat status updates using Socket.io
- Instant notification when seats are booked/cancelled
- Real-time UI synchronization across all connected clients

### 👨‍💼 Admin Panel

- Admin-only seat management
- User management capabilities
- Bulk operations for seat creation
- System overview and monitoring

![Admin Panel](src/assets/images/Admin.png)

## 🏗️ Tech Stack

### Frontend

- **React 19** - Modern React with hooks
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router DOM** - Client-side routing
- **Axios** - HTTP client for API calls
- **Socket.io Client** - Real-time communication
- **Lucide React** - Beautiful icons

### Backend

- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **Socket.io** - Real-time bidirectional communication
- **JWT** - JSON Web Tokens for authentication
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing

## 📁 Project Structure

```
SlotBooking/
├── BE/                          # Backend directory
│   ├── src/
│   │   ├── app.js              # Express app configuration
│   │   ├── index.js            # Server entry point
│   │   ├── config/
│   │   │   └── db.js           # MongoDB connection
│   │   ├── models/
│   │   │   ├── seatModel.js    # Seat schema and model
│   │   │   └── userModel.js    # User schema and model
│   │   ├── routes/
│   │   │   ├── seatRoutes.js   # Seat-related API endpoints
│   │   │   └── userRoutes.js   # User-related API endpoints
│   │   └── middleware/
│   │       └── authMiddleware.js # Authentication middleware
│   ├── package.json
│   └── package-lock.json
├── src/                         # Frontend directory
│   ├── App.jsx                 # Main React component
│   ├── SeatBookingPage.jsx     # User seat booking interface
│   ├── AdminSeatManager.jsx    # Admin seat management interface
│   ├── main.jsx               # React entry point
│   └── assets/
│       └── images/            # Project images
├── public/
├── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn package manager

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd SlotBooking
   ```

2. **Install Frontend Dependencies**

   ```bash
   npm install
   ```

3. **Install Backend Dependencies**

   ```bash
   cd BE
   npm install
   ```

4. **Environment Setup**

   Create a `.env` file in the `BE` directory:

   ```env
   PORT=5001
   MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/slotbooking
   JWT_SECRET=your-super-secret-jwt-key
   ```

5. **Start the Backend Server**

   ```bash
   cd BE
   npm start
   # or
   node src/index.js
   ```

6. **Start the Frontend Development Server**

   ```bash
   # In a new terminal, from the root directory
   npm run dev
   ```

7. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5001

## 📚 API Documentation

### Authentication Endpoints

#### POST `/api/users/create-user`

Create a new user account.

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "1234567890",
  "role": "user"
}
```

#### POST `/api/users/login`

Authenticate user and get JWT token.

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### Seat Management Endpoints

#### GET `/api/seats/get-seats`

Get all seats (requires authentication).

```bash
Authorization: Bearer <jwt-token>
```

#### POST `/api/seats/book-seat`

Book a seat (requires authentication).

```json
{
  "seatId": "seat-id-here",
  "userId": "user-id-here"
}
```

#### POST `/api/seats/cancel-booking`

Cancel a seat booking (requires authentication).

```json
{
  "seatId": "seat-id-here",
  "userId": "user-id-here"
}
```

#### POST `/api/seats/add-bulk-seats`

Add multiple seats (admin only).

```json
{
  "seats": [
    { "seatNumber": "A1" },
    { "seatNumber": "A2" },
    { "seatNumber": "B1" }
  ]
}
```

#### DELETE `/api/seats/delete-seat/:id`

Delete a seat (admin only).

### User Management Endpoints

#### GET `/api/users/get-users`

Get all users (admin only).

#### GET `/api/users/get-user/:id`

Get user by ID (requires authentication).

#### PUT `/api/users/update-user/:id`

Update user information (requires authentication).

#### DELETE `/api/users/delete-user/:id`

Delete user (requires authentication).

## 🔧 Configuration

### Backend Configuration

- **Port**: Default 5001 (configurable via environment variable)
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with 1-hour expiration
- **CORS**: Enabled for frontend communication

### Frontend Configuration

- **Development Server**: Vite dev server on port 5173
- **API Base URL**: http://localhost:5001/api
- **Real-time**: Socket.io connection to backend

## 🎯 Key Features Explained

### Concurrency Control

The system uses MongoDB's atomic operations to prevent race conditions when multiple users try to book the same seat simultaneously:

```javascript
const seat = await Seat.findOneAndUpdate(
  { _id: seatId, isBooked: false },
  {
    $set: {
      isBooked: true,
      "bookingDetails.userId": userId,
      "bookingDetails.bookingTime": new Date(),
    },
    $inc: { __v: 1 },
  },
  { new: true, runValidators: true }
);
```

### Real-time Updates

Socket.io is used to broadcast seat changes to all connected clients:

```javascript
// Emit when seat is booked
io.emit("seatBooked", { seatId, userId, seat });

// Emit when booking is cancelled
io.emit("seatCancelled", { seatId, seat });
```

### One Seat Per User Policy

Users can only book one seat at a time:

```javascript
const existingBooking = await Seat.findOne({
  isBooked: true,
  "bookingDetails.userId": userId,
});

if (existingBooking) {
  return res.status(400).json({
    message:
      "You have already booked a seat. Please cancel your current booking before booking another.",
  });
}
```

## 🛠️ Development

### Available Scripts

**Frontend:**

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

**Backend:**

```bash
npm start            # Start the server
npm run dev          # Start with nodemon (if configured)
```

### Code Style

- ESLint configuration for code quality
- Consistent formatting with Prettier
- React hooks best practices
- Express.js middleware pattern

## 🚀 Deployment

### Backend Deployment

1. Set up environment variables on your hosting platform
2. Configure MongoDB connection string
3. Set JWT secret
4. Deploy to platforms like Heroku, Railway, or AWS

### Frontend Deployment

1. Build the project: `npm run build`
2. Deploy the `dist` folder to platforms like Vercel, Netlify, or AWS S3

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 👨‍💻 Author

**Sathya** - [GitHub Profile]

## 🙏 Acknowledgments

- MongoDB for the database
- Socket.io for real-time functionality
- React team for the amazing framework
- Express.js community for the robust backend framework

---

**Note**: Make sure to replace placeholder values like database URLs, JWT secrets, and repository URLs with your actual values before deployment.
