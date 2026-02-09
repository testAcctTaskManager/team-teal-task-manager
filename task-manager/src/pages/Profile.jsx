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
        <div>
            <h2>
                {user.display_name}
            </h2>
            <h3>
                {user.email}
                {user.timezone}
            </h3>
        </div>
    );
};

export default Profile;
/*
function App() {
  const [currentPokemon, setCurrentPokemon] = useState([]);
  const [offset, setOffset] = useState(0);
  const LIMIT = 20;  

  useEffect(() => {
    getPokes();
  }, [offset]);

  const getPokes = async () => {
    let res = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${LIMIT}&offset=${offset}`);
    let data = await res.json();

    console.log(data.results);
    setCurrentPokemon(data.results);
  };

  const onClickNext = () => {
      setOffset((prev) => LIMIT + prev);
  };


  const onClickBack = () => {
    if (offset <= 0) {
      setOffset(0);
    } else {
      setOffset(offset - LIMIT);
    }
      //setOffset((prev) => Math.max(prev - LIMIT, 0));
  };

  console.log(currentPokemon);

  return (
    <div className="App">
      <h1> Pokemon List </h1>
      <div className="main-container ">
        <div>
          <Pokemon currentPokemon={currentPokemon} />
          <button onClick={onClickBack} disabled={offset === 0}> Back </button>
          <button onClick={onClickNext}> Next </button>
        </div>
      </div>
    </div>
  );
};

export default App;

      useEffect(() => {
    async function loadTask() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/tasks/${id}`);
        const data = await res.json().catch(() => null);
        if (!res.ok || !data || data.error) {
          console.error("API error loading task", data);
          setError("Unable to load task from server.");
        } else {
          setTask(data);
        }
      } catch (err) {
        console.error("Fetch error loading task", err);
        setError("Network error loading task.");
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadTask();
    }
  }, [id]);

*/