
import { useEffect, useMemo, useState } from "react";

const API_URL = "http://localhost:8080/api/expenses";

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f4f7fb",
    color: "#172033",
    fontFamily: "Arial, sans-serif",
    padding: "24px",
    boxSizing: "border-box",
  },
  container: { maxWidth: "1200px", margin: "0 auto" },
  card: {
    background: "#fff",
    border: "1px solid #e5eaf2",
    borderRadius: "14px",
    padding: "22px",
    boxShadow: "0 4px 15px rgba(25,40,70,0.04)",
  },
  label: {
    display: "block",
    fontSize: "13px",
    color: "#68758a",
    marginBottom: "9px",
  },
  input: {
    width: "100%",
    padding: "11px",
    border: "1px solid #d9e0ea",
    borderRadius: "8px",
    boxSizing: "border-box",
    fontSize: "14px",
  },
  button: {
    background: "#5145e5",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "12px 18px",
    fontWeight: "bold",
    cursor: "pointer",
  },
};

function money(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function App() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("Expense");
  const [category, setCategory] = useState("Food");
  const [date, setDate] = useState(
    new Date().toLocaleDateString("en-CA")
  );

  async function loadTransactions() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error(`Backend returned HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("The expenses API did not return a list.");
      }

      setTransactions(data);
    } catch (err) {
      setError(
        "Could not load transactions. Check that the backend is running and the API is available."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTransactions();
  }, []);

  const totals = useMemo(() => {
    return transactions.reduce(
      (result, transaction) => {
        const amount = Number(transaction.amount) || 0;
        const transactionType = String(
          transaction.type || "Expense"
        ).toLowerCase();

        if (transactionType === "income") {
          result.income += amount;
        } else {
          result.expenses += amount;
        }

        return result;
      },
      { income: 0, expenses: 0 }
    );
  }, [transactions]);

  const balance = totals.income - totals.expenses;

  async function handleSubmit(event) {
    event.preventDefault();

    if (!title.trim() || !amount || Number(amount) <= 0) {
      setError("Enter a title and an amount greater than zero.");
      return;
    }

    setSaving(true);
    setError("");

    const transaction = {
      title: title.trim(),
      amount: Number(amount),
      type,
      category,
      date,
    };

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(transaction),
      });

      if (!response.ok) {
        throw new Error(`Could not save transaction: HTTP ${response.status}`);
      }

      const savedTransaction = await response.json();

      setTransactions((current) => [
        savedTransaction,
        ...current.filter((item) => item.id !== savedTransaction.id),
      ]);

      setTitle("");
      setAmount("");
      setType("Expense");
      setCategory("Food");
      setDate(new Date().toLocaleDateString("en-CA"));
    } catch (err) {
      setError(
        "Could not save the transaction. Check the backend, database, and API."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this transaction?")) {
      return;
    }

    setError("");

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Delete failed");
      }

      setTransactions((current) =>
        current.filter((item) => item.id !== id)
      );
    } catch (err) {
      setError("Could not delete the transaction. Please try again.");
    }
  }

  function exportCSV() {
    const rows = [
      ["Title", "Type", "Category", "Amount", "Date"],
      ...transactions.map((item) => [
        item.title || "",
        item.type || "Expense",
        item.category || "",
        item.amount ?? 0,
        item.date || "",
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((value) =>
            `"${String(value).replace(/"/g, '""')}"`
          )
          .join(",")
      )
      .join("\n");

    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" })
    );

    const link = document.createElement("a");
    link.href = url;
    link.download = "finora-transactions.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
            flexWrap: "wrap",
            marginBottom: "28px",
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: "30px" }}>
              Finora
            </h1>
            <p style={{ color: "#68758a", marginBottom: 0 }}>
              Smart Expense &amp; Budget Management
            </p>
          </div>

          <button style={styles.button} onClick={exportCSV}>
            Export CSV
          </button>
        </header>

        {error && (
          <div
            role="alert"
            style={{
              background: "#fff0f0",
              color: "#b42318",
              padding: "14px",
              borderRadius: "8px",
              marginBottom: "20px",
            }}
          >
            {error}
          </div>
        )}

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
            gap: "18px",
            marginBottom: "24px",
          }}
        >
          <div style={styles.card}>
            <p style={styles.label}>Total Income</p>
            <h2 style={{ color: "#159568", margin: "8px 0" }}>
              {money(totals.income)}
            </h2>
            <span style={{ color: "#68758a", fontSize: "13px" }}>
              All recorded income
            </span>
          </div>

          <div style={styles.card}>
            <p style={styles.label}>Total Expenses</p>
            <h2 style={{ color: "#e05252", margin: "8px 0" }}>
              {money(totals.expenses)}
            </h2>
            <span style={{ color: "#68758a", fontSize: "13px" }}>
              All recorded expenses
            </span>
          </div>

          <div style={styles.card}>
            <p style={styles.label}>Available Balance</p>
            <h2
              style={{
                color: balance >= 0 ? "#5145e5" : "#e05252",
                margin: "8px 0",
              }}
            >
              {money(balance)}
            </h2>
            <span style={{ color: "#68758a", fontSize: "13px" }}>
              Income minus expenses
            </span>
          </div>

          <div style={styles.card}>
            <p style={styles.label}>Transactions</p>
            <h2 style={{ margin: "8px 0" }}>
              {transactions.length}
            </h2>
            <span style={{ color: "#68758a", fontSize: "13px" }}>
              Saved records
            </span>
          </div>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "22px",
            alignItems: "start",
          }}
        >
          <div style={styles.card}>
            <h2 style={{ marginTop: 0 }}>Add Transaction</h2>
            <p style={{ color: "#68758a", fontSize: "14px" }}>
              Record income or an expense.
            </p>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "16px" }}>
                <label style={styles.label} htmlFor="title">
                  Transaction title
                </label>
                <input
                  id="title"
                  style={styles.input}
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="e.g. Salary or Lunch"
                  required
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={styles.label} htmlFor="amount">
                  Amount (₹)
                </label>
                <input
                  id="amount"
                  style={styles.input}
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="Enter amount"
                  required
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={styles.label} htmlFor="type">
                  Transaction type
                </label>
                <select
                  id="type"
                  style={styles.input}
                  value={type}
                  onChange={(event) => setType(event.target.value)}
                >
                  <option value="Expense">Expense</option>
                  <option value="Income">Income</option>
                </select>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={styles.label} htmlFor="category">
                  Category
                </label>
                <select
                  id="category"
                  style={styles.input}
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                >
                  <option>Food</option>
                  <option>Salary</option>
                  <option>Shopping</option>
                  <option>Transport</option>
                  <option>Housing</option>
                  <option>Bills</option>
                  <option>Healthcare</option>
                  <option>Education</option>
                  <option>Entertainment</option>
                  <option>Other</option>
                </select>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={styles.label} htmlFor="date">
                  Date
                </label>
                <input
                  id="date"
                  style={styles.input}
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                style={{
                  ...styles.button,
                  width: "100%",
                  opacity: saving ? 0.7 : 1,
                }}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Transaction"}
              </button>
            </form>
          </div>

          <div style={styles.card}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              <h2 style={{ marginTop: 0 }}>Recent Transactions</h2>
              <button
                type="button"
                onClick={loadTransactions}
                style={{
                  ...styles.button,
                  padding: "8px 12px",
                  fontSize: "12px",
                }}
              >
                Refresh
              </button>
            </div>

            {loading ? (
              <p>Loading transactions...</p>
            ) : transactions.length === 0 ? (
              <p style={{ color: "#68758a" }}>
                No transactions yet. Add your first transaction.
              </p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    textAlign: "left",
                    fontSize: "14px",
                  }}
                >
                  <thead>
                    <tr style={{ background: "#f7f8fc" }}>
                      {["Transaction", "Date", "Amount", "Action"].map(
                        (heading) => (
                          <th
                            key={heading}
                            style={{
                              padding: "12px 8px",
                              color: "#68758a",
                              fontWeight: 600,
                            }}
                          >
                            {heading}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((item) => {
                      const isIncome =
                        String(item.type || "Expense").toLowerCase() ===
                        "income";

                      return (
                        <tr key={item.id}>
                          <td
                            style={{
                              padding: "14px 8px",
                              borderBottom: "1px solid #edf0f5",
                            }}
                          >
                            <strong>{item.title || item.description || "Transaction"}</strong>
                            <div
                              style={{
                                fontSize: "12px",
                                color: "#68758a",
                                marginTop: "4px",
                              }}
                            >
                              {item.category || "Other"} ·{" "}
                              {isIncome ? "Income" : "Expense"}
                            </div>
                          </td>
                          <td
                            style={{
                              padding: "14px 8px",
                              borderBottom: "1px solid #edf0f5",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {item.date || "—"}
                          </td>
                          <td
                            style={{
                              padding: "14px 8px",
                              borderBottom: "1px solid #edf0f5",
                              whiteSpace: "nowrap",
                              fontWeight: "bold",
                              color: isIncome ? "#159568" : "#e05252",
                            }}
                          >
                            {isIncome ? "+" : "−"}
                            {money(item.amount)}
                          </td>
                          <td
                            style={{
                              padding: "14px 8px",
                              borderBottom: "1px solid #edf0f5",
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => handleDelete(item.id)}
                              style={{
                                border: "1px solid #f0caca",
                                background: "#fff",
                                color: "#c33",
                                borderRadius: "6px",
                                padding: "6px 8px",
                                cursor: "pointer",
                              }}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        <footer
          style={{
            textAlign: "center",
            color: "#8791a3",
            fontSize: "12px",
            marginTop: "28px",
          }}
        >
          Finora · Smart Expense &amp; Budget Management
        </footer>
      </div>
    </main>
  );
}

export default App;
