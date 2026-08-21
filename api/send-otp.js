import { Redis } from "@upstash/redis";
import nodemailer from "nodemailer";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN
});

const OTP_EXPIRY = 5 * 60; // 5 minutes

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "POST only allowed"
    });
  }

  try {

    const { email } = req.body || {};

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email address"
      });
    }

    /*
     * Generate 6-digit OTP
     */
    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    /*
     * Redis key
     */
    const redisKey = `appnetick:otp:${normalizedEmail}`;

    /*
     * Save OTP for 5 minutes
     */
    await redis.set(
      redisKey,
      JSON.stringify({
        otp: otp,
        attempts: 0,
        createdAt: Date.now()
      }),
      {
        ex: OTP_EXPIRY
      }
    );

    /*
     * Email logo
     *
     * IMPORTANT:
     * This must be a PUBLIC HTTPS URL.
     *
     * Example:
     * https://raw.githubusercontent.com/USERNAME/REPOSITORY/main/logo.png
     *
     * Put that URL in Vercel:
     *
     * LOGO_URL=https://...
     */
    const logoUrl = process.env.LOGO_URL;

    /*
     * Gmail transporter
     */
    const transporter = nodemailer.createTransport({
      service: "gmail",

      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    /*
     * Send email
     */
    await transporter.sendMail({

      from: `"Appnetick" <${process.env.EMAIL_USER}>`,

      to: normalizedEmail,

      subject: "Your Appnetick verification code",

      html: `
<!DOCTYPE html>

<html lang="en">

<head>

<meta charset="UTF-8">

<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0"
>

<meta
  name="color-scheme"
  content="light"
>

<meta
  name="supported-color-schemes"
  content="light"
>

<title>Appnetick</title>

</head>


<body
  style="
    margin:0;
    padding:0;
    background:#ffffff;
    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
    color:#000000;
  "
>


<!-- Main wrapper -->

<table
  width="100%"
  cellpadding="0"
  cellspacing="0"
  border="0"
  style="
    width:100%;
    background:#ffffff;
  "
>

<tr>

<td
  align="center"
  style="
    padding:42px 20px 50px;
  "
>


<!-- Email content -->

<table
  width="100%"
  cellpadding="0"
  cellspacing="0"
  border="0"
  style="
    width:100%;
    max-width:620px;
    background:#ffffff;
  "
>


<!-- Logo -->

<tr>

<td
  align="left"
  style="
    padding:0 0 46px 0;
  "
>

${
  logoUrl
    ? `
<img
  src="${logoUrl}"
  width="92"
  height="92"
  alt="Appnetick"
  style="
    display:block;
    width:92px;
    height:92px;
    object-fit:contain;
    border:0;
  "
>
`
    : `
<div
  style="
    width:92px;
    height:92px;
    line-height:92px;
    text-align:center;
    background:#2463e8;
    border-radius:27px;
    color:#ffffff;
    font-size:42px;
    font-weight:700;
  "
>
A
</div>
`
}

</td>

</tr>


<!-- Brand -->

<tr>

<td
  align="left"
  style="
    padding:0 0 34px 0;
  "
>

<div
  style="
    color:#000000;
    font-size:31px;
    line-height:1.2;
    font-weight:700;
    letter-spacing:-1.2px;
  "
>
Appnetick
</div>

</td>

</tr>


<!-- Heading -->

<tr>

<td
  align="left"
  style="
    padding:0 0 18px 0;
  "
>

<div
  style="
    color:#000000;
    font-size:24px;
    line-height:1.35;
    font-weight:700;
    letter-spacing:-0.4px;
  "
>
Use the code below to verify your email
</div>

</td>

</tr>


<!-- OTP -->

<tr>

<td
  align="left"
  style="
    padding:10px 0 32px 0;
  "
>

<div
  style="
    color:#000000;
    font-size:42px;
    line-height:1.2;
    font-weight:700;
    letter-spacing:2px;
  "
>
${otp}
</div>

</td>

</tr>


<!-- Security message -->

<tr>

<td
  align="left"
  style="
    padding:0 0 42px 0;
  "
>

<div
  style="
    color:#111111;
    font-size:16px;
    line-height:1.55;
    font-weight:400;
  "
>
If you did not request this OTP, please ignore this email
and do not share the OTP with anyone.
</div>

</td>

</tr>


<!-- Expiry -->

<tr>

<td
  align="left"
  style="
    padding:0 0 34px 0;
  "
>

<div
  style="
    color:#777777;
    font-size:14px;
    line-height:1.6;
  "
>
This verification code expires in 5 minutes.
</div>

</td>

</tr>


<!-- Footer -->

<tr>

<td
  align="left"
  style="
    padding:28px 0 0 0;
    border-top:1px solid #eeeeee;
  "
>

<div
  style="
    color:#999999;
    font-size:12px;
    line-height:1.7;
  "
>
© ${new Date().getFullYear()} Appnetick
</div>

</td>

</tr>


</table>

<!-- End email content -->


</td>

</tr>

</table>

<!-- End main wrapper -->


</body>

</html>
      `
    });

    /*
     * IMPORTANT:
     * OTP is never returned to the app.
     */
    return res.status(200).json({
      success: true,
      message: "OTP sent successfully"
    });

  } catch (error) {

    console.error("Send OTP Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to send OTP"
    });

  }
}
