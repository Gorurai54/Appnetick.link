import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email required" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const safeEmail = encodeURIComponent(email.toLowerCase().trim());

    // 🔥 SAVE OTP IN FIREBASE
    await fetch(
      `https://appnetick-default-rtdb.firebaseio.com/OTPs/${safeEmail}.json`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          otp: otp,
          createdAt: Date.now()
        })
      }
    );

    // 📩 SEND EMAIL
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "OTP Verification",
      html: `<h2>Your OTP is <b>${otp}</b></h2>`
    });

    return res.status(200).json({
      success: true,
      message: "OTP sent"
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
}
