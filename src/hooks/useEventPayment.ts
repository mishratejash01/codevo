import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { initializeRazorpayPayment } from '@/utils/razorpay';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

interface PaymentDetails {
  eventId: string;
  eventTitle: string;
  registrationId: string;
  amount: number;
  currency: string;
  userEmail: string;
  userName: string;
  userMobile: string;
  formType?: string;
}

interface UseEventPaymentReturn {
  processPayment: (details: PaymentDetails) => Promise<boolean>;
  isProcessing: boolean;
}

interface ClientContext {
  user_agent: string;
  timezone: string;
  screen_resolution: string;
  language: string;
  platform: string;
  timestamp: string;
}

// Get client context for fraud prevention and dispute resolution
const getClientContext = (): ClientContext => {
  return {
    user_agent: navigator.userAgent,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screen_resolution: `${window.screen.width}x${window.screen.height}`,
    language: navigator.language,
    platform: navigator.platform,
    timestamp: new Date().toISOString(),
  };
};

export const useEventPayment = (): UseEventPaymentReturn => {
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchComprehensivePaymentDetails = async (
    paymentId: string,
    registrationId: string,
    clientContext: ClientContext
  ) => {
    try {
      const { data, error } = await supabase.functions.invoke('fetch-razorpay-payment', {
        body: {
          payment_id: paymentId,
          registration_id: registrationId,
          client_context: clientContext,
        },
      });

      if (error) {
        console.error('Error fetching payment details from edge function:', error);
        return null;
      }

      return data?.payment || null;
    } catch (err) {
      console.error('Failed to fetch comprehensive payment details:', err);
      return null;
    }
  };

  const updateRegistrationStatus = async (formType: string | undefined, registrationId: string) => {
    // Use type-safe approach for updating registration
    const updateData = { payment_status: 'paid', status: 'confirmed' };
    
    try {
      switch (formType) {
        case 'workshop':
          await supabase.from('workshop_registrations').update(updateData).eq('id', registrationId);
          break;
        case 'webinar':
          await supabase.from('webinar_registrations').update(updateData).eq('id', registrationId);
          break;
        case 'meetup':
          await supabase.from('meetup_registrations').update(updateData).eq('id', registrationId);
          break;
        case 'contest':
          await supabase.from('contest_registrations').update(updateData).eq('id', registrationId);
          break;
        default:
          await supabase.from('event_registrations').update(updateData).eq('id', registrationId);
      }
    } catch (error) {
      console.error('Error updating registration status:', error);
    }
  };

  const processPayment = async (details: PaymentDetails): Promise<boolean> => {
    setIsProcessing(true);
    const clientContext = getClientContext();
    
    return new Promise(async (resolve) => {
      try {
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
            try {
              const { data: { user } } = await supabase.auth.getUser();
              
              // Fetch comprehensive payment details from Razorpay via edge function
              const comprehensiveDetails = await fetchComprehensivePaymentDetails(
                response.razorpay_payment_id,
                details.registrationId,
                clientContext
              );

              // Build metadata object
              let metadata: Json = {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id || null,
                client_context: clientContext as unknown as Json,
              };

              let paymentMethod: string | null = null;
              let transactionId: string | null = null;

              if (comprehensiveDetails) {
                paymentMethod = comprehensiveDetails.payment_method;
                transactionId = comprehensiveDetails.transaction_id;
                metadata = {
                  razorpay_payment_id: comprehensiveDetails.razorpay_payment_id,
                  razorpay_order_id: comprehensiveDetails.razorpay_order_id,
                  payment_method: comprehensiveDetails.payment_method,
                  is_captured: comprehensiveDetails.is_captured,
                  transaction_id: comprehensiveDetails.transaction_id,
                  acquirer_data: comprehensiveDetails.acquirer_data as Json,
                  card: comprehensiveDetails.card as Json,
                  vpa: comprehensiveDetails.vpa,
                  upi: comprehensiveDetails.upi as Json,
                  bank: comprehensiveDetails.bank,
                  wallet: comprehensiveDetails.wallet,
                  razorpay_fee: comprehensiveDetails.fee,
                  razorpay_tax: comprehensiveDetails.tax,
                  razorpay_email: comprehensiveDetails.razorpay_email,
                  razorpay_contact: comprehensiveDetails.razorpay_contact,
                  customer_id: comprehensiveDetails.customer_id,
                  is_international: comprehensiveDetails.is_international,
                  razorpay_created_at: comprehensiveDetails.razorpay_created_at,
                  razorpay_created_at_iso: comprehensiveDetails.razorpay_created_at_iso,
                  client_context: {
                    user_agent: clientContext.user_agent,
                    timezone: clientContext.timezone,
                    screen_resolution: clientContext.screen_resolution,
                    language: clientContext.language,
                    platform: clientContext.platform,
                    payment_initiated_at: clientContext.timestamp,
                  },
                  fetched_at: comprehensiveDetails.fetched_at,
                };
              }

              // Record payment in Supabase
              const { error: paymentError } = await supabase
                .from('event_payments')
                .insert({
                  event_id: details.eventId,
                  registration_id: details.registrationId,
                  user_id: user?.id || null,
                  user_email: details.userEmail,
                  amount: details.amount,
                  currency: details.currency || 'INR',
                  payment_gateway: 'razorpay',
                  gateway_payment_id: response.razorpay_payment_id,
                  gateway_order_id: response.razorpay_order_id || null,
                  gateway_signature: response.razorpay_signature || null,
                  payment_status: 'completed',
                  completed_at: new Date().toISOString(),
                  payment_method: paymentMethod,
                  transaction_id: transactionId,
                  metadata: metadata,
                } as any); // Cast to any to allow registration_form_type column

              if (paymentError) {
                console.error('Error inserting payment record:', paymentError);
              }

              // Update registration status
              await updateRegistrationStatus(details.formType, details.registrationId);

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
          async (error) => {
            try {
              const { data: { user } } = await supabase.auth.getUser();
              
              // Record failed payment for audit trail
              await supabase.from('event_payments').insert({
                event_id: details.eventId,
                registration_id: details.registrationId,
                user_id: user?.id || null,
                user_email: details.userEmail,
                amount: details.amount,
                currency: details.currency || 'INR',
                payment_gateway: 'razorpay',
                payment_status: 'failed',
                metadata: {
                  error_code: error?.code || null,
                  error_description: error?.description || null,
                  error_reason: error?.reason || null,
                  error_source: error?.source || null,
                  error_step: error?.step || null,
                  client_context: clientContext as unknown as Json,
                  failed_at: new Date().toISOString(),
                } as Json,
              });
            } catch (recordError) {
              console.error('Error recording failed payment:', recordError);
            }

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
