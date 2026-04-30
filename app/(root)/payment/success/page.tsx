import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { confirmStripeCreditPurchase } from "@/lib/actions/auth.actions";

type PaymentSuccessPageProps = {
    searchParams: Promise<{
        session_id?: string;
    }>;
};

const PaymentSuccessPage = async ({ searchParams }: PaymentSuccessPageProps) => {
    const { session_id: sessionId } = await searchParams;
    let credits: number | null = null;
    let error: string | null = null;

    if (!sessionId) {
        error = "Missing Stripe checkout session.";
    } else {
        try {
            const result = await confirmStripeCreditPurchase(sessionId);
            credits = result.credits;
        } catch (e) {
            error = e instanceof Error ? e.message : "Unable to confirm your payment.";
        }
    }

    const isSuccess = !error;

    return (
        <main className="mx-auto flex min-h-[calc(100vh-12rem)] max-w-xl flex-col items-center justify-center text-center">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/5">
                {isSuccess ? (
                    <CheckCircle2 className="h-7 w-7 text-emerald-300" />
                ) : (
                    <XCircle className="h-7 w-7 text-red-300" />
                )}
            </div>

            <h1 className="text-3xl font-semibold">
                {isSuccess ? "Payment complete" : "Payment not confirmed"}
            </h1>

            <p className="mt-3 text-base text-light-100">
                {isSuccess
                    ? `Your InterviewIQ balance is now ${credits?.toFixed(2)} credits.`
                    : error}
            </p>

            <div className="mt-8 flex gap-3">
                <Button asChild>
                    <Link href="/">Back to dashboard</Link>
                </Button>
                <Button asChild variant="outline">
                    <Link href="/interview">Start an interview</Link>
                </Button>
            </div>
        </main>
    );
};

export default PaymentSuccessPage;
