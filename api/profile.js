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
      <!DOCTYPE html>
      <!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Profile</title>
<style>
body{
  margin:0;
  font-family: Arial, sans-serif;
  background:#f5f5f5;
}

/* TOP BAR (Instagram-like) */
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
}

.icons span{
  margin-left:10px;
  font-size:18px;
}

/* PROFILE HEADER */
.profile{
  background:white;
  padding:20px;
  text-align:center;
}

.profile img{
  width:90px;
  height:90px;
  border-radius:50%;
  object-fit:cover;
}

.username{
  font-weight:bold;
  margin-top:10px;
}

.bio{
  color:#555;
  margin-top:5px;
}

/* MODAL */
.modal{
  position:fixed;
  top:0;
  left:0;
  width:100%;
  height:100%;
  background:rgba(0,0,0,0.6);
  display:flex;
  align-items:center;
  justify-content:center;
}

.modal-box{
  background:white;
  width:85%;
  max-width:350px;
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

.modal-title{
  font-size:18px;
  font-weight:bold;
  margin-top:10px;
}

.modal-desc{
  font-size:13px;
  color:#666;
  margin:10px 0;
}

.btn{
  width:100%;
  padding:10px;
  margin-top:10px;
  border:none;
  border-radius:6px;
  font-weight:bold;
  cursor:pointer;
}
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Profile</title>

<!-- Phosphor Icons (Regular) -->
<script src="https://unpkg.com/@phosphor-icons/web"></script>

<style>
body{
  margin:0;
  font-family: Arial, sans-serif;
  background:#f5f5f5;
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

/* ICONS */
.icons{
  display:flex;
  gap:15px;
  font-size:22px;
}

.icons i{
  cursor:pointer;
  color:#111;
}

/* PROFILE */
.profile{
  background:white;
  padding:20px;
  text-align:center;
}

.profile img{
  width:90px;
  height:90px;
  border-radius:50%;
  object-fit:cover;
}

.username{
  font-weight:bold;
  margin-top:10px;
}

.bio{
  color:#555;
  margin-top:5px;
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
  max-width:350px;
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

.modal-title{
  font-size:18px;
  font-weight:bold;
  margin-top:10px;
}

.modal-desc{
  font-size:13px;
  color:#666;
  margin:10px 0;
}

.btn{
  width:100%;
  padding:10px;
  margin-top:10px;
  border:none;
  border-radius:6px;
  font-weight:bold;
  cursor:pointer;
}

.open{
  background:#0095f6;
  color:white;
}

.continue{
  background:#eee;
}
</style>
</head>

<body>

<!-- TOP BAR -->
<div class="topbar">
  <div class="logo">
    <i class="ph ph-instagram-logo"></i> Appnetick
  </div>

  <div class="icons">
    <i class="ph ph-heart"></i>
    <i class="ph ph-chat-circle"></i>
    <i class="ph ph-paper-plane-tilt"></i>
  </div>
</div>

<!-- PROFILE -->
<div class="profile">
  <img id="avatar" />
  <div class="username" id="username"></div>
  <div class="bio" id="bio"></div>
</div>

<!-- MODAL -->
<div class="modal" id="modal">
  <div class="modal-box">
    <img id="modalAvatar" />
    <div class="modal-title" id="modalName"></div>
    <div class="modal-desc">
      Open this profile in Appnetick app for better experience. Full features are available in the app.
    </div>

    <button class="btn open" onclick="openApp()">OPEN IN APP</button>
    <button class="btn continue" onclick="closeModal()">CONTINUE IN BROWSER</button>
  </div>
</div>

<script>
function openApp(){
  window.location.href = "intent://profile#Intent;scheme=https;package=com.test.app;end;";
}

function closeModal(){
  document.getElementById('modal').style.display='none';
}
</script>

</body>
</html>
    `);

  } catch (err) {
    console.error("API ERROR:", err);
    return res.status(500).send("Server Error: " + err.message);
  }
}
