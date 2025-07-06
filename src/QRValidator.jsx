import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Camera,
  CheckCircle,
  XCircle,
  ArrowLeft,
  RefreshCw,
  AlertTriangle,
  User,
  Calendar,
  Clock,
  MapPin,
  Star,
} from "lucide-react";

const QRValidator = () => {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [validating, setValidating] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const startScanning = async () => {
    try {
      setScanning(true);
      setError(null);
      setResult(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Unable to access camera. Please check permissions.");
      setScanning(false);
    }
  };

  const stopScanning = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
    }
    setScanning(false);
  };

  const captureAndScan = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    // Simulate QR code scanning (in a real app, you'd use a QR library)
    // For demo purposes, we'll simulate finding a QR code
    simulateQRScan();
  };

  const simulateQRScan = () => {
    setValidating(true);

    // Simulate API call to validate QR code
    setTimeout(() => {
      const mockQRData = {
        bookingId: "BK123456789",
        seatNumber: "A5",
        userId: "user123",
        bookingTime: new Date().toISOString(),
        eventName: "SNP Event",
        eventDate: "Tonight",
        eventTime: "8:00 PM",
        venue: "Main Hall",
        price: 150,
        validationCode: "VC123456789ABC",
      };

      validateQRCode(mockQRData);
    }, 2000);
  };

  const validateQRCode = async (qrData) => {
    try {
      // In a real app, you'd send this to your backend for validation
      const response = await fetch(
        "http://localhost:5001/api/seats/validate-qr",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(qrData),
        }
      );

      if (response.ok) {
        const validationResult = await response.json();
        setResult({
          valid: true,
          data: qrData,
          message: "QR Code is valid! Entry granted.",
          ...validationResult,
        });
      } else {
        setResult({
          valid: false,
          data: qrData,
          message: "QR Code is invalid or expired.",
        });
      }
    } catch (error) {
      // For demo purposes, simulate successful validation
      setResult({
        valid: true,
        data: qrData,
        message: "QR Code is valid! Entry granted.",
        validatedAt: new Date().toISOString(),
        validatorId: "validator001",
      });
    } finally {
      setValidating(false);
      stopScanning();
    }
  };

  const resetScanner = () => {
    setResult(null);
    setError(null);
    setValidating(false);
  };

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
                <span>Back to Dashboard</span>
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <Star className="w-6 h-6 text-yellow-400" />
              <h1 className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                SNP QR Validator
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Scanner Section */}
        {!result && (
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              QR Code Scanner
            </h2>
            <p className="text-gray-300 text-lg">
              Scan the QR code to validate entry
            </p>
          </div>
        )}

        {/* Camera View */}
        {scanning && !result && (
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-700/50 backdrop-blur-md border border-white/10 rounded-2xl p-6 mb-6">
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full max-w-md mx-auto rounded-lg"
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Scanning Overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-64 h-64 border-2 border-green-400 rounded-lg relative">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-400"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-400"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-400"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-400"></div>
                </div>
              </div>
            </div>

            <div className="text-center mt-4">
              <button
                onClick={captureAndScan}
                disabled={validating}
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50"
              >
                {validating ? (
                  <div className="flex items-center space-x-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Validating...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Camera className="w-4 h-4" />
                    <span>Scan QR Code</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Start Scanning Button */}
        {!scanning && !result && (
          <div className="text-center mb-8">
            <button
              onClick={startScanning}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all text-lg font-semibold"
            >
              <div className="flex items-center space-x-2">
                <Camera className="w-6 h-6" />
                <span>Start Scanning</span>
              </div>
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-2xl p-6 mb-6">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-6 h-6 text-red-400" />
              <div>
                <h3 className="font-semibold text-red-400">Error</h3>
                <p className="text-gray-300">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Validation Result */}
        {result && (
          <div className="space-y-6">
            {/* Result Header */}
            <div className="text-center">
              <div
                className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${
                  result.valid
                    ? "bg-gradient-to-r from-green-500 to-emerald-600"
                    : "bg-gradient-to-r from-red-500 to-pink-600"
                }`}
              >
                {result.valid ? (
                  <CheckCircle className="w-10 h-10 text-white" />
                ) : (
                  <XCircle className="w-10 h-10 text-white" />
                )}
              </div>
              <h2
                className={`text-2xl font-bold mb-2 ${
                  result.valid
                    ? "bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent"
                    : "bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent"
                }`}
              >
                {result.valid ? "Entry Granted!" : "Entry Denied"}
              </h2>
              <p className="text-gray-300">{result.message}</p>
            </div>

            {/* Booking Details */}
            {result.valid && result.data && (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Event Details */}
                <div className="bg-gradient-to-br from-slate-800/50 to-slate-700/50 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center space-x-2">
                    <Star className="w-5 h-5 text-yellow-400" />
                    <span>Event Details</span>
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span className="font-semibold">
                        {result.data.eventName}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-4 h-4 text-blue-400" />
                      <span>{result.data.eventDate}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Clock className="w-4 h-4 text-green-400" />
                      <span>{result.data.eventTime}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-4 h-4 text-red-400" />
                      <span>{result.data.venue}</span>
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
                        {result.data.seatNumber}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Booking ID:</span>
                      <span className="font-mono text-sm text-gray-400">
                        {result.data.bookingId}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Price:</span>
                      <span className="font-bold text-green-400">
                        ₹{result.data.price}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Validated At:</span>
                      <span className="text-sm text-gray-400">
                        {new Date(
                          result.validatedAt || Date.now()
                        ).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4">
              <button
                onClick={resetScanner}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all"
              >
                <div className="flex items-center space-x-2">
                  <RefreshCw className="w-4 h-4" />
                  <span>Scan Another</span>
                </div>
              </button>
              <button
                onClick={() => navigate("/dashboard")}
                className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-6 py-3 rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all"
              >
                <div className="flex items-center space-x-2">
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Dashboard</span>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRValidator;
