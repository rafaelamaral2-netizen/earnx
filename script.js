const STORAGE_KEY = "earnx_auth_test_v2";

let state = {
  sessionUserId: null,
  users: [
    {
      id: "u1",
      username: "rafael",
      email: "rafael@test.com",
      password: "1234",
      displayName: "Rafael Amaral"
    }
  ],
  ui: {
    authView: "login"
  }
};

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    state = JSON.parse(raw);
  }
}

function login(identifier, password) {
  const value = identifier.trim().toLowerCase();
  const user = state.users.find(
    u =>
      (u.email.toLowerCase() === value || u.username.toLowerCase() === value) &&
      u.password === password
  );

  if (!user) {
    alert("Invalid credentials");
    return;
  }

  state.sessionUserId = user.id;
  saveState();
  render();
}

function signup(displayName, username, email, password) {
  const emailNorm = email.trim().toLowerCase();
  const userNorm = username.trim().toLowerCase();

  if (!displayName.trim() || !userNorm || !emailNorm || !password.trim()) {
    alert("Complete all fields");
    return;
  }

  if (state.users.some(u => u.email.toLowerCase() === emailNorm)) {
    alert("That email already exists");
    return;
  }

  if (state.users.some(u => u.username.toLowerCase() === userNorm)) {
    alert("That username already exists");
    return;
  }

  state.users.push({
    id: "u" + (state.users.length + 1),
    displayName: displayName.trim(),
    username: userNorm,
    email: emailNorm,
    password: password.trim()
  });

  state.sessionUserId = state.users[state.users.length - 1].id;
  saveState();
  render();
}

function logout() {
  state.sessionUserId = null;
  saveState();
  render();
}

function render() {
  const app = document.getElementById("app");
  if (!app) return;

  if (!state.sessionUserId) {
    if (state.ui.authView === "login") {
      app.innerHTML = `
        <div style="max-width:420px;margin:60px auto;padding:24px;border:1px solid #333;border-radius:16px;">
          <h1>EARNX</h1>
          <input id="loginIdentifier" placeholder="Email or username" style="width:100%;padding:12px;margin:8px 0;" />
          <input id="loginPassword" type="password" placeholder="Password" style="width:100%;padding:12px;margin:8px 0;" />
          <button id="loginBtn" style="width:100%;padding:12px;margin-top:8px;">Login</button>
          <p style="margin-top:12px;"><a href="#" id="goSignup">Create account</a></p>
          <p>Demo: rafael@test.com / 1234</p>
        </div>
      `;
    } else {
      app.innerHTML = `
        <div style="max-width:420px;margin:60px auto;padding:24px;border:1px solid #333;border-radius:16px;">
          <h1>Create account</h1>
          <input id="signupDisplayName" placeholder="Display name" style="width:100%;padding:12px;margin:8px 0;" />
          <input id="signupUsername" placeholder="Username" style="width:100%;padding:12px;margin:8px 0;" />
          <input id="signupEmail" placeholder="Email" style="width:100%;padding:12px;margin:8px 0;" />
          <input id="signupPassword" type="password" placeholder="Password" style="width:100%;padding:12px;margin:8px 0;" />
          <button id="signupBtn" style="width:100%;padding:12px;margin-top:8px;">Create account</button>
          <p style="margin-top:12px;"><a href="#" id="goLogin">Back to login</a></p>
        </div>
      `;
    }
  } else {
    const user = state.users.find(u => u.id === state.sessionUserId);
    app.innerHTML = `
      <div style="max-width:700px;margin:60px auto;padding:24px;">
        <h1>Welcome, ${user.displayName}</h1>
        <p>@${user.username}</p>
        <button id="logoutBtn">Logout</button>
      </div>
    `;
  }

  bindEvents();
}

function bindEvents() {
  const loginBtn = document.getElementById("loginBtn");
  if (loginBtn) {
    loginBtn.onclick = () => {
      login(
        document.getElementById("loginIdentifier").value,
        document.getElementById("loginPassword").value
      );
    };
  }

  const signupBtn = document.getElementById("signupBtn");
  if (signupBtn) {
    signupBtn.onclick = () => {
      signup(
        document.getElementById("signupDisplayName").value,
        document.getElementById("signupUsername").value,
        document.getElementById("signupEmail").value,
        document.getElementById("signupPassword").value
      );
    };
  }

  const goSignup = document.getElementById("goSignup");
  if (goSignup) {
    goSignup.onclick = e => {
      e.preventDefault();
      state.ui.authView = "signup";
      render();
    };
  }

  const goLogin = document.getElementById("goLogin");
  if (goLogin) {
    goLogin.onclick = e => {
      e.preventDefault();
      state.ui.authView = "login";
      render();
    };
  }

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.onclick = logout;
  }
}

loadState();
render();
