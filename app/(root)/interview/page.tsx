import Agent from "@/components/Agent";
import {getCurrentUser} from "@/lib/actions/auth.actions";


const Page = async () => {
    const user = await getCurrentUser();

    return (
        <>
            <h3>Interview generation</h3>

            <Agent
                userName={user?.name || ''}
                userId={user?.id}
                userImage={user?.image}
                type="generate"
                initialCredits={user?.credits ?? 0}
            />
        </>
    );
};

export default Page;
