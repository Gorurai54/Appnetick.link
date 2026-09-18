// https://appnetick-link.vercel.app/api/send-otp.js

import { Redis } from "@upstash/redis";
import nodemailer from "nodemailer";

/*
============================================================
REDIS
============================================================
*/

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN
});

const OTP_EXPIRY = 5 * 60;


/*
============================================================
HELPERS
============================================================
*/

function safeString(value) {
    return String(value || "").trim();
}


/*
============================================================
HTML ESCAPE
============================================================
*/

function escapeHtml(value) {
    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/*
============================================================
TEXT TO HTML
============================================================
*/

function textToHtml(value) {
    return escapeHtml(value)
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .replace(/\n/g, "<br>");
}


/*
============================================================
EMAIL VALIDATION
============================================================
*/

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}


/*
============================================================
TRANSPORTER
============================================================
*/

function createTransporter() {
    return nodemailer.createTransport({
        service: "gmail",

        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
}


/*
============================================================
COMMON EMAIL UI
============================================================
*/

function createEmailLayout({
    logoUrl,
    content
}) {

    return `

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
    content="dark"
>

<meta
    name="supported-color-schemes"
    content="dark"
>

<title>Appnetick</title>

</head>


<body

style="
    margin:0;
    padding:0;
    width:100%;
    background:#111111;
    color:#FFFFFF;
    font-family:
        -apple-system,
        BlinkMacSystemFont,
        'Segoe UI',
        Roboto,
        Helvetica,
        Arial,
        sans-serif;
"

>


<table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="
        width:100%;
        background:#111111;
    "
>

<tr>

<td
    align="center"
    style="
        padding:45px 20px 50px;
    "
>


<table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="
        width:100%;
        max-width:600px;
    "
>


<!-- =====================================================
     LOGO
===================================================== -->

<tr>

<td
    align="left"
    style="
        padding-bottom:55px;
    "
>

${
    logoUrl

    ?

`
<img

src="${escapeHtml(logoUrl)}"

alt="Appnetick"

style="
    display:block;
    max-width:270px;
    width:auto;
    height:auto;
    border:0;
"

>
`

    :

`
<div

style="
    display:inline-block;
    background:#FFFFFF;
    color:#000000;
    padding:10px 14px;
    font-size:31px;
    line-height:1;
    font-weight:700;
    letter-spacing:-1.5px;
"

>
Appnetick
</div>
`

}

</td>

</tr>


<!-- =====================================================
     CONTENT
===================================================== -->

<tr>

<td

style="
    color:#FFFFFF;
    font-size:16px;
    line-height:1.65;
"

>

${content}

</td>

</tr>


<!-- =====================================================
     FOOTER
===================================================== -->

<tr>

<td

style="
    padding-top:55px;
    color:#A0A0A0;
    font-size:13px;
    line-height:1.6;
"

>

Best,<br>

Appnetick

<br><br>

This is an automated email.
Please do not reply to this message.

<br><br>

© ${new Date().getFullYear()} Appnetick

</td>

</tr>


</table>

</td>

</tr>

</table>


</body>

</html>

`;

}


/*
============================================================
CUSTOM EMAIL SENDER
============================================================

Separate from OTP system.

- No OTP
- No Redis
- Existing OTP flow unaffected
============================================================
*/

async function sendCustomEmail({
    email,
    subject,
    title,
    message,
    details,
    footerMessage
}) {

    const transporter = createTransporter();

    const logoUrl = process.env.LOGO_URL;


    /*
    --------------------------------------------------------
    DETAILS
    --------------------------------------------------------
    */

    let detailsHtml = "";

    if (details) {

        detailsHtml = `

<div

style="
    margin-top:30px;
    color:#FFFFFF;
    font-size:15px;
    line-height:1.7;
"

>

${textToHtml(details)}

</div>

`;

    }


    /*
    --------------------------------------------------------
    FOOTER MESSAGE
    --------------------------------------------------------
    */

    let footerHtml = "";

    if (footerMessage) {

        footerHtml = `

<div

style="
    margin-top:30px;
    color:#A0A0A0;
    font-size:14px;
    line-height:1.65;
"

>

${textToHtml(footerMessage)}

</div>

`;

    }


    /*
    --------------------------------------------------------
    CUSTOM EMAIL CONTENT
    --------------------------------------------------------
    */

    const content = `

<div

style="
    color:#FFFFFF;
    font-size:16px;
    line-height:1.65;
"

>

Hello,

</div>


<div

style="
    margin-top:28px;
    color:#FFFFFF;
    font-size:25px;
    line-height:1.3;
    font-weight:600;
    letter-spacing:-0.5px;
"

>

${escapeHtml(title)}

</div>


<div

style="
    margin-top:18px;
    color:#FFFFFF;
    font-size:16px;
    line-height:1.7;
"

>

${textToHtml(message)}

</div>

${detailsHtml}

${footerHtml}

`;


    /*
    --------------------------------------------------------
    SEND
    --------------------------------------------------------
    */

    await transporter.sendMail({

        from:
            `"Appnetick" <${process.env.EMAIL_USER}>`,

        to:
            email,

        subject:
            subject,

        html:
            createEmailLayout({

                logoUrl:
                    logoUrl,

                content:
                    content

            }),

        text:
            [
                "Hello,",
                "",
                title,
                "",
                message,
                details || "",
                footerMessage || ""
            ]
            .filter(Boolean)
            .join("\n\n")

    });

}


/*
============================================================
MAIN HANDLER
============================================================
*/

export default async function handler(req, res) {


    /*
    --------------------------------------------------------
    METHOD
    --------------------------------------------------------
    */

    if (req.method !== "POST") {

        return res.status(405).json({

            success: false,

            message:
                "POST only allowed"

        });

    }


    try {


        /*
        ====================================================
        REQUEST BODY
        ====================================================
        */

        const body =
            req.body || {};


        /*
        ====================================================
        EMAIL TYPE
        ====================================================
        */

        const emailType =
            safeString(
                body.type
            ).toLowerCase();


        /*
        ====================================================
        CUSTOM EMAIL
        ====================================================
        */

        if (
            emailType === "custom"
        ) {


            /*
            ------------------------------------------------
            ADMIN SECRET
            ------------------------------------------------
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

                    success: false,

                    message:
                        "Unauthorized"

                });

            }


            /*
            ------------------------------------------------
            EMAIL
            ------------------------------------------------
            */

            const email =
                safeString(
                    body.email
                )
                .toLowerCase();


            /*
            ------------------------------------------------
            SUBJECT
            ------------------------------------------------
            */

            const subject =
                safeString(
                    body.subject
                );


            /*
            ------------------------------------------------
            TITLE
            ------------------------------------------------
            */

            const title =
                safeString(
                    body.title
                );


            /*
            ------------------------------------------------
            MESSAGE
            ------------------------------------------------
            */

            const message =
                safeString(
                    body.message
                );


            /*
            ------------------------------------------------
            DETAILS
            ------------------------------------------------
            */

            const details =
                safeString(
                    body.details
                );


            /*
            ------------------------------------------------
            FOOTER
            ------------------------------------------------
            */

            const footerMessage =
                safeString(
                    body.footer_message
                );


            /*
            ------------------------------------------------
            VALIDATE EMAIL
            ------------------------------------------------
            */

            if (!email) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Email is required"

                });

            }


            if (
                !isValidEmail(email)
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid email address"

                });

            }


            /*
            ------------------------------------------------
            VALIDATE SUBJECT
            ------------------------------------------------
            */

            if (!subject) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Subject is required"

                });

            }


            /*
            ------------------------------------------------
            VALIDATE TITLE
            ------------------------------------------------
            */

            if (!title) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Title is required"

                });

            }


            /*
            ------------------------------------------------
            VALIDATE MESSAGE
            ------------------------------------------------
            */

            if (!message) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Message is required"

                });

            }


            /*
            ------------------------------------------------
            SEND CUSTOM EMAIL
            ------------------------------------------------
            */

            await sendCustomEmail({

                email:
                    email,

                subject:
                    subject,

                title:
                    title,

                message:
                    message,

                details:
                    details,

                footerMessage:
                    footerMessage

            });


            /*
            ------------------------------------------------
            SUCCESS
            ------------------------------------------------
            */

            return res.status(200).json({

                success: true,

                message:
                    "Custom email sent successfully"

            });

        }


        /*
        ====================================================
        EXISTING OTP SYSTEM
        ====================================================
        */


        const email =
            safeString(
                body.email
            );


        if (!email) {

            return res.status(400).json({

                success: false,

                message:
                    "Email is required"

            });

        }


        /*
        ----------------------------------------------------
        NORMALIZE EMAIL
        ----------------------------------------------------
        */

        const normalizedEmail =
            email
                .trim()
                .toLowerCase();


        /*
        ----------------------------------------------------
        VALIDATE
        ----------------------------------------------------
        */

        if (
            !isValidEmail(
                normalizedEmail
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid email address"

            });

        }


        /*
        ----------------------------------------------------
        GENERATE OTP
        ----------------------------------------------------
        */

        const otp =
            Math.floor(
                100000 +
                Math.random() * 900000
            )
            .toString();


        /*
        ----------------------------------------------------
        REDIS KEY
        ----------------------------------------------------
        */

        const redisKey =
            `appnetick:otp:${normalizedEmail}`;


        /*
        ----------------------------------------------------
        SAVE OTP
        ----------------------------------------------------
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
        ----------------------------------------------------
        LOGO
        ----------------------------------------------------
        */

        const logoUrl =
            process.env.LOGO_URL;


        /*
        ----------------------------------------------------
        TRANSPORTER
        ----------------------------------------------------
        */

        const transporter =
            createTransporter();


        /*
        ====================================================
        OTP EMAIL
        ====================================================
        */

        const otpContent = `

<div

style="
    color:#FFFFFF;
    font-size:16px;
    line-height:1.65;
"

>

Hello,

</div>


<div

style="
    margin-top:28px;
    color:#FFFFFF;
    font-size:25px;
    line-height:1.3;
    font-weight:600;
    letter-spacing:-0.5px;
"

>

Verify your email

</div>


<div

style="
    margin-top:18px;
    color:#FFFFFF;
    font-size:16px;
    line-height:1.7;
"

>

We noticed a request to verify your Appnetick account.

</div>


<div

style="
    margin-top:30px;
    color:#FFFFFF;
    font-size:16px;
    line-height:1.6;
"

>

Your verification code is:

</div>


<div

style="
    margin-top:18px;
    color:#FFFFFF;
    font-size:36px;
    line-height:1.2;
    font-weight:700;
    letter-spacing:7px;
"

>

${otp}

</div>


<div

style="
    margin-top:25px;
    color:#A0A0A0;
    font-size:14px;
    line-height:1.6;
"

>

This code expires in 5 minutes.

</div>


<div

style="
    margin-top:30px;
    color:#A0A0A0;
    font-size:14px;
    line-height:1.65;
"

>

If you did not request this code,
you can safely ignore this email.

</div>

`;


        /*
        ----------------------------------------------------
        SEND OTP EMAIL
        ----------------------------------------------------
        */

        await transporter.sendMail({

            from:
                `"Appnetick" <${process.env.EMAIL_USER}>`,

            to:
                normalizedEmail,

            subject:
                "Your Appnetick verification code",

            html:
                createEmailLayout({

                    logoUrl:
                        logoUrl,

                    content:
                        otpContent

                }),

            text:
                [
                    "Hello,",
                    "",
                    "Verify your email",
                    "",
                    "We noticed a request to verify your Appnetick account.",
                    "",
                    `Your verification code is: ${otp}`,
                    "",
                    "This code expires in 5 minutes.",
                    "",
                    "If you did not request this code, you can safely ignore this email."
                ]
                .join("\n\n")

        });


        /*
        ====================================================
        OTP SUCCESS
        ====================================================
        */

        return res.status(200).json({

            success: true,

            message:
                "OTP sent successfully"

        });


    } catch (error) {


        /*
        ====================================================
        ERROR
        ====================================================
        */

        console.error(
            "Send OTP Error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to send email"

        });

    }

}
