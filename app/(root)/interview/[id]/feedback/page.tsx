import {getCurrentUser} from "@/lib/actions/auth.actions";
import {
    getFeedbackById,
    getFeedbackByInterviewId, // ❌ (kept for reference, not used anymore)
    getFeedbackHistoryByInterviewId,
    getInterviewsById
} from "@/lib/actions/general.action";
import {redirect} from "next/navigation";
import {Button} from "@/components/ui/button";
import Link from "next/link";
import dayjs from "dayjs";

function Img(props: { src: string, width: number, height: number, alt: string }) {
    void props;
    return null;
}

const Page = async ({ params, searchParams }: RouteParams) => {
    const { id } = await params
    const { feedbackId } = await searchParams
    const user = await getCurrentUser();

    if (!user) redirect("/sign-in");

    const interview = await getInterviewsById(id);
    if(!interview) redirect('/');

    /**
     * ❌ OLD APPROACH (Problem)
     * - Uses getFeedbackByInterviewId (random result due to no order guarantee)
     * - Causes outdated feedback to show after multiple attempts
     */
    /*
    const [latestFeedback, feedbackHistory] = await Promise.all([
        getFeedbackByInterviewId({
            interviewId: id,
            userId: user.id,
        }),
        getFeedbackHistoryByInterviewId(id, user.id),
    ]);
    */

    /**
     * ✅ NEW APPROACH (Fix)
     * - Use ONLY history function
     * - Already sorted by createdAt DESC
     * - feedbackHistory[0] = latest attempt ALWAYS
     */
    const feedbackHistory = await getFeedbackHistoryByInterviewId(id, user.id);

    // ✅ Safety: if no feedback exists, redirect
    if (!feedbackHistory.length) redirect('/');

    /**
     * ❌ OLD LOGIC
     */
    /*
    const feedback = feedbackId
        ? await getFeedbackById({
            feedbackId,
            interviewId: id,
            userId: user.id,
        })
        : latestFeedback;
    */

    /**
     * ✅ NEW LOGIC
     * - If user selects past attempt → load that
     * - Otherwise → ALWAYS show latest (index 0)
     */
    const feedback = feedbackId
        ? await getFeedbackById({
            feedbackId,
            interviewId: id,
            userId: user.id,
        })
        : feedbackHistory[0];

    const canViewPastAttempts = feedbackHistory.length > 1;

    const pastAttemptsTooltip = canViewPastAttempts
        ? `You have ${feedbackHistory.length} attempts for this interview.`
        : "No past attempts for this interview";

    console.log(feedback);

    return (
        <section className="section-feedback">
            <div className="flex flex-row justify-center">
                <h1 className="text-4xl font-semibold">
                    Feedback on the Interview -{" "}
                    <span className="capitalize">{interview.role}</span> Interview
                </h1>
            </div>

            <div className="flex flex-row justify-center ">
                <div className="flex flex-row gap-5">
                    <div className="flex flex-row gap-2 items-center">
                        <Img src="/star.svg" width={22} height={22} alt="star" />
                        <p>
                            Overall Impression:{" "}
                            <span className="text-primary-200 font-bold">
                                {feedback?.totalScore}
                            </span>
                            /100
                        </p>
                    </div>

                    <div className="flex flex-row gap-2">
                        <Img src="/calendar.svg" width={22} height={22} alt="calendar" />
                        <p>
                            {feedback?.createdAt
                                ? dayjs(feedback.createdAt).format("MMM D, YYYY h:mm A")
                                : "N/A"}
                        </p>
                    </div>
                </div>
            </div>

            <hr />

            <p>{feedback?.finalAssessment}</p>

            <div className="flex flex-col gap-4">
                <h2>Breakdown of the Interview:</h2>
                {feedback?.categoryScores?.map((category, index) => (
                    <div key={index}>
                        <p className="font-bold">
                            {index + 1}. {category.name} ({category.score}/100)
                        </p>
                        <p>{category.comment}</p>
                    </div>
                ))}
            </div>

            <div className="flex flex-col gap-3">
                <h3>Strengths</h3>
                <ul>
                    {feedback?.strengths?.map((strength, index) => (
                        <li key={index}>{strength}</li>
                    ))}
                </ul>
            </div>

            <div className="flex flex-col gap-3">
                <h3>Areas for Improvement</h3>
                <ul>
                    {feedback?.areasForImprovement?.map((area, index) => (
                        <li key={index}>{area}</li>
                    ))}
                </ul>
            </div>

            <div className="buttons">
                <Button asChild className="btn-secondary flex-1">
                    <Link href="/" className="flex w-full justify-center">
                        <p className="text-sm font-semibold text-primary-200 text-center">
                            Back to dashboard
                        </p>
                    </Link>
                </Button>

                <Button asChild className="btn-primary flex-1">
                    <Link
                        href={`/interview/${id}`}
                        className="flex w-full justify-center"
                    >
                        <p className="text-sm font-semibold text-black text-center">
                            Retake Interview
                        </p>
                    </Link>
                </Button>

                <div className="group relative flex-1">
                    {canViewPastAttempts ? (
                        <Button asChild className="btn-secondary w-full">
                            <Link
                                href={`/interview/${id}/history`}
                                className="flex w-full justify-center"
                            >
                                <p className="text-sm font-semibold text-primary-200 text-center">
                                    View Past Attempts
                                </p>
                            </Link>
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            disabled
                            className="btn-secondary w-full cursor-not-allowed opacity-70"
                        >
                            <span className="text-sm font-semibold text-primary-200 text-center">
                                View Past Attempts
                            </span>
                        </Button>
                    )}

                    <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-3 w-max max-w-xs -translate-x-1/2 rounded-lg border border-white/10 bg-dark-200 px-3 py-2 text-xs font-medium text-light-100 opacity-0 shadow-lg transition group-hover:opacity-100">
                        {pastAttemptsTooltip}
                    </span>
                </div>
            </div>
        </section>
    )
}

export default Page;