import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only allowed" });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email required" });
  }

  // OTP generate
  const otp = Math.floor(100000 + Math.random() * 900000);

  // Gmail SMTP setup
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const html = `
  <div style="font-family:Arial;text-align:center;padding:20px">
    <img src="https://appnetick-link.vercel.app/20260314_091747.png"
         style="width:80px;height:80px;border-radius:20px" />

    <h2>Appnetick OTP</h2>

    <p>Your OTP is:</p>

    <h1 style="color:#00bfff">${otp}</h1>

    <p>This OTP is valid for 5 minutes</p>
  </div>
  `;

  try {
    await transporter.sendMail({
      from: "Appnetick <no-reply@appnetick.com>",
      to: email,
      subject: "Your OTP Code",
      html
    });

    return res.status(200).json({
      success: true,
      message: "OTP sent"
    });

  } catch (err) {
    return res.status(500).json({
      error: err.message
    });
  }
}
