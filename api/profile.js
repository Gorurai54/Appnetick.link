import { initializeApp } from "firebase/app";
import { getDatabase, ref, get } from "firebase/database";

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
  try {

    const uid = req.query.uid;

    if (!uid) {
      return res.status(400).send("UID missing");
    }

    const snap = await get(ref(db, "Users/" + uid));

    if (!snap.exists()) {
      return res.status(404).send("User not found");
    }

    const data = snap.val();

    res.status(200).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta property="og:title" content="${data.full_name || "User"}">
        <meta property="og:image" content="${data.avatar || ""}">
        <meta property="og:description" content="${data.email || ""}">
      </head>
      <body style="background:black;color:white">
        Redirecting...
        <script>
          setTimeout(()=>{
            window.location.href="/";
          },1000);
        </script>
      </body>
      </html>
    `);

  } catch (err) {
    console.log(err);
    res.status(500).send(err.toString());
  }
}
