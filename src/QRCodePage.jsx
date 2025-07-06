import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import QRCode from "react-qr-code";
import {
  CheckCircle,
  Calendar,
  Clock,
  MapPin,
  Star,
  Download,
  Share2,
  ArrowLeft,
  Ticket,
  User,
} from "lucide-react";

const QRCodePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [bookingData, setBookingData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get booking data from location state or localStorage
    const data =
      location.state?.bookingData ||
      JSON.parse(localStorage.getItem("lastBooking"));
    if (data) {
      setBookingData(data);
    }
    setLoading(false);
  }, [location.state]);

  const generateQRData = () => {
    if (!bookingData) return "";

    const qrData = {
      bookingId: bookingData.bookingId || `BK${Date.now()}`,
      seatNumber: bookingData.seat.seatNumber,
      userId: bookingData.userId,
      bookingTime: bookingData.bookingTime,
      eventName: "SNP Event",
      eventDate: "Tonight",
      eventTime: "8:00 PM",
      venue: "Main Hall",
      price: bookingData.seat.price,
      validationCode: generateValidationCode(),
    };

    return JSON.stringify(qrData);
  };

  const generateValidationCode = () => {
    // Generate a unique validation code
    return `VC${Date.now()}${Math.random()
      .toString(36)
      .substr(2, 9)
      .toUpperCase()}`;
  };

  const downloadQRCode = () => {
    const svg = document.querySelector("#qr-code svg");
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const pngFile = canvas.toDataURL("image/png");

        const downloadLink = document.createElement("a");
        downloadLink.download = `booking-${bookingData?.seat?.seatNumber}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      };

      img.src = "data:image/svg+xml;base64," + btoa(svgData);
    }
  };

  const shareBooking = () => {
    if (navigator.share) {
      navigator.share({
        title: "My Booking Confirmation",
        text: `I've booked seat ${bookingData?.seat?.seatNumber} for the SNP Event!`,
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(
        `Booking Confirmation: Seat ${bookingData?.seat?.seatNumber} - SNP Event`
      );
      alert("Booking details copied to clipboard!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto mb-4 flex items-center justify-center animate-spin">
            <div className="w-8 h-8 bg-white rounded-full"></div>
          </div>
          <p className="text-white">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (!bookingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500 rounded-full mx-auto mb-4 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">
            No Booking Found
          </h2>
          <p className="text-gray-300 mb-6">
            Please make a booking first to view this page.
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
          >
            Go to Booking
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/dashboard")}
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Booking</span>
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <Star className="w-6 h-6 text-yellow-400" />
              <h1 className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                SNP
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Success Message */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full mx-auto mb-4 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
            Booking Confirmed!
          </h1>
          <p className="text-gray-300 text-lg">
            Your seat has been successfully booked. Show this QR code at the
            venue.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* QR Code Section */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-700/50 backdrop-blur-md border border-white/10 rounded-2xl p-8">
            <div className="text-center">
              <h2 className="text-xl font-bold mb-6">Entry QR Code</h2>
              <div
                id="qr-code"
                className="bg-white p-4 rounded-lg inline-block mb-6"
              >
                <QRCode
                  value={generateQRData()}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <div className="space-y-2 text-sm text-gray-300">
                <p>Scan this QR code at the venue entrance</p>
                <p className="text-xs">Valid for entry only</p>
              </div>
            </div>
          </div>

          {/* Booking Details */}
          <div className="space-y-6">
            {/* Event Details */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-700/50 backdrop-blur-md border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center space-x-2">
                <Ticket className="w-5 h-5 text-purple-400" />
                <span>Event Details</span>
              </h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span className="font-semibold">SNP Event</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  <span>Tonight</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Clock className="w-4 h-4 text-green-400" />
                  <span>8:00 PM</span>
                </div>
                <div className="flex items-center space-x-3">
                  <MapPin className="w-4 h-4 text-red-400" />
                  <span>Main Hall</span>
                </div>
              </div>
            </div>

            {/* Seat Details */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-700/50 backdrop-blur-md border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center space-x-2">
                <User className="w-5 h-5 text-purple-400" />
                <span>Seat Details</span>
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Seat Number:</span>
                  <span className="font-bold text-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1 rounded-full">
                    {bookingData.seat.seatNumber}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Section:</span>
                  <span className="font-semibold capitalize">
                    {bookingData.seat.type}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Price:</span>
                  <span className="font-bold text-green-400">
                    ₹{bookingData.seat.price}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Booking ID:</span>
                  <span className="font-mono text-sm text-gray-400">
                    {bookingData.bookingId || `BK${Date.now()}`}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={downloadQRCode}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all flex items-center justify-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download QR</span>
              </button>
              <button
                onClick={shareBooking}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all flex items-center justify-center space-x-2"
              >
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>

        {/* Important Notes */}
        <div className="mt-8 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-2xl p-6">
          <h3 className="text-lg font-bold mb-3 text-amber-400">
            Important Notes
          </h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>• Please arrive 15 minutes before the event starts</li>
            <li>• Show this QR code at the entrance for entry</li>
            <li>• Keep your booking confirmation safe</li>
            <li>• No refunds or exchanges allowed</li>
            <li>• Follow venue rules and regulations</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default QRCodePage;
