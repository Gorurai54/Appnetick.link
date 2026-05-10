import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: "users-f0dd7",
      clientEmail: "firebase-adminsdk-fbsvc@users-f0dd7.iam.gserviceaccount.com",
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
    }),
    databaseURL: "https://users-f0dd7-default-rtdb.asia-southeast1.firebasedatabase.app"
  });
}

const db = admin.database();

export default async function handler(req, res) {
  try {

    const uid = req.query.uid;

    if (!uid) {
      return res.status(400).send("UID missing");
    }

    const snap = await db.ref("Users/" + uid).get();

    if (!snap.exists()) {
      return res.status(404).send("User not found");
    }

    const data = snap.val();

    res.status(200).send(`
      <html>
      <head>
        <meta property="og:title" content="${data.full_name || "User"}">
        <meta property="og:image" content="${data.avatar || ""}">
        <meta property="og:description" content="${data.email || ""}">
      </head>
      <body>OK</body>
      </html>
    `);

  } catch (e) {
    console.log(e);
    res.status(500).send(e.toString());
  }
}
