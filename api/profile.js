import { initializeApp } from "firebase/app";
import { getDatabase, ref, get } from "firebase/database";

/* Firebase Config */
const firebaseConfig = {
  apiKey: "AIzaSyBGIQFj6syU2231sov7c5i_90O0s6olCxlM",
  authDomain: "appnetick.firebaseapp.com",
  databaseURL: "https://appnetick-default-rtdb.firebaseio.com",
  projectId: "appnetick",
  storageBucket: "appnetick.firebasestorage.app",
  messagingSenderId: "816276009696",
  appId: "1:816276009696:web:db763c2ae70d2b944c9685"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export default async function handler(req, res) {

  const uid = req.query.uid;

  if (!uid) {
    return res.status(400).send("UID missing");
  }

  const snap = await get(ref(db, "Users/" + uid));

  if (!snap.exists()) {
    return res.status(404).send("User not found");
  }

  const data = snap.val();

  const name = data.full_name || "User";
  const image = data.avatar || "https://via.placeholder.com/120";
  const email = data.email || "Appnetick Profile";

  res.setHeader("Content-Type", "text/html");

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${name}</title>

      <!-- OPEN GRAPH TAGS -->
      <meta property="og:title" content="${name}">
      <meta property="og:description" content="${email}">
      <meta property="og:image" content="${image}">
      <meta property="og:type" content="website">

      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>

    <body>
      <h2>Redirecting...</h2>

      <script>
        setTimeout(() => {
          window.location.href = "/profile.html?uid=${uid}";
        }, 1000);
      </script>
    </body>
    </html>
  `);
}
