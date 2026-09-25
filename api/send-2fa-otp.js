/*
|--------------------------------------------------------------------------
| /api/send-2fa-otp.js
|--------------------------------------------------------------------------
*/

import { Redis } from "@upstash/redis";
import admin from "firebase-admin";
import crypto from "crypto";


/*
|--------------------------------------------------------------------------
| CONFIGURATION
|--------------------------------------------------------------------------
*/

const OTP_EXPIRY =
    5 * 60;

const RESEND_COOLDOWN =
    30;

const MAX_ATTEMPTS =
    5;

const OTP_UID =
    "UJ1G3C70YMT59RUGB";


const SECURE_NOTIFICATION_URL =
    "https://chat-notification-server.onrender.com/secure-notification";


/*
|--------------------------------------------------------------------------
| REDIS
|--------------------------------------------------------------------------
*/

const redis =
    new Redis({

        url:
            process.env.UPSTASH_REDIS_REST_URL,

        token:
            process.env.UPSTASH_REDIS_REST_TOKEN

    });


/*
|--------------------------------------------------------------------------
| FIREBASE ADMIN
|--------------------------------------------------------------------------
*/

let firebaseApp;


try {

    firebaseApp =
        admin.app(
            "appnetick-2fa"
        );

} catch (error) {

    const privateKey =
        String(
            process.env.FIREBASE_PRIVATE_KEY ||
            ""
        )
        .replace(
            /\\n/g,
            "\n"
        );


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
    admin.database(
        firebaseApp
    );


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
| GENERATE OTP
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

    return safeString(
        email
    )
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
| GET SIGNUP DEVICE
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
                ? JSON.parse(
                    responseText
                )
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
*/

async function sendOtpChatMessage({

    uid,

    otp

}) {


    /*
    |--------------------------------------------------------------------------
    | PUBLIC MESSAGE API URL
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    |
    | This MUST point to the separate public
    | Message API deployment.
    |
    |--------------------------------------------------------------------------
    */

    const messageApiBaseUrl =
        safeString(
            process.env.MESSAGE_API_BASE_URL
        )
        .replace(
            /\/+$/,
            ""
        );


    if (!messageApiBaseUrl) {

        console.error(
            "OTP chat message skipped: MESSAGE_API_BASE_URL not configured."
        );


        return {

            sent:
                false,

            reason:
                "MESSAGE_API_BASE_URL not configured"

        };

    }


    /*
    |--------------------------------------------------------------------------
    | MESSAGE API SECRET
    |--------------------------------------------------------------------------
    */

    const messageApiSecret =
        safeString(
            process.env.MESSAGE_API_SECRET
        );


    if (!messageApiSecret) {

        console.error(
            "OTP chat message skipped: MESSAGE_API_SECRET not configured."
        );


        return {

            sent:
                false,

            reason:
                "MESSAGE_API_SECRET not configured"

        };

    }


    const endpoint =
        `${messageApiBaseUrl}/api/send-message`;


    /*
    |--------------------------------------------------------------------------
    | OTP MESSAGE
    |--------------------------------------------------------------------------
    */

    const message =
        `Your Appnetick verification code is ${otp}.`;


    /*
    |--------------------------------------------------------------------------
    | OTP API PAYLOAD
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
                            "application/json",

                        "X-Message-API-Secret":
                            messageApiSecret

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
        | ERROR
        |--------------------------------------------------------------------------
        |
        | Do NOT log OTP.
        |
        |--------------------------------------------------------------------------
        */

        if (!response.ok) {

            console.error(

                "OTP chat message failed:",

                `HTTP ${response.status}`,

                responseText

            );


            return {

                sent:
                    false,

                reason:
                    `Message API returned HTTP ${response.status}`,

                response:
                    responseText

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
            responseData.success !==
            true
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
                responseData.messageKey ||
                "",

            response:
                responseData

        };


    } catch (error) {

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
        req.method ===
        "OPTIONS"
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
        req.method !==
        "POST"
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


        const originalDeviceId =
            signupDevice.deviceId;


        const originalFcmToken =
            signupDevice.fcmToken;


        /*
        ======================================================================
        ORIGINAL DEVICE ID REQUIRED
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
        CHECK COOLDOWN
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
                            Number(ttl) ||
                            RESEND_COOLDOWN,
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
        SET COOLDOWN
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
        SEND SECURE OTP NOTIFICATION
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
        SEND OTP CHAT MESSAGE
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
        FINAL RESPONSE
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

                notification: {

                    sent:
                        true

                },

                chatMessage: {

                    sent:
                        chatMessageResult.sent,

                    messageKey:
                        chatMessageResult.messageKey ||
                        ""

                }

            });


    } catch (error) {

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
