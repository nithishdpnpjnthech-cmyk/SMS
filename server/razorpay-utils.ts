import Razorpay from 'razorpay';
import crypto from 'crypto';

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || '',
    key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

export const createRazorpayOrder = async (amount: number, receiptId: string) => {
    const options = {
        amount: Math.round(amount * 100), // amount in the smallest currency unit (paise for INR)
        currency: "INR",
        receipt: receiptId,
    };

    return razorpay.orders.create(options);
};

export const verifyRazorpaySignature = (orderId: string, paymentId: string, signature: string) => {
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '');
    hmac.update(orderId + "|" + paymentId);
    const generatedSignature = hmac.digest('hex');
    return generatedSignature === signature;
};
