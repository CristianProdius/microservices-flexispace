"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { AlertCircle, CreditCard } from "lucide-react";
import { useTranslations } from "next-intl";
import { STRIPE_PUBLISHABLE_KEY } from "@/lib/config";

interface CheckoutPaymentFormProps {
  clientSecret: string;
  onConfirmed: () => void;
}

const PaymentFormInner = ({ onConfirmed }: Pick<CheckoutPaymentFormProps, "onConfirmed">) => {
  const stripe = useStripe();
  const elements = useElements();
  const t = useTranslations("booking");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitPayment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!stripe || !elements || submitting) return;

    setSubmitting(true);
    setError(null);
    const result = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (result.error) {
      setError(result.error.message ?? t("payment.paymentFailedRetry"));
      setSubmitting(false);
      return;
    }

    const status = result.paymentIntent?.status;
    if (status === "requires_capture" || status === "succeeded") {
      onConfirmed();
      return;
    }

    setError(t("payment.paymentFailedRetry"));
    setSubmitting(false);
  };

  return (
    <form onSubmit={submitPayment} className="space-y-4">
      <PaymentElement />
      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}
      <button
        type="submit"
        disabled={!stripe || !elements || submitting}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <CreditCard className="size-4" />
        {submitting ? t("processing") : t("payment.completePayment")}
      </button>
    </form>
  );
};

const CheckoutPaymentForm = ({ clientSecret, onConfirmed }: CheckoutPaymentFormProps) => {
  const t = useTranslations("booking");
  const stripePromise = useMemo(
    () => (STRIPE_PUBLISHABLE_KEY ? loadStripe(STRIPE_PUBLISHABLE_KEY) : null),
    []
  );

  if (!stripePromise) {
    return (
      <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
        <AlertCircle className="mt-0.5 size-4 shrink-0" />
        <p>{t("payment.paymentFailedRetry")}</p>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <PaymentFormInner onConfirmed={onConfirmed} />
    </Elements>
  );
};

export default CheckoutPaymentForm;
