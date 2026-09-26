/**
 * Razorpay Checkout Service for ExamSimula
 */

export interface StudentPrefill {
  name?: string;
  email?: string;
  contact?: string;
}

export interface PurchaseOrderResponse {
  success: boolean;
  data?: {
    order_id?: string;
    rzp_order_id?: string;
    amount?: number;
    amount_paise?: number;
    currency?: string;
    key_id?: string;
    paper_id?: number;
  };
  order_id?: string;
  rzp_order_id?: string;
  key_id?: string;
  amount_paise?: number;
  currency?: string;
  error?: string;
  message?: string;
}

export interface PaymentSuccessData {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface CheckoutOptions {
  paperId: number;
  paperTitle: string;
  pricePaise?: number;
  student?: StudentPrefill;
  token?: string | null;
  referralCode?: string | null;
  onSuccess?: (paymentData: PaymentSuccessData) => void;
  onError?: (error: any) => void;
  onDismiss?: () => void;
}

/**
 * Dynamically injects the Razorpay checkout script into the DOM if not already loaded.
 */
export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true));
      existingScript.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error('Failed to load Razorpay checkout script.');
      resolve(false);
    };

    document.body.appendChild(script);
  });
};

/**
 * Calls Go Backend to create a purchase order and get the Razorpay order_id.
 */
export const createPurchaseOrder = async (
  paperId: number,
  referralCode?: string | null,
  token?: string | null
): Promise<PurchaseOrderResponse> => {
  const authToken = token || localStorage.getItem('auth_token');
  const apiUrl = import.meta.env.VITE_EXAM_API_URL || 'http://localhost:8080';

  const response = await fetch(`${apiUrl}/api/v1/purchases`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
    },
    body: JSON.stringify({
      exam_paper_id: paperId,
      paper_id: paperId,
      referral_code: referralCode || undefined,
      currency: 'INR'
    })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || errData.message || `Failed to create purchase order (HTTP ${response.status})`);
  }

  return await response.json();
};

/**
 * Calls Go Backend to verify and capture the payment after checkout success.
 */
export const verifyPurchasePayment = async (
  paymentData: PaymentSuccessData,
  token?: string | null
): Promise<any> => {
  const authToken = token || localStorage.getItem('auth_token');
  const apiUrl = import.meta.env.VITE_EXAM_API_URL || 'http://localhost:8080';

  const response = await fetch(`${apiUrl}/api/v1/purchases/update`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
    },
    body: JSON.stringify({
      rzp_order_id: paymentData.razorpay_order_id,
      rzp_payment_id: paymentData.razorpay_payment_id,
      rzp_signature: paymentData.razorpay_signature,
      status: 'captured'
    })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || errData.message || 'Payment verification failed on server');
  }

  return await response.json();
};

/**
 * Full Razorpay checkout flow:
 * 1. Ensure Razorpay checkout script is loaded
 * 2. Fetch order_id from Go backend
 * 3. Initialize new window.Razorpay(options) with Test Key ID & prefilled student details
 * 4. Call rzp.open() to display the modal
 */
export const openRazorpayCheckout = async ({
  paperId,
  paperTitle,
  pricePaise,
  student,
  token,
  referralCode,
  onSuccess,
  onError,
  onDismiss
}: CheckoutOptions): Promise<void> => {
  // Step 1: Ensure Razorpay script is loaded
  const isLoaded = await loadRazorpayScript();
  if (!isLoaded) {
    const errorMsg = 'Failed to load Razorpay payment gateway. Please check your internet connection.';
    if (onError) onError(new Error(errorMsg));
    else alert(errorMsg);
    return;
  }

  try {
    // Step 2: Call Go Backend to fetch the order_id
    const orderRes = await createPurchaseOrder(paperId, referralCode, token);
    const orderData = orderRes.data || orderRes;
    const orderId = orderData.rzp_order_id || orderData.order_id || orderRes.rzp_order_id || orderRes.order_id;
    const razorpayKey =
      orderData.key_id ||
      orderRes.key_id ||
      orderRes.data?.key_id ||
      import.meta.env.VITE_RAZORPAY_KEY_ID ||
      'rzp_test_TfqCUTSu39gbr9';

    if (!orderId) {
      throw new Error('Order ID was not received from backend server.');
    }

    // Step 3: Initialize checkout options
    const options: RazorpayOptions = {
      key: razorpayKey,
      amount: orderData.amount_paise || pricePaise || 4900,
      currency: orderData.currency || 'INR',
      name: 'ExamSimula',
      description: `Purchase: ${paperTitle || `Mock Paper #${paperId}`}`,
      image: '/favicon.svg',
      order_id: orderId,
      prefill: {
        name: student?.name || '',
        email: student?.email || '',
        contact: student?.contact || ''
      },
      theme: {
        color: '#1e3a8a' // Indigo / Deep Navy theme
      },
      modal: {
        ondismiss: () => {
          if (onDismiss) onDismiss();
        }
      },
      handler: async (response) => {
        try {
          // Verify with backend
          await verifyPurchasePayment(response, token);
          if (onSuccess) {
            onSuccess(response);
          }
        } catch (err) {
          console.error('Payment verification error:', err);
          if (onError) onError(err);
          else alert('Payment received but verification encountered an issue. Please contact support.');
        }
      }
    };

    // Step 4: Initialize modal instance and open UI
    const rzp = new window.Razorpay(options);

    rzp.on('payment.failed', (failRes: any) => {
      console.error('Razorpay Payment Failed:', failRes.error);
      const description = failRes.error?.description || 'Payment was unsuccessful.';
      if (onError) {
        onError(new Error(description));
      } else {
        alert(`Payment failed: ${description}`);
      }
    });

    rzp.open();
  } catch (error: any) {
    console.error('Checkout initiation failed:', error);
    if (onError) onError(error);
    else alert(`Checkout error: ${error.message || 'Unable to initiate payment'}`);
  }
};
