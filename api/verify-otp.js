// FILE: api/verify-otp.js

export default async function handler(req, res) {

  // ONLY POST ALLOWED
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "POST only allowed"
    });
  }

  try {

    const { email, otp } = req.body;

    // VALIDATION
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP required"
      });
    }

    // FIREBASE URL
    const firebaseUrl =
      `https://appnetick-default-rtdb.firebaseio.com/OTPs/${email.replace(/\./g, "_")}.json`;

    // GET STORED OTP
    const response = await fetch(firebaseUrl);

    const data = await response.json();

    // OTP NOT FOUND
    if (!data) {
      return res.status(404).json({
        success: false,
        message: "OTP not found"
      });
    }

    // EXPIRE CHECK (5 MIN)
    const now = Date.now();

    const otpAge =
      now - (data.createdAt || 0);

    const fiveMinutes =
      5 * 60 * 1000;

    if (otpAge > fiveMinutes) {

      return res.status(400).json({
        success: false,
        message: "OTP expired"
      });

    }

    // VERIFY OTP
    if (String(data.otp) === String(otp)) {

      // DELETE OTP AFTER SUCCESS
      await fetch(firebaseUrl, {
        method: "DELETE"
      });

      return res.status(200).json({
        success: true,
        message: "OTP verified successfully"
      });

    } else {

      return res.status(400).json({
        success: false,
        message: "Invalid OTP"
      });

    }

  } catch (err) {

    return res.status(500).json({
      success: false,
      message: err.message
    });

  }

}
