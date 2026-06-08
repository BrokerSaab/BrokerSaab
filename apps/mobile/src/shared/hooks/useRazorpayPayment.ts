import { useCallback } from 'react';
import RazorpayCheckout from 'react-native-razorpay';

const RAZORPAY_KEY = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID ?? '';

export interface RazorpayPrefill {
  name?: string;
  email?: string;
  contact?: string;
}

export interface RazorpayResult {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export const useRazorpayPayment = () => {
  const pay = useCallback(
    async (orderId: string, amountPaise: number, prefill?: RazorpayPrefill): Promise<RazorpayResult> => {
      const options = {
        key: RAZORPAY_KEY,
        order_id: orderId,
        currency: 'INR',
        amount: amountPaise,
        name: 'BrokerSaab',
        description: 'Advisory Services',
        prefill: prefill ?? {},
        theme: { color: '#D4AF37' },
      };
      // react-native-razorpay opens the native payment sheet
      const data = await RazorpayCheckout.open(options);
      return data as RazorpayResult;
    },
    [],
  );

  return { pay };
};
