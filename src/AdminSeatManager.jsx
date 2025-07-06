import React, { useState, useEffect } from "react";
import { Plus, Trash2, AlertCircle, CheckCircle, X } from "lucide-react";

const AdminSeatManager = () => {
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [bulkSeats, setBulkSeats] = useState("");
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [userNameMap, setUserNameMap] = useState({});

  useEffect(() => {
    fetchSeats();
  }, []);

  const fetchSeats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:5001/api/seats/get-seats",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch seats");
      const data = await response.json();
      setSeats(data || []);
    } catch (err) {
      setError("Failed to fetch seats: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAdd = async () => {
    if (!bulkSeats.trim()) {
      setError("Please enter seat numbers");
      return;
    }
    try {
      setLoading(true);
      setError("");
      setSuccess("");
      const seatNumbers = bulkSeats
        .split(/[,\n]/)
        .map((seat) => seat.trim())
        .filter(Boolean);
      if (seatNumbers.length === 0) {
        setError("Please enter valid seat numbers");
        return;
      }
      const seatsToAdd = seatNumbers.map((seatNumber) => ({ seatNumber }));
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:5001/api/seats/add-bulk-seats",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ seats: seatsToAdd }),
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to add seats");
      setSuccess(`Successfully added ${data.seats.length} seats`);
      setBulkSeats("");
      setShowBulkAdd(false);
      fetchSeats();
    } catch (err) {
      setError("Failed to add seats: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserName = async (userId) => {
    if (!userId || userNameMap[userId]) return; // skip if already loaded
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5001/api/users/get-user/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      if (response.ok && data?.name) {
        setUserNameMap((prev) => ({ ...prev, [userId]: data.name }));
      } else {
        setUserNameMap((prev) => ({ ...prev, [userId]: "N/A" }));
      }
    } catch {
      setUserNameMap((prev) => ({ ...prev, [userId]: "N/A" }));
    }
  };

  const handleDeleteSeat = async (seatId) => {
    if (!confirm("Are you sure you want to delete this seat?")) return;
    try {
      setLoading(true);
      setError("");
      setSuccess("");
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5001/api/seats/delete-seat/${seatId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Failed to delete seat");
      setSuccess("Seat deleted successfully");
      fetchSeats();
    } catch (err) {
      setError("Failed to delete seat: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header, Alerts, Bulk Add remain unchanged */}

        {/* Seats List */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              All Seats ({seats.length})
            </h2>
          </div>
          {loading && seats.length === 0 ? (
            <div className="p-8 text-center">Loading...</div>
          ) : seats.length === 0 ? (
            <div className="p-8 text-center">No seats found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Seat Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Booking Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {seats.map((seat) => {
                    const userId = seat.bookingDetails?.userId;
                    if (seat.isBooked && userId && !userNameMap[userId]) {
                      fetchUserName(userId);
                    }
                    return (
                      <tr key={seat._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          {seat.seatNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              seat.isBooked
                                ? "bg-red-100 text-red-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {seat.isBooked ? "Booked" : "Available"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {seat.isBooked ? (
                            <div>
                              <div>
                                User: {userNameMap[userId] || "Loading..."}
                              </div>
                              <div>
                                Booked:{" "}
                                {seat.bookingDetails?.bookingTime
                                  ? new Date(
                                      seat.bookingDetails.bookingTime
                                    ).toLocaleString()
                                  : "N/A"}
                              </div>
                            </div>
                          ) : (
                            "No booking"
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => handleDeleteSeat(seat._id)}
                            disabled={loading}
                            className="text-red-600 hover:text-red-800 flex items-center gap-1"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSeatManager;
