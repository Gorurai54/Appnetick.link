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
        <meta property="og:description" content="${username} is on Appnetick â€¢ Find them in Appnetick App">
        <meta property="og:image" content="${avatar}">
        <meta property="og:type" content="profile">

        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${name}</title>
      </head>

      <body style="background:#000;color:white;font-family:Arial;display:flex;align-items:center;justify-content:center;height:100vh;">
        <div style="text-align:center">
          <img src="${avatar}" style="width:120px;height:120px;border-radius:50%;object-fit:cover;border:2px solid #444"/>
          <h2>${name}</h2>
          <p>@${username}</p>
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
