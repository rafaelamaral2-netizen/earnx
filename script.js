const STORAGE_KEY = "earnx_app_v3";

let state = {
  user: null,
  balance: 0,
  totalEarned: 0,
  tasksCompleted: 0,
  history: []
};

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      state = {
        ...state,
        ...parsed,
        history: Array.isArray(parsed.history) ? parsed.history : []
      };
    }
  } catch (error) {
    console.error("Failed to load state:", error);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function currency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

function addHistory(type, title, amount = 0) {
  state.history.unshift({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
    type,
    title,
    amount,
    date: new Date().toLocaleString()
  });

  state.history = state.history.slice(0, 20);
}

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

function earn(amount, title = "Reward added") {
  state.balance += amount;
  state.totalEarned += amount;
  state.tasksCompleted += 1;
  addHistory("earn", title, amount);
  saveState();
  render();
}

function withdraw(amount) {
  if (state.balance < amount) {
    alert("Not enough balance.");
    return;
  }

  state.balance -= amount;
  addHistory("withdraw", "Withdrawal requested", -amount);
  saveState();
  render();
}

function resetApp() {
  const confirmed = confirm("Reset all local EarnX data?");
  if (!confirmed) return;

  localStorage.removeItem(STORAGE_KEY);
  state = {
    user: null,
    balance: 0,
    totalEarned: 0,
    tasksCompleted: 0,
    history: []
  };
  render();
}

function renderAuth() {
  return `
    <div class="auth-wrap">
      <div class="auth-card">
        <div class="brand">
          <div class="brand-badge">X</div>
          <div>
            <h1>EarnX</h1>
            <p class="muted">Rewards dashboard</p>
          </div>
        </div>

        <h2 class="auth-title">Welcome back</h2>
        <p class="auth-subtitle">Sign in to continue managing your dashboard.</p>

        <div class="form-row">
          <input class="input" id="username" placeholder="Enter your username" />
        </div>

        <button class="btn btn-primary" id="loginBtn">Enter dashboard</button>
      </div>
    </div>
  `;
}

function renderDashboard() {
  const username = state.user?.username || "User";

  return `
    <div class="app-shell">
      <div class="container">
        <div class="topbar">
          <div class="topbar-left">
            <h2>EarnX Dashboard</h2>
            <p>Hello, ${escapeHtml(username)}. Here is your current activity.</p>
          </div>

          <div class="topbar-actions">
            <button class="btn btn-secondary" id="resetBtn">Reset</button>
            <button class="btn btn-danger" id="logoutBtn">Logout</button>
          </div>
        </div>

        <div class="grid">
          <section class="card span-4">
            <div class="stat-label">Available Balance</div>
            <div class="stat-value">${currency(state.balance)}</div>
            <div class="stat-foot">Current ready balance</div>
          </section>

          <section class="card span-4">
            <div class="stat-label">Total Earned</div>
            <div class="stat-value">${currency(state.totalEarned)}</div>
            <div class="stat-foot">Lifetime rewards tracked locally</div>
          </section>

          <section class="card span-4">
            <div class="stat-label">Tasks Completed</div>
            <div class="stat-value">${state.tasksCompleted}</div>
            <div class="stat-foot">Simple local progress counter</div>
          </section>

          <section class="card span-6">
            <h3>Quick Actions</h3>
            <p class="muted">Use these actions to test and recover the app flow.</p>
            <div class="actions">
              <button class="btn btn-primary" id="earn10Btn">Earn $10</button>
              <button class="btn btn-secondary" id="earn25Btn">Earn $25</button>
              <button class="btn btn-secondary" id="withdraw10Btn">Withdraw $10</button>
            </div>
          </section>

          <section class="card span-6">
            <h3>Account</h3>
            <p><strong>User:</strong> ${escapeHtml(username)}</p>
            <p><strong>Status:</strong> Active</p>
            <p><strong>Storage:</strong> Local browser state</p>
            <p class="muted">This is a stable recovery build for your frontend.</p>
          </section>

          <section class="card span-12">
            <h3>Recent Activity</h3>
            ${
              state.history.length === 0
                ? `<div class="empty">No activity yet.</div>`
                : `<div class="activity-list">
                    ${state.history
                      .map(
                        (item) => `
                          <div class="activity-item">
                            <div class="activity-main">
                              <div class="activity-title">${escapeHtml(item.title)}</div>
                              <div class="activity-meta">${escapeHtml(item.date)}</div>
                            </div>
                            <div class="amount ${item.amount >= 0 ? "positive" : ""}">
                              ${item.amount >= 0 ? "+" : "-"}${currency(Math.abs(item.amount))}
                            </div>
                          </div>
                        `
                      )
                      .join("")}
                  </div>`
            }
          </section>
        </div>
      </div>
    </div>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function bindEvents() {
  const loginBtn = document.getElementById("loginBtn");
  if (loginBtn) {
    loginBtn.addEventListener("click", () => {
      const input = document.getElementById("username");
      const username = input?.value.trim();

      if (!username) {
        alert("Please enter a username.");
        return;
      }

      login(username);
    });
  }

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }

  const resetBtn = document.getElementById("resetBtn");
  if (resetBtn) {
    resetBtn.addEventListener("click", resetApp);
  }

  const earn10Btn = document.getElementById("earn10Btn");
  if (earn10Btn) {
    earn10Btn.addEventListener("click", () => earn(10, "Quick reward"));
  }

  const earn25Btn = document.getElementById("earn25Btn");
  if (earn25Btn) {
    earn25Btn.addEventListener("click", () => earn(25, "Bonus reward"));
  }

  const withdraw10Btn = document.getElementById("withdraw10Btn");
  if (withdraw10Btn) {
    withdraw10Btn.addEventListener("click", () => withdraw(10));
  }
}

function render() {
  const app = document.getElementById("app");
  if (!app) return;

  app.innerHTML = state.user ? renderDashboard() : renderAuth();
  bindEvents();
}

function init() {
  loadState();
  render();
}

document.addEventListener("DOMContentLoaded", init);
