export default async function handler(req, res) {

  const cid = req.query.cid;

  if (!cid) {
    return res.status(404).send("Channel Not Found");
  }

  const response = await fetch(
    `https://users-f0dd7-default-rtdb.asia-southeast1.firebasedatabase.app/Channels/${cid}.json`
  );

  const data = await response.json();

  if (!data) {
    return res.status(404).send("Channel Not Found");
  }

  const name = data.name || "Channel";
  const description = data.description || "";
  const logo =
  data.logo ||
  "https://appnetick-link.vercel.app/20260314_091747.png";

  return res.status(200).send(`
<!DOCTYPE html>
<html lang="en">
<head>

<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<meta property="og:site_name" content="Appnetick • Channel">

<meta property="og:title" content="See ${name} channel on Appnetick">
<meta property="og:description" content="${description}">
<meta property="og:image" content="${logo}">
<meta property="og:url" content="https://appnetick-link.vercel.app/user/channel/invite?uid=${req.query.uid}&cid=${cid}">
<meta property="og:type" content="website">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${name}">
<meta name="twitter:description" content="${description}">
<meta name="twitter:image" content="${logo}">

<title>${name} on Appnetick</title>

<link rel="icon" href="/20260313_121958.jpg">

<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">

<script src="https://unpkg.com/@phosphor-icons/web"></script>

<style>

*{
margin:0;
padding:0;
box-sizing:border-box;
font-family:'Inter',sans-serif;
}

body{
background:#0b141a;
color:#fff;
overflow-x:hidden;
}

/* TOOLBAR */

.topbar{
height:60px;
display:flex;
align-items:center;
justify-content:center;
position:sticky;
top:0;
z-index:1000;
background:rgba(0,0,0,0.45);
backdrop-filter:blur(20px);
-webkit-backdrop-filter:blur(20px);
border-bottom:1px solid rgba(255,255,255,0.08);
}

.logo{
font-size:22px;
font-weight:700;
color:#2196f3;
cursor:pointer;
}

/* MAIN */

.container{
max-width:550px;
margin:auto;
padding:40px 20px;
text-align:center;
}

/* CHANNEL IMAGE */

.channel-logo{
width:140px;
height:140px;
border-radius:50%;
object-fit:cover;
border:4px solid rgba(255,255,255,0.08);
box-shadow:0 0 25px rgba(33,150,243,0.15);
}

/* NAME */

.channel-name{
margin-top:20px;
font-size:30px;
font-weight:700;
}

/* INVITE TEXT */

.invite{
margin-top:10px;
font-size:15px;
color:#b8b8b8;
}

/* JOIN BUTTON */

.join-btn{
margin-top:25px;
background:#2196f3;
color:white;
border:none;
padding:14px 40px;
border-radius:50px;
font-size:16px;
font-weight:700;
cursor:pointer;
}

/* DESCRIPTION */

.description-card{
margin-top:35px;
background:rgba(255,255,255,0.04);
border:1px solid rgba(255,255,255,0.05);
border-radius:20px;
padding:20px;
text-align:left;
backdrop-filter:blur(20px);
}

.description-title{
font-size:18px;
font-weight:700;
margin-bottom:12px;
}

.description-text{
font-size:14px;
line-height:1.8;
color:#cfcfcf;
}

/* STATS */

.stats{
display:flex;
gap:15px;
margin-top:25px;
}

.stat{
flex:1;
background:rgba(255,255,255,0.04);
border:1px solid rgba(255,255,255,0.05);
border-radius:18px;
padding:20px;
}

.stat h2{
font-size:24px;
font-weight:700;
}

.stat p{
margin-top:5px;
color:#aaa;
font-size:13px;
}

/* FEATURES */

.features{
margin-top:25px;
background:rgba(255,255,255,0.04);
border:1px solid rgba(255,255,255,0.05);
border-radius:20px;
padding:20px;
text-align:left;
}

.feature-item{
display:flex;
align-items:center;
gap:10px;
margin-bottom:14px;
color:#ddd;
}

.feature-item:last-child{
margin-bottom:0;
}

.feature-item i{
color:#2196f3;
font-size:18px;
}

/* DOWNLOAD */

.download-box{
margin-top:35px;
padding:25px;
background:rgba(255,255,255,0.04);
border-radius:20px;
}

.download-box p{
color:#bdbdbd;
margin-bottom:15px;
}

.download-btn{
background:#2196f3;
border:none;
color:white;
padding:12px 28px;
border-radius:50px;
font-weight:700;
cursor:pointer;
}

/* FOOTER */

.footer{
padding:30px;
text-align:center;
color:#888;
font-size:13px;
}

</style>

</head>

<body>

<!-- TOOLBAR -->

<div class="topbar">

<div class="logo"
onclick="location.href='/'">
Appnetick
</div>

</div>

<!-- CONTENT -->

<div class="container">

<img
id="channelLogo"
class="channel-logo"
src="https://via.placeholder.com/140">

<h1
id="channelName"
class="channel-name">
Loading...
</h1>

<p class="invite">
You are invited to join this channel
</p>

<button
class="join-btn"
onclick="joinChannel()">
Join Channel
</button>

<!-- DESCRIPTION -->

<div class="description-card">

<div class="description-title">
About Channel
</div>

<div
id="channelDescription"
class="description-text">
Loading channel information...
</div>

</div>

<!-- STATS -->

<div class="stats">

<div class="stat">
<h2 id="subscribers">0</h2>
<p>Subscribers</p>
</div>

<div class="stat">
<h2 id="posts">0</h2>
<p>Posts</p>
</div>

</div>

<!-- FEATURES -->

<div class="features">

<div class="feature-item">
<i class="ph ph-check-circle"></i>
<span>Public Channel</span>
</div>

<div class="feature-item">
<i class="ph ph-shield-check"></i>
<span>Secure Community</span>
</div>

<div class="feature-item">
<i class="ph ph-lightning"></i>
<span>Real Time Updates</span>
</div>

<div class="feature-item">
<i class="ph ph-users"></i>
<span>Unlimited Members</span>
</div>

</div>

<!-- DOWNLOAD -->

<div class="download-box">

<p>
Don't have Appnetick?
</p>

<button
class="download-btn"
onclick="location.href='/'">
Download App
</button>

</div>

</div>

<div class="footer">
© 2026 Appnetick
</div>

<!-- FIREBASE -->

<script type="module">

import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
getDatabase,
ref,
get
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = {
apiKey: "AIzaSyDZtlQ6BR9olb_Ssf7c5i_90O0s6olCxlM",
authDomain: "users-f0dd7.firebaseapp.com",
databaseURL: "https://users-f0dd7-default-rtdb.asia-southeast1.firebasedatabase.app",
projectId: "users-f0dd7",
storageBucket: "users-f0dd7.firebasestorage.app",
appId: "1:747543481819:android:df33f3d9d1b330d4d96bfe"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

/*
FINAL URL FORMAT

https://appnetick-link.vercel.app/user/channel/invite/uid?=383737376363?cid?=27363g373736
*/


 function getInviteData() {

const params = new URLSearchParams(window.location.search);

return {
    uid: params.get("uid") || "",
    cid: params.get("cid") || ""
};

}
    



async function loadChannel() {

const inviteData = getInviteData();

console.log("Full URL:", window.location.href);
console.log("UID:", inviteData.uid);
console.log("CID:", inviteData.cid);
console.log("Firebase Path:", "Channels/" + inviteData.cid);
const inviterUid = inviteData.uid;
const channelId = inviteData.cid;

console.log("Inviter UID:", inviterUid);
console.log("Channel ID:", channelId);

if (!channelId) {

    document.getElementById("channelName").innerText =
    "Channel Not Found";

    return;
}

try {

    const snap = await get(
        ref(db, "Channels/" + channelId)
    );

    if (!snap.exists()) {

        document.getElementById("channelName").innerText =
        "Channel Not Found";

        return;
    }

    const data = snap.val();

    document.getElementById("channelName").innerText =
    data.name || "Channel";

    document.getElementById("channelDescription").innerText =
    data.description || "No description available";

    document.getElementById("subscribers").innerText =
    data.subscribers || 0;

    document.getElementById("channelLogo").src =
    data.logo || "https://via.placeholder.com/140";

    document.title =
    (data.name || "Channel") + " • Appnetick";

    document.querySelector(".invite").innerText =
    "You are invited to join @" +
    (data.username || "channel");

} catch (e) {

    console.error(e);

    document.getElementById("channelName").innerText =
    "Unable to load channel";

}

}

loadChannel();


window.joinChannel = function(){

alert("Channel joining system will be connected later.");

}

</script>

</body>
</html>
`);
}
