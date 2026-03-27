"use client";
import Agent from "@/components/Agent";


const Page = () => {

    return (
        <>
            <h3>Interview generation</h3>

            <Agent
                userName="You"
                userId="userId"
                type="generate"
            />
        </>
    );
};

export default Page;
