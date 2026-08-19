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
     * Save OTP in Upstash Redis
     *
     * It will automatically disappear
     * after 5 minutes.
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

<meta name="color-scheme" content="light">

<title>Appnetick Verification</title>

</head>

<body style="
margin:0;
padding:0;
background:#f4f7fb;
font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;
color:#111827;
">

<table
width="100%"
cellpadding="0"
cellspacing="0"
border="0"
style="
background:#f4f7fb;
padding:24px 12px;
"
>

<tr>

<td align="center">

<table
width="100%"
cellpadding="0"
cellspacing="0"
border="0"
style="
max-width:620px;
background:#ffffff;
border-radius:22px;
overflow:hidden;
border:1px solid #e8edf3;
"
>

<!-- Toolbar -->

<tr>

<td
style="
padding:18px 24px;
border-bottom:1px solid #edf0f4;
background:#ffffff;
"
>

<table
width="100%"
cellpadding="0"
cellspacing="0"
border="0"
>

<tr>

<td
valign="middle"
style="white-space:nowrap;"
>

<div
style="
display:inline-block;
width:40px;
height:40px;
line-height:40px;
text-align:center;
vertical-align:middle;
background:#111827;
border-radius:12px;
color:#ffffff;
font-size:19px;
font-weight:700;
"
>
A
</div>

<span
style="
display:inline-block;
vertical-align:middle;
margin-left:10px;
color:#111827;
font-size:20px;
line-height:40px;
font-weight:700;
letter-spacing:-0.4px;
"
>
Appnetick
</span>

</td>

<td
align="right"
valign="middle"
>

<span
style="
display:inline-block;
padding:7px 11px;
background:#f3f4f6;
border-radius:20px;
color:#6b7280;
font-size:11px;
font-weight:600;
"
>
SECURE
</span>

</td>

</tr>

</table>

</td>

</tr>


<!-- Hero -->

<tr>

<td
style="
padding:42px 28px 28px;
text-align:center;
"
>

<div
style="
display:inline-block;
width:56px;
height:56px;
line-height:56px;
border-radius:18px;
background:#f3f4f6;
color:#111827;
font-size:25px;
font-weight:700;
"
>
✓
</div>

<h1
style="
margin:22px 0 10px;
color:#111827;
font-size:27px;
line-height:1.3;
font-weight:700;
letter-spacing:-0.5px;
"
>
Verify your account
</h1>

<p
style="
margin:0 auto;
max-width:470px;
color:#6b7280;
font-size:15px;
line-height:1.7;
"
>
Use the verification code below to securely
continue with your Appnetick account.
</p>

</td>

</tr>


<!-- OTP -->

<tr>

<td
style="
padding:8px 28px 20px;
"
>

<div
style="
background:#f8fafc;
border:1px solid #e5e7eb;
border-radius:18px;
padding:26px 20px;
text-align:center;
"
>

<div
style="
color:#6b7280;
font-size:11px;
font-weight:700;
letter-spacing:2px;
margin-bottom:13px;
"
>
VERIFICATION CODE
</div>

<div
style="
color:#111827;
font-size:38px;
line-height:1.2;
font-weight:700;
letter-spacing:8px;
padding-left:8px;
"
>
${otp}
</div>

<div
style="
margin-top:14px;
color:#9ca3af;
font-size:13px;
"
>
This code expires in 5 minutes
</div>

</div>

</td>

</tr>


<!-- Message -->

<tr>

<td
style="
padding:5px 28px 10px;
"
>

<p
style="
margin:0;
color:#4b5563;
font-size:14px;
line-height:1.8;
"
>
Enter this code in the Appnetick app to complete
your verification. For your security, never share
this code with anyone.
</p>

</td>

</tr>


<!-- Security -->

<tr>

<td
style="
padding:22px 28px 8px;
"
>

<div
style="
background:#f8fafc;
border:1px solid #e5e7eb;
border-radius:16px;
padding:20px;
"
>

<div
style="
color:#111827;
font-size:15px;
font-weight:700;
margin-bottom:12px;
"
>
Security information
</div>

<div
style="
color:#6b7280;
font-size:13px;
line-height:1.8;
"
>
• Never share your verification code.<br>
• Appnetick support will never ask for your OTP.<br>
• This code automatically expires after 5 minutes.<br>
• If you did not request this code, you can ignore this email.
</div>

</div>

</td>

</tr>


<!-- Footer Message -->

<tr>

<td
style="
padding:22px 28px 10px;
"
>

<div
style="
background:#111827;
border-radius:16px;
padding:18px 20px;
text-align:center;
"
>

<p
style="
margin:0;
color:#d1d5db;
font-size:12px;
line-height:1.7;
"
>
Appnetick uses secure verification systems
to help protect your account from unauthorized access.
</p>

</div>

</td>

</tr>


<!-- Footer -->

<tr>

<td
style="
padding:28px 20px 30px;
text-align:center;
"
>

<div
style="
color:#9ca3af;
font-size:12px;
line-height:1.8;
"
>
© ${new Date().getFullYear()} Appnetick
<br>
Secure Authentication Service
</div>

</td>

</tr>

</table>

</td>

</tr>

</table>

</body>

</html>
      `
    });

    /*
     * IMPORTANT:
     * OTP is NOT returned to the app.
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
