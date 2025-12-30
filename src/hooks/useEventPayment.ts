import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { initializeRazorpayPayment } from '@/utils/razorpay';
import { toast } from 'sonner';

interface PaymentDetails {
  eventId: string;
  eventTitle: string;
  registrationId: string;
  amount: number;
  currency: string;
  userEmail: string;
  userName: string;
  userMobile: string;
}

interface UseEventPaymentReturn {
  processPayment: (details: PaymentDetails) => Promise<boolean>;
  isProcessing: boolean;
}

export const useEventPayment = (): UseEventPaymentReturn => {
  const [isProcessing, setIsProcessing] = useState(false);

  const processPayment = async (details: PaymentDetails): Promise<boolean> => {
    setIsProcessing(true);
    
    return new Promise(async (resolve) => {
      try {
        // Initialize payment and wait for the modal to open
        await initializeRazorpayPayment(
          {
            amount: details.amount,
            currency: details.currency || 'INR',
            name: 'Codevo Events',
            description: `Registration for ${details.eventTitle}`,
            prefill: {
              name: details.userName,
              email: details.userEmail,
              contact: details.userMobile,
            },
            notes: {
              event_id: details.eventId,
              registration_id: details.registrationId,
            },
            theme: {
              color: '#ff8c00',
            },
          },
          async (response) => {
            // Success Callback: Update database
            try {
              const { data: { user } } = await supabase.auth.getUser();
              
              // Record payment in Supabase
              await supabase.from('event_payments').insert({
                event_id: details.eventId,
                registration_id: details.registrationId,
                user_id: user?.id,
                user_email: details.userEmail,
                amount: details.amount,
                currency: details.currency || 'INR',
                payment_gateway: 'razorpay',
                gateway_payment_id: response.razorpay_payment_id,
                gateway_order_id: response.razorpay_order_id || null,
                gateway_signature: response.razorpay_signature || null,
                payment_status: 'completed',
                completed_at: new Date().toISOString(),
              });

              // Update registration status
              await supabase
                .from('event_registrations')
                .update({
                  payment_status: 'paid',
                  status: 'confirmed',
                })
                .eq('id', details.registrationId);

              toast.success('Payment successful! Registration confirmed.');
              setIsProcessing(false);
              resolve(true);
            } catch (error) {
              console.error('Error recording payment:', error);
              toast.error('Payment received but database update failed. Contact support.');
              setIsProcessing(false);
              resolve(false);
            }
          },
          (error) => {
            // Failure Callback
            console.error('Payment failed:', error);
            toast.error(error?.description || 'Payment failed. Please try again.');
            setIsProcessing(false);
            resolve(false);
          }
        );
      } catch (err) {
        console.error('Initialization error:', err);
        setIsProcessing(false);
        resolve(false);
      }
    });
  };

  return {
    processPayment,
    isProcessing,
  };
};
