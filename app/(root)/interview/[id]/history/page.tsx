import dayjs from "dayjs";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/actions/auth.actions";
import {
    getFeedbackHistoryByInterviewId,
    getInterviewsById,
} from "@/lib/actions/general.action";

const HistoryPage = async ({ params }: RouteParams) => {
    const { id } = await params;
    const user = await getCurrentUser();

    if (!user) redirect("/sign-in");

    const [interview, feedbackHistory] = await Promise.all([
        getInterviewsById(id),
        getFeedbackHistoryByInterviewId(id, user.id),
    ]);

    if (!interview) redirect("/");

    return (
        <section className="section-feedback">
            <div className="flex flex-col items-center gap-3 text-center">
                <h1 className="text-4xl font-semibold">
                    Past Attempts -{" "}
                    <span className="capitalize">{interview.role}</span> Interview
                </h1>
                <p className="text-base">
                    Review previous feedback and compare your progress over time.
                </p>
            </div>

            {feedbackHistory.length > 0 ? (
                <div className="flex flex-col gap-4">
                    {feedbackHistory.map((feedback, index) => (
                        <Link
                            key={feedback.id}
                            href={`/interview/${id}/feedback?feedbackId=${feedback.id}`}
                            className="rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10"
                        >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <h2 className="text-xl font-semibold">
                                        Attempt {feedbackHistory.length - index}
                                    </h2>
                                    <p className="text-sm">
                                        {feedback.createdAt
                                            ? dayjs(feedback.createdAt).format("MMM D, YYYY h:mm A")
                                            : "Date unavailable"}
                                    </p>
                                </div>

                                <p className="text-lg font-bold text-primary-200">
                                    {feedback.totalScore}/100
                                </p>
                            </div>

                            <p className="mt-4 line-clamp-2 text-base">
                                {feedback.finalAssessment || "No summary available."}
                            </p>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
                    <p>No feedback attempts found for this interview.</p>
                </div>
            )}

            <div className="buttons">
                <Button asChild className="btn-secondary flex-1">
                    <Link href={`/interview/${id}/feedback`}>
                        <p className="text-sm font-semibold text-primary-200 text-center">
                            Back to latest feedback
                        </p>
                    </Link>
                </Button>

                <Button asChild className="btn-primary flex-1">
                    <Link href={`/interview/${id}`}>
                        <p className="text-sm font-semibold text-black text-center">
                            Retake Interview
                        </p>
                    </Link>
                </Button>
            </div>
        </section>
    );
};

export default HistoryPage;
