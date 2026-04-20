"use client";

import { useState, useEffect } from "react";
import { logout, updateUser } from "@/lib/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
    user: any;
};

export default function ProfileMenu({ user }: Props) {

    const [isOpen, setIsOpen] = useState(false);
    const [shouldRender, setShouldRender] = useState(false);

    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(user?.name || "");

    const [isEditingEmail, setIsEditingEmail] = useState(false);
    const [email, setEmail] = useState(user?.email || "");

    const [isVisible, setIsVisible] = useState(false);

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
                        className={`absolute top-0 right-0 w-[400px] h-full bg-gradient-to-b from-[#171532] to-black 
text-white p-6 transform transition-transform duration-300 ease-in-out ${
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

                            {/* LOGOUT */}
                            <div className="mt-auto pb-10">
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
        </div>
    );
}