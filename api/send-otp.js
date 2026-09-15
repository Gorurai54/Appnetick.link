//https://appnetick-link.vercel.app/api/send-otp.js

import { Redis } from "@upstash/redis";
import nodemailer from "nodemailer";

/*

REDIS

*/

const redis = new Redis({

url:
process.env.UPSTASH_REDIS_REST_URL,

token:
process.env.UPSTASH_REDIS_REST_TOKEN

});

const OTP_EXPIRY = 5 * 60; // 5 minutes

/*

HELPERS

*/

function safeString(value) {

return String(value || "").trim();

}

/*

HTML ESCAPE

*/

function escapeHtml(value) {

return String(value || "")
.replace(/&/g, "&")
.replace(/</g, "<")
.replace(/>/g, ">")
.replace(/"/g, """)
.replace(/'/g, "'");

}

/*

TEXT TO HTML

*/

function textToHtml(value) {

return escapeHtml(value)
.replace(/\r\n/g, "\n")
.replace(/\r/g, "\n")
.replace(/\n/g, "<br>");

}

/*

EMAIL VALIDATION

*/

function isValidEmail(email) {

return /^[^\s@]+@[^\s@]+.[^\s@]+$/.test(email);

}

/*

CREATE TRANSPORTER

Both OTP and custom emails use the SAME Gmail account.

*/

function createTransporter() {

return nodemailer.createTransport({

service: "gmail",  

auth: {  

  user:  
    process.env.EMAIL_USER,  

  pass:  
    process.env.EMAIL_PASS  

}

});

}

/*

CUSTOM EMAIL SENDER

*/

async function sendCustomEmail({

email,
subject,
title,
message,
details,
footerMessage

}) {

const logoUrl =
process.env.LOGO_URL;

const transporter =
createTransporter();

/*

OPTIONAL DETAILS CARD

*/

const detailsHtml =
details
? `

<table  
  width="100%"  
  cellpadding="0"  
  cellspacing="0"  
  border="0"  
  style="  
    width:100%;  
    margin-top:22px;  
    background:#FFFFFF;  
    border:1px solid #DCDCDC;  
    border-radius:18px;  
  "  
>  <tr>  <td  
  style="  
    padding:18px;  
    color:#212121;  
    font-size:14px;  
    line-height:1.65;  
  "  
>  ${textToHtml(details)}

</td>  </tr>  </table>  `
: "";

/*

OPTIONAL FOOTER MESSAGE

*/

const footerHtml =
footerMessage
? `

<div  
  style="  
    margin-top:22px;  
    color:#757575;  
    font-size:13px;  
    line-height:1.6;  
  "  
>  ${textToHtml(footerMessage)}

</div>  `
: "";

/*

SEND

*/

await transporter.sendMail({

from:  
  `"Appnetick" <${process.env.EMAIL_USER}>`,  

to:  
  email,  

subject:  
  subject,  

html: `

<!DOCTYPE html>  <html lang="en">  <head>  <meta charset="UTF-8">  <meta
name="viewport"
content="width=device-width, initial-scale=1.0"

> 

<meta
name="color-scheme"
content="light dark"

> 

<meta
name="supported-color-schemes"
content="light dark"

> 

<title>Appnetick</title>  </head>  <body  
  style="  
    margin:0;  
    padding:0;  
    width:100%;  
    background:#FFFFFF;  
    color:#212121;  
    font-family:  
      -apple-system,  
      BlinkMacSystemFont,  
      'Segoe UI',  
      Roboto,  
      Helvetica,  
      Arial,  
      sans-serif;  
  "  
>  <!-- =====================================================  
     OUTER WRAPPER  
===================================================== -->  <table  
  width="100%"  
  cellpadding="0"  
  cellspacing="0"  
  border="0"  
  style="  
    width:100%;  
    background:#FFFFFF;  
  "  
>  <tr>  <td  
  align="center"  
  style="  
    padding:28px 14px 40px;  
  "  
>  <!-- =====================================================  
     EMAIL CONTAINER  
===================================================== -->  <table  
  width="100%"  
  cellpadding="0"  
  cellspacing="0"  
  border="0"  
  style="  
    width:100%;  
    max-width:620px;  
  "  
>  <!-- =====================================================  
     TOP TOOLBAR  
===================================================== -->  <tr>  <td  
  style="  
    padding:0 0 18px 0;  
  "  
>  <table  
  width="100%"  
  cellpadding="0"  
  cellspacing="0"  
  border="0"  
  style="  
    width:100%;  
    height:62px;  
    background:#FFFFFF;  
    border:1px solid #DCDCDC;  
    border-radius:18px;  
  "  
>  <tr>  <td  
  valign="middle"  
  style="  
    padding:0 18px;  
  "  
>  <!-- LOGO -->  ${
logoUrl
? `

<img
src="${escapeHtml(logoUrl)}"
width="42"
height="42"
alt="Appnetick"
style="
display:block;
width:42px;
height:42px;
object-fit:contain;
border:0;
border-radius:12px;
"

> 

  :

<div  
  style="  
    width:42px;  
    height:42px;  
    line-height:42px;  
    text-align:center;  
    background:#2979FF;  
    border-radius:12px;  
    color:#FFFFFF;  
    font-size:20px;  
    font-weight:700;  
  "  
>  A

</div>  `
}

</td>  </tr>  </table>  </td>  </tr>  <!-- =====================================================  
     MAIN CARD  
===================================================== -->  <tr>  <td>  <table  
  width="100%"  
  cellpadding="0"  
  cellspacing="0"  
  border="0"  
  style="  
    width:100%;  
    background:#F7F7F7;  
    border:1px solid #DCDCDC;  
    border-radius:22px;  
  "  
>  <tr>  <td  
  style="  
    padding:30px 24px 28px;  
  "  
>  <!-- =====================================================  
     APPNETICK BADGE  
===================================================== -->  <table  
  cellpadding="0"  
  cellspacing="0"  
  border="0"  
>  <tr>  <td  
  style="  
    background:rgba(41,121,255,0.10);  
    border-radius:30px;  
    padding:8px 13px;  
    color:#2979FF;  
    font-size:13px;  
    font-weight:600;  
    line-height:1;  
  "  
>  Appnetick

</td>  </tr>  </table>  <!-- =====================================================  
     HEADING  
===================================================== -->  <div  
  style="  
    margin-top:20px;  
    color:#212121;  
    font-size:26px;  
    line-height:1.25;  
    font-weight:700;  
    letter-spacing:-0.7px;  
  "  
>  ${escapeHtml(title)}

</div>  <!-- =====================================================  
     MESSAGE  
===================================================== -->  <div  
  style="  
    margin-top:10px;  
    color:#757575;  
    font-size:14px;  
    line-height:1.65;  
  "  
>  ${textToHtml(message)}

</div>  <!-- =====================================================  
     DETAILS  
===================================================== -->  ${detailsHtml}

<!-- =====================================================  
     FOOTER MESSAGE  
===================================================== -->  ${footerHtml}

</td>  </tr>  </table>  </td>  </tr>  <!-- =====================================================  
     FOOTER  
===================================================== -->  <tr>  <td  
  align="center"  
  style="  
    padding:24px 12px 0;  
  "  
>  <div  
  style="  
    color:#9E9E9E;  
    font-size:12px;  
    line-height:1.6;  
  "  
>  Appnetick

</div>  <div  
  style="  
    margin-top:4px;  
    color:#9E9E9E;  
    font-size:11px;  
    line-height:1.6;  
  "  
>  This is an automated email from Appnetick.
Please do not reply to this message.

</div>  <div  
  style="  
    margin-top:10px;  
    color:#B0B0B0;  
    font-size:11px;  
    line-height:1.6;  
  "  
>  © ${new Date().getFullYear()} Appnetick

</div>  </td>  </tr>  </table>  <!-- END EMAIL CONTAINER -->  </td>  </tr>  </table>  <!-- END OUTER WRAPPER -->  </body>  </html>  `

});

}

/*

MAIN HANDLER

*/

export default async function handler(req, res) {

/*

METHOD

*/

if (req.method !== "POST") {

return res.status(405).json({  

  success:false,  

  message:  
    "POST only allowed"  

});

}

try {

/*  
========================================================  
REQUEST BODY  
========================================================  
*/  

const body =  
  req.body || {};  


/*  
========================================================  
EMAIL TYPE  
========================================================  
*/  

const emailType =  
  safeString(  
    body.type  
  )  
  .toLowerCase();  


/*  
========================================================  
CUSTOM EMAIL MODE  
========================================================  

This mode does NOT generate any OTP/code.  

Whatever page/backend calls this endpoint provides  
the complete email content.  

Example:  

{  
  "type":"custom",  
  "email":"user@gmail.com",  
  "subject":"Application received",  
  "title":"Verification application received",  
  "message":"Your application was received.",  
  "details":"Status code: 123456789012",  
  "footer_message":"Keep this code safe."  
}  

The sender decides what goes inside the email.  
========================================================  
*/  

if (  
  emailType === "custom"  
) {  


  /*  
  ------------------------------------------------------  
  ADMIN SECRET  
  ------------------------------------------------------  
  */  

  const adminSecret =  
    safeString(  
      body.admin_secret  
    );  


  const serverSecret =  
    safeString(  
      process.env.EMAIL_ADMIN_SECRET  
    );  


  if (  
    !serverSecret ||  
    !adminSecret ||  
    adminSecret !== serverSecret  
  ) {  

    return res.status(401).json({  

      success:false,  

      message:  
        "Unauthorized"  

    });  

  }  


  /*  
  ------------------------------------------------------  
  DATA  
  ------------------------------------------------------  
  */  

  const email =  
    safeString(  
      body.email  
    )  
    .toLowerCase();  


  const subject =  
    safeString(  
      body.subject  
    );  


  const title =  
    safeString(  
      body.title  
    );  


  const message =  
    safeString(  
      body.message  
    );  


  const details =  
    safeString(  
      body.details  
    );  


  const footerMessage =  
    safeString(  
      body.footer_message  
    );  


  /*  
  ------------------------------------------------------  
  VALIDATION  
  ------------------------------------------------------  
  */  

  if (!email) {  

    return res.status(400).json({  

      success:false,  

      message:  
        "Email is required"  

    });  

  }  


  if (!isValidEmail(email)) {  

    return res.status(400).json({  

      success:false,  

      message:  
        "Invalid email address"  

    });  

  }  


  if (!subject) {  

    return res.status(400).json({  

      success:false,  

      message:  
        "Subject is required"  

    });  

  }  


  if (!title) {  

    return res.status(400).json({  

      success:false,  

      message:  
        "Title is required"  

    });  

  }  


  if (!message) {  

    return res.status(400).json({  

      success:false,  

      message:  
        "Message is required"  

    });  

  }  


  /*  
  ------------------------------------------------------  
  SEND CUSTOM EMAIL  
  ------------------------------------------------------  
  */  

  await sendCustomEmail({  

    email,  

    subject,  

    title,  

    message,  

    details,  

    footerMessage  

  });  


  /*  
  ------------------------------------------------------  
  SUCCESS  
  ------------------------------------------------------  
  */  

  return res.status(200).json({  

    success:true,  

    message:  
      "Email sent successfully"  

  });  

}  


/*  
========================================================  
EXISTING OTP SYSTEM  
========================================================  

IMPORTANT:  

This branch remains the normal Appnetick OTP system.  

Existing request:  

POST /api/send-otp  

{  
  "email":"example@gmail.com"  
}  

========================================================  
*/  


const email =  
  safeString(  
    body.email  
  );  


if (!email) {  

  return res.status(400).json({  

    success:false,  

    message:  
      "Email is required"  

  });  

}  


/*  
--------------------------------------------------------  
NORMALIZE EMAIL  
--------------------------------------------------------  
*/  

const normalizedEmail =  
  email  
    .trim()  
    .toLowerCase();  


/*  
--------------------------------------------------------  
VALIDATE EMAIL  
--------------------------------------------------------  
*/  

if (  
  !isValidEmail(  
    normalizedEmail  
  )  
) {  

  return res.status(400).json({  

    success:false,  

    message:  
      "Invalid email address"  

  });  

}  


/*  
--------------------------------------------------------  
GENERATE 6-DIGIT OTP  
--------------------------------------------------------  
*/  

const otp =  
  Math.floor(  
    100000 +  
    Math.random() * 900000  
  )  
  .toString();  


/*  
--------------------------------------------------------  
REDIS KEY  
--------------------------------------------------------  
*/  

const redisKey =  
  `appnetick:otp:${normalizedEmail}`;  


/*  
--------------------------------------------------------  
SAVE OTP FOR 5 MINUTES  
--------------------------------------------------------  
*/  

await redis.set(  

  redisKey,  

  JSON.stringify({  

    otp:  
      otp,  

    attempts:  
      0,  

    createdAt:  
      Date.now()  

  }),  

  {  

    ex:  
      OTP_EXPIRY  

  }  

);  


/*  
--------------------------------------------------------  
LOGO  
--------------------------------------------------------  
*/  

const logoUrl =  
  process.env.LOGO_URL;  


/*  
--------------------------------------------------------  
TRANSPORTER  
--------------------------------------------------------  
*/  

const transporter =  
  createTransporter();  


/*  
========================================================  
EXISTING OTP EMAIL  
========================================================  
*/  

await transporter.sendMail({  

  from:  
    `"Appnetick" <${process.env.EMAIL_USER}>`,  

  to:  
    normalizedEmail,  

  subject:  
    "Your Appnetick verification code",  

  html: `

<!DOCTYPE html>  <html lang="en">  <head>  <meta charset="UTF-8">  <meta
name="viewport"
content="width=device-width, initial-scale=1.0"

> 

<meta
name="color-scheme"
content="light dark"

> 

<meta
name="supported-color-schemes"
content="light dark"

> 

<title>Appnetick Verification</title>  </head>  <body  
  style="  
    margin:0;  
    padding:0;  
    width:100%;  
    background:#FFFFFF;  
    color:#212121;  
    font-family:  
      -apple-system,  
      BlinkMacSystemFont,  
      'Segoe UI',  
      Roboto,  
      Helvetica,  
      Arial,  
      sans-serif;  
  "  
>  <table  
  width="100%"  
  cellpadding="0"  
  cellspacing="0"  
  border="0"  
  style="  
    width:100%;  
    background:#FFFFFF;  
  "  
>  <tr>  <td  
  align="center"  
  style="  
    padding:28px 14px 40px;  
  "  
>  <table  
  width="100%"  
  cellpadding="0"  
  cellspacing="0"  
  border="0"  
  style="  
    width:100%;  
    max-width:620px;  
  "  
>  <!-- TOOLBAR -->  <tr>  <td  
  style="  
    padding:0 0 18px 0;  
  "  
>  <table  
  width="100%"  
  cellpadding="0"  
  cellspacing="0"  
  border="0"  
  style="  
    width:100%;  
    height:62px;  
    background:#FFFFFF;  
    border:1px solid #DCDCDC;  
    border-radius:18px;  
  "  
>  <tr>  <td  
  valign="middle"  
  style="  
    padding:0 18px;  
  "  
>  ${
logoUrl
? `

<img
src="${escapeHtml(logoUrl)}"
width="42"
height="42"
alt="Appnetick"
style="
display:block;
width:42px;
height:42px;
object-fit:contain;
border:0;
border-radius:12px;
"

> 

  :

<div  
  style="  
    width:42px;  
    height:42px;  
    line-height:42px;  
    text-align:center;  
    background:#2979FF;  
    border-radius:12px;  
    color:#FFFFFF;  
    font-size:20px;  
    font-weight:700;  
  "  
>  
A  
</div>  `
}

</td>  </tr>  </table>  </td>  </tr>  <!-- MAIN CARD -->  <tr>  <td>  <table  
  width="100%"  
  cellpadding="0"  
  cellspacing="0"  
  border="0"  
  style="  
    width:100%;  
    background:#F7F7F7;  
    border:1px solid #DCDCDC;  
    border-radius:22px;  
  "  
>  <tr>  <td  
  style="  
    padding:30px 24px 28px;  
  "  
>  <!-- BADGE -->  <table  
  cellpadding="0"  
  cellspacing="0"  
  border="0"  
>  <tr>  <td  
  style="  
    background:rgba(41,121,255,0.10);  
    border-radius:30px;  
    padding:8px 13px;  
    color:#2979FF;  
    font-size:13px;  
    font-weight:600;  
    line-height:1;  
  "  
>  Email verification

</td>  </tr>  </table>  <!-- HEADING -->  <div  
  style="  
    margin-top:20px;  
    color:#212121;  
    font-size:26px;  
    line-height:1.25;  
    font-weight:700;  
    letter-spacing:-0.7px;  
  "  
>  Verify your email

</div>  <!-- DESCRIPTION -->  <div  
  style="  
    margin-top:10px;  
    color:#757575;  
    font-size:14px;  
    line-height:1.65;  
  "  
>  Use the verification code below to
continue with your Appnetick account.

</div>  <!-- OTP CARD -->  <table  
  width="100%"  
  cellpadding="0"  
  cellspacing="0"  
  border="0"  
  style="  
    width:100%;  
    margin-top:24px;  
    background:#FFFFFF;  
    border:1px solid #DCDCDC;  
    border-radius:18px;  
  "  
>  <tr>  <td  
  align="center"  
  style="  
    padding:25px 16px 23px;  
  "  
>  <div  
  style="  
    color:#757575;  
    font-size:12px;  
    line-height:1.4;  
    font-weight:500;  
    margin-bottom:8px;  
  "  
>  YOUR VERIFICATION CODE

</div>  <div  
  style="  
    color:#2979FF;  
    font-size:38px;  
    line-height:1.25;  
    font-weight:700;  
    letter-spacing:7px;  
    padding-left:7px;  
  "  
>  ${otp}

</div>  </td>  </tr>  </table>  <!-- EXPIRY -->  <table  
  width="100%"  
  cellpadding="0"  
  cellspacing="0"  
  border="0"  
  style="  
    margin-top:14px;  
  "  
>  <tr>  <td  
  style="  
    padding:0;  
  "  
>  <div  
  style="  
    color:#757575;  
    font-size:13px;  
    line-height:1.5;  
  "  
>  This code expires in
<strong style="color:#212121;">
5 minutes
</strong>.

</div>  </td>  </tr>  </table>  <!-- SECURITY CARD -->  <table  
  width="100%"  
  cellpadding="0"  
  cellspacing="0"  
  border="0"  
  style="  
    width:100%;  
    margin-top:22px;  
    background:#FFFFFF;  
    border:1px solid #DCDCDC;  
    border-radius:18px;  
  "  
>  <tr>  <td  
  style="  
    padding:17px 18px;  
  "  
>  <table  
  cellpadding="0"  
  cellspacing="0"  
  border="0"  
>  <tr>  <td  
  valign="top"  
  style="  
    width:34px;  
    padding-right:12px;  
  "  
>  <div  
  style="  
    width:32px;  
    height:32px;  
    line-height:32px;  
    text-align:center;  
    background:rgba(41,121,255,0.10);  
    border-radius:10px;  
    color:#2979FF;  
    font-size:15px;  
    font-weight:700;  
  "  
>  ✓

</div>  </td>  <td  
  valign="top"  
>  <div  
  style="  
    color:#212121;  
    font-size:14px;  
    line-height:1.45;  
    font-weight:600;  
    margin-bottom:3px;  
  "  
>  Keep your code private

</div>  <div  
  style="  
    color:#757575;  
    font-size:13px;  
    line-height:1.55;  
  "  
>  Appnetick will never ask you to share
your verification code with anyone.

</div>  </td>  </tr>  </table>  </td>  </tr>  </table>  <!-- NOT REQUESTED -->  <div  
  style="  
    margin-top:22px;  
    color:#757575;  
    font-size:13px;  
    line-height:1.6;  
  "  
>  If you did not request this code,
you can safely ignore this email.

</div>  </td>  </tr>  </table>  </td>  </tr>  <!-- FOOTER -->  <tr>  <td  
  align="center"  
  style="  
    padding:24px 12px 0;  
  "  
>  <div  
  style="  
    color:#9E9E9E;  
    font-size:12px;  
    line-height:1.6;  
  "  
>  Appnetick

</div>  <div  
  style="  
    margin-top:4px;  
    color:#9E9E9E;  
    font-size:11px;  
    line-height:1.6;  
  "  
>  This is an automated verification email.
Please do not reply to this message.

</div>  <div  
  style="  
    margin-top:10px;  
    color:#B0B0B0;  
    font-size:11px;  
    line-height:1.6;  
  "  
>  © ${new Date().getFullYear()} Appnetick

</div>  </td>  </tr>  </table>  </td>  </tr>  </table>  </body>  </html>  `  

});  


/*  
========================================================  
OTP SUCCESS  
========================================================  
*/  

return res.status(200).json({  

  success:true,  

  message:  
    "OTP sent successfully"  

});

} catch (error) {

console.error(  
  "Send OTP Error:",  
  error  
);  


return res.status(500).json({  

  success:false,  

  message:  
    "Failed to send email"  

});

}

}
