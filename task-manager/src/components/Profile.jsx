import { useEffect, useState } from "react";

//Will need to be replaced with the actuall logged in user
const CURRENT_USER_ID = 1;

export default function Profile() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    display_name: "", 
    timezone: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false); 
  const [error, setError] = useState(null);

  async function load() {
    try {
      setLoading(true);
      const res = await fetch(`/api/users/${CURRENT_USER_ID}`);
      const data = await res.json().catch(() => null);

      if (!data || data.error) {
        console.error("API error loading user", data);
        setError("Failed to load profile");
        setUsers(null);
      } else {
        setUser(data);
        setForm({
            display_name: data.display_name || "",
            timezone: data.timezone || "",
        });

        setError(null);

        }

    } catch (err) {
      console.error("Fetch error", err);
      setError("Fetch error loading profile");
      setUsers(null);
    } 
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function save(e) {
    e.preventDefault();
    if (!users) return;
    
    try {
      // POST example
      const resp = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ CompanyName: company, ContactName: contact }),
      });
      const bodyResp = await resp.json().catch(() => null);
      if (!resp.ok) {
        console.error("Create error", bodyResp);
      }
    } catch (err) {
      console.error("Create fetch error", err);
    }
    setCompany("");
    setContact("");
    load();
  }

  // PATCH/PUT example
  async function saveEdit(id) {
    const payload = {};
    if (form.CompanyName !== undefined) payload.CompanyName = form.CompanyName;
    if (form.ContactName !== undefined) payload.ContactName = form.ContactName;
    const res = await fetch(`/api/customers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const updated = await res.json();
      setCustomers((prev) =>
        prev.map((p) => (p.CustomerID === updated.CustomerID ? updated : p)),
      );
      cancelEdit();
    } else {
      console.error("Update failed", await res.text());
    }
  }

  return (
    <div>
      <h1>Customers</h1>
      <form onSubmit={create}>
        <input
          placeholder="Company"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
        <input
          placeholder="Contact"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
        />
        <button type="submit">Add</button>
      </form>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Company</th>
            <th>Contact</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {customers.map((c) => (
            <tr key={c.CustomerID}>
              <td>{c.CustomerID}</td>
              <td>
                {editingId === String(c.CustomerID) ? (
                  <input
                    value={form.CompanyName}
                    onChange={(e) =>
                      setForm({ ...form, CompanyName: e.target.value })
                    }
                  />
                ) : (
                  c.CompanyName
                )}
              </td>
              <td>
                {editingId === String(c.CustomerID) ? (
                  <input
                    value={form.ContactName}
                    onChange={(e) =>
                      setForm({ ...form, ContactName: e.target.value })
                    }
                  />
                ) : (
                  c.ContactName
                )}
              </td>
              <td>
                {editingId === String(c.CustomerID) ? (
                  <>
                    <button
                      type="button"
                      onClick={() => saveEdit(c.CustomerID)}
                      style={{ marginRight: 8 }}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      style={{ marginRight: 8 }}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => startEdit(c)}
                    data-test={`edit-${c.CustomerID}`}
                    style={{
                      marginRight: 8,
                      display: "inline-block",
                      padding: "6px 10px",
                    }}
                  >
                    Edit
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => remove(c.CustomerID)}
                  style={{ marginLeft: 8 }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}