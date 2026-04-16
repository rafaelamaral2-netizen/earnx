const STORAGE_KEY = "earnx_app_v2";

// ---------- STATE ----------
let state = {
  user: null,
  balance: 0,
  history: [],
};

// ---------- INIT ----------
function init() {
  loadState();
  render();
}

// ---------- STORAGE ----------
function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      state = JSON.parse(saved);
    }
  } catch (e) {
    console.error("Error loading state", e);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// ---------- AUTH ----------
function login(username) {
  state.user = { username };
  saveState();
  render();
}

function logout() {
  state.user = null;
  saveState();
  render();
}

// ---------- LOGIC ----------
function earn(amount) {
  state.balance += amount;
  state.history.push({
    type: "earn",
    amount,
    date: new Date().toLocaleString(),
  });
  saveState();
  render();
}

// ---------- UI ----------
function render() {
  const app = document.getElementById("app");

  if (!app) return;

  // LOGIN
  if (!state.user) {
    app.innerHTML = `
      <div class="container">
        <h1>EarnX</h1>
        <p>Welcome back</p>
        <input id="username" placeholder="Username" />
        <button id="loginBtn">Login</button>
      </div>
    `;

    document.getElementById("loginBtn").onclick = () => {
      const username = document.getElementById("username").value.trim();
      if (!username) return alert("Enter username");
      login(username);
    };

    return;
  }

  // DASHBOARD
  app.innerHTML = `
    <div class="container">
      <h1>EarnX</h1>
      <p>Hello, ${state.user.username}</p>

      <div class="card">
        <h2>Balance</h2>
        <p>$${state.balance}</p>
      </div>

      <button id="earnBtn">+ Earn $10</button>
      <button id="logoutBtn">Logout</button>

      <h3>Activity</h3>
      <ul id="history"></ul>
    </div>
  `;

  document.getElementById("earnBtn").onclick = () => earn(10);
  document.getElementById("logoutBtn").onclick = logout;

  const historyList = document.getElementById("history");
  historyList.innerHTML = state.history
    .map(
      (h) =>
        `<li>${h.type.toUpperCase()} $${h.amount} - ${h.date}</li>`
    )
    .join("");
}

// ---------- START ----------
document.addEventListener("DOMContentLoaded", init);
