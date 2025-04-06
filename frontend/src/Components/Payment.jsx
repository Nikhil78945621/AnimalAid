import React, { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import CryptoJS from "crypto-js";

const Payment = () => {
  const [formData, setFormData] = useState({
    amount: "10",
    tax_amount: "0",
    total_amount: "10",
    transaction_uuid: uuidv4(),
    product_service_charge: "0",
    product_delivery_charge: "0",
    product_code: "EPAYTEST",
    success_url: "http://localhost:3000/paymentsuccess",
    failed_url: "http://localhost:3000/paymentfailed",
    signed_field_names: "total_amount,transaction_uuid,product_code",
    signature: "",
    secret: "8gBm/:&EnhH.1/q",
  });

  const generateSignature = (
    total_amount,
    transaction_uuid,
    product_code,
    secret
  ) => {
    const hashString = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${product_code}`;
    const hash = CryptoJS.HmacSHA256(hashString, secret);
    const hashedSignature = CryptoJS.enc.Base64.stringify(hash);
    return hashedSignature;
  };

  useEffect(() => {
    const { total_amount, transaction_uuid, product_code, secret } = formData;
    const hashedSignature = generateSignature(
      total_amount,
      transaction_uuid,
      product_code,
      secret
    );
    setFormData({ ...formData, signature: hashedSignature });
  }, [formData.amount]);

  return (
    <div>
      <h2>eSewa Payment</h2>
      <form
        action="https://rc-epay.esewa.com.np/api/epay/main/v2/form"
        method="POST"
      >
        <div className="field">
          <label htmlFor="">Amount</label>

          <input
            type="text"
            name="amount"
            value={formData.amount}
            onChange={({ target }) =>
              setFormData({
                ...formData,
                amount: target.value,
                total_amount: target.value,
              })
            }
            required
          />
        </div>
        <input
          type="hidden"
          name="tax_amount"
          value={formData.tax_amount}
          readOnly
          required
        />
        <input
          type="hidden"
          name="total_amount"
          value={formData.total_amount}
          readOnly
          required
        />
        <input
          type="hidden"
          name="transaction_uuid"
          value={formData.transaction_uuid}
          readOnly
          required
        />
        <input
          type="hidden"
          name="product_code"
          value={formData.product_code}
          readOnly
          required
        />
        <input
          type="hidden"
          name="product_service_charge"
          value={formData.product_service_charge}
          readOnly
          required
        />
        <input
          type="hidden"
          name="product_delivery_charge"
          value={formData.product_delivery_charge}
          readOnly
          required
        />
        <input
          type="hidden"
          name="success_url"
          value={formData.success_url}
          readOnly
          required
        />
        <input
          type="hidden"
          name="failure_url"
          value={formData.failed_url}
          readOnly
          required
        />
        <input
          type="hidden"
          name="signed_field_names"
          value={formData.signed_field_names}
          readOnly
          required
        />
        <input
          type="hidden"
          name="signature"
          value={formData.signature}
          readOnly
          required
        />

        <div className="field">
          <label htmlFor="">FirstName</label>
          <input type="text" />
        </div>

        <div className="field">
          <label htmlFor="">LastName</label>
          <input type="text" />
        </div>
        <input type="submit" value="Pay with eSewa" />
      </form>
    </div>
  );
};

export default Payment;
