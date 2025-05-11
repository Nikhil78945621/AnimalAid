import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import "./../../Views/VetChat.css";

const VetChat = () => {
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
        "https://animalaid-9duz.onrender.com/api/home-visits/vet",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("Fetched requests:", response.data.data);
      const filteredRequests = response.data.data.filter(
        (req) => req.status === "accepted"
      );
      setRequests(filteredRequests);
      const initialChat = {};
      filteredRequests.forEach((req) => {
        if (req.chatHistory && req.chatHistory.length > 0) {
          initialChat[req._id] = req.chatHistory;
        }
      });
      setChatMessages((prev) => ({ ...prev, ...initialChat }));
    } catch (error) {
      console.error("Fetch requests error:", error);
      if (error.response?.status === 401) {
        navigate("/login");
      } else {
        alert(
          "Failed to load requests: " +
            (error.response?.data?.message || "Server error")
        );
      }
    }
  };

  const handleSendMessage = async (requestId) => {
    if (!newMessage.trim()) return;
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const response = await axios.post(
        "https://animalaid-9duz.onrender.com/api/home-visits/send-message",
        {
          requestId,
          message: `Vet: ${newMessage}`,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log("Message sent successfully:", response.data);
      setNewMessage("");
    } catch (error) {
      alert(error.response?.data?.message || "Failed to send message.");
    }
  };

  const connectWebSocket = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      return;
    }

    const websocket = new WebSocket("ws://localhost:8084");
    wsRef.current = websocket;

    websocket.onopen = () => {
      console.log("WebSocket connected (VetChat)");
      retryCountRef.current = 0;
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("WebSocket message received:", data);
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

    websocket.onclose = () => {
      wsRef.current = null;
      const delay = Math.min(2000 * Math.pow(2, retryCountRef.current), 16000);
      retryCountRef.current += 1;
      setTimeout(connectWebSocket, delay);
    };
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
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  }, [navigate, connectWebSocket, fetchRequests]);

  return (
    <div className="vet-chat">
      <h2>Chat for Accepted Home Visit Requests</h2>
      <button onClick={fetchRequests} className="refresh-btn">
        Refresh Requests
      </button>
      {requests.length === 0 ? (
        <p className="no-requests">No accepted requests available.</p>
      ) : (
        requests.map((request) => (
          <div key={request._id} className="request-card">
            <h3>
              {request.petType} - {request.priority}
            </h3>
            <p>
              <strong>Description:</strong> {request.description}
            </p>
            <p>
              <strong>Address:</strong> {request.address}
            </p>
            <p>
              <strong>Distance:</strong>{" "}
              {typeof request.distance === "number" && !isNaN(request.distance)
                ? request.distance.toFixed(2)
                : "N/A"}{" "}
              km
            </p>
            <p>
              <strong>ETA:</strong> {request.eta || "N/A"} minutes
            </p>
            <p>
              <strong>Status:</strong> {request.status}
            </p>
            {request.petOwner && (
              <p>
                <strong>Owner:</strong> {request.petOwner.name}
              </p>
            )}
            <div className="chat-section">
              <h4>Chat with Pet Owner</h4>
              <div className="chat-messages">
                {(chatMessages[request._id] || []).map((msg, idx) => {
                  let senderName = "Unknown";
                  let isReceived = false;
                  if (typeof msg.sender === "string") {
                    senderName =
                      msg.sender === request.petOwner?._id
                        ? request.petOwner.name
                        : request.veterinarian?.name || "Unknown";
                    isReceived = msg.sender === request.petOwner?._id;
                  } else if (msg.sender?._id) {
                    senderName = msg.sender.name;
                    isReceived =
                      msg.sender._id.toString() ===
                      request.petOwner?._id.toString();
                  } else {
                    console.warn(
                      `Invalid message at index ${idx} for request ${request._id}:`,
                      msg
                    );
                  }
                  return (
                    <div
                      key={idx}
                      className={`message ${isReceived ? "received" : "sent"}`}
                    >
                      <strong>{senderName}: </strong>
                      {msg.message}{" "}
                      <span>
                        ({new Date(msg.timestamp).toLocaleTimeString()})
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="chat-input">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                />
                <button onClick={() => handleSendMessage(request._id)}>
                  Send
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default VetChat;
