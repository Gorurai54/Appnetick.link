export const config = {
  api: {
    bodyParser: true
  }
};

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "POST only allowed"
    });
  }

  try {

    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body)
        : req.body || {};
    console.log("RAW BODY:", req.body);

    let { email, otp } = body;

    email = String(email || "")
      .trim()
      .toLowerCase();

    otp = String(otp || "").trim();

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP required"
      });
    }

    const safeEmail =
      email.replace(/[.#$\[\]@]/g, "_");

    const url =
      `https://appnetick-default-rtdb.firebaseio.com/OTPs/${safeEmail}.json`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "OTP not found"
      });
    }

    const isExpired =
      Date.now() - data.createdAt > 5 * 60 * 1000;

    if (isExpired) {
      return res.status(400).json({
        success: false,
        message: "OTP expired"
      });
    }

    if (String(data.otp) === otp) {

      await fetch(url, { method: "DELETE" });

      return res.status(200).json({
        success: true,
        verified: true,
        message: "OTP verified successfully"
      });

    }

    return res.status(400).json({
      success: false,
      message: "Invalid OTP"
    });

  } catch (err) {

    return res.status(500).json({
      success: false,
      message: err.message
    });

  }
}
