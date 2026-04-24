'use client';

import React, {useCallback, useEffect, useRef, useState} from 'react'
import Image from "next/image";
import { cn } from "@/lib/utils";
import {useRouter} from "next/navigation";
import { vapi } from '@/lib/vapi.sdk';
import {interviewer} from "@/constants";
import {createFeedback} from "@/lib/actions/general.action";
import {deductInterviewCredits} from "@/lib/actions/auth.actions";
import {toast} from "sonner";


enum CallStatus {
    INACTIVE = "INACTIVE",
    CONNECTING = "CONNECTING",
    ACTIVE = "ACTIVE",
    FINISHED = "FINISHED",
}

interface SavedMessage {
    role: 'user' | 'system' | 'assistant';
    content: string;
}

const Agent = ({ userName, userId, type, interviewId, questions, initialCredits = 0 }: AgentProps) => {
    const router = useRouter();
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
    const [messages, setMessages] = useState<SavedMessage[]>([]);
    const callStartedAtRef = useRef<number | null>(null);
    const creditChargeHandledRef = useRef(false);

    useEffect(() => {
        const onCallStart = () => {
            callStartedAtRef.current = Date.now();
            creditChargeHandledRef.current = false;
            setCallStatus(CallStatus.ACTIVE);
        };
        const onCallEnd = () => setCallStatus(CallStatus.FINISHED);

        const onMessage = (message: Message) => {
            if(message.type === 'transcript' && message.transcriptType === 'final') {
                const newMessage = { role: message.role, content: message.transcript }

                setMessages((prev) => [ ...prev, newMessage]);
            }
        }

        const onSpeechStart = () => setIsSpeaking(true);
        const onSpeechEnd = () => setIsSpeaking(false);

        const onError = (error: Error) => console.log('Error', error);

        vapi.on('call-start', onCallStart);
        vapi.on('call-end', onCallEnd);
        vapi.on('message', onMessage);
        vapi.on('speech-start', onSpeechStart);
        vapi.on('speech-end', onSpeechEnd);
        vapi.on('error', onError);

        return () => {
            vapi.off('call-start', onCallStart);
            vapi.off('call-end', onCallEnd);
            vapi.off('message', onMessage);
            vapi.off('speech-start', onSpeechStart);
            vapi.off('speech-end', onSpeechEnd);
            vapi.off('error', onError);
        }
    },[])

    const handleGenerateFeedback = useCallback(async (messages: SavedMessage[]) => {
        console.log('Generate feedback here');

        // TODO: create a server action that generates feedback
        const { success, feedbackId: id } = await createFeedback({
            interviewId: interviewId!,
            userId: userId!,
            transcript: messages
        })

        if(success && id) {
            router.push(`/interview/${interviewId}/feedback`);
        } else {
            console.log('Error saving feedback');
            router.push('/');
        }
    }, [interviewId, router, userId]);

    const finalizeCreditCharge = useCallback(async () => {
        if (type !== 'interview' || creditChargeHandledRef.current) {
            return;
        }

        creditChargeHandledRef.current = true;

        const startedAt = callStartedAtRef.current;
        const endedAt = Date.now();

        if (!startedAt) {
            return;
        }

        try {
            const result = await deductInterviewCredits({ startedAt, endedAt });

            if (result.chargedCredits > 0) {
                toast.success(
                    `Charged ${result.chargedCredits.toFixed(2)} credits for ${result.durationMinutes.toFixed(2)} min. Balance: ${result.credits.toFixed(2)}`
                );
            }

            router.refresh();
        } catch (error) {
            console.error("Failed to deduct interview credits", error);
            toast.error("Interview completed, but credit deduction failed.");
        }
    }, [router, type]);

    useEffect(() => {
        if (callStatus === CallStatus.FINISHED) {
            const finishInterview = async () => {
                await finalizeCreditCharge();

                if(type === 'generate') {
                    router.push('/');
                } else {
                    const userMessages = messages.filter(
                        (msg) => msg.role === "user" && msg.content.trim().length > 2
                    );

                    const totalWords = userMessages.reduce((count, msg) => {
                        return count + msg.content.trim().split(" ").length;
                    }, 0);

                    if (userMessages.length < 2 || totalWords < 10) {
                        console.log("Not enough meaningful answers → skip feedback");
                        router.push("/");
                        return;
                    }

                    await handleGenerateFeedback(messages);
                }
            };

            finishInterview();
        }
    }, [callStatus, finalizeCreditCharge, handleGenerateFeedback, messages, router, type]);

    const handleCall = async () => {
        if (type === 'interview' && initialCredits < 0.1) {
            toast.error("You need at least 0.10 credits to start an interview.");
            return;
        }

        setCallStatus(CallStatus.CONNECTING);

        if(type === 'generate') {
        await vapi.start(process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID!, {
            variableValues: {
                username: userName,
                userid: userId,
            }
        })
    } else {
            let formattedQuestions = '';

            if(questions) {
                formattedQuestions = questions
                    .map((question) => `- ${question}`)
                    .join('\n');
            }

            await vapi.start( interviewer, {
                variableValues: {
                    questions: formattedQuestions
                }
            })
        }
    }
    const handleDisconnect = async () => {
        setCallStatus(CallStatus.FINISHED);

        vapi.stop();
    }

    const LATESTMessage = messages[messages.length - 1]?.content;
    const isCallInactiveOrFinished = callStatus === CallStatus.INACTIVE || callStatus === CallStatus.FINISHED;


    return (
        <>
            <div className="call-view">
                {/* AI Interviewer Card */}
                <div className="card-interviewer">
                    <div className="avatar">
                        <Image
                            src="/ai-avatar.png"
                            alt="profile-image"
                            width={65}
                            height={54}
                            className="object-cover"
                        />
                        {isSpeaking && <span className="animate-speak" />}
                    </div>
                    <h3>AI Interviewer</h3>
                </div>

                {/* User Profile Card */}
                <div className="card-border">
                    <div className="card-content">
                        <Image
                            src="/user-avatar.jpg"
                            alt="profile-image"
                            width={539}
                            height={539}
                            className="rounded-full object-cover size-[120px]"
                        />
                        <h3>{userName}</h3>
                    </div>
                </div>
            </div>

            {messages.length > 0 && (
                <div className="transcript-border">
                    <div className="transcript">
                        <p
                            key={LATESTMessage}
                            className={cn(
                                "transition-opacity duration-500 opacity-0",
                                "animate-fadeIn opacity-100"
                            )}
                        >
                            {LATESTMessage}
                        </p>
                    </div>
                </div>
            )}

            <div className="w-full flex justify-center">
                {callStatus !== CallStatus.ACTIVE ? (
                    <button className="relative btn-call" onClick={handleCall}>
                        <span
                            className={cn(
                                "absolute animate-ping rounded-full opacity-75",
                                callStatus !== CallStatus.CONNECTING && "hidden"
                            )}
                        />

                        <span>
                                {isCallInactiveOrFinished? 'Call': '. . .'}
                        </span>
                    </button>
                ) : (
                    <button className="btn-disconnect" onClick={handleDisconnect}>
                        End
                    </button>
                )}
            </div>
        </>
    );
};

export default Agent;
