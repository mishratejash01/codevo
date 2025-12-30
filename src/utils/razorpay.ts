import { toast } from "sonner";

interface PaymentOptions {
  key?: string; // Allow passing key from page
  amount: number;
  currency: string;
  orderId?: string;
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

const RAZORPAY_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";

const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const initializeRazorpayPayment = async (
  options: PaymentOptions,
  onSuccess: (response: any) => void,
  onFailure: (error: any) => void
) => {
  console.log("Attempting to open Razorpay Modal...");
  
  const isLoaded = await loadRazorpayScript();

  if (!isLoaded || !window.Razorpay) {
    console.error("Razorpay SDK could not be loaded. Check your Ad-Blocker.");
    toast.error("Payment gateway blocked. Please disable your Ad-Blocker to continue.");
    onFailure({ description: "SDK_LOAD_ERROR" });
    return;
  }

  // FIX: Key must be on a single line. 
  // We use the key passed in options, or fallback to the test key.
  const RAZORPAY_KEY_ID = options.key || "rzp_test_RxwjSllgmQ72cg";

  const paymentOptions = {
    key: RAZORPAY_KEY_ID,
    amount: Math.round(options.amount * 100), // Amount in paise
    currency: options.currency || "INR",
    name: options.name,
    description: options.description,
    image: "/image.png",
    order_id: options.orderId,
    handler: function (response: any) {
      console.log("Payment Successful:", response.razorpay_payment_id);
      onSuccess(response);
    },
    prefill: options.prefill,
    notes: options.notes,
    theme: options.theme || {
      color: "#ff8c00",
    },
    modal: {
      ondismiss: function () {
        console.log("Payment modal closed by user");
        toast.info("Payment cancelled");
        onFailure({ description: "Payment cancelled by user" });
      },
    },
  };

  try {
    const rzp = new (window as any).Razorpay(paymentOptions);
    
    rzp.on("payment.failed", function (response: any) {
      console.error("Payment Failed:", response.error);
      onFailure(response.error);
    });

    rzp.open();
  } catch (error) {
    console.error("Razorpay Modal Error:", error);
    toast.error("Failed to open payment gateway.");
    onFailure(error);
  }
};
