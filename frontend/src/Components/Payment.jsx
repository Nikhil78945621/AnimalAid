import React, { useState, useEffect } from "react";
import CryptoJS from "crypto-js";

const Payment = () => {
  const [formData, setFormData] = useState({
    amount: "100",
    tax_amount: "0",
    total_amount: "100",
    transaction_uuid: "",
    product_code: "EPAYTEST",
    product_service_charge: "0",
    product_delivery_charge: "0",
    success_url: "https://google.com",
    failure_url: "https://facebook.com",
    signed_field_names: "total_amount,transaction_uuid,product_code",
    signature: "",
    secret: "8gBm/:&EnhH.1/q",
  });

  // Generate transaction UUID and signature on component load and whenever inputs change
  useEffect(() => {
    const generateUUID = () => {
      const now = new Date();
      const uuid =
        now
          .toISOString()
          .slice(2, 10)
          .replace(/-/g, "") +
        "-" +
        now
          .getHours()
          .toString()
          .padStart(2, "0") +
        now
          .getMinutes()
          .toString()
          .padStart(2, "0") +
        now
          .getSeconds()
          .toString()
          .padStart(2, "0");
      return uuid;
    };

    const generateSignature = () => {
      const { total_amount, product_code, secret } = formData;
      const transaction_uuid = generateUUID();

      const dataToSign = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${product_code}`;
      const hash = CryptoJS.HmacSHA256(dataToSign, secret);
      const hashInBase64 = CryptoJS.enc.Base64.stringify(hash);

      setFormData((prevData) => ({
        ...prevData,
        transaction_uuid,
        signature: hashInBase64,
      }));
    };

    generateSignature();
  }, [formData.total_amount, formData.product_code, formData.secret]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  return (
    <form
      action="https://rc-epay.esewa.com.np/api/epay/main/v2/form"
      method="POST"
      target="_blank"
    >
      <h2>eSewa Payment Form</h2>

      {Object.entries(formData).map(([key, value]) => {
        if (key === "secret") return null; // don't submit secret
        return (
          <div key={key}>
            <label>{key.replace(/_/g, " ")}:</label>
            <input
              type="text"
              name={key}
              value={value}
              onChange={handleChange}
              required
              readOnly={key === "signature" || key === "transaction_uuid"}
            />
          </div>
        );
      })}

      {/* Include secret input for local use (not submitted to eSewa) */}
      <div>
        <label>Secret Key (Local Use Only):</label>
        <input
          type="text"
          name="secret"
          value={formData.secret}
          onChange={handleChange}
        />
      </div>

      <button
        type="submit"
        style={{
          backgroundColor: "#60bb46",
          color: "white",
          border: "none",
          padding: "10px 20px",
          cursor: "pointer",
          marginTop: "10px",
        }}
      >
        Pay with eSewa
      </button>
    </form>
  );
};

export default Payment;
