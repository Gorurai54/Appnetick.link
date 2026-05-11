export default async function handler(req, res) {

  // =========================
  // ONLY POST
  // =========================

  if (req.method !== "POST") {

    return res.status(405).json({
      success: false,
      message: "POST only allowed"
    });

  }

  try {

    let { email, otp } = req.body;

    // =========================
    // CLEAN INPUT
    // =========================

    email = String(email || "")
      .trim()
      .toLowerCase();

    otp = String(otp || "")
      .trim();

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
    // FIREBASE KEY
    // =========================

    const safeEmail =
  email
    .replace(/[.#$\[\]@]/g, "_")
    .toLowerCase()
    .trim();

    // =========================
    // FIREBASE URL
    // =========================

    const firebaseUrl =
      `https://appnetick-default-rtdb.firebaseio.com/OTPs/${safeEmail}.json`;

    // =========================
    // GET STORED OTP
    // =========================

    const response =
      await fetch(firebaseUrl);

    const data =
      await response.json();

    // =========================
    // DEBUG LOGS
    // =========================

    console.log("EMAIL:", email);

    console.log("ENTERED OTP:", otp);

    console.log("DATABASE:", data);

    // =========================
    // OTP NOT FOUND
    // =========================

    if (!data) {

      return res.status(404).json({

        success: false,

        message: "OTP not found"

      });

    }

    // =========================
    // EXPIRE CHECK
    // =========================

    const now = Date.now();

    const createdAt =
      Number(data.createdAt || 0);

    const otpAge =
      now - createdAt;

    const fiveMinutes =
      5 * 60 * 1000;

    if (otpAge > fiveMinutes) {

      return res.status(400).json({

        success: false,

        message: "OTP expired"

      });

    }

    // =========================
    // CLEAN OTP
    // =========================

    const savedOtp =
      String(data.otp || "")
        .trim();

    const enteredOtp =
      String(otp || "")
        .trim();

    // =========================
    // VERIFY
    // =========================

    if (savedOtp === enteredOtp) {

      // =====================
      // DELETE OTP
      // =====================

      await fetch(firebaseUrl, {

        method: "DELETE"

      });

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

  }

  catch (err) {

    console.error(err);

    return res.status(500).json({

      success: false,

      message: err.message

    });

  }

}
