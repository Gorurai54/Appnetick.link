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
      <html lang="en">
      <head>
        <meta charset="UTF-8">

        <link rel="icon" href="/20260314_091747.png">

        <meta property="og:site_name" content="Appnetick">

        <!-- OG TAGS -->
        <meta property="og:title" content="${name}">
        <meta property="og:description" content="${username} is on Appnetick • Find them in Appnetick App">
        <meta property="og:image" content="${avatar}">
        <meta property="og:type" content="profile">

        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${name}</title>

        <style>
          *{
            margin:0;
            padding:0;
            box-sizing:border-box;
          }

          body{
            background:#000;
            color:#fff;
            font-family:Arial,sans-serif;
          }

          .navbar{
            width:100%;
            height:70px;
            border-bottom:1px solid #262626;
            display:flex;
            align-items:center;
            justify-content:center;
            position:sticky;
            top:0;
            background:#000;
            z-index:1000;
          }

          .navbar-inner{
            width:100%;
            max-width:1000px;
            display:flex;
            align-items:center;
            justify-content:space-between;
            padding:0 20px;
          }

          .nav-left{
            display:flex;
            align-items:center;
            gap:15px;
          }

          .nav-username{
            font-size:30px;
            font-weight:700;
          }

          .nav-buttons{
            display:flex;
            gap:10px;
          }

          .btn{
            padding:10px 18px;
            border-radius:999px;
            font-size:14px;
            font-weight:700;
            cursor:pointer;
          }

          .btn-open{
            background:transparent;
            border:1px solid #555;
            color:#fff;
          }

          .btn-follow{
            background:#0095f6;
            border:none;
            color:#fff;
          }

          .container{
            width:100%;
            max-width:1000px;
            margin:auto;
            padding:40px 20px;
          }

          .profile-header{
            display:flex;
            align-items:center;
            gap:80px;
            padding-bottom:40px;
            border-bottom:1px solid #262626;
          }

          .profile-image img{
            width:180px;
            height:180px;
            border-radius:50%;
            object-fit:cover;
            border:3px solid #262626;
          }

          .profile-info{
            flex:1;
          }

          .profile-top{
            display:flex;
            align-items:center;
            gap:15px;
            flex-wrap:wrap;
            margin-bottom:25px;
          }

          .profile-top h2{
            font-size:28px;
            font-weight:300;
          }

          .stats{
            display:flex;
            gap:40px;
            margin-bottom:25px;
            flex-wrap:wrap;
          }

          .stats div{
            font-size:16px;
          }

          .stats strong{
            font-weight:700;
          }

          .name{
            font-size:18px;
            font-weight:700;
            margin-bottom:8px;
          }

          .bio{
            color:#d1d1d1;
            line-height:1.6;
            max-width:500px;
          }

          .email{
            color:#8e8e8e;
            margin-top:10px;
            font-size:14px;
          }

          .stories{
            display:flex;
            gap:25px;
            padding:30px 0;
            border-bottom:1px solid #262626;
            overflow-x:auto;
          }

          .story{
            text-align:center;
          }

          .story img{
            width:80px;
            height:80px;
            border-radius:50%;
            object-fit:cover;
            border:2px solid #444;
            padding:2px;
          }

          .story p{
            margin-top:8px;
            font-size:13px;
            color:#ddd;
          }

          .tabs{
            display:flex;
            justify-content:center;
            gap:60px;
            padding:18px 0;
            border-bottom:1px solid #262626;
          }

          .tab{
            font-size:13px;
            font-weight:700;
            color:#a8a8a8;
            letter-spacing:1px;
            text-transform:uppercase;
          }

          .tab.active{
            color:#fff;
          }

          .posts{
            display:grid;
            grid-template-columns:repeat(3,1fr);
            gap:6px;
            margin-top:20px;
          }

          .post{
            aspect-ratio:1/1;
            background:#111;
            overflow:hidden;
            position:relative;
          }

          .post img{
            width:100%;
            height:100%;
            object-fit:cover;
            transition:0.3s;
          }

          .post:hover img{
            transform:scale(1.05);
            opacity:0.8;
          }

          .footer{
            text-align:center;
            color:#777;
            padding:40px 20px;
            font-size:14px;
          }

          @media(max-width:768px){

            .profile-header{
              flex-direction:column;
              align-items:flex-start;
              gap:30px;
            }

            .profile-image img{
              width:120px;
              height:120px;
            }

            .nav-username{
              font-size:22px;
            }

            .posts{
              grid-template-columns:repeat(3,1fr);
            }

            .stats{
              gap:20px;
            }

            .tabs{
              gap:25px;
            }
          }
        </style>
      </head>

      <body>

        <div class="navbar">
          <div class="navbar-inner">

            <div class="nav-left">
              <div class="nav-username">${username}</div>

              <div class="nav-buttons">
                <button class="btn btn-open">Open App</button>
                <button class="btn btn-follow">Follow</button>
              </div>
            </div>

          </div>
        </div>

        <div class="container">

          <div class="profile-header">

            <div class="profile-image">
              <img src="${avatar}" alt="${name}">
            </div>

            <div class="profile-info">

              <div class="profile-top">
                <h2>${username}</h2>

                <button class="btn btn-open">Message</button>
                <button class="btn btn-follow">Follow</button>
              </div>

              <div class="stats">
                <div><strong>24</strong> posts</div>
                <div><strong>12.4K</strong> followers</div>
                <div><strong>180</strong> following</div>
              </div>

              <div class="name">${name}</div>

              <div class="bio">
                Welcome to my Appnetick profile ✨ <br>
                Sharing moments, photos and updates.
              </div>

              <div class="email">${email}</div>

            </div>

          </div>

          <div class="stories">

            <div class="story">
              <img src="${avatar}">
              <p>Highlights</p>
            </div>

            <div class="story">
              <img src="${avatar}">
              <p>Travel</p>
            </div>

            <div class="story">
              <img src="${avatar}">
              <p>Life</p>
            </div>

            <div class="story">
              <img src="${avatar}">
              <p>Friends</p>
            </div>

          </div>

          <div class="tabs">
            <div class="tab active">Posts</div>
            <div class="tab">Reels</div>
            <div class="tab">Tagged</div>
          </div>

          <div class="posts">

            <div class="post">
              <img src="${avatar}">
            </div>

            <div class="post">
              <img src="${avatar}">
            </div>

            <div class="post">
              <img src="${avatar}">
            </div>

            <div class="post">
              <img src="${avatar}">
            </div>

            <div class="post">
              <img src="${avatar}">
            </div>

            <div class="post">
              <img src="${avatar}">
            </div>

          </div>

        </div>

        <div class="footer">
          © 2026 Appnetick
        </div>

        <script>
          // optional redirect to frontend app
          // setTimeout(()=> window.location.href="/", 2000);
        </script>

      </body>
      </html>
    `);

  } catch (err) {
    console.error("API ERROR:", err);
    return res.status(500).send("Server Error: " + err.message);
  }
}
