import { toast } from "sonner";

interface PaymentOptions {
  amount: number;
  currency: string;
  orderId?: string; // Optional: If you generate orders on backend
  name: string;
  description: string;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color: string;
  };
}

export const initializeRazorpayPayment = (
  options: PaymentOptions,
  onSuccess: (response: any) => void,
  onFailure: (error: any) => void
) => {
  const Razorpay = window.Razorpay;

  if (!Razorpay) {
    toast.error("Razorpay SDK not loaded. Please check your internet connection.");
    return;
  }

  // Live Key ID
  const RAZORPAY_KEY_ID = "rzp_live_Rxvn7fqMFo62r3";

  const paymentOptions = {
    key: RAZORPAY_KEY_ID,
    amount: options.amount * 100, // Amount in paise (e.g., 500.00 -> 50000)
    currency: options.currency,
    name: options.name,
    description: options.description,
    image: "/image.png", // Using your public image
    order_id: options.orderId,
    handler: function (response: any) {
      onSuccess(response);
    },
    prefill: options.prefill,
    notes: options.notes,
    theme: options.theme || {
      color: "#ff8c00", // Codevo Orange
    },
    modal: {
      ondismiss: function () {
        toast.info("Payment cancelled");
      },
    },
  };

  try {
    const rzp = new Razorpay(paymentOptions);
    
    rzp.on("payment.failed", function (response: any) {
      onFailure(response.error);
    });

    rzp.open();
  } catch (error) {
    console.error("Razorpay Initialization Error:", error);
    toast.error("Failed to initialize payment gateway.");
  }
};
