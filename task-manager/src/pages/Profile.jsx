import { useEffect, useState } from "react";
import "./profile.css";

//Current_User_1 will need to be replaces with the logged in user. 

function Profile() {
    const [user, setUser] = useState(null);
    //Borrowed setError UseState from TaskDetail.jsx
    const [error, setError] = useState(null);
    const CURRENT_USER_ID = 1;

    useEffect(() => {

        const fetchUser = async () => {
            setError(null);
            
            try {
                const res = await fetch(`/api/users/${CURRENT_USER_ID}`);
                const data = await res.json();

                if (!res.ok) {
                    console.error("API error loading user", data);
                    setError("Unable to load user from server");
                }
                
                console.log(data);
                setUser(data);

            } catch (err) {
                console.error("Fetch error loading user", err);
                setError("Unable to get user");
            }
        };

        fetchUser();
    }, []);

    if (error) {
        return <p>{error}</p>;
    }

    if (!user) {
        return <p>Loading profile…</p>;
    }

    return (
        <div className="profile-page">
            <header>
                User Profile
            </header>
            <h2>
                {user.display_name}
            </h2>
            <h3>
                <p>Email: {user.email}</p>
                <p>Timezone: {user.timezone}</p>
            </h3>
        </div>
    );
};

export default Profile;