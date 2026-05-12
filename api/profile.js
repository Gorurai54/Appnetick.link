export const config = { runtime: "nodejs" };

export default async function handler(req, res) { try { const uid = req.query.uid;

if (!uid) {
  return res.status(400).send("UID missing");
}

const url = `https://appnetick-default-rtdb.firebaseio.com/Users/${uid}.json`;
const response = await fetch(url);

if (!response.ok) {
  return res.status(500).send("Firebase fetch failed");
}

const data = await response.json();

if (!data) {
  return res.status(404).send("User not found");
}

const name = data.full_name || "User";
const username = data.Username || "user";
const avatar = data.avatar || data.profilePic || "https://via.placeholder.com/150";
const bio = data.bio || "No bio available";
const posts = data.posts || 0;
const followers = data.followers || 0;
const following = data.following || 0;

res.setHeader("Content-Type", "text/html");

return res.status(200).send(`

<!DOCTYPE html><html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${name}</title><script src="https://unpkg.com/@phosphor-icons/web"></script><meta property="og:title" content="${name}">
<meta property="og:description" content="${username} is on Appnetick">
<meta property="og:image" content="${avatar}"><style>
body{
  margin:0;
  font-family:Arial;
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
  gap:14px;
  font-size:20px;
}

/* PROFILE HEADER */
.profile{
  background:white;
  padding:20px;
}
.header{
  display:flex;
  align-items:center;
  gap:20px;
}
.profile img{
  width:90px;
  height:90px;
  border-radius:50%;
  object-fit:cover;
}
.stats{
  display:flex;
  justify-content:space-around;
  margin-top:15px;
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

.username{
  font-weight:bold;
  margin-top:5px;
}
.bio{
  color:#555;
  font-size:13px;
  margin-top:5px;
}

/* BUTTONS */
.actions{
  display:flex;
  gap:10px;
  padding:10px 20px;
  background:white;
}
.btn{
  flex:1;
  padding:10px;
  border:none;
  border-radius:8px;
  font-weight:bold;
}
.follow{
  background:#0095f6;
  color:white;
}
.message{
  background:#eee;
}

/* GRID */
.grid{
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:2px;
  padding:2px;
}
.grid div{
  aspect-ratio:1;
  background:#ddd;
}

/* MODAL */
.modal{
  position:fixed;
  top:0;left:0;
  width:100%;height:100%;
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
}
.modal-title{
  font-weight:bold;
  margin-top:10px;
}
.modal-desc{
  font-size:13px;
  color:#666;
  margin:10px 0;
}
.modal-btn{
  width:100%;
  padding:10px;
  margin-top:8px;
  border:none;
  border-radius:6px;
  font-weight:bold;
}
.open{background:#0095f6;color:white;}
.continue{background:#eee;}
</style></head><body><div class="topbar">
  <div class="logo"><i class="ph ph-instagram-logo"></i> Appnetick</div>
  <div class="icons">
    <i class="ph ph-heart"></i>
    <i class="ph ph-chat-circle"></i>
    <i class="ph ph-paper-plane-tilt"></i>
  </div>
</div><div class="profile">
  <div class="header">
    <img src="${avatar}">
    <div>
      <div class="username">@${username}</div>
      <div class="bio">${bio}</div>
    </div>
  </div>  <div class="stats">
    <div><b>${posts}</b><span>Posts</span></div>
    <div><b>${followers}</b><span>Followers</span></div>
    <div><b>${following}</b><span>Following</span></div>
  </div>
</div><div class="actions">
  <button class="btn follow"><i class="ph ph-user-plus"></i> Follow</button>
  <button class="btn message"><i class="ph ph-chat-circle"></i> Message</button>
</div><div class="grid">
  <div></div><div></div><div></div>
  <div></div><div></div><div></div>
  <div></div><div></div><div></div>
</div><div class="modal" id="modal">
  <div class="modal-box">
    <img src="${avatar}">
    <div class="modal-title">${name}</div>
    <div class="modal-desc">OPEN THIS PROFILE IN APPNETICK FOR FULL EXPERIENCE</div>
    <button class="modal-btn open" onclick="openApp()">OPEN IN APP</button>
    <button class="modal-btn continue" onclick="closeModal()">CONTINUE</button>
  </div>
</div><script>
function openApp(){
  window.location.href = `intent://profile?uid=${uid}#Intent;scheme=https;package=com.test.app;end;`;
}
function closeModal(){
  document.getElementById('modal').style.display='none';
}
</script></body>
</html>
    `);} catch (err) { return res.status(500).send("Server Error: " + err.message); } }
