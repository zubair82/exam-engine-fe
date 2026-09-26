/// <reference types="vite/client" />

interface RazorpayOptions {
  key: string;
  amount?: number;
  currency?: string;
  name?: string;
  description?: string;
  image?: string;
  order_id: string;
  handler?: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
    confirm_close?: boolean;
    escape?: boolean;
    backdropclose?: boolean;
  };
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, callback: (response: any) => void) => void;
  close: () => void;
}

interface Window {
  Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
}