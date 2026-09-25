// /api/send-2fa-otp.js

import { Redis } from "@upstash/redis";
import admin from "firebase-admin";
import crypto from "crypto";


/*
|--------------------------------------------------------------------------
| CONFIGURATION
|--------------------------------------------------------------------------
*/

const OTP_EXPIRY = 5 * 60; // 5 minutes

const RESEND_COOLDOWN = 30; // 30 seconds

const MAX_ATTEMPTS = 5;

const OTP_UID = "UJ1G3C70YMT59RUGB";

const SECURE_NOTIFICATION_URL =
    "https://chat-notification-server.onrender.com/secure-notification";


/*
|--------------------------------------------------------------------------
| REDIS
|--------------------------------------------------------------------------
*/

const redis = new Redis({

    url:
        process.env.UPSTASH_REDIS_REST_URL,

    token:
        process.env.UPSTASH_REDIS_REST_TOKEN

});


/*
|--------------------------------------------------------------------------
| FIREBASE ADMIN
|--------------------------------------------------------------------------
|
| This is the MAIN Appnetick Firebase project.
|
| It is NOT the appnetic1000 chat project.
|
|--------------------------------------------------------------------------
*/

let firebaseApp;

try {

    firebaseApp =
        admin.app("appnetick-2fa");

} catch (error) {

    const privateKey =
        String(
            process.env.FIREBASE_PRIVATE_KEY || ""
        )
        .replace(/\\n/g, "\n");


    firebaseApp =
        admin.initializeApp(
            {
                credential:
                    admin.credential.cert({

                        projectId:
                            process.env.FIREBASE_PROJECT_ID,

                        clientEmail:
                            process.env.FIREBASE_CLIENT_EMAIL,

                        privateKey:
                            privateKey

                    }),

                databaseURL:
                    process.env.FIREBASE_DATABASE_URL

            },
            "appnetick-2fa"
        );

}


const firebaseDb =
    admin.database(firebaseApp);


/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function safeString(value) {

    return String(
        value || ""
    ).trim();

}


/*
|--------------------------------------------------------------------------
| HASH OTP
|--------------------------------------------------------------------------
|
| Plain OTP is NEVER stored in Redis.
|
|--------------------------------------------------------------------------
*/

function hashOtp(otp) {

    return crypto
        .createHash("sha256")
        .update(
            String(otp)
        )
        .digest("hex");

}


/*
|--------------------------------------------------------------------------
| GENERATE SECURE OTP
|--------------------------------------------------------------------------
*/

function generateOtp() {

    return crypto
        .randomInt(
            100000,
            1000000
        )
        .toString();

}


/*
|--------------------------------------------------------------------------
| NORMALIZE EMAIL
|--------------------------------------------------------------------------
*/

function normalizeEmail(email) {

    return safeString(email)
        .toLowerCase();

}


/*
|--------------------------------------------------------------------------
| VALIDATE EMAIL
|--------------------------------------------------------------------------
*/

function isValidEmail(email) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(email);

}


/*
|--------------------------------------------------------------------------
| FIREBASE USER DEVICE INFORMATION
|--------------------------------------------------------------------------
*/

async function getSignupDevice(uid) {

    const snapshot =
        await firebaseDb
            .ref(
                `Users/${uid}/deviceInformation/signupDevice`
            )
            .once("value");


    const value =
        snapshot.val();


    if (
        !value ||
        typeof value !== "object"
    ) {

        return null;

    }


    return {

        deviceId:
            safeString(
                value.device_id
            ),

        fcmToken:
            safeString(
                value.fcmToken
            )

    };

}


/*
|--------------------------------------------------------------------------
| SEND SECURE LOGIN OTP NOTIFICATION
|--------------------------------------------------------------------------
|
| This is your EXISTING secure notification system.
|
|--------------------------------------------------------------------------
*/

async function sendSecureNotification({

    notificationToken,

    uid,

    newDeviceId,

    otp

}) {

    const payload = {

        notificationToken:
            notificationToken,

        notificationTitle:
            "Login Verification",

        notificationBody:
            "A login attempt was made from a new device. Enter the OTP to continue.",

        notificationType:
            "login_otp",

        notificationSubtext:
            "New device login verification",

        notificationUid:
            uid,

        notificationDeviceId:
            newDeviceId,

        otp:
            otp

    };


    const headers = {

        "Content-Type":
            "application/json"

    };


    /*
    |--------------------------------------------------------------------------
    | Optional secure secret
    |--------------------------------------------------------------------------
    */

    const secret =
        safeString(
            process.env.SECURE_NOTIFICATION_SECRET
        );


    if (secret) {

        headers[
            "x-secure-notification-secret"
        ] =
            secret;

    }


    const response =
        await fetch(
            SECURE_NOTIFICATION_URL,
            {

                method:
                    "POST",

                headers:
                    headers,

                body:
                    JSON.stringify(
                        payload
                    )

            }
        );


    const responseText =
        await response.text();


    if (!response.ok) {

        throw new Error(

            `Secure notification failed: HTTP ${response.status} ${responseText}`

        );

    }


    let responseData = {};

    try {

        responseData =
            responseText
                ? JSON.parse(responseText)
                : {};

    } catch (error) {

        responseData = {

            raw:
                responseText

        };

    }


    return responseData;

}


/*
|--------------------------------------------------------------------------
| SEND OTP AS NORMAL CHAT MESSAGE
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| This is intentionally SAFE.
|
| If this request fails, the actual 2FA OTP flow
| DOES NOT fail.
|
|--------------------------------------------------------------------------
*/

async function sendOtpChatMessage({

    uid,

    otp

}) {

    /*
    |--------------------------------------------------------------------------
    | Build this Vercel API's own URL
    |--------------------------------------------------------------------------
    */

    const appBaseUrl =
        safeString(
            process.env.APP_BASE_URL
        )
        .replace(/\/+$/, "");


    let endpoint = "";


    if (appBaseUrl) {

        endpoint =
            `${appBaseUrl}/api/send-message`;

    } else if (
        process.env.VERCEL_URL
    ) {

        endpoint =
            `https://${process.env.VERCEL_URL}/api/send-message`;

    }


    /*
    |--------------------------------------------------------------------------
    | If URL is not configured, simply skip chat message.
    |--------------------------------------------------------------------------
    */

    if (!endpoint) {

        console.error(
            "OTP chat message skipped: APP_BASE_URL / VERCEL_URL not configured."
        );

        return {

            sent:
                false,

            reason:
                "Message API URL not configured"

        };

    }


    /*
    |--------------------------------------------------------------------------
    | OTP message
    |--------------------------------------------------------------------------
    */

    const message =
        `Your Appnetick verification code is ${otp}.`;


    /*
    |--------------------------------------------------------------------------
    | IMPORTANT
    |--------------------------------------------------------------------------
    |
    | We do NOT send fromUid here.
    |
    | send-message.js automatically uses:
    |
    | UJ1G3C70YMT59RUGB
    |
    | when mode = otp.
    |
    |--------------------------------------------------------------------------
    */

    const payload = {

        mode:
            "otp",

        toUid:
            uid,

        message:
            message

    };


    try {

        const response =
            await fetch(
                endpoint,
                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json"

                    },

                    body:
                        JSON.stringify(
                            payload
                        )

                }
            );


        const responseText =
            await response.text();


        /*
        |--------------------------------------------------------------------------
        | DO NOT expose OTP in logs
        |--------------------------------------------------------------------------
        */

        if (!response.ok) {

            console.error(

                "OTP chat message failed:",
                `HTTP ${response.status}`

            );

            return {

                sent:
                    false,

                reason:
                    `Message API returned HTTP ${response.status}`

            };

        }


        let responseData = {};

        try {

            responseData =
                responseText
                    ? JSON.parse(
                        responseText
                    )
                    : {};

        } catch (error) {

            responseData = {};

        }


        if (
            responseData.success !== true
        ) {

            console.error(
                "OTP chat message API returned unsuccessful response."
            );

            return {

                sent:
                    false,

                reason:
                    "Message API returned unsuccessful response"

            };

        }


        return {

            sent:
                true,

            messageKey:
                responseData.messageKey || "",

            response:
                responseData

        };


    } catch (error) {

        /*
        |--------------------------------------------------------------------------
        | IMPORTANT
        |--------------------------------------------------------------------------
        |
        | Do NOT throw.
        |
        | OTP notification has already been / will be handled
        | independently.
        |
        |--------------------------------------------------------------------------
        */

        console.error(
            "OTP chat message request failed:",
            error.message
        );


        return {

            sent:
                false,

            reason:
                error.message

        };

    }

}


/*
|--------------------------------------------------------------------------
| MAIN HANDLER
|--------------------------------------------------------------------------
*/

export default async function handler(
    req,
    res
) {


    /*
    |--------------------------------------------------------------------------
    | CORS
    |--------------------------------------------------------------------------
    */

    res.setHeader(
        "Access-Control-Allow-Origin",
        "*"
    );

    res.setHeader(
        "Access-Control-Allow-Methods",
        "POST, OPTIONS"
    );

    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type"
    );

    res.setHeader(
        "Cache-Control",
        "no-store"
    );


    /*
    |--------------------------------------------------------------------------
    | OPTIONS
    |--------------------------------------------------------------------------
    */

    if (
        req.method === "OPTIONS"
    ) {

        return res
            .status(204)
            .end();

    }


    /*
    |--------------------------------------------------------------------------
    | POST ONLY
    |--------------------------------------------------------------------------
    */

    if (
        req.method !== "POST"
    ) {

        return res
            .status(405)
            .json({

                success:
                    false,

                message:
                    "POST only allowed"

            });

    }


    try {


        /*
        ======================================================================
        REQUEST BODY
        ======================================================================
        */

        const body =
            req.body || {};


        /*
        ======================================================================
        REQUIRED VALUES
        ======================================================================
        */

        const uid =
            safeString(
                body.uid
            );


        const newDeviceId =
            safeString(
                body.newDeviceId
            );


        /*
        ======================================================================
        VALIDATE UID
        ======================================================================
        */

        if (!uid) {

            return res
                .status(400)
                .json({

                    success:
                        false,

                    message:
                        "uid is required"

                });

        }


        /*
        ======================================================================
        VALIDATE NEW DEVICE
        ======================================================================
        */

        if (!newDeviceId) {

            return res
                .status(400)
                .json({

                    success:
                        false,

                    message:
                        "newDeviceId is required"

                });

        }


        /*
        ======================================================================
        GET ORIGINAL SIGNUP DEVICE
        ======================================================================
        */

        const signupDevice =
            await getSignupDevice(
                uid
            );


        if (!signupDevice) {

            return res
                .status(404)
                .json({

                    success:
                        false,

                    message:
                        "Original signup device information not found"

                });

        }


        /*
        ======================================================================
        ORIGINAL DEVICE ID
        ======================================================================
        */

        const originalDeviceId =
            signupDevice.deviceId;


        /*
        ======================================================================
        ORIGINAL FCM TOKEN
        ======================================================================
        */

        const originalFcmToken =
            signupDevice.fcmToken;


        /*
        ======================================================================
        CHECK ORIGINAL DEVICE ID
        ======================================================================
        */

        if (!originalDeviceId) {

            return res
                .status(404)
                .json({

                    success:
                        false,

                    message:
                        "Original signup device ID not found"

                });

        }


        /*
        ======================================================================
        NEW DEVICE MUST BE DIFFERENT
        ======================================================================
        */

        if (
            newDeviceId ===
            originalDeviceId
        ) {

            return res
                .status(400)
                .json({

                    success:
                        false,

                    message:
                        "Two-factor verification is not required on the original signup device"

                });

        }


        /*
        ======================================================================
        FCM TOKEN REQUIRED
        ======================================================================
        */

        if (!originalFcmToken) {

            return res
                .status(404)
                .json({

                    success:
                        false,

                    message:
                        "Original signup device FCM token not found"

                });

        }


        /*
        ======================================================================
        REDIS KEYS
        ======================================================================
        */

        const otpKey =
            `appnetick:2fa:otp:${uid}`;


        const cooldownKey =
            `appnetick:2fa:cooldown:${uid}`;


        /*
        ======================================================================
        CHECK RESEND COOLDOWN
        ======================================================================
        */

        const cooldownExists =
            await redis.exists(
                cooldownKey
            );


        if (cooldownExists) {

            const ttl =
                await redis.ttl(
                    cooldownKey
                );


            return res
                .status(429)
                .json({

                    success:
                        false,

                    message:
                        "Please wait before requesting another OTP",

                    retryAfter:
                        Math.max(
                            Number(ttl) || RESEND_COOLDOWN,
                            0
                        )

                });

        }


        /*
        ======================================================================
        GENERATE OTP
        ======================================================================
        */

        const otp =
            generateOtp();


        /*
        ======================================================================
        HASH OTP
        ======================================================================
        */

        const otpHash =
            hashOtp(
                otp
            );


        /*
        ======================================================================
        SAVE OTP HASH
        ======================================================================
        |
        | IMPORTANT:
        |
        | Plain OTP is NOT saved.
        |
        ======================================================================
        */

        await redis.set(

            otpKey,

            JSON.stringify({

                otpHash:
                    otpHash,

                attempts:
                    0,

                createdAt:
                    Date.now(),

                uid:
                    uid,

                deviceId:
                    newDeviceId

            }),

            {

                ex:
                    OTP_EXPIRY

            }

        );


        /*
        ======================================================================
        SET RESEND COOLDOWN
        ======================================================================
        */

        await redis.set(

            cooldownKey,

            "1",

            {

                ex:
                    RESEND_COOLDOWN

            }

        );


        /*
        ======================================================================
        SEND EXISTING SECURE NOTIFICATION
        ======================================================================
        */

        let secureNotificationResult;


        try {

            secureNotificationResult =
                await sendSecureNotification({

                    notificationToken:
                        originalFcmToken,

                    uid:
                        uid,

                    newDeviceId:
                        newDeviceId,

                    otp:
                        otp

                });


        } catch (
            notificationError
        ) {


            /*
            ==================================================================
            SECURE NOTIFICATION FAILED
            ==================================================================
            |
            | Since the user did NOT receive the OTP notification,
            | remove the OTP and cooldown.
            |
            ==================================================================
            */

            await redis.del(
                otpKey
            );

            await redis.del(
                cooldownKey
            );


            console.error(
                "Secure OTP notification failed:",
                notificationError.message
            );


            return res
                .status(500)
                .json({

                    success:
                        false,

                    message:
                        "Unable to send OTP notification"

                });

        }


        /*
        ======================================================================
        SEND OTP AS CHAT MESSAGE
        ======================================================================
        |
        | IMPORTANT:
        |
        | This is intentionally AFTER the secure notification.
        |
        | If chat message fails:
        |
        | - OTP notification still works
        | - Redis OTP still exists
        | - login verification still works
        |
        ======================================================================
        */

        const chatMessageResult =
            await sendOtpChatMessage({

                uid:
                    uid,

                otp:
                    otp

            });


        /*
        ======================================================================
        FINAL SUCCESS
        ======================================================================
        |
        | NEVER RETURN THE OTP.
        |
        ======================================================================
        */

        return res
            .status(200)
            .json({

                success:
                    true,

                message:
                    "OTP sent successfully",

                expiresIn:
                    OTP_EXPIRY,

                resendAfter:
                    RESEND_COOLDOWN,

                notification:
                    {

                        sent:
                            true

                    },

                chatMessage:
                    {

                        sent:
                            chatMessageResult.sent,

                        /*
                        | Message key is safe to return.
                        | OTP itself is never returned.
                        */
                        messageKey:
                            chatMessageResult.messageKey || ""

                    }

            });


    } catch (error) {


        /*
        ======================================================================
        UNEXPECTED ERROR
        ======================================================================
        */

        console.error(
            "SEND 2FA OTP ERROR:",
            error
        );


        return res
            .status(500)
            .json({

                success:
                    false,

                message:
                    "Internal server error"

            });

    }

}
