/* =========================================================
   EARNX — SCRIPT.JS — PHASE 1 + 2 + 3
   State + Feed + Discover (FULL)
   ========================================================= */

/* -------------------------
   STATE
------------------------- */
const initialUI = {
  appView: "home",
  discoverTab: "global",
  discoverCategory: "all",
  profileUserId: null,
  searchQuery: "",
  theme: "dark",
  messagesView: "inbox",
  activeConvoUserId: null,
  feedFilter: "following"
};

let state = {
  sessionUserId: "u1",
  ui: loadUIState(),
  users: getMockUsers(),
  posts: getMockPosts(),
  follows: getMockFollows(),
  messages: [],
  localLikes: {},
};

/* -------------------------
   BOOT
------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  applyTheme();
  render();
});

/* -------------------------
   MOCK DATA
------------------------- */
function getMockUsers() {
  return [
    { id:"u1", displayName:"Rafael", username:"rafael", country:"PR", verified:true, category:"tech"},
    { id:"u2", displayName:"Sofia", username:"sofia", country:"MX", verified:true, category:"lifestyle"},
    { id:"u3", displayName:"Alex", username:"alex", country:"PR", verified:false, category:"gaming"},
    { id:"u4", displayName:"Luna", username:"luna", country:"ES", verified:true, category:"art"}
  ];
}

function getMockPosts() {
  return [
    {id:"p1", userId:"u2", content:"Premium drop 🔥", monetized:true, likesCount:120, createdAt:Date.now()},
    {id:"p2", userId:"u3", content:"Streaming tonight", monetized:false, likesCount:80, createdAt:Date.now()},
    {id:"p3", userId:"u4", content:"New artwork", monetized:true, likesCount:200, createdAt:Date.now()}
  ];
}

function getMockFollows() {
  return [
    { followerId:"u1", followingId:"u2"},
    { followerId:"u1", followingId:"u3"}
  ];
}

/* -------------------------
   STORAGE
------------------------- */
function loadUIState(){
  try{
    return {...initialUI, ...JSON.parse(localStorage.getItem("ui"))}
  }catch{
    return {...initialUI}
  }
}
function saveUIState(){
  localStorage.setItem("ui", JSON.stringify(state.ui));
}

/* -------------------------
   HELPERS
------------------------- */
function currentUser(){
  return state.users.find(u=>u.id===state.sessionUserId);
}

function scoreUser(user){
  return followerCount(user.id)*10 + userPosts(user.id).length*20;
}

function rankingUsers(){
  return [...state.users].sort((a,b)=>scoreUser(b)-scoreUser(a));
}

function followerCount(id){
  return state.follows.filter(f=>f.followingId===id).length;
}

function userPosts(id){
  return state.posts.filter(p=>p.userId===id);
}

/* -------------------------
   THEME
------------------------- */
function applyTheme(){
  document.body.classList.toggle("dark-theme", state.ui.theme==="dark");
}

function toggleTheme(){
  state.ui.theme = state.ui.theme==="dark"?"light":"dark";
  saveUIState();
  applyTheme();
  render();
}

/* -------------------------
   NAVIGATION
------------------------- */
function setAppView(v){
  state.ui.appView = v;
  saveUIState();
  render();
}

function setProfile(id){
  state.ui.profileUserId = id;
  state.ui.appView = "profile";
  render();
}

/* -------------------------
   FEED
------------------------- */
function filteredPosts(){
  return state.posts;
}

function toggleLike(id){
  state.localLikes[id] = !state.localLikes[id];
  render();
}

/* -------------------------
   DISCOVER LOGIC
------------------------- */
function getDiscoverUsers(){
  let users = rankingUsers();

  if(state.ui.discoverCategory!=="all"){
    users = users.filter(u=>u.category===state.ui.discoverCategory);
  }

  if(state.ui.searchQuery){
    const q = state.ui.searchQuery.toLowerCase();
    users = users.filter(u =>
      u.displayName.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q)
    );
  }

  return users;
}

/* -------------------------
   RENDER
------------------------- */
function render(){
  document.getElementById("app").innerHTML = `
    ${renderNav()}
    ${renderPage()}
  `;
  bindEvents();
}

/* -------------------------
   NAV UI
------------------------- */
function renderNav(){
  return `
  <nav>
    <button data-nav="home">Home</button>
    <button data-nav="discover">Discover</button>
    <button data-nav="profile">Profile</button>
  </nav>
  `;
}

/* -------------------------
   PAGES
------------------------- */
function renderPage(){
  if(state.ui.appView==="home") return renderFeed();
  if(state.ui.appView==="discover") return renderDiscover();
  if(state.ui.appView==="profile") return renderProfile();
  return "";
}

/* -------------------------
   FEED UI
------------------------- */
function renderFeed(){
  return `
    <h2>Feed</h2>
    ${filteredPosts().map(renderPost).join("")}
  `;
}

function renderPost(p){
  const u = state.users.find(x=>x.id===p.userId);
  const liked = state.localLikes[p.id];

  return `
    <div>
      <b>${u.displayName}</b>
      <p>${p.content}</p>

      <button data-like="${p.id}">
        ❤️ ${(p.likesCount||0)+(liked?1:0)}
      </button>

      <button data-profile="${u.id}">
        View Profile
      </button>
    </div>
  `;
}

/* -------------------------
   DISCOVER UI
------------------------- */
function renderDiscover(){
  const users = getDiscoverUsers();

  return `
    <h2>Discover</h2>

    <input id="search" placeholder="search..." value="${state.ui.searchQuery}"/>

    <div>
      ${["all","tech","lifestyle","gaming","art"].map(c=>`
        <button data-cat="${c}">${c}</button>
      `).join("")}
    </div>

    <div>
      ${users.map(renderCreator).join("")}
    </div>
  `;
}

function renderCreator(u){
  return `
    <div>
      <b>${u.displayName}</b>
      <p>@${u.username}</p>
      <span>Score: ${scoreUser(u)}</span>

      <button data-profile="${u.id}">
        View
      </button>
    </div>
  `;
}

/* -------------------------
   PROFILE UI
------------------------- */
function renderProfile(){
  const u = state.users.find(x=>x.id===state.ui.profileUserId) || currentUser();

  return `
    <h2>${u.displayName}</h2>
    <p>@${u.username}</p>
    <p>${u.category}</p>
    <p>Followers: ${followerCount(u.id)}</p>
  `;
}

/* -------------------------
   EVENTS
------------------------- */
function bindEvents(){

  document.querySelectorAll("[data-nav]").forEach(b=>{
    b.onclick = ()=> setAppView(b.dataset.nav);
  });

  document.querySelectorAll("[data-like]").forEach(b=>{
    b.onclick = ()=> toggleLike(b.dataset.like);
  });

  document.querySelectorAll("[data-profile]").forEach(b=>{
    b.onclick = ()=> setProfile(b.dataset.profile);
  });

  const search = document.getElementById("search");
  if(search){
    search.oninput = e=>{
      state.ui.searchQuery = e.target.value;
      render();
    }
  }

  document.querySelectorAll("[data-cat]").forEach(b=>{
    b.onclick = ()=>{
      state.ui.discoverCategory = b.dataset.cat;
      render();
    }
  });
}
