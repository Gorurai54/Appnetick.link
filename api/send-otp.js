import nodemailer from "nodemailer";

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

    let { email } = req.body;

    // =========================
    // CLEAN EMAIL
    // =========================

    email = String(email || "")
      .trim()
      .toLowerCase();

    // =========================
    // VALIDATION
    // =========================

    if (!email) {

      return res.status(400).json({
        success: false,
        message: "Email required"
      });

    }

    // =========================
    // GENERATE OTP
    // =========================

    const otp =
      Math.floor(100000 + Math.random() * 900000)
        .toString();

    // =========================
    // FIREBASE KEY
    // =========================

    const safeEmail =
  email
    .replace(/[.#$\[\]@]/g, "_")
    .toLowerCase()
    .trim();

    // =========================
    // SAVE OTP
    // =========================

    await fetch(

      `https://appnetick-default-rtdb.firebaseio.com/OTPs/${safeEmail}.json`,

      {
        method: "PUT",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({

          otp: otp,

          createdAt: Date.now()

        })
      }
    );

    // =========================
    // SMTP
    // =========================

    const transporter =
      nodemailer.createTransport({

        service: "gmail",

        auth: {

          user: process.env.EMAIL_USER,

          pass: process.env.EMAIL_PASS

        }

      });

    // =========================
    // EMAIL HTML
    // =========================

    const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
</head>

<body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial">

<div style="
max-width:420px;
margin:40px auto;
background:#ffffff;
border-radius:14px;
overflow:hidden;
box-shadow:0 10px 30px rgba(0,0,0,0.08)
">

<div style="
background:#000814;
padding:22px;
text-align:center
">

<img
src="https://appnetick-link.vercel.app/20260314_091747.png"
style="
width:60px;
height:60px;
border-radius:14px
"/>

<h2 style="
color:#fff;
margin:10px 0 0;
font-size:18px
">
Appnetick
</h2>

<p style="
color:#cbd5e1;
font-size:12px;
margin:5px 0 0
">
Secure Verification
</p>

</div>

<div style="
padding:25px;
text-align:center
">

<h3 style="
margin:0;
color:#111;
font-size:18px
">
Verify your email
</h3>

<p style="
color:#666;
font-size:14px;
margin-top:10px
">
Enter this OTP to continue
</p>

<div style="
margin:25px auto;
font-size:30px;
letter-spacing:8px;
font-weight:bold;
background:#f1f5f9;
padding:15px 25px;
border-radius:10px;
color:#000814;
display:inline-block
">
${otp}
</div>

<p style="
color:#888;
font-size:12px;
margin-top:15px
">
This OTP is valid for <b>5 minutes</b>.
<br/>
Do not share it with anyone.
</p>

</div>

<div style="
padding:15px;
text-align:center;
font-size:11px;
color:#999;
background:#fafafa
">
© Appnetick • All rights reserved
</div>

</div>

</body>
</html>
`;

    // =========================
    // SEND EMAIL
    // =========================

    await transporter.sendMail({

      from: `Appnetick <${process.env.EMAIL_USER}>`,

      to: email,

      subject: "Your OTP Code - Appnetick",

      html

    });

    // =========================
    // SUCCESS
    // =========================

    return res.status(200).json({

      success: true,

      message: "OTP sent successfully"

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
