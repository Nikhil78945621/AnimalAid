import React, { useState, useEffect } from "react";
import axios from "axios";
import VetAppointments from "./VetAppointment"; // Ensure correct import
import "./../Views/VetDashboard.css";
import moment from "moment-timezone";

const VetDashboard = () => {
  const [vetData, setVetData] = useState({
    fee: "",
    speciality: "",
    address: "",
    clinic: "",
  });
  const [stats, setStats] = useState({
    totalAppointments: 0,
    totalIncome: 0,
  });
  const [loading, setLoading] = useState(true);
  const [availability, setAvailability] = useState({
    workingHours: [
      { day: "Mon", start: "09:00", end: "17:00", active: true },
      { day: "Tue", start: "09:00", end: "17:00", active: true },
      { day: "Wed", start: "09:00", end: "17:00", active: true },
      { day: "Thu", start: "09:00", end: "17:00", active: true },
      { day: "Fri", start: "09:00", end: "17:00", active: true },
      { day: "Sat", start: "09:00", end: "12:00", active: false },
      { day: "Sun", start: "09:00", end: "12:00", active: false },
    ],
    appointmentDuration: 60,
    timezone: "UTC",
  });
  const [blockSlotData, setBlockSlotData] = useState({
    start: "",
    end: "",
    reason: "",
  });

  // Fetch vet profile, stats, and availability
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const profileResponse = await axios.get(
          "http://localhost:8084/api/auth/profile",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const statsResponse = await axios.get(
          "http://localhost:8084/api/appointments/vet/stats",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const availabilityResponse = await axios.get(
          "http://localhost:8084/api/vet/availability",
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setVetData({
          fee: profileResponse.data.fee || "",
          speciality: profileResponse.data.speciality || "",
          address: profileResponse.data.address || "",
          clinic: profileResponse.data.clinic || "",
        });

        setStats({
          totalAppointments: statsResponse.data.totalAppointments,
          totalIncome: statsResponse.data.totalIncome,
        });

        if (availabilityResponse.data) {
          setAvailability({
            workingHours: availabilityResponse.data.workingHours,
            appointmentDuration: availabilityResponse.data.appointmentDuration,
            timezone: availabilityResponse.data.timezone,
          });
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle updating professional profile
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await axios.patch("http://localhost:8084/api/auth/profile", vetData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  // Handle availability changes
  const handleAvailabilityChange = (index, field, value) => {
    const updatedHours = [...availability.workingHours];
    updatedHours[index][field] = value;
    setAvailability((prev) => ({ ...prev, workingHours: updatedHours }));
  };

  // Save availability
  const handleSaveAvailability = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        "http://localhost:8084/api/vet/availability",
        {
          workingHours: availability.workingHours,
          appointmentDuration: availability.appointmentDuration,
          timezone: availability.timezone,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Availability updated successfully!");
    } catch (error) {
      console.error("Error updating availability:", error);
    }
  };

  // Handle blocking a slot
  const handleBlockSlot = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:8084/api/vet/block-slot",
        blockSlotData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      alert("Slot blocked successfully!");
      setBlockSlotData({ start: "", end: "", reason: "" }); // Reset form
    } catch (error) {
      console.error("Error blocking slot:", error);
    }
  };

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div className="vet-dashboard">
      <div className="dashboard-header">
        <h1>Veterinarian Dashboard</h1>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>Total Appointments</h3>
          <p>{stats.totalAppointments}</p>
        </div>
        <div className="stat-card">
          <h3>Total Income</h3>
          <p>${stats.totalIncome}</p>
        </div>
      </div>

      <div className="profile-section">
        <h2>Professional Profile</h2>
        <form onSubmit={handleUpdateProfile}>
          <div className="form-row">
            <label>
              Hourly Fee ($):
              <input
                type="number"
                value={vetData.fee}
                onChange={(e) =>
                  setVetData({ ...vetData, fee: e.target.value })
                }
                required
              />
            </label>

            <label>
              Speciality:
              <input
                type="text"
                value={vetData.speciality}
                onChange={(e) =>
                  setVetData({ ...vetData, speciality: e.target.value })
                }
                required
              />
            </label>
          </div>

          <div className="form-row">
            <label>
              Clinic Address:
              <input
                type="text"
                value={vetData.address}
                onChange={(e) =>
                  setVetData({ ...vetData, address: e.target.value })
                }
                required
              />
            </label>

            <label>
              Clinic Name:
              <input
                type="text"
                value={vetData.clinic}
                onChange={(e) =>
                  setVetData({ ...vetData, clinic: e.target.value })
                }
              />
            </label>
          </div>

          <button type="submit" className="update-btn">
            Update Profile
          </button>
        </form>
      </div>

      <div className="availability-section">
        <h2>Working Hours & Availability</h2>
        <form onSubmit={handleSaveAvailability}>
          <div className="timezone-selector">
            <label>Timezone:</label>
            <select
              value={availability.timezone}
              onChange={(e) =>
                setAvailability((prev) => ({
                  ...prev,
                  timezone: e.target.value,
                }))
              }
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
            </select>
          </div>

          <div className="appointment-duration">
            <label>Appointment Duration (minutes):</label>
            <input
              type="number"
              value={availability.appointmentDuration}
              onChange={(e) =>
                setAvailability((prev) => ({
                  ...prev,
                  appointmentDuration: parseInt(e.target.value),
                }))
              }
              min="15"
              step="15"
            />
          </div>

          <div className="working-hours-form">
            <h3>Weekly Schedule</h3>
            {availability.workingHours.map((day, index) => (
              <div key={day.day} className="day-schedule">
                <label>
                  <input
                    type="checkbox"
                    checked={day.active}
                    onChange={(e) =>
                      handleAvailabilityChange(
                        index,
                        "active",
                        e.target.checked
                      )
                    }
                  />
                  {day.day}
                </label>
                <input
                  type="time"
                  value={day.start}
                  onChange={(e) =>
                    handleAvailabilityChange(index, "start", e.target.value)
                  }
                  disabled={!day.active}
                />
                <span>to</span>
                <input
                  type="time"
                  value={day.end}
                  onChange={(e) =>
                    handleAvailabilityChange(index, "end", e.target.value)
                  }
                  disabled={!day.active}
                />
              </div>
            ))}
          </div>
          <button type="submit" className="save-btn">
            Save Availability
          </button>
        </form>
      </div>

      <div className="block-slot-section">
        <h2>Block Slot</h2>
        <form onSubmit={handleBlockSlot}>
          <div className="form-row">
            <label>
              Start Time:
              <input
                type="datetime-local"
                value={blockSlotData.start}
                onChange={(e) =>
                  setBlockSlotData({ ...blockSlotData, start: e.target.value })
                }
                required
              />
            </label>

            <label>
              End Time:
              <input
                type="datetime-local"
                value={blockSlotData.end}
                onChange={(e) =>
                  setBlockSlotData({ ...blockSlotData, end: e.target.value })
                }
                required
              />
            </label>
          </div>

          <div className="form-row">
            <label>
              Reason:
              <input
                type="text"
                value={blockSlotData.reason}
                onChange={(e) =>
                  setBlockSlotData({ ...blockSlotData, reason: e.target.value })
                }
                required
              />
            </label>
          </div>

          <button type="submit" className="block-btn">
            Block Slot
          </button>
        </form>
      </div>

      <div className="appointments-section">
        <VetAppointments stats={stats} setStats={setStats} />
      </div>
    </div>
  );
};

export default VetDashboard;
