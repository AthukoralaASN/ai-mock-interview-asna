import {db} from "@/firebase/admin";

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