const mongoose = require("mongoose");

const seatSchema = new mongoose.Schema({
  seatNumber: {
    type: String,
    required: true,
    unique: true,
  },
  isBooked: {
    type: Boolean,
    default: false,
  },
  bookingDetails: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    bookingTime: {
      type: Date,
      default: Date.now,
    },
  },
  // Add version for optimistic locking
  version: {
    type: Number,
    default: 0,
  },
});

// Add index for better performance
seatSchema.index({ seatNumber: 1 });
seatSchema.index({ isBooked: 1 });

const Seat = mongoose.model("Seat", seatSchema);
module.exports = Seat;

// This code defines a Mongoose schema for a seat model in a booking system. Each seat has a unique number, a boolean indicating if it's booked, and details about the booking including the user ID and booking time. The model is then exported for use in other parts of the application.
// The schema ensures that each seat number is unique and provides a structure for storing booking details,
//making it easy to manage seat bookings in a MongoDB database. The default values for `isBooked` and `bookingTime` help streamline the booking process by automatically setting these fields when a new seat is created or booked.
// The `Seat` model can be used to create, read, update, and delete seat
