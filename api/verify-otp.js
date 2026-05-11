export default async function handler(req, res) {

  // =========================
  // METHOD CHECK
  // =========================
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "POST only allowed"
    });
  }

  try {

    // =========================
    // SAFE BODY PARSING (VERY IMPORTANT)
    // =========================
    let body = req.body;

    if (!body || typeof body === "string") {
      try {
        body = JSON.parse(body || "{}");
      } catch (e) {
        body = {};
      }
    }

    console.log("📦 HEADERS:", req.headers);
    console.log("📦 RAW BODY:", req.body);
    console.log("📦 PARSED BODY:", body);

    let { email, otp } = body;

    // =========================
    // CLEAN INPUT
    // =========================
    email = String(email || "")
      .trim()
      .toLowerCase();

    otp = String(otp || "").trim();

    // =========================
    // VALIDATION
    // =========================
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP required"
      });
    }

    // =========================
    // FIREBASE SAFE KEY
    // =========================
    const safeEmail =
      email.replace(/[.#$\[\]@]/g, "_").toLowerCase();

    const firebaseUrl =
      `https://appnetick-default-rtdb.firebaseio.com/OTPs/${safeEmail}.json`;

    // =========================
    // GET OTP FROM FIREBASE
    // =========================
    const response = await fetch(firebaseUrl);
    const data = await response.json();

    console.log("🔥 FIREBASE DATA:", data);

    // =========================
    // NOT FOUND
    // =========================
    if (!data) {
      return res.status(404).json({
        success: false,
        message: "OTP not found"
      });
    }

    // =========================
    // EXPIRE CHECK (5 MIN)
    // =========================
    const now = Date.now();
    const createdAt = Number(data.createdAt || 0);

    const isExpired = (now - createdAt) > 5 * 60 * 1000;

    if (isExpired) {

      // optional cleanup
      await fetch(firebaseUrl, { method: "DELETE" });

      return res.status(400).json({
        success: false,
        message: "OTP expired"
      });
    }

    // =========================
    // CLEAN STORED OTP
    // =========================
    const savedOtp = String(data.otp || "").trim();
    const enteredOtp = String(otp || "").trim();

    console.log("🔐 ENTERED OTP:", enteredOtp);
    console.log("🔐 SAVED OTP:", savedOtp);

    // =========================
    // VERIFY OTP
    // =========================
    if (savedOtp === enteredOtp) {

      // DELETE AFTER SUCCESS
      await fetch(firebaseUrl, { method: "DELETE" });

      return res.status(200).json({
        success: true,
        verified: true,
        message: "OTP verified successfully"
      });
    }

    // =========================
    // INVALID OTP
    // =========================
    return res.status(400).json({
      success: false,
      message: "Invalid OTP"
    });

  } catch (err) {

    console.error("❌ VERIFY ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
}
