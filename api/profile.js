export default async function handler(req, res) {
  try {
    const uid = req.query.uid;

    if (!uid) {
      return res.status(400).send("UID missing");
    }

    // Firebase REST API (SAFE FOR VERCEL)
    const url = `https://appnetick-default-rtdb.firebaseio.com/Users/${uid}.json`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data) {
      return res.status(404).send("User not found");
    }

    const name = data.full_name || "User";
    const username = data.Username || "user";
    const email = data.email || "";
    const avatar = data.avatar || data.profilePic || "";

    res.setHeader("Content-Type", "text/html");

    return res.status(200).send(`
      <!DOCTYPE html><html lang="en">
<head>
<meta charset="UTF-8" />
<link rel="icon" href="/20260314_091747.png">

<meta property="og:site_name" content="Appnetick">

        <!-- OG TAGS -->
        <meta property="og:title" content="${name}">
        <meta property="og:description" content="${username} is on Appnetick • Find them in Appnetick App">
        <meta property="og:image" content="${avatar}">
        <meta property="og:type" content="profile">

        <meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Appnetick Profile</title><!-- Phosphor Icons --><script src="https://unpkg.com/@phosphor-icons/web"></script><style>
body{
  margin:0;
  font-family: Arial, sans-serif;
  background:#fafafa;
}

/* TOP BAR */
.topbar{
  height:55px;
  background:white;
  display:flex;
  align-items:center;
  justify-content:space-between;
  padding:0 15px;
  border-bottom:1px solid #ddd;
  position:sticky;
  top:0;
}
.logo{
  font-weight:bold;
  display:flex;
  align-items:center;
  gap:6px;
}
.icons{
  display:flex;
  gap:12px;
  font-size:20px;
}

/* PROFILE HEADER */
.profile{
  background:white;
  padding:20px;
  text-align:center;
}
.profile img{
  width:95px;
  height:95px;
  border-radius:50%;
  object-fit:cover;
  border:2px solid #ddd;
}
.username{
  font-weight:bold;
  margin-top:10px;
}
.bio{
  color:#555;
  margin-top:6px;
  font-size:14px;
}

/* STATS BAR */
.stats{
  display:flex;
  justify-content:space-around;
  padding:15px;
  background:white;
  border-top:1px solid #eee;
  border-bottom:1px solid #eee;
}
.stats div{
  text-align:center;
}
.stats b{
  display:block;
  font-size:16px;
}
.stats span{
  font-size:12px;
  color:#777;
}

/* ACTION BUTTONS */
.actions{
  display:flex;
  gap:10px;
  padding:15px;
  background:white;
}
.btn{
  flex:1;
  padding:10px;
  border:none;
  border-radius:8px;
  font-weight:bold;
  cursor:pointer;
}
.follow{background:#0095f6;color:white;}
.message{background:#eee;}

/* CONTENT GRID (blank area fill) */
.grid{
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:2px;
  padding:2px;
}
.grid div{
  background:#ddd;
  aspect-ratio:1;
}

/* MODAL */
.modal{
  position:fixed;
  top:0; left:0;
  width:100%; height:100%;
  background:rgba(0,0,0,0.6);
  display:flex;
  align-items:center;
  justify-content:center;
}
.modal-box{
  background:white;
  width:85%;
  max-width:360px;
  padding:20px;
  border-radius:12px;
  text-align:center;
}
.modal-box img{
  width:80px;
  height:80px;
  border-radius:50%;
  object-fit:cover;
}
.modal-title{font-size:18px;font-weight:bold;margin-top:10px;}
.modal-desc{font-size:13px;color:#666;margin:10px 0;}
.modal-btn{
  width:100%;
  padding:10px;
  margin-top:8px;
  border:none;
  border-radius:6px;
  font-weight:bold;
  cursor:pointer;
}
.open{background:#0095f6;color:white;}
.continue{background:#eee;}
</style></head>
<body><!-- TOP BAR --><div class="topbar">
  <div class="logo">
    <i class="ph ph-instagram-logo"></i> Appnetick
  </div>
  <div class="icons">
    <i class="ph ph-heart"></i>
    <i class="ph ph-chat-circle"></i>
    <i class="ph ph-paper-plane-tilt"></i>
  </div>
</div><!-- PROFILE --><div class="profile">
  <img id="avatar" />
  <div class="username" id="username"></div>
  <div class="bio" id="bio"></div>
</div><!-- STATS --><div class="stats">
  <div><b id="posts">0</b><span>Posts</span></div>
  <div><b id="followers">0</b><span>Followers</span></div>
  <div><b id="following">0</b><span>Following</span></div>
</div><!-- ACTIONS --><div class="actions">
  <button class="btn follow"><i class="ph ph-user-plus"></i> Follow</button>
  <button class="btn message"><i class="ph ph-chat-circle"></i> Message</button>
</div><!-- GRID CONTENT --><div class="grid">
  <div></div><div></div><div></div>
  <div></div><div></div><div></div>
  <div></div><div></div><div></div>
</div><!-- MODAL --><div class="modal" id="modal">
  <div class="modal-box">
    <img id="modalAvatar" />
    <div class="modal-title" id="modalName"></div>
    <div class="modal-desc">
      OPEN THIS PROFILE IN APPNETICK FOR BEST EXPERIENCE. ALL FEATURES LIKE CHAT, POSTS AND FOLLOW ARE AVAILABLE INSIDE THE APP.
    </div><button class="modal-btn open" onclick="openApp()">OPEN IN APP</button>
<button class="modal-btn continue" onclick="closeModal()">CONTINUE IN BROWSER</button>

  </div>
</div><script>
const params = new URLSearchParams(window.location.search);
const uid = params.get("uid");

async function loadUser(){
  if(!uid) return;

  const res = await fetch(`/api/user?uid=${uid}`);
  const data = await res.json();

  document.getElementById("avatar").src = data.avatar;
  document.getElementById("username").innerText = "@" + data.Username;
  document.getElementById("bio").innerText = data.bio || "No bio available";

  document.getElementById("modalAvatar").src = data.avatar;
  document.getElementById("modalName").innerText = data.full_name;

  // extra stats (fallback)
  document.getElementById("posts").innerText = data.posts || 0;
  document.getElementById("followers").innerText = data.followers || 0;
  document.getElementById("following").innerText = data.following || 0;
}

loadUser();

function openApp(){
  window.location.href = `intent://profile?uid=${uid}#Intent;scheme=https;package=com.test.app;end;`;
}

function closeModal(){
  document.getElementById("modal").style.display="none";
}
</script></body>
</html><!-- BACKEND (Vercel API) --><!--
export default async function handler(req,res){
  const uid = req.query.uid;
  if(!uid) return res.status(400).json({error:"UID missing"});

  const url = `https://appnetick-default-rtdb.firebaseio.com/Users/${uid}.json`;
  const response = await fetch(url);
  const data = await response.json();

  if(!data) return res.status(404).json({error:"User not found"});

  return res.status(200).json(data);
}
-->
    `);

  } catch (err) {
    console.error("API ERROR:", err);
    return res.status(500).send("Server Error: " + err.message);
  }
}
