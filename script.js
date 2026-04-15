const STORAGE_KEY = "earnx_app_v1";

// ---------- STATE ----------
let state = {
  user: null,
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

// ---------- UI ----------
function render() {
  const app = document.getElementById("app");

  if (!app) {
    console.error("App container not found");
    return;
  }

  if (!state.user) {
    app.innerHTML = `
      <div class="container">
        <h1>EarnX</h1>
        <p>Login simple</p>
        <input id="username" placeholder="Enter username" />
        <button id="loginBtn">Login</button>
      </div>
    `;

    document.getElementById("loginBtn").onclick = () => {
      const username = document.getElementById("username").value.trim();
      if (!username) {
        alert("Enter a username");
        return;
      }
      login(username);
    };

    return;
  }

  // DASHBOARD
  app.innerHTML = `
    <div class="container">
      <h1>Welcome, ${state.user.username}</h1>
      <p>Your EarnX dashboard is alive 🚀</p>
      <button id="logoutBtn">Logout</button>
    </div>
  `;

  document.getElementById("logoutBtn").onclick = logout;
}

// ---------- START ----------
document.addEventListener("DOMContentLoaded", init);
