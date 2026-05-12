import nodemailer from "nodemailer";

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "POST only allowed"
    });
  }

  try {

    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    // 🔥 Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 📩 Mail transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // 📧 Send email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP Code",
      html: `
        <!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>

<body style="
  margin:0;
  padding:0;
  background:#f3f6fb;
  font-family:Arial,sans-serif;
">

  <div style="
    max-width:620px;
    margin:40px auto;
    background:#ffffff;
    border-radius:24px;
    overflow:hidden;
    box-shadow:0 6px 24px rgba(0,0,0,0.08);
  ">

    <!-- Top Header -->
    <div style="
      background:linear-gradient(135deg,#111827,#1f2937);
      padding:45px 25px;
      text-align:center;
    ">

      <h1 style="
        margin:0;
        color:#ffffff;
        font-size:34px;
        font-weight:700;
        letter-spacing:1px;
      ">
        Appnetick
      </h1>

      <p style="
        color:#d1d5db;
        margin-top:12px;
        font-size:15px;
        line-height:1.7;
      ">
        Secure identity verification system
      </p>

    </div>

    <!-- Main Content -->
    <div style="padding:45px 35px;">

      <h2 style="
        margin-top:0;
        color:#111827;
        font-size:28px;
        line-height:1.4;
      ">
        Verify your account on Appnetick
      </h2>

      <p style="
        color:#4b5563;
        font-size:16px;
        line-height:1.9;
        margin-top:20px;
      ">
        We received a request to verify your identity on Appnetick.
        To continue securely, please use the verification code below.
        This helps us protect your account and keep your information safe.
      </p>

      <!-- OTP Card -->
      <div style="
        margin:40px 0;
        text-align:center;
      ">

        <div style="
          display:inline-block;
          background:#f9fafb;
          border:2px solid #e5e7eb;
          border-radius:20px;
          padding:28px 45px;
          min-width:280px;
        ">

          <div style="
            font-size:13px;
            color:#6b7280;
            letter-spacing:2px;
            margin-bottom:14px;
            font-weight:600;
          ">
            VERIFICATION CODE
          </div>

          <div style="
            font-size:46px;
            font-weight:700;
            letter-spacing:10px;
            color:#111827;
          ">
            ${otp}
          </div>

          <div style="
            margin-top:16px;
            color:#6b7280;
            font-size:14px;
          ">
            Valid for 5 minutes
          </div>

        </div>

      </div>

      <!-- Description -->
      <p style="
        color:#4b5563;
        font-size:15px;
        line-height:1.9;
      ">
        Enter this code in the Appnetick app to complete verification.
        Do not share this code with anyone for security reasons.
      </p>

      <!-- Security Box -->
      <div style="
        margin-top:35px;
        background:#f9fafb;
        border:1px solid #e5e7eb;
        border-radius:18px;
        padding:25px;
      ">

        <h3 style="
          margin-top:0;
          margin-bottom:18px;
          color:#111827;
          font-size:20px;
        ">
          Security Rules
        </h3>

        <ul style="
          margin:0;
          padding-left:22px;
          color:#4b5563;
          font-size:15px;
          line-height:2;
        ">
          <li>Never share your OTP with anyone.</li>
          <li>Appnetick support will never ask for your verification code.</li>
          <li>This OTP automatically expires after 5 minutes.</li>
          <li>If you did not request this verification, you can safely ignore this email.</li>
        </ul>

      </div>

      <!-- Extra Description -->
      <div style="
        margin-top:35px;
        padding:22px;
        background:#111827;
        border-radius:18px;
      ">

        <p style="
          margin:0;
          color:#e5e7eb;
          font-size:14px;
          line-height:1.9;
          text-align:center;
        ">
          Appnetick uses advanced security systems to help protect your
          account from unauthorized access and suspicious activity.
        </p>

      </div>

      <!-- Footer -->
      <div style="
        margin-top:45px;
        text-align:center;
        color:#9ca3af;
        font-size:13px;
        line-height:1.8;
      ">
        © ${new Date().getFullYear()} Appnetick <br/>
        Secure Authentication Service
      </div>

    </div>

  </div>

</body>
</html>
      `
    });

    // ✅ Response back to app
    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      otp: otp   // ⚠️ (only for testing, remove in production)
    });

  } catch (err) {

    return res.status(500).json({
      success: false,
      message: err.message
    });

  }
}
