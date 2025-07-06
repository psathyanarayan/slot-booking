const mongoose = require("mongoose");

const validationSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    required: true,
  },
  seatNumber: {
    type: String,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  validationCode: {
    type: String,
    required: true,
  },
  isValid: {
    type: Boolean,
    required: true,
  },
  validatedAt: {
    type: Date,
    default: Date.now,
  },
  validatorId: {
    type: String,
    default: "validator001",
  },
  ipAddress: {
    type: String,
  },
  userAgent: {
    type: String,
  },
  message: {
    type: String,
  },
});

// Index for better performance
validationSchema.index({ bookingId: 1, validatedAt: -1 });
validationSchema.index({ seatNumber: 1, validatedAt: -1 });

const Validation = mongoose.model("Validation", validationSchema);
module.exports = Validation;
