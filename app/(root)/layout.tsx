import { ReactNode } from 'react'
import Image from "next/image";
import Link from "next/link";
import {isAuthenticated} from "@/lib/actions/auth.actions";
import {redirect} from "next/navigation";
import { logout } from "@/lib/actions/auth.actions";
import {Button} from "@/components/ui/button";

const RootLayout = async ({children}:{children: ReactNode }) => {
    const isUserAuthenticated = await isAuthenticated();

    if(!isUserAuthenticated) redirect('/sign-in')

    return (
        <div className="root-layout">
            <nav className="flex justify-between items-center">
                <Link href="/" className="flex items-center gap-2">
                    <Image src="/logo.svg" alt="Logo" width={38} height={32} />
                    <h2 className="text-primary-100">InterviewIQ</h2>
                </Link>

                <form action={logout}>
                    <Button type="submit">Logout</Button>
                </form>
            </nav>

            {children}
        </div>
    )
}
export default RootLayout
