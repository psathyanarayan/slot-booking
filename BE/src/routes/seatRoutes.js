// src/routes/seatRoutes.js
const express = require("express");
const router = express.Router();
const Seat = require("../models/seatModel");
const Validation = require("../models/validationModel");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middleware/authMiddleware");
const io = require("../app").io; // Assuming you have set up socket.io in your app.js

// Get all seats
router.get("/get-seats", authenticateToken, async (req, res) => {
  try {
    const seats = await Seat.find();
    res.status(200).json(seats);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching seats", error: error.message });
  }
});
//Add bulk seats
router.post(
  "/add-bulk-seats",
  authenticateToken,
  authorizeRoles("admin"),
  async (req, res) => {
    const { seats } = req.body; // Expecting an array
    if (!Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({ message: "Invalid seats data" });
    }
    try {
      const seatDocuments = seats.map((seat) => ({
        seatNumber: seat.seatNumber,
        isBooked: false,
        bookingDetails: {
          userId: null,
          bookingTime: null,
        },
        version: 0, // Initialize version for concurrency control
      }));
      const savedSeats = await Seat.insertMany(seatDocuments);
      res.status(201).json({
        message: "Seats added successfully",
        seats: savedSeats.map((seat) => ({
          id: seat._id,
          seatNumber: seat.seatNumber,
          isBooked: seat.isBooked,
          bookingDetails: seat.bookingDetails,
        })),
      });
    } catch (error) {
      console.error("Error adding bulk seats:", error);
      res
        .status(500)
        .json({ message: "Error adding bulk seats", error: error.message });
    }
  }
);

// Delete a seat
router.delete(
  "/delete-seat/:id",
  authenticateToken,
  authorizeRoles("admin"),
  async (req, res) => {
    const seatId = req.params.id;
    if (!seatId) {
      return res.status(400).json({ message: "Seat ID is required" });
    }
    try {
      const deletedSeat = await Seat.findByIdAndDelete(seatId);
      if (!deletedSeat) {
        return res.status(404).json({ message: "Seat not found" });
      }
      res.status(200).json({
        message: "Seat deleted successfully",
        seatId: deletedSeat._id,
      });
    } catch (error) {
      console.error("Error deleting seat:", error);
      res
        .status(500)
        .json({ message: "Error deleting seat", error: error.message });
    }
  }
);
// Book a seat with concurrency control
router.post("/book-seat", authenticateToken, async (req, res) => {
  const { seatId, userId } = req.body;

  if (!seatId || !userId) {
    return res
      .status(400)
      .json({ message: "Seat ID and User ID are required" });
  }

  try {
    // 1️⃣ Check if user has already booked a seat
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

    // 2️⃣ Book the seat atomically
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

    if (!seat) {
      return res.status(409).json({
        message: "Seat is already booked or not found",
        error: "CONCURRENT_BOOKING",
      });
    }

    // 3️⃣ Emit to frontend clients
    const io = req.app.get("io");
    io.emit("seatBooked", { seatId, userId, seat });

    console.log("Seat booked successfully");

    // 4️⃣ Return response
    res.status(200).json({
      message: "Seat booked successfully",
      seat: {
        id: seat._id,
        seatNumber: seat.seatNumber,
        isBooked: seat.isBooked,
        bookingDetails: seat.bookingDetails,
      },
    });
  } catch (error) {
    console.error("Booking error:", error);
    res
      .status(500)
      .json({ message: "Error booking seat", error: error.message });
  }
});
// Cancel booking
router.post("/cancel-booking", authenticateToken, async (req, res) => {
  const { seatId, userId } = req.body;

  if (!seatId || !userId) {
    return res
      .status(400)
      .json({ message: "Seat ID and User ID are required" });
  }

  try {
    const seat = await Seat.findOneAndUpdate(
      {
        _id: seatId,
        "bookingDetails.userId": userId,
        isBooked: true,
      },
      {
        $set: {
          isBooked: false,
          bookingDetails: {
            userId: null,
            bookingTime: null,
          },
        },
        $inc: { version: 1 },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!seat) {
      return res.status(404).json({
        message:
          "Booking not found or you are not authorized to cancel this booking",
      });
    }

    // Emit real-time update
    const io = req.app.get("io");
    io.emit("seatCancelled", { seatId, seat });
    console.log("Booking cancelled successfully");

    res.status(200).json({
      message: "Booking cancelled successfully",
      seat: {
        id: seat._id,
        seatNumber: seat.seatNumber,
        isBooked: seat.isBooked,
      },
    });
  } catch (error) {
    console.error("Cancellation error:", error);
    res.status(500).json({
      message: "Error cancelling booking",
      error: error.message,
    });
  }
});

// Validate QR Code
router.post("/validate-qr", async (req, res) => {
  const { bookingId, seatNumber, userId, validationCode } = req.body;

  if (!bookingId || !seatNumber || !userId || !validationCode) {
    return res.status(400).json({
      message: "Missing required fields for QR validation",
    });
  }

  try {
    // Find the seat and check if it's booked by the correct user
    const seat = await Seat.findOne({
      seatNumber: seatNumber,
      isBooked: true,
      "bookingDetails.userId": userId,
    });

    let isValid = false;
    let message = "QR Code is invalid";

    if (!seat) {
      message = "Booking not found or seat not booked by this user";
    } else {
      // Check if the booking is still valid (not expired)
      const bookingTime = new Date(seat.bookingDetails.bookingTime);
      const currentTime = new Date();
      const hoursDiff = (currentTime - bookingTime) / (1000 * 60 * 60);

      // Booking expires after 24 hours
      if (hoursDiff > 24) {
        message = "Booking has expired";
      } else {
        isValid = true;
        message = "QR Code is valid";
      }
    }

    // Log the validation attempt
    const validationRecord = new Validation({
      bookingId,
      seatNumber,
      userId,
      validationCode,
      isValid,
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
      message,
    });

    await validationRecord.save();

    if (isValid) {
      console.log(`QR Code validated for seat ${seatNumber} by user ${userId}`);

      res.status(200).json({
        valid: true,
        message: "QR Code is valid",
        validatedAt: new Date().toISOString(),
        validatorId: "validator001",
        bookingDetails: {
          seatNumber: seat.seatNumber,
          bookingTime: seat.bookingDetails.bookingTime,
          userId: seat.bookingDetails.userId,
        },
      });
    } else {
      res.status(404).json({
        valid: false,
        message: message,
      });
    }
  } catch (error) {
    console.error("QR validation error:", error);
    res.status(500).json({
      valid: false,
      message: "Error validating QR code",
      error: error.message,
    });
  }
});

module.exports = router;
