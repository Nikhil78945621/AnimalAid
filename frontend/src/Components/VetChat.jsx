import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import "./../Views/VetChat.css";

const VetChat = () => {
  const [requests, setRequests] = useState([]);
  const [chatMessages, setChatMessages] = useState({});
  const [newMessage, setNewMessage] = useState("");
  const [ws, setWs] = useState(null);
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
        "http://localhost:8084/api/home-visits/vet",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("Raw fetched requests:", response.data.data);
      const acceptedRequests = response.data.data.filter(
        (req) => req.status === "accepted"
      );
      console.log("Filtered accepted requests:", acceptedRequests);
      setRequests(acceptedRequests);
      const initialChat = {};
      acceptedRequests.forEach((req) => {
        if (req.chatHistory && req.chatHistory.length > 0) {
          initialChat[req._id] = req.chatHistory;
        }
      });
      console.log("Initial chat messages from fetch:", initialChat);
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
    }
  };

  const connectWebSocket = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log("WebSocket already connected (VetChat), skipping reconnect");
      return;
    }

    const websocket = new WebSocket("ws://localhost:8084");
    wsRef.current = websocket;
    setWs(websocket);

    websocket.onopen = () => {
      console.log("WebSocket connected (VetChat)");
      retryCountRef.current = 0;
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("WebSocket message received (VetChat):", data);
      switch (data.type) {
        case "REQUEST_UPDATED":
          console.log("Refreshing requests due to update");
          fetchRequests();
          break;
        case "NEW_CHAT_MESSAGE":
          console.log(
            "New chat message received for request:",
            data.data.requestId,
            data.data.message
          );
          setChatMessages((prev) => {
            const updatedMessages = {
              ...prev,
              [data.data.requestId]: [
                ...(prev[data.data.requestId] || []),
                data.data.message,
              ],
            };
            console.log("Updated chatMessages state:", updatedMessages);
            return updatedMessages;
          });
          break;
        default:
          console.log("Unhandled WebSocket message type:", data.type);
          break;
      }
    };

    websocket.onerror = (error) => {
      console.error("WebSocket error (VetChat):", error);
    };

    websocket.onclose = () => {
      console.log("WebSocket disconnected (VetChat)");
      setWs(null);
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
        console.log("WebSocket closed on unmount (VetChat)");
      }
    };
  }, [navigate]);

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
      message: `Vet: ${newMessage}`,
    };
    console.log("Sending message payload (VetChat):", payload);

    try {
      const response = await axios.post(
        "http://localhost:8084/api/home-visits/send-message",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log("Send message response (VetChat):", response.data);
      setNewMessage("");
    } catch (error) {
      console.error(
        "Error sending message (VetChat):",
        error.response?.data || error.message
      );
      alert(
        error.response?.data?.message ||
          "Failed to send message. Check if the request exists or try logging in again."
      );
    }
  };

  return (
    <div className="vet-chat">
      <h2>Your Accepted Home Visit Requests - Chat</h2>
      <button
        onClick={fetchRequests}
        style={{ marginBottom: "10px", padding: "5px 10px" }}
      >
        Refresh Requests
      </button>
      {requests.length === 0 ? (
        <p>No accepted requests found.</p>
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
              <strong>Distance:</strong> {request.distance.toFixed(2)} km
            </p>
            <p>
              <strong>ETA:</strong> {request.eta} minutes
            </p>
            <p>
              <strong>Status:</strong> {request.status}
            </p>
            <div className="chat-section">
              <h4>Chat with Pet Owner</h4>
              <div className="chat-messages">
                {(chatMessages[request._id] || []).length > 0 ? (
                  chatMessages[request._id].map((msg, idx) => (
                    <div
                      key={idx}
                      className={`message ${
                        msg.sender._id === request.petOwner
                          ? "received"
                          : "sent"
                      }`}
                    >
                      <strong>{msg.sender.name || "User"}: </strong>
                      {msg.message} (
                      {new Date(msg.timestamp).toLocaleTimeString()})
                    </div>
                  ))
                ) : (
                  <p>No messages yet.</p>
                )}
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
