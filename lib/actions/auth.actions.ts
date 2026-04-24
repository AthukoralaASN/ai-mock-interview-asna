"use server";

import {auth, db} from "@/firebase/admin";
import {cookies} from "next/headers";
import {revalidatePath} from "next/cache";

// const ONE_WEEK = 60; // 1 minute
const ONE_WEEK = 60 * 60 * 24 * 7;
const DEFAULT_SIGNUP_CREDITS = 10;
const MIN_PURCHASE_CREDITS = 1;

export async function signUp(params: SignUpParams) {
    const { uid, name, email } = params;

        try {
            const userRecord = await db.collection('users').doc(uid).get();

            if(userRecord.exists) {
                return {
                    success: false,
                    message: `User already exists. Please sign in instead`,
                }
            }

            await db.collection('users').doc(uid).set({
                name,
                email,
                credits: DEFAULT_SIGNUP_CREDITS,
                createdAt: new Date().toISOString(),
            })

            return {
                success: true,
                message: `Account created successfully. Please sign in`
            }
        } catch (e: unknown) {
            console.error('Error creating a user', e);

            if (e instanceof Error && "code" in e && e.code === 'auth/email-already-exists') {
                return {
                    success: false,
                    message: 'This email is already in use.'
                };
            }

            return {
                success: false,
                message: 'Failed to create an account.'
            };
        }
    }

export async function signIn(params: SignInParams) {
    const { email, idToken } = params;

    try {
        const userRecord = await auth.getUserByEmail(email);

        if (!userRecord) {
            return {
                success: false,
                message: `User dose not exists. Create an account instead`
            }
        }

        await setSessionCookie(idToken);
    } catch (e) {
        console.log(e);

        return {
            success: false,
            message: 'Failed to log into an account.'
        }
    }
}

export async function setSessionCookie(idToken: string) {
    const cookieStore = await cookies();

    const sessionCookie = await auth.createSessionCookie(idToken, {
        expiresIn: ONE_WEEK * 1000,
    })

    cookieStore.set('session', sessionCookie, {
        maxAge: ONE_WEEK,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        sameSite: 'lax'
    })
}

export async function getCurrentUser(): Promise<User | null> {
    const cookieStore = await cookies();

    const sessionCookie = cookieStore.get('session')?.value;

    if (!sessionCookie) return null;

    try {
        const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);

        const userRecord = await db.
        collection('users')
            .doc(decodedClaims.uid)
            .get();

        if (!userRecord.exists) return null;

        return {
            ...userRecord.data(),
            id: userRecord.id,
        } as User;
    } catch (e) {
        console.log(e)

        return null;
    }
}

export async function isAuthenticated() {
    const user = await getCurrentUser();

    return !!user;
}

export async function logout() {
    const cookieStore = await cookies();
    cookieStore.delete("session");
}

export async function updateUser(data: {
    name?: string;
    email?: string;
    image?: string;
}): Promise<void> {
    const user: User | null = await getCurrentUser();

    if (!user) throw new Error("Not authenticated");

    const updateData: {
        name?: string;
        email?: string;
        image?: string;
    } = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.image !== undefined) updateData.image = data.image;

    await db.collection("users").doc(user.id).update(updateData);
    revalidatePath("/");
}

export async function purchaseCredits(amount: number) {
    const user = await getCurrentUser();

    if (!user) {
        throw new Error("Not authenticated");
    }

    if (!Number.isFinite(amount) || amount < MIN_PURCHASE_CREDITS) {
        throw new Error(`Minimum purchase is ${MIN_PURCHASE_CREDITS} credit`);
    }

    const normalizedAmount = Number(amount.toFixed(2));
    const userRef = db.collection("users").doc(user.id);

    const updatedBalance = await db.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(userRef);
        const currentCredits = Number(snapshot.data()?.credits ?? 0);
        const nextCredits = Number((currentCredits + normalizedAmount).toFixed(2));

        transaction.update(userRef, {
            credits: nextCredits,
        });

        return nextCredits;
    });

    revalidatePath("/");

    return {
        success: true,
        credits: updatedBalance,
    };
}

export async function deductInterviewCredits(params: {
    startedAt: number;
    endedAt: number;
}) {
    const user = await getCurrentUser();

    if (!user) {
        throw new Error("Not authenticated");
    }

    const { startedAt, endedAt } = params;

    if (!Number.isFinite(startedAt) || !Number.isFinite(endedAt) || endedAt <= startedAt) {
        return {
            success: true,
            chargedCredits: 0,
            credits: Number(user.credits ?? 0),
            durationMinutes: 0,
        };
    }

    const durationMinutes = (endedAt - startedAt) / 60000;
    const chargedCredits = Number((durationMinutes * 0.1).toFixed(2));
    const userRef = db.collection("users").doc(user.id);

    const updatedBalance = await db.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(userRef);
        const currentCredits = Number(snapshot.data()?.credits ?? 0);
        const nextCredits = Math.max(0, Number((currentCredits - chargedCredits).toFixed(2)));

        transaction.update(userRef, {
            credits: nextCredits,
        });

        return nextCredits;
    });

    revalidatePath("/");

    return {
        success: true,
        chargedCredits,
        credits: updatedBalance,
        durationMinutes: Number(durationMinutes.toFixed(2)),
    };
}
