import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { openRazorpayCheckout, PaymentSuccessData } from '../services/razorpayService';

interface UseRazorpayCheckoutOptions {
  onSuccess?: (paymentData: PaymentSuccessData, paperId: number) => void;
  onError?: (error: Error, paperId: number) => void;
}

export const useRazorpayCheckout = (options?: UseRazorpayCheckoutOptions) => {
  const { user, token } = useAuth();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [activePaperId, setActivePaperId] = useState<number | null>(null);

  const buyPaper = useCallback(async ({
    paperId,
    paperTitle,
    pricePaise,
    referralCode,
    onSuccessCallback,
    onErrorCallback
  }: {
    paperId: number;
    paperTitle?: string;
    pricePaise?: number;
    referralCode?: string | null;
    onSuccessCallback?: (data: PaymentSuccessData) => void;
    onErrorCallback?: (err: Error) => void;
  }) => {
    setIsCheckingOut(true);
    setActivePaperId(paperId);

    const activeRefCode = referralCode || localStorage.getItem('referral_code') || sessionStorage.getItem('referral_code');

    await openRazorpayCheckout({
      paperId,
      paperTitle: paperTitle || `Exam Paper #${paperId}`,
      pricePaise,
      student: {
        name: user?.name,
        email: user?.email
      },
      token,
      referralCode: activeRefCode,
      onSuccess: (paymentData) => {
        setIsCheckingOut(false);
        setActivePaperId(null);
        if (onSuccessCallback) onSuccessCallback(paymentData);
        if (options?.onSuccess) options.onSuccess(paymentData, paperId);
      },
      onError: (err) => {
        setIsCheckingOut(false);
        setActivePaperId(null);
        if (onErrorCallback) onErrorCallback(err);
        if (options?.onError) options.onError(err, paperId);
      },
      onDismiss: () => {
        setIsCheckingOut(false);
        setActivePaperId(null);
      }
    });
  }, [user, token, options]);

  return {
    buyPaper,
    isCheckingOut,
    activePaperId
  };
};

export default useRazorpayCheckout;
