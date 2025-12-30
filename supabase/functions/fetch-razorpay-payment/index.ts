import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RazorpayPaymentResponse {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  status: string;
  order_id: string | null;
  invoice_id: string | null;
  international: boolean;
  method: string;
  amount_refunded: number;
  refund_status: string | null;
  captured: boolean;
  description: string;
  card_id: string | null;
  bank: string | null;
  wallet: string | null;
  vpa: string | null;
  email: string;
  contact: string;
  customer_id: string | null;
  notes: Record<string, string>;
  fee: number;
  tax: number;
  error_code: string | null;
  error_description: string | null;
  error_source: string | null;
  error_step: string | null;
  error_reason: string | null;
  acquirer_data: {
    auth_code?: string;
    rrn?: string;
    bank_transaction_id?: string;
    upi_transaction_id?: string;
  };
  created_at: number;
  card?: {
    id: string;
    entity: string;
    name: string;
    last4: string;
    network: string;
    type: string;
    issuer: string | null;
    international: boolean;
    emi: boolean;
    sub_type: string;
  };
  upi?: {
    vpa: string;
    flow: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { payment_id, registration_id, client_context } = await req.json();

    if (!payment_id) {
      console.error('Missing payment_id in request');
      return new Response(
        JSON.stringify({ error: 'payment_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Razorpay Key ID is a publishable key, safe to use directly
    const razorpayKeyId = 'rzp_live_Rxvn7fqMFo62r3';
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET');

    if (!razorpayKeySecret) {
      console.error('RAZORPAY_KEY_SECRET not configured');
      return new Response(
        JSON.stringify({ error: 'Payment gateway not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Basic Auth header for Razorpay API
    const authHeader = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);

    console.log(`Fetching payment details for: ${payment_id}`);

    // Fetch payment details from Razorpay
    const razorpayResponse = await fetch(
      `https://api.razorpay.com/v1/payments/${payment_id}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${authHeader}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!razorpayResponse.ok) {
      const errorText = await razorpayResponse.text();
      console.error('Razorpay API error:', razorpayResponse.status, errorText);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch payment details from Razorpay',
          details: errorText 
        }),
        { status: razorpayResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const paymentData: RazorpayPaymentResponse = await razorpayResponse.json();
    console.log('Payment data retrieved successfully:', paymentData.id, paymentData.status);

    // Extract key details for dispute resolution
    const comprehensivePaymentDetails = {
      // Core identifiers
      razorpay_payment_id: paymentData.id,
      razorpay_order_id: paymentData.order_id,
      registration_id: registration_id,

      // Payment method details
      payment_method: paymentData.method,
      payment_status: paymentData.status,
      is_captured: paymentData.captured,

      // Amount details
      amount: paymentData.amount / 100, // Convert from paise to rupees
      currency: paymentData.currency,
      fee: paymentData.fee ? paymentData.fee / 100 : null,
      tax: paymentData.tax ? paymentData.tax / 100 : null,
      amount_refunded: paymentData.amount_refunded ? paymentData.amount_refunded / 100 : 0,
      refund_status: paymentData.refund_status,

      // Bank/Card Reference Numbers (CRITICAL for disputes)
      transaction_id: paymentData.acquirer_data?.rrn || 
                      paymentData.acquirer_data?.bank_transaction_id || 
                      paymentData.acquirer_data?.upi_transaction_id || 
                      paymentData.acquirer_data?.auth_code || null,
      acquirer_data: paymentData.acquirer_data,

      // Card details (if card payment)
      card: paymentData.card ? {
        last4: paymentData.card.last4,
        network: paymentData.card.network,
        type: paymentData.card.type,
        issuer: paymentData.card.issuer,
        international: paymentData.card.international,
        sub_type: paymentData.card.sub_type,
      } : null,

      // UPI details (if UPI payment)
      vpa: paymentData.vpa,
      upi: paymentData.upi,

      // Bank details (if netbanking)
      bank: paymentData.bank,

      // Wallet details (if wallet payment)
      wallet: paymentData.wallet,

      // Customer details from Razorpay
      razorpay_email: paymentData.email,
      razorpay_contact: paymentData.contact,
      customer_id: paymentData.customer_id,

      // Payment description and notes
      description: paymentData.description,
      notes: paymentData.notes,

      // International transaction flag
      is_international: paymentData.international,

      // Razorpay timestamp (Unix)
      razorpay_created_at: paymentData.created_at,
      razorpay_created_at_iso: new Date(paymentData.created_at * 1000).toISOString(),

      // Error details (if any)
      error_code: paymentData.error_code,
      error_description: paymentData.error_description,
      error_source: paymentData.error_source,
      error_step: paymentData.error_step,
      error_reason: paymentData.error_reason,

      // Client context (passed from frontend)
      client_ip: client_context?.ip || null,
      user_agent: client_context?.user_agent || null,
      timezone: client_context?.timezone || null,
      screen_resolution: client_context?.screen_resolution || null,
      
      // Timestamp of this fetch
      fetched_at: new Date().toISOString(),
    };

    console.log('Comprehensive payment details prepared for:', payment_id);

    return new Response(
      JSON.stringify({
        success: true,
        payment: comprehensivePaymentDetails,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error in fetch-razorpay-payment:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
