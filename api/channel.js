export default async function handler(req, res) {

  const cid =
    typeof req.query.cid === "string"
      ? req.query.cid
      : "";

  const uid =
    typeof req.query.uid === "string"
      ? req.query.uid
      : "";


  /* =====================================================
     CHANNEL ID CHECK
  ===================================================== */

  if (!cid) {
    return res
      .status(404)
      .send("Channel Not Found");
  }


  /* =====================================================
     FIREBASE
  ===================================================== */

  try {

    const response = await fetch(
      `https://users-f0dd7-default-rtdb.asia-southeast1.firebasedatabase.app/Channels/${encodeURIComponent(cid)}.json`
    );


    if (!response.ok) {

      return res
        .status(404)
        .send("Channel Not Found");

    }


    const data =
      await response.json();


    if (!data) {

      return res
        .status(404)
        .send("Channel Not Found");

    }


    /* ===================================================
       CHANNEL DATA
    =================================================== */

    const name =
      data.name ||
      "Channel";


    const description =
      data.description ||
      "View this channel on Appnetick.";


    const logo =
      data.logo ||
      "https://appnetick-link.vercel.app/20260314_091747.png";


    const username =
      data.username ||
      "channel";


    const subscribers =
      data.subscribers ||
      data.members ||
      0;


    const posts =
      data.posts ||
      data.postCount ||
      0;


    /* ===================================================
       INVITE URL
    =================================================== */

    const inviteUrl =
      `https://appnetick-link.vercel.app/user/channel/invite?uid=${encodeURIComponent(uid)}&cid=${encodeURIComponent(cid)}`;


    /* ===================================================
       HTML ESCAPE
    =================================================== */

    function escapeHtml(value) {

      return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    }


    const safeName =
      escapeHtml(name);


    const safeDescription =
      escapeHtml(description);


    const safeUsername =
      escapeHtml(username);


    const safeLogo =
      escapeHtml(logo);


    const safeInviteUrl =
      escapeHtml(inviteUrl);


    /* ===================================================
       RESPONSE
    =================================================== */

    res.setHeader(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=300"
    );


    return res.status(200).send(`

<!DOCTYPE html>

<html lang="en">

<head>


<meta charset="UTF-8">


<meta
name="viewport"
content="width=device-width, initial-scale=1.0">


<title>
${safeName} • Appnetick
</title>


<!-- =================================================
     OPEN GRAPH
================================================== -->

<meta
property="og:site_name"
content="Appnetick">


<meta
property="og:title"
content="See ${safeName} channel on Appnetick">


<meta
property="og:description"
content="${safeDescription}">


<meta
property="og:image"
content="${safeLogo}">


<meta
property="og:url"
content="${safeInviteUrl}">


<meta
property="og:type"
content="website">


<!-- =================================================
     TWITTER
================================================== -->

<meta
name="twitter:card"
content="summary_large_image">


<meta
name="twitter:title"
content="${safeName} • Appnetick">


<meta
name="twitter:description"
content="${safeDescription}">


<meta
name="twitter:image"
content="${safeLogo}">


<!-- =================================================
     FAVICON
================================================== -->

<link
rel="icon"
href="/20260313_121958.jpg">


<!-- =================================================
     FONT
================================================== -->

<link
href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
rel="stylesheet">


<!-- =================================================
     PHOSPHOR
================================================== -->

<script
src="https://unpkg.com/@phosphor-icons/web">
</script>


<style>

/* =====================================================
   THEME
===================================================== */

:root{

    --bg:#FFFFFF;

    --surface:#FFFFFF;

    --surface-secondary:#F7F7F7;

    --text:#212121;

    --secondary:#757575;

    --muted:#9E9E9E;

    --border:#DCDCDC;

    --input-bg:#F5F5F5;

    --primary:#2196F3;

    --primary-soft:
        rgba(33,150,243,0.10);

    --shadow:
        0 6px 25px
        rgba(0,0,0,0.06);

}


[data-theme="dark"]{

    --bg:#1E1E1E;

    --surface:#1E1E1E;

    --surface-secondary:#252525;

    --text:#FFFFFF;

    --secondary:#A0A0A0;

    --muted:#777777;

    --border:#424242;

    --input-bg:#252525;

    --primary:#2979FF;

    --primary-soft:
        rgba(41,121,255,0.14);

    --shadow:
        0 6px 25px
        rgba(0,0,0,0.28);

}


/* =====================================================
   GLOBAL
===================================================== */

*{

    margin:0;

    padding:0;

    box-sizing:border-box;

    font-family:'Inter',sans-serif;

}


html{

    background:var(--bg);

}


body{

    min-height:100vh;

    background:var(--bg);

    color:var(--text);

    overflow-x:hidden;

    transition:

        background .25s ease,

        color .25s ease;

}


/* =====================================================
   TOPBAR
===================================================== */

.topbar{

    position:sticky;

    top:0;

    z-index:1000;

    width:100%;

    height:64px;

    display:flex;

    align-items:center;

    justify-content:space-between;

    padding:0 14px;

    background:var(--surface);

    border-bottom:
        1px solid var(--border);

}


.brand{

    font-size:21px;

    font-weight:600;

    letter-spacing:-.5px;

    color:var(--text);

    cursor:pointer;

}


.brand span{

    color:var(--primary);

}


.topbar-actions{

    display:flex;

    align-items:center;

    gap:4px;

}


.icon-button{

    width:42px;

    height:42px;

    border:none;

    outline:none;

    border-radius:50%;

    background:transparent;

    color:var(--text);

    display:flex;

    align-items:center;

    justify-content:center;

    font-size:22px;

    cursor:pointer;

    transition:
        background .18s ease,
        transform .12s ease;

}


.icon-button:hover{

    background:
        var(--surface-secondary);

}


.icon-button:active{

    transform:scale(.96);

}


/* =====================================================
   MAIN
===================================================== */

.container{

    width:100%;

    max-width:430px;

    margin:0 auto;

    padding:
        30px 20px 40px;

}


/* =====================================================
   CHANNEL HEADER
===================================================== */

.channel-header{

    text-align:center;

    padding:
        8px 0 26px;

}


.channel-logo-wrap{

    display:flex;

    align-items:center;

    justify-content:center;

}


.channel-logo{

    width:110px;

    height:110px;

    border-radius:50%;

    object-fit:cover;

    display:block;

    border:
        3px solid var(--surface);

    box-shadow:

        0 0 0 1px var(--border),

        0 8px 25px
        rgba(0,0,0,.10);

    background:
        var(--surface-secondary);

}


/* =====================================================
   CHANNEL NAME
===================================================== */

.channel-name{

    margin-top:18px;

    font-size:27px;

    line-height:1.2;

    font-weight:700;

    letter-spacing:-.6px;

    word-break:break-word;

}


/* =====================================================
   INVITE
===================================================== */

.invite{

    margin:
        9px auto 0;

    max-width:340px;

    color:var(--secondary);

    font-size:14px;

    line-height:1.55;

}


/* =====================================================
   JOIN BUTTON
===================================================== */

.join-btn{

    width:100%;

    min-height:50px;

    margin-top:20px;

    border:none;

    outline:none;

    border-radius:30px;

    background:var(--primary);

    color:#FFFFFF;

    font-size:15px;

    font-weight:600;

    display:flex;

    align-items:center;

    justify-content:center;

    gap:8px;

    cursor:pointer;

    transition:
        opacity .18s ease,
        transform .12s ease;

}


.join-btn:hover{

    opacity:.90;

}


.join-btn:active{

    transform:scale(.985);

}


.join-btn i{

    font-size:20px;

}


/* =====================================================
   INFO CARD
===================================================== */

.info-card{

    margin-top:18px;

    padding:18px;

    background:var(--surface);

    border:
        1px solid var(--border);

    border-radius:18px;

    box-shadow:var(--shadow);

}


/* =====================================================
   CARD TITLE
===================================================== */

.card-title{

    display:flex;

    align-items:center;

    gap:9px;

    font-size:16px;

    font-weight:600;

}


.card-title i{

    font-size:20px;

    color:var(--primary);

}


/* =====================================================
   DESCRIPTION
===================================================== */

.description-text{

    margin-top:11px;

    font-size:14px;

    line-height:1.7;

    color:var(--secondary);

    word-break:break-word;

}


/* =====================================================
   STATS
===================================================== */

.stats{

    display:flex;

    gap:12px;

    margin-top:18px;

}


.stat{

    flex:1;

    min-width:0;

    padding:
        18px 12px;

    text-align:center;

    background:var(--surface);

    border:
        1px solid var(--border);

    border-radius:18px;

    box-shadow:var(--shadow);

}


.stat-icon{

    width:38px;

    height:38px;

    margin:
        0 auto 9px;

    border-radius:50%;

    background:
        var(--primary-soft);

    color:var(--primary);

    display:flex;

    align-items:center;

    justify-content:center;

}


.stat-icon i{

    font-size:19px;

}


.stat h2{

    font-size:22px;

    line-height:1.2;

    font-weight:700;

}


.stat p{

    margin-top:5px;

    color:var(--secondary);

    font-size:12px;

}


/* =====================================================
   FEATURES
===================================================== */

.features{

    margin-top:18px;

    padding:18px;

    background:var(--surface);

    border:
        1px solid var(--border);

    border-radius:18px;

    box-shadow:var(--shadow);

}


.feature-item{

    min-height:42px;

    display:flex;

    align-items:center;

    gap:12px;

    color:var(--secondary);

    font-size:14px;

}


.feature-item + .feature-item{

    border-top:
        1px solid var(--border);

}


.feature-item i{

    width:28px;

    color:var(--primary);

    font-size:20px;

}


/* =====================================================
   DOWNLOAD
===================================================== */

.download-box{

    margin-top:18px;

    padding:20px;

    text-align:center;

    background:var(--surface);

    border:
        1px solid var(--border);

    border-radius:18px;

    box-shadow:var(--shadow);

}


.download-icon{

    width:42px;

    height:42px;

    margin:
        0 auto 10px;

    border-radius:50%;

    display:flex;

    align-items:center;

    justify-content:center;

    background:
        var(--primary-soft);

    color:var(--primary);

}


.download-icon i{

    font-size:21px;

}


.download-box p{

    color:var(--secondary);

    font-size:13px;

    margin-bottom:14px;

}


.download-btn{

    min-height:44px;

    padding:
        0 25px;

    border:none;

    border-radius:25px;

    background:var(--primary);

    color:#FFFFFF;

    font-size:14px;

    font-weight:600;

    cursor:pointer;

}


/* =====================================================
   FOOTER
===================================================== */

.footer{

    padding:
        12px 20px 30px;

    text-align:center;

    color:var(--muted);

    font-size:12px;

}


/* =====================================================
   MOBILE
===================================================== */

@media(max-width:500px){

    .topbar{

        height:60px;

    }


    .brand{

        font-size:20px;

    }


    .container{

        padding:
            24px 16px 35px;

    }


    .channel-logo{

        width:100px;

        height:100px;

    }


    .channel-name{

        font-size:25px;

    }

}


/* =====================================================
   SMALL SCREEN
===================================================== */

@media(max-width:350px){

    .stats{

        gap:8px;

    }


    .stat{

        padding:
            15px 8px;

    }


    .stat h2{

        font-size:20px;

    }

}

</style>

</head>


<body>


<!-- =====================================================
     TOOLBAR
===================================================== -->

<div class="topbar">


    <div
        class="brand"
        onclick="location.href='/'">

        Appnetick<span>.</span>

    </div>


    <div class="topbar-actions">


        <button
            id="themeButton"
            class="icon-button"
            aria-label="Change theme">

            <i
                id="themeIcon"
                class="ph ph-moon">
            </i>

        </button>


        <button
            class="icon-button"
            aria-label="Home"
            onclick="location.href='/'">

            <i class="ph ph-house"></i>

        </button>


    </div>

</div>



<!-- =====================================================
     CONTENT
===================================================== -->

<div class="container">


    <div class="channel-header">


        <div class="channel-logo-wrap">

            <img
                id="channelLogo"
                class="channel-logo"
                src="${safeLogo}"
                alt="Channel">

        </div>


        <h1
            id="channelName"
            class="channel-name">

            ${safeName}

        </h1>


        <p
            id="inviteText"
            class="invite">

            You are invited to join @${safeUsername}

        </p>


        <button
            class="join-btn"
            onclick="joinChannel()">

            <i class="ph ph-user-plus"></i>

            <span>
                Join Channel
            </span>

        </button>


    </div>



    <!-- =================================================
         ABOUT
    ================================================== -->

    <div class="info-card">


        <div class="card-title">

            <i class="ph ph-info"></i>

            <span>
                About Channel
            </span>

        </div>


        <div
            id="channelDescription"
            class="description-text">

            ${safeDescription}

        </div>


    </div>



    <!-- =================================================
         STATS
    ================================================== -->

    <div class="stats">


        <div class="stat">


            <div class="stat-icon">

                <i class="ph ph-users"></i>

            </div>


            <h2 id="subscribers">

                ${Number(subscribers) || 0}

            </h2>


            <p>
                Subscribers
            </p>


        </div>



        <div class="stat">


            <div class="stat-icon">

                <i class="ph ph-article"></i>

            </div>


            <h2 id="posts">

                ${Number(posts) || 0}

            </h2>


            <p>
                Posts
            </p>


        </div>


    </div>



    <!-- =================================================
         FEATURES
    ================================================== -->

    <div class="features">


        <div class="feature-item">

            <i class="ph ph-check-circle"></i>

            <span>
                Public Channel
            </span>

        </div>


        <div class="feature-item">

            <i class="ph ph-shield-check"></i>

            <span>
                Secure Community
            </span>

        </div>


        <div class="feature-item">

            <i class="ph ph-lightning"></i>

            <span>
                Real Time Updates
            </span>

        </div>


        <div class="feature-item">

            <i class="ph ph-users-three"></i>

            <span>
                Unlimited Members
            </span>

        </div>


    </div>



    <!-- =================================================
         DOWNLOAD
    ================================================== -->

    <div class="download-box">


        <div class="download-icon">

            <i class="ph ph-download-simple"></i>

        </div>


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



<!-- =====================================================
     FOOTER
===================================================== -->

<div class="footer">

    © 2026 Appnetick

</div>



<!-- =====================================================
     FIREBASE
===================================================== -->

<script type="module">


import {
    initializeApp
}
from
"https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";


import {
    getDatabase,
    ref,
    get
}
from
"https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";



const firebaseConfig = {

    apiKey:
    "AIzaSyDZtlQ6BR9olb_Ssf7c5i_90O0s6olCxlM",

    authDomain:
    "users-f0dd7.firebaseapp.com",

    databaseURL:
    "https://users-f0dd7-default-rtdb.asia-southeast1.firebasedatabase.app",

    projectId:
    "users-f0dd7",

    storageBucket:
    "users-f0dd7.firebasestorage.app",

    appId:
    "1:747543481819:android:df33f3d9d1b330d4d96bfe"

};


const app =
    initializeApp(
        firebaseConfig
    );


const db =
    getDatabase(app);



/* =====================================================
   URL DATA
===================================================== */

function getInviteData(){

    const params =
        new URLSearchParams(
            window.location.search
        );


    return {

        uid:
        params.get("uid") || "",

        cid:
        params.get("cid") || ""

    };

}



/* =====================================================
   NUMBER FORMAT
===================================================== */

function formatNumber(value){

    const number =
        Number(value) || 0;


    if(number >= 1000000){

        return (
            number / 1000000
        ).toFixed(
            number >= 10000000
                ? 0
                : 1
        ) + "M";

    }


    if(number >= 1000){

        return (
            number / 1000
        ).toFixed(
            number >= 10000
                ? 0
                : 1
        ) + "K";

    }


    return number.toString();

}



/* =====================================================
   LOAD CHANNEL
===================================================== */

async function loadChannel(){

    const inviteData =
        getInviteData();


    const inviterUid =
        inviteData.uid;


    const channelId =
        inviteData.cid;


    console.log(
        "Full URL:",
        window.location.href
    );


    console.log(
        "UID:",
        inviterUid
    );


    console.log(
        "CID:",
        channelId
    );


    console.log(
        "Firebase Path:",
        "Channels/" +
        channelId
    );


    if(!channelId){

        document
            .getElementById(
                "channelName"
            )
            .innerText =
            "Channel Not Found";


        return;

    }


    try{


        const snap =
            await get(
                ref(
                    db,
                    "Channels/" +
                    channelId
                )
            );


        if(!snap.exists()){

            document
                .getElementById(
                    "channelName"
                )
                .innerText =
                "Channel Not Found";


            document
                .getElementById(
                    "channelDescription"
                )
                .innerText =
                "This channel may no longer exist.";


            return;

        }


        const data =
            snap.val();


        const channelName =
            data.name ||
            "Channel";


        const channelDescription =
            data.description ||
            "No description available";


        const channelUsername =
            data.username ||
            "channel";


        const channelLogo =
            data.logo ||
            "/20260313_121958.jpg";


        const subscriberCount =
            data.subscribers ||
            data.members ||
            0;


        const postCount =
            data.posts ||
            data.postCount ||
            0;



        /* =============================================
           UI
        ============================================== */

        document
            .getElementById(
                "channelName"
            )
            .innerText =
            channelName;


        document
            .getElementById(
                "channelDescription"
            )
            .innerText =
            channelDescription;


        document
            .getElementById(
                "subscribers"
            )
            .innerText =
            formatNumber(
                subscriberCount
            );


        document
            .getElementById(
                "posts"
            )
            .innerText =
            formatNumber(
                postCount
            );


        document
            .getElementById(
                "channelLogo"
            )
            .src =
            channelLogo;


        document
            .getElementById(
                "inviteText"
            )
            .innerText =
            "You are invited to join @" +
            channelUsername;


        document.title =
            channelName +
            " • Appnetick";


    }catch(error){


        console.error(
            "Channel loading error:",
            error
        );


        document
            .getElementById(
                "channelName"
            )
            .innerText =
            "Unable to load channel";


        document
            .getElementById(
                "channelDescription"
            )
            .innerText =
            "Something went wrong while loading this channel.";

    }

}



/* =====================================================
   JOIN
===================================================== */

window.joinChannel =
function(){

    alert(
        "Channel joining system will be connected later."
    );

};



/* =====================================================
   THEME
===================================================== */

const themeButton =
    document.getElementById(
        "themeButton"
    );


const themeIcon =
    document.getElementById(
        "themeIcon"
    );


const systemTheme =
    window.matchMedia &&
    window.matchMedia(
        "(prefers-color-scheme: dark)"
    ).matches
        ? "dark"
        : "light";


let savedTheme =
    localStorage.getItem(
        "appnetick-theme"
    );


if(!savedTheme){

    savedTheme =
        systemTheme;

}


function applyTheme(theme){

    document.documentElement
        .setAttribute(
            "data-theme",
            theme
        );


    localStorage.setItem(
        "appnetick-theme",
        theme
    );


    if(theme === "dark"){

        themeIcon.className =
            "ph ph-sun";


        themeButton.setAttribute(
            "aria-label",
            "Switch to light theme"
        );

    }else{

        themeIcon.className =
            "ph ph-moon";


        themeButton.setAttribute(
            "aria-label",
            "Switch to dark theme"
        );

    }

}


applyTheme(
    savedTheme
);


themeButton.addEventListener(
    "click",
    function(){

        const currentTheme =
            document.documentElement
                .getAttribute(
                    "data-theme"
                );


        applyTheme(
            currentTheme === "dark"
                ? "light"
                : "dark"
        );

    }
);



/* =====================================================
   LOAD
===================================================== */

loadChannel();

</script>


</body>

</html>

`);

  } catch (error) {

    console.error(
      "Channel API Error:",
      error
    );

    return res
      .status(500)
      .send("Unable to load channel");

  }

}
