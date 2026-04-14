'use server';

import {db} from "@/firebase/admin";
import { generateObject } from "ai";
import { GoogleGenAI } from "@google/genai";
import {feedbackSchema} from "@/constants";
import {google} from "@ai-sdk/google";
import OpenAI from "openai";

export async function getInterviewsByUserId(userId: string | undefined) {
    if (!userId) return []; // 🛑 prevent crash

    const interviews = await db
        .collection("interviews")
        .where("userId", "==", userId)
        .orderBy("createdAt", "desc")
        .get();

    return interviews.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    }));
}

export async function getLatestInterviews(params: GetLatestInterviewsParams): Promise<Interview[]> {
    const { userId, limit = 20 } = params;


    const interviews = await db
        .collection("interviews")
        .orderBy("createdAt", "desc")
        .where("finalized", "==", true)
        .where('userId', '!=', userId)
        .limit(limit)
        .get();

    return interviews.docs.map((doc) => ({
        ...(doc.data() as Interview),
        id: doc.id,
    }));
}

export async function getInterviewsById(Id: string): Promise<Interview | null> {


    const interview = await db
        .collection("interviews")
        .doc(Id)
        .get();

    return interview.data() as interview | null;
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function createFeedback(params: CreateFeedbackParams) {
    const { interviewId, userId, transcript } = params;

    try {
        const formattedTranscript = transcript
            .map((sentence: { role: string; content: string }) => (
                `-${sentence.role}: ${sentence.content}\n`
            )).join('');

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "You are a professional interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories",
                },
                {
                    role: "user",
                    content: `You are an AI interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories. Be thorough and detailed in your analysis. Don't be lenient with the candidate. If there are mistakes or areas for improvement, point them out.

Transcript:
${formattedTranscript}

Please score the candidate from 0 to 100 in the following areas. Do not add categories other than the ones provided:
- **Communication Skills**: Clarity, articulation, structured responses.
- **Technical Knowledge**: Understanding of key concepts for the role.
- **Problem-Solving**: Ability to analyze problems and propose solutions.
- **Cultural & Role Fit**: Alignment with company values and job role.
- **Confidence & Clarity**: Confidence in responses, engagement, and clarity.

If transcript is short or incomplete, still generate realistic scores and feedback.

Return ONLY valid JSON in this exact format:

{
  "totalScore": number,
  "categoryScores": [
    { "name": "Communication Skills", "score": number, "comment": string },
    { "name": "Technical Knowledge", "score": number, "comment": string },
    { "name": "Problem Solving", "score": number, "comment": string },
    { "name": "Cultural Fit", "score": number, "comment": string },
    { "name": "Confidence and Clarity", "score": number, "comment": string }
  ],
  "strengths": string[],
  "areasForImprovement": string[],
  "finalAssessment": string
}`,
                },
            ],
        });

        const text = response.choices[0].message.content || "{}";

        const clean = text.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(clean);

        const { totalScore, categoryScores, strengths, areasForImprovement, finalAssessment } = feedbackSchema.parse(parsed);

        const feedback = await db.collection('feedback').add({
            interviewId,
            userId,
            totalScore,
            categoryScores,
            strengths,
            areasForImprovement,
            finalAssessment,
            createdAt: new Date().toISOString(),
        })

        return {
            success: true,
            feedbackId: feedback.id
        }

    } catch (e) {
        console.error('Error saving feedback',e);

        return { success: false };
    }
}