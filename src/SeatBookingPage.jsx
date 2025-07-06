import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import {
  Crown,
  Users,
  Eye,
  Star,
  MapPin,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  QrCode,
  Scan,
} from "lucide-react";

const SeatBookingPage = () => {
  const navigate = useNavigate();
  const [seats, setSeats] = useState([]);
  const [selectedSeatId, setSelectedSeatId] = useState(null);
  const [hoveredSeat, setHoveredSeat] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [socket, setSocket] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);

  // Get user data from localStorage (fallback to mock for demo)
  const user = (() => {
    try {
      const userData = localStorage.getItem("user");
      return userData ? JSON.parse(userData) : { id: 1, name: "John Doe" };
    } catch {
      return { id: 1, name: "John Doe" };
    }
  })();

  // Get auth token
  const getAuthToken = () => {
    try {
      return localStorage.getItem("token") || "demo-token";
    } catch {
      return "demo-token";
    }
  };

  // Fetch seats from API
  const fetchSeats = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        "http://localhost:5001/api/seats/get-seats",
        {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Enhance seats with UI properties
      const enhancedSeats = data.map((seat) => ({
        ...seat,
        row: seat.seatNumber.charAt(0),
        position: parseInt(seat.seatNumber.slice(1)),
        type: getSeatType(seat.seatNumber),
        price: getSeatPrice(seat.seatNumber),
      }));

      setSeats(enhancedSeats);
    } catch (error) {
      console.error("Error fetching seats:", error);
      setError("Failed to fetch seats. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Determine seat type based on row
  const getSeatType = (seatNumber) => {
    const row = seatNumber.charAt(0);
    if (["A", "B"].includes(row)) return "premium";
    if (["C", "D", "E", "F"].includes(row)) return "standard";
    return "economy";
  };

  // Get seat price based on type
  const getSeatPrice = (seatNumber) => {
    const type = getSeatType(seatNumber);
    switch (type) {
      case "premium":
        return 150;
      case "standard":
        return 100;
      case "economy":
        return 75;
      default:
        return 100;
    }
  };

  // Initialize Socket.IO connection
  useEffect(() => {
    const socketConnection = io("http://localhost:5001", {
      transports: ["websocket", "polling"],
      autoConnect: true,
    });

    socketConnection.on("connect", () => {
      console.log("Connected to Socket.IO server:", socketConnection.id);
      setSocketConnected(true);

      // Join the seat updates room
      socketConnection.emit("join-seat-room", { userId: user.id });
    });

    socketConnection.on("connect_error", (error) => {
      console.error("Socket.IO connection error:", error);
      setSocketConnected(false);
    });

    socketConnection.on("disconnect", () => {
      console.log("Disconnected from Socket.IO server");
      setSocketConnected(false);
    });

    // Listen for real-time seat booking updates
    socketConnection.on("seatBooked", (data) => {
      console.log("Seat booked event received:", data);
      const { seatId, userId, seat } = data;

      // Update seats in real-time
      setSeats((prev) =>
        prev.map((s) =>
          s._id === seatId
            ? { ...s, isBooked: true, bookingDetails: seat.bookingDetails }
            : s
        )
      );

      // Show notification if another user booked a seat
      if (userId !== user.id) {
        showNotification(
          `Seat ${seat.seatNumber} was just booked by another user`
        );
      }
    });

    // Listen for seat cancellation updates
    socketConnection.on("seatCancelled", (data) => {
      console.log("Seat cancelled event received:", data);
      const { seatId, seat } = data;

      // Update seats in real-time
      setSeats((prev) =>
        prev.map((s) =>
          s._id === seatId
            ? {
                ...s,
                isBooked: false,
                bookingDetails: { userId: null, bookingTime: null },
              }
            : s
        )
      );

      showNotification(`Seat ${seat.seatNumber} is now available`);
    });

    setSocket(socketConnection);

    return () => {
      console.log("Disconnecting from Socket.IO server");
      socketConnection.disconnect();
    };
  }, [user.id]);

  // Initial fetch
  useEffect(() => {
    fetchSeats();
  }, []);

  const handleSeatClick = (seat) => {
    if (!seat.isBooked) {
      setSelectedSeatId(seat._id === selectedSeatId ? null : seat._id);
    } else {
      showNotification("This seat is already booked");
    }
  };

  const handleBookSeat = async () => {
    if (!selectedSeatId) {
      showNotification("Please select a seat to book");
      return;
    }

    setShowBookingModal(true);
    setError(null);

    try {
      const response = await fetch(
        "http://localhost:5001/api/seats/book-seat",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            seatId: selectedSeatId,
            userId: user.id,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (data.error === "CONCURRENT_BOOKING") {
          throw new Error(
            "This seat was just booked by another user. Please select a different seat."
          );
        }
        throw new Error(data.message || "Booking failed");
      }

      // Success - show confirmation
      setBookingSuccess(true);
      setSelectedSeatId(null);

      // Update local state immediately for better UX
      setSeats((prev) =>
        prev.map((s) =>
          s._id === selectedSeatId
            ? { ...s, isBooked: true, bookingDetails: data.seat.bookingDetails }
            : s
        )
      );

      // Store booking data for QR code page
      const bookingData = {
        bookingId: `BK${Date.now()}`,
        seat: data.seat,
        userId: user.id,
        bookingTime: new Date().toISOString(),
        user: user,
      };
      localStorage.setItem("lastBooking", JSON.stringify(bookingData));

      // Show success notification
      showNotification(
        `Seat ${data.seat.seatNumber} booked successfully!`,
        "success"
      );

      // Navigate to QR code page after delay
      setTimeout(() => {
        setShowBookingModal(false);
        setBookingSuccess(false);
        navigate("/qr-code", { state: { bookingData } });
      }, 2000);
    } catch (error) {
      console.error("Booking error:", error);
      setError(error.message);
      setShowBookingModal(false);
      showNotification(error.message, "error");
    }
  };

  // Notification system
  const showNotification = (message, type = "info") => {
    // You can implement a toast notification system here
    // For now, we'll use a simple alert
    if (type === "error") {
      alert(`❌ ${message}`);
    } else if (type === "success") {
      alert(`✅ ${message}`);
    } else {
      alert(`ℹ️ ${message}`);
    }
  };

  const getSeatIcon = (type) => {
    switch (type) {
      case "premium":
        return <Crown className="w-3 h-3" />;
      case "standard":
        return <Users className="w-3 h-3" />;
      case "economy":
        return <Eye className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const getSeatColor = (seat) => {
    if (seat.isBooked) return "bg-red-500 text-white cursor-not-allowed";
    if (selectedSeatId === seat._id)
      return "bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg scale-110 ring-4 ring-blue-300";
    if (hoveredSeat === seat._id && !seat.isBooked)
      return "bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-md scale-105";

    switch (seat.type) {
      case "premium":
        return "bg-gradient-to-br from-amber-400 to-orange-500 text-white hover:from-amber-500 hover:to-orange-600";
      case "standard":
        return "bg-gradient-to-br from-emerald-400 to-teal-500 text-white hover:from-emerald-500 hover:to-teal-600";
      case "economy":
        return "bg-gradient-to-br from-blue-400 to-indigo-500 text-white hover:from-blue-500 hover:to-indigo-600";
      default:
        return "bg-gray-300";
    }
  };

  const groupSeatsByRow = (seats) => {
    return seats.reduce((acc, seat) => {
      if (!acc[seat.row]) acc[seat.row] = [];
      acc[seat.row].push(seat);
      return acc;
    }, {});
  };

  const selectedSeat = seats.find((seat) => seat._id === selectedSeatId);
  const seatsByRow = groupSeatsByRow(seats);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Star className="w-8 h-8 text-yellow-400" />
                <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                  SNP
                </h1>
              </div>
              <div className="hidden md:flex items-center space-x-4 text-sm text-gray-300">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>Tonight</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>8:00 PM</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4" />
                  <span>Main Hall</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex space-x-2">
                <button
                  onClick={() => navigate("/qr-code")}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-2 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all flex items-center space-x-2 text-sm"
                >
                  <QrCode className="w-4 h-4" />
                  <span>My QR</span>
                </button>
                <button
                  onClick={() => navigate("/qr-validator")}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-2 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all flex items-center space-x-2 text-sm"
                >
                  <Scan className="w-4 h-4" />
                  <span>Scan QR</span>
                </button>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-300">Welcome back,</p>
                <p className="font-semibold">{user.name}</p>
                {socketConnected && (
                  <p className="text-xs text-green-400 mt-1">🟢 Connected</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Loading State */}
        {loading && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto mb-4 flex items-center justify-center animate-spin">
              <div className="w-8 h-8 bg-white rounded-full"></div>
            </div>
            <p className="text-gray-300">Loading seats...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-16">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={fetchSeats}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Main Content */}
        {!loading && !error && (
          <>
            {/* Show Info */}
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Seat Booking
              </h2>
              <p className="text-gray-300 text-lg">
                Event booking platform. Choose your seat and enjoy the show!
              </p>
            </div>

            {/* Stage */}
            <div className="mb-8">
              <div className="relative">
                <div className="w-full h-16 bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 rounded-lg shadow-2xl flex items-center justify-center mb-4">
                  <span className="text-white font-bold text-lg tracking-wider">
                    STAGE
                  </span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 rounded-lg blur-md opacity-50"></div>
              </div>
              <div className="text-center text-gray-400 text-sm mb-8">
                <div className="w-32 h-1 bg-gradient-to-r from-transparent via-gray-400 to-transparent mx-auto mb-2"></div>
                All seats face this direction
              </div>
            </div>

            {/* Seating Chart */}
            <div className="space-y-4 mb-8">
              {Object.entries(seatsByRow).map(([row, rowSeats]) => (
                <div
                  key={row}
                  className="flex items-center justify-center space-x-2"
                >
                  <div className="w-8 text-center font-bold text-gray-400">
                    {row}
                  </div>
                  <div className="flex space-x-2">
                    {rowSeats.map((seat, index) => (
                      <div
                        key={seat._id}
                        className={`relative w-12 h-12 rounded-lg cursor-pointer transition-all duration-200 flex items-center justify-center text-xs font-bold ${getSeatColor(
                          seat
                        )}`}
                        onClick={() => handleSeatClick(seat)}
                        onMouseEnter={() =>
                          !seat.isBooked && setHoveredSeat(seat._id)
                        }
                        onMouseLeave={() => setHoveredSeat(null)}
                      >
                        <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/10 to-transparent"></div>
                        <div className="relative z-10 flex flex-col items-center justify-center">
                          {getSeatIcon(seat.type)}
                          <span className="text-xs mt-1">{seat.position}</span>
                        </div>

                        {/* Tooltip */}
                        {hoveredSeat === seat._id && !seat.isBooked && (
                          <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-black/90 text-white px-3 py-2 rounded-lg text-xs whitespace-nowrap z-20">
                            <div className="font-semibold">
                              Seat {seat.seatNumber}
                            </div>
                            <div className="text-gray-300">${seat.price}</div>
                            <div className="text-gray-400 capitalize">
                              {seat.type}
                            </div>
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/90"></div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-6 mb-8">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gradient-to-br from-amber-400 to-orange-500 rounded flex items-center justify-center">
                  <Crown className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm text-gray-300">Premium (Rs 150)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gradient-to-br from-emerald-400 to-teal-500 rounded flex items-center justify-center">
                  <Users className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm text-gray-300">Standard (Rs 100)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-indigo-500 rounded flex items-center justify-center">
                  <Eye className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm text-gray-300">Economy (Rs 75)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-red-500 rounded"></div>
                <span className="text-sm text-gray-300">Booked</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded ring-2 ring-blue-300"></div>
                <span className="text-sm text-gray-300">Selected</span>
              </div>
            </div>

            {/* Booking Section */}
            <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 backdrop-blur-md border border-white/10 rounded-2xl p-6">
              <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
                <div className="flex-1">
                  {selectedSeat ? (
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-white">
                        Selected Seat
                      </h3>
                      <div className="flex items-center space-x-4 text-gray-300">
                        <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                          {selectedSeat.seatNumber}
                        </span>
                        <span className="capitalize">
                          {selectedSeat.type} Section
                        </span>
                        <span className="text-green-400 font-bold text-lg">
                          Rs {selectedSeat.price}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-400">
                      <h3 className="text-xl font-bold mb-2">
                        Select Your Seat
                      </h3>
                      <p>
                        Choose from available seats to continue with booking
                      </p>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleBookSeat}
                  disabled={!selectedSeatId || showBookingModal}
                  className={`px-8 py-3 rounded-xl font-bold text-lg transition-all duration-200 ${
                    selectedSeatId && !showBookingModal
                      ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105"
                      : "bg-gray-600 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {showBookingModal ? "Processing..." : "Book Selected Seat"}
                </button>
              </div>
            </div>
          </>
        )}

        {/* Enhanced Booking Modal */}
        {showBookingModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-2xl border border-white/10 max-w-md w-full mx-4">
              <div className="text-center">
                {bookingSuccess ? (
                  <>
                    <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-green-400">
                      Booking Confirmed!
                    </h3>
                    <p className="text-gray-300">
                      Your seat has been successfully booked.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center animate-spin">
                      <div className="w-8 h-8 bg-white rounded-full"></div>
                    </div>
                    <h3 className="text-xl font-bold mb-2">
                      Processing Your Booking
                    </h3>
                    <p className="text-gray-300">
                      Please wait while we confirm your seat...
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Connection Status */}
        {socket && (
          <div
            className={`fixed bottom-4 right-4 border rounded-lg px-3 py-2 text-sm backdrop-blur-md transition-all duration-300 ${
              socketConnected
                ? "bg-green-500/20 border-green-500/30 text-green-400"
                : "bg-red-500/20 border-red-500/30 text-red-400"
            }`}
          >
            <div className="flex items-center space-x-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  socketConnected ? "bg-green-400 animate-pulse" : "bg-red-400"
                }`}
              ></div>
              <span>
                {socketConnected
                  ? "Real-time updates active"
                  : "Connection lost"}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SeatBookingPage;
