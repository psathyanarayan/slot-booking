// src/app.js
const express = require("express");
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");
require("@dotenvx/dotenvx").config();

const seatRoutes = require("./routes/seatRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173", // Your frontend URL
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // Join a room for seat updates
  socket.on("join-seat-room", (data) => {
    socket.join("seat-updates");
    console.log(`Client ${socket.id} joined seat-updates room`);
  });

  // Handle seat selection (optional - for future features)
  socket.on("seat-selected", (data) => {
    socket.broadcast.to("seat-updates").emit("seat-selected", data);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Make io available to routes
app.set("io", io);

// API routes
app.use("/api/seats", seatRoutes);
app.use("/api/users", userRoutes);

module.exports = { app, server };
