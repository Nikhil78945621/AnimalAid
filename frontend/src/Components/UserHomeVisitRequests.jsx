import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import "./../Views/UserHomeVisit.css";

const UserHomeVisitRequests = () => {
  const [requests, setRequests] = useState([]);
  const [chatMessages, setChatMessages] = useState({});
  const [newMessage, setNewMessage] = useState("");
  const wsRef = useRef(null);
  const retryCountRef = useRef(0);
  const navigate = useNavigate();

  const fetchRequests = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    try {
      const response = await axios.get(
        "https://animalaid-9duz.onrender.com/api/home-visits/user",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const fetchedRequests = Array.isArray(response.data.data)
        ? response.data.data
        : [];
      setRequests(fetchedRequests);
      const initialChat = {};
      fetchedRequests.forEach((req) => {
        if (req.chatHistory && req.chatHistory.length > 0) {
          initialChat[req._id] = req.chatHistory;
        }
      });
      setChatMessages((prev) => ({ ...prev, ...initialChat }));
    } catch (error) {
      console.error(
        "Fetch requests error:",
        error.response?.data || error.message
      );
      if (error.response?.status === 401) {
        navigate("/login");
      } else {
        alert(
          "Failed to load requests: " +
            (error.response?.data?.message || "Server error")
        );
      }
      setRequests([]);
    }
  };

  const connectWebSocket = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log("WebSocket already connected (User), skipping reconnect");
      return;
    }

    const websocket = new WebSocket("ws://localhost:8084");
    wsRef.current = websocket;

    websocket.onopen = () => {
      console.log("WebSocket connected (User)");
      retryCountRef.current = 0;
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("WebSocket message received (User):", data);
      switch (data.type) {
        case "REQUEST_UPDATED":
          fetchRequests();
          break;
        case "NEW_CHAT_MESSAGE":
          setChatMessages((prev) => ({
            ...prev,
            [data.data.requestId]: [
              ...(prev[data.data.requestId] || []),
              data.data.message,
            ],
          }));
          break;
        default:
          break;
      }
    };

    websocket.onerror = (error) => {
      console.error("WebSocket error (User):", error);
    };

    websocket.onclose = () => {
      console.log("WebSocket disconnected (User)");
      wsRef.current = null;
      const delay = Math.min(2000 * Math.pow(2, retryCountRef.current), 16000);
      retryCountRef.current += 1;
      console.log(
        `Reconnecting in ${delay / 1000} seconds... (Attempt ${
          retryCountRef.current
        })`
      );
      setTimeout(connectWebSocket, delay);
    };
  };

  const handleSendMessage = async (requestId) => {
    if (!newMessage.trim()) return;
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Session expired. Please log in again.");
      navigate("/login");
      return;
    }

    const payload = {
      requestId,
      message: `Pet Owner: ${newMessage}`,
    };
    console.log("Sending message payload (User):", payload);

    try {
      const response = await axios.post(
        "https://animalaid-9duz.onrender.com/api/home-visits/send-message",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log("Send message response (User):", response.data);
      setNewMessage("");
    } catch (error) {
      console.error(
        "Error sending message (User):",
        error.response?.data || error.message
      );
      alert(
        error.response?.data?.message ||
          "Failed to send message. Check if the request exists or try logging in again."
      );
    }
  };

  const handleCancelRequest = async (requestId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Session expired. Please log in again.");
      navigate("/login");
      return;
    }

    if (window.confirm("Are you sure you want to cancel this request?")) {
      try {
        const response = await axios.patch(
          `https://animalaid-9duz.onrender.com/api/home-visits/${requestId}/cancel`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        alert("Request canceled successfully.");
        fetchRequests(); // Refresh the request list
      } catch (error) {
        console.error(
          "Cancel request error:",
          error.response?.data || error.message
        );
        alert(
          error.response?.data?.message ||
            "Failed to cancel request. Please try again."
        );
      }
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const decodedToken = jwtDecode(token);
    if (decodedToken.exp * 1000 < Date.now()) {
      localStorage.removeItem("token");
      navigate("/login");
      return;
    }

    connectWebSocket();
    fetchRequests();

    return () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.CONNECTING) {
        wsRef.current.onclose = null;
      } else if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
        console.log("WebSocket closed on unmount (User)");
      }
    };
  }, [navigate]);

  return (
    <div className="user-home-visits-container">
      <h2 className="page-title">Your Home Visit Requests</h2>
      {requests.length === 0 ? (
        <p className="no-requests-message">No requests found.</p>
      ) : (
        requests.map((request) => (
          <div key={request._id} className="request-card">
            <h3 className="request-title">
              {request.petType} - {request.priority}
            </h3>
            <p className="request-detail">
              <strong>Description:</strong> {request.description}
            </p>
            <p className="request-detail">
              <strong>Address:</strong> {request.address}
            </p>
            <p className="request-detail">
              <strong>Status:</strong>{" "}
              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
            </p>
            {request.veterinarian && (
              <p className="request-detail">
                <strong>Vet:</strong> {request.veterinarian.name}
              </p>
            )}
            {/* Cancel Button */}
            {(request.status === "pending" ||
              request.status === "accepted") && (
              <button
                onClick={() => handleCancelRequest(request._id)}
                className="cancel-button"
                style={{
                  backgroundColor: "#ff4d4d",
                  color: "white",
                  padding: "8px 16px",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  marginTop: "10px",
                }}
              >
                Cancel Request
              </button>
            )}
            {request.status === "accepted" && (
              <div className="chat-section">
                <h4 className="chat-title">Chat with Vet</h4>
                <div className="chat-messages">
                  {(chatMessages[request._id] || request.chatHistory || []).map(
                    (msg, idx) => {
                      let senderName = "Unknown";
                      let isSent = false;
                      if (typeof msg.sender === "string") {
                        senderName =
                          msg.sender === request.petOwner._id
                            ? request.petOwner.name
                            : request.veterinarian?.name || "Unknown";
                        isSent = msg.sender === request.petOwner._id;
                      } else if (msg.sender?._id) {
                        senderName = msg.sender.name;
                        isSent = msg.sender._id === request.petOwner._id;
                      }
                      return (
                        <div
                          key={idx}
                          className={`message ${isSent ? "sent" : "received"}`}
                        >
                          <strong>{senderName}: </strong>
                          {msg.message}
                          <span className="message-time">
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      );
                    }
                  )}
                </div>
                <div className="chat-input-container">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="chat-input"
                  />
                  <button
                    onClick={() => handleSendMessage(request._id)}
                    className="send-button"
                  >
                    Send
                  </button>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default UserHomeVisitRequests;
