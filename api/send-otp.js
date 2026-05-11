import nodemailer from "nodemailer";

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

    let { email } = body;

    email = String(email || "")
      .trim()
      .toLowerCase();

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email required"
      });
    }

    const otp =
      Math.floor(100000 + Math.random() * 900000).toString();

    const safeEmail =
      email.replace(/[#$\[\]]/g, "_");

    // SAVE OTP
    const firebaseRes = await fetch(
  `https://appnetick-default-rtdb.firebaseio.com/OTPs/${safeEmail}.json`,
  {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      otp,
      createdAt: Date.now()
    })
  }
);

const firebaseData = await firebaseRes.json();

console.log("Firebase response:", firebaseData);

    // SMTP
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
      message: "OTP sent successfully"
    });

  } catch (err) {

    return res.status(500).json({
      success: false,
      message: err.message
    });

  }
}
