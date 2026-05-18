import Razorpay from "razorpay";

const keyId = process.env.RAZORPAY_KEY_ID || "";
const keySecret = process.env.RAZORPAY_KEY_SECRET || "";

const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

export async function createOrder(amount: number, currency = "INR", receipt?: string) {
  // Razorpay expects amount in paise
  const options = {
    amount: Math.round(amount * 100),
    currency,
    receipt: receipt || `rcpt_${Date.now()}`,
    payment_capture: 1,
  };
  const order = await razorpay.orders.create(options as any);
  return order;
}

export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string) {
  const crypto = require("crypto");
  const generated = crypto
    .createHmac("sha256", keySecret)
    .update(orderId + "|" + paymentId)
    .digest("hex");
  return generated === signature;
}

export default { createOrder, verifyPaymentSignature };
