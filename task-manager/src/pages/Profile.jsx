import { useEffect, useState } from "react";

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
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-gradient-to-r from-slate-700 to-slate-600 rounded-lg px-6 py-4 shadow-lg">
        <h1 className="text-2xl font-bold text-white m-0">User Profile</h1>
      </div>

      <div className="bg-white/5 rounded-lg p-8 shadow-lg border border-white/10">
        <h2 className="text-3xl font-bold text-white mb-6 text-center">
          {user.display_name}
        </h2>

        <div className="space-y-4">
          <div className="flex items-center gap-3 text-lg">
            <span className="text-white/60 font-medium">Email:</span>
            <span className="text-white">{user.email}</span>
          </div>
          <div className="flex items-center gap-3 text-lg">
            <span className="text-white/60 font-medium">Timezone:</span>
            <span className="text-white">{user.timezone}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
