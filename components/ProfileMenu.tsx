"use client";

import { useState, useEffect } from "react";
import { logout, purchaseCredits, updateUser } from "@/lib/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowUp, Wallet } from "lucide-react";
import { toast } from "sonner";

type Props = {
    user: User | null;
};

export default function ProfileMenu({ user }: Props) {

    const [isOpen, setIsOpen] = useState(false);
    const [shouldRender, setShouldRender] = useState(false);

    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(user?.name || "");

    const [isEditingEmail, setIsEditingEmail] = useState(false);
    const [email, setEmail] = useState(user?.email || "");

    const [isVisible, setIsVisible] = useState(false);
    const [credits, setCredits] = useState(Number(user?.credits ?? 0));
    const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
    const [purchaseAmount, setPurchaseAmount] = useState("10");
    const [isPurchasing, setIsPurchasing] = useState(false);

    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("upload_preset", "profile_upload"); // your preset

            const res = await fetch(
                "https://api.cloudinary.com/v1_1/dfecxgmvd/image/upload",
                {
                    method: "POST",
                    body: formData,
                }
            );

            const data = await res.json();

            // 🔥 Cloudinary image URL
            const imageUrl = data.secure_url;

            // save to DB
            await updateUser({ image: imageUrl });

            // update UI
            setImagePreview(imageUrl);

        } catch (err) {
            console.error(err);
        }
    };

    // animation mount/unmount
    useEffect(() => {
        if (isOpen) {
            setShouldRender(true);

            setTimeout(() => {
                setIsVisible(true);
            }, 20);
        } else {
            setIsVisible(false);

            const timeout = setTimeout(() => {
                setShouldRender(false);
            }, 300);

            return () => clearTimeout(timeout);
        }
    }, [isOpen]);

    const handleSaveName = async () => {
        try {
            await updateUser({ name });
            setIsEditing(false);
        } catch (e) {
            console.error(e);
        }
    };

    const handleSaveEmail = async () => {
        try {
            await updateUser({ email });
            setIsEditingEmail(false);
        } catch (e) {
            console.error(e);
        }
    };

    const handlePurchaseCredits = async () => {
        const amount = Number(purchaseAmount);

        if (!Number.isFinite(amount) || amount < 1) {
            toast.error("Enter at least 1 credit.");
            return;
        }

        try {
            setIsPurchasing(true);

            const result = await purchaseCredits(amount);
            setCredits(result.credits);
            setIsBuyModalOpen(false);
            toast.success(`${amount.toFixed(2)} credits added successfully.`);
        } catch (error) {
            console.error(error);
            toast.error("Unable to purchase credits right now.");
        } finally {
            setIsPurchasing(false);
        }
    };

    return (
        <div className="relative">
            {/* Profile Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="w-10 h-10 rounded-full bg-gray-600 text-white flex items-center justify-center overflow-hidden"
            >
                {user?.image ? (
                    <img
                        src={user.image}
                        alt="profile"
                        className="w-full h-full object-cover"
                    />
                ) : (
                    user?.name?.charAt(0)?.toUpperCase() || "P"
                )}
            </button>

            {/* Drawer */}
            {shouldRender && (
                <div className="fixed inset-0 z-50">

                    {/* Overlay */}
                    <div
                        onClick={() => setIsOpen(false)}
                        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
                            isOpen ? "opacity-100" : "opacity-0"
                        }`}
                    />

                    {/* Drawer Panel */}
                    <div
                        className={`absolute top-0 right-0 w-[400px] h-full purple-gradient-dark text-white p-6 transform transition-transform duration-300 ease-in-out ${
                            isVisible ? "translate-x-0" : "translate-x-full"
                        }`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex flex-col h-full">
                            {/*<div className="flex justify-center pt-10 mb-12">*/}
                            {/* Avatar */}
                            <div className="flex justify-center pt-10 mb-12">
                                <label className="relative cursor-pointer">

                                    <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center border border-gray-600">
                                        {imagePreview || user?.image ? (
                                            <img
                                                src={imagePreview || user.image}
                                                alt="profile"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-2xl font-semibold">
    {user?.name?.charAt(0)?.toUpperCase() || "P"}
  </span>
                                        )}
                                    </div>

                                    {/* Hidden file input */}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleImageChange}
                                    />
                                </label>
                            </div>

                            {/* FIELDS */}
                            <div className="flex flex-col gap-4">

                                {/* NAME */}
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-400 shrink-0 text-sm">
                                        Name:
                                    </span>

                                    {isEditing ? (
                                        <>
                                            <Input
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className="flex-1"
                                            />

                                            <Button
                                                size="icon"
                                                variant="outline"
                                                onClick={() => setIsEditing(false)}
                                            >
                                                ✕
                                            </Button>

                                            <Button size="icon" onClick={handleSaveName}>
                                                ✔
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <span className="flex-1 truncate text-sm">
                                                {user?.name || "No Name"}
                                            </span>

                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => setIsEditing(true)}
                                            >
                                                Edit
                                            </Button>
                                        </>
                                    )}
                                </div>

                                {/* EMAIL */}
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-400 shrink-0 text-sm">
                                        Email:
                                    </span>

                                    {isEditingEmail ? (
                                        <>
                                            <Input
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="flex-1"
                                            />

                                            <Button
                                                size="icon"
                                                variant="outline"
                                                onClick={() => setIsEditingEmail(false)}
                                            >
                                                ✕
                                            </Button>

                                            <Button size="icon" onClick={handleSaveEmail}>
                                                ✔
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <span className="flex-1 break-all text-sm">
                                                {user?.email}
                                            </span>

                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => setIsEditingEmail(true)}
                                            >
                                                Edit
                                            </Button>
                                        </>
                                    )}
                                </div>

                                {/* ACCOUNT */}
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-400 shrink-0 text-sm">
                                        Account Created:
                                    </span>
                                    <span className="text-sm">
                                        {user?.createdAt
                                            ? new Date(user.createdAt).toLocaleDateString()
                                            : "N/A"}
                                    </span>
                                </div>
                            </div>

                            {/* BOTTOM SECTION */}
                            <div className="mt-auto space-y-4 pb-10">

                                {/* CREDITS */}
                                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_12px_30px_rgba(0,0,0,0.28)]">
                                    <div className="flex items-center justify-between rounded-xl border border-white/8 bg-black/20 px-3 py-2">
                                        <div className="flex items-center gap-2">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/8">
                                                <Wallet className="h-4 w-4 text-white" />
                                            </div>
                                            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-300">Credits</span>
                                        </div>

                                        <span className="text-sm font-semibold text-white">{credits.toFixed(2)} Credits</span>
                                    </div>

                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="mt-3 w-full justify-center gap-2 border-white/10 bg-white/5 text-white hover:bg-white/10"
                                        onClick={() => setIsBuyModalOpen(true)}
                                    >
                                        <ArrowUp className="h-4 w-4" />
                                        Buy Credits
                                    </Button>
                                </div>

                                {/* LOGOUT */}
                                <form action={logout}>
                                    <Button type="submit" className="w-full">
                                        Logout
                                    </Button>
                                </form>

                            </div>

                        </div>
                    </div>
                </div>
            )}

            {isBuyModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/65 px-4">
                    <div
                        className="absolute inset-0"
                        onClick={() => !isPurchasing && setIsBuyModalOpen(false)}
                    />

                    <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-[#121216] text-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                            <div>
                                <h3 className="text-base font-semibold">Purchase InterviewIQ Credits</h3>
                            </div>

                            <button
                                type="button"
                                className="text-sm text-gray-400 transition hover:text-white"
                                onClick={() => !isPurchasing && setIsBuyModalOpen(false)}
                            >
                                ×
                            </button>
                        </div>

                        <div className="space-y-4 px-5 py-4">
                            <div className="rounded-xl border border-white/8 bg-white/5 px-4 py-5 text-center text-sm text-gray-300">
                                You&apos;re adding <span className="font-semibold text-emerald-300">${purchaseAmount || "0"}</span> to your balance.
                                Your new total will be{" "}
                                <span className="font-semibold text-white">
                                    {(credits + (Number(purchaseAmount) || 0)).toFixed(2)} credits
                                </span>
                                .
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm text-gray-300">Amount to Purchase</label>
                                <Input
                                    type="number"
                                    min="1"
                                    step="1"
                                    value={purchaseAmount}
                                    onChange={(e) => setPurchaseAmount(e.target.value)}
                                    className="border-white/10 bg-black/40 text-white"
                                />
                            </div>

                            <div className="flex gap-2">
                                {["10", "25", "50"].map((value) => (
                                    <button
                                        key={value}
                                        type="button"
                                        className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm transition hover:bg-white/10"
                                        onClick={() => setPurchaseAmount(value)}
                                    >
                                        ${value}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 border-t border-white/10 px-5 py-4">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setIsBuyModalOpen(false)}
                                disabled={isPurchasing}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={handlePurchaseCredits}
                                disabled={isPurchasing}
                            >
                                {isPurchasing ? "Processing..." : "Purchase"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
