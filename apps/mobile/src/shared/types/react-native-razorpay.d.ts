declare module 'react-native-razorpay' {
  interface RazorpayOptions {
    key: string;
    order_id: string;
    currency?: string;
    amount: number;
    name?: string;
    description?: string;
    prefill?: { name?: string; email?: string; contact?: string };
    theme?: { color?: string };
  }

  interface RazorpaySuccessPayload {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }

  const RazorpayCheckout: {
    open(options: RazorpayOptions): Promise<RazorpaySuccessPayload>;
  };

  export default RazorpayCheckout;
}
