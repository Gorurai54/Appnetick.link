import { Redis } from "@upstash/redis";
import admin from "firebase-admin";
import crypto from "crypto";

/*
|--------------------------------------------------------------------------
| Configuration
|--------------------------------------------------------------------------
*/

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN
});

const OTP_EXPIRY = 5 * 60; // 5 minutes
const RESEND_COOLDOWN = 30; // 30 seconds
const OTP_MAX_ATTEMPTS = 5;

/*
|--------------------------------------------------------------------------
| Firebase Admin Configuration
|--------------------------------------------------------------------------
*/

const FIREBASE_PROJECT_ID =
    process.env.FIREBASE_PROJECT_ID;

const FIREBASE_CLIENT_EMAIL =
    process.env.FIREBASE_CLIENT_EMAIL;

const FIREBASE_PRIVATE_KEY =
    process.env.FIREBASE_PRIVATE_KEY;

const FIREBASE_DATABASE_URL =
    process.env.FIREBASE_DATABASE_URL;

/*
|--------------------------------------------------------------------------
| Validate Firebase Environment Variables
|--------------------------------------------------------------------------
*/

if (
    !FIREBASE_PROJECT_ID ||
    !FIREBASE_CLIENT_EMAIL ||
    !FIREBASE_PRIVATE_KEY ||
    !FIREBASE_DATABASE_URL
) {
    throw new Error(
        "Missing Firebase Admin environment variables"
    );
}

/*
|--------------------------------------------------------------------------
| Debug Logs
|--------------------------------------------------------------------------
*/

console.log(
    "Firebase Project:",
    FIREBASE_PROJECT_ID
);

console.log(
    "Firebase Client Email exists:",
    !!FIREBASE_CLIENT_EMAIL
);

console.log(
    "Firebase Private Key exists:",
    !!FIREBASE_PRIVATE_KEY
);

console.log(
    "Firebase Database URL:",
    FIREBASE_DATABASE_URL
);

/*
|--------------------------------------------------------------------------
| Firebase Admin Initialization
|--------------------------------------------------------------------------
|
| IMPORTANT:
| We use the DEFAULT Firebase Admin app here.
|
| This avoids the problem where a previously-created
| named app exists without databaseURL.
|
*/

let firebaseApp;

/*
 * Find default Firebase Admin app.
 */
try {
    firebaseApp = admin.app();

    console.log(
        "Existing default Firebase Admin app found."
    );

    /*
     * If the existing app does not have the expected
     * database URL, log it for debugging.
     */
    console.log(
        "Existing Firebase Database URL:",
        firebaseApp.options?.databaseURL
    );

} catch (_) {

    /*
     * No default Firebase Admin app exists.
     * Create one with databaseURL explicitly supplied.
     */

    firebaseApp = admin.initializeApp({
        credential: admin.credential.cert({
            projectId:
                FIREBASE_PROJECT_ID,

            clientEmail:
                FIREBASE_CLIENT_EMAIL,

            privateKey:
                FIREBASE_PRIVATE_KEY.replace(
                    /\\n/g,
                    "\n"
                )
        }),

        databaseURL:
            FIREBASE_DATABASE_URL
    });

    console.log(
        "Firebase Admin default app initialized."
    );
}

/*
|--------------------------------------------------------------------------
| Firebase Database
|--------------------------------------------------------------------------
*/

const firebaseDb =
    admin.database(firebaseApp);

/*
|--------------------------------------------------------------------------
| Existing secure notification server
|--------------------------------------------------------------------------
*/

const SECURE_NOTIFICATION_URL =
    process.env.SECURE_NOTIFICATION_URL ||
    "https://chat-notification-server.onrender.com/secure-notification";

/*
|--------------------------------------------------------------------------
| Optional internal secret
|--------------------------------------------------------------------------
*/

const SECURE_NOTIFICATION_SECRET =
    process.env.SECURE_NOTIFICATION_SECRET || "";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function safeString(value, maxLength = 500) {

    if (
        value === undefined ||
        value === null
    ) {
        return "";
    }

    return String(value)
        .trim()
        .slice(0, maxLength);
}

function isValidUid(uid) {

    return /^[A-Za-z0-9_-]{1,128}$/.test(uid);
}

function isValidDeviceId(deviceId) {

    return /^[A-Za-z0-9._:-]{1,256}$/.test(
        deviceId
    );
}

function hashOtp(otp) {

    return crypto
        .createHash("sha256")
        .update(otp)
        .digest("hex");
}

function hashDeviceId(deviceId) {

    return crypto
        .createHash("sha256")
        .update(deviceId)
        .digest("hex");
}

function getRedisKey(uid, deviceId) {

    return (
        `appnetick:2fa:otp:${uid}:${hashDeviceId(deviceId)}`
    );
}

function getCooldownKey(uid, deviceId) {

    return (
        `appnetick:2fa:otp:cooldown:${uid}:${hashDeviceId(deviceId)}`
    );
}

function generateOtp() {

    return String(
        crypto.randomInt(
            100000,
            1000000
        )
    );
}

function normalizeFirebaseValue(value) {

    if (typeof value === "string") {
        return value.trim();
    }

    return value;
}

/*
|--------------------------------------------------------------------------
| CORS
|--------------------------------------------------------------------------
*/

function setCorsHeaders(res) {

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
        "Content-Type, Authorization"
    );

    res.setHeader(
        "Cache-Control",
        "no-store"
    );
}

/*
|--------------------------------------------------------------------------
| Get Original Signup Device
|--------------------------------------------------------------------------
*/

async function getSignupDevice(uid) {

    const snapshot =
        await firebaseDb
            .ref("Users")
            .child(uid)
            .child("deviceInformation")
            .child("signupDevice")
            .once("value");

    if (!snapshot.exists()) {
        return null;
    }

    const data = snapshot.val();

    if (
        !data ||
        typeof data !== "object"
    ) {
        return null;
    }

    const originalDeviceId =
        normalizeFirebaseValue(
            data.device_id
        );

    const fcmToken =
        normalizeFirebaseValue(
            data.fcmToken
        );

    return {
        deviceId:
            originalDeviceId || "",

        fcmToken:
            fcmToken || ""
    };
}

/*
|--------------------------------------------------------------------------
| Send FCM Notification
|--------------------------------------------------------------------------
*/

async function sendSecureNotification({
    notificationToken,
    uid,
    newDeviceId,
    otp
}) {

    const notificationBody = {

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

        otp
    };

    const headers = {
        "Content-Type":
            "application/json"
    };

    /*
     * Send internal secret if configured.
     */
    if (SECURE_NOTIFICATION_SECRET) {

        headers["x-internal-secret"] =
            SECURE_NOTIFICATION_SECRET;
    }

    const response =
        await fetch(
            SECURE_NOTIFICATION_URL,
            {
                method: "POST",

                headers,

                body:
                    JSON.stringify(
                        notificationBody
                    )
            }
        );

    let responseData = null;

    try {

        responseData =
            await response.json();

    } catch (_) {

        responseData = null;
    }

    if (!response.ok) {

        const errorMessage =
            responseData?.error ||
            responseData?.message ||
            `Notification server returned HTTP ${response.status}`;

        throw new Error(
            errorMessage
        );
    }

    if (
        !responseData ||
        responseData.success !== true
    ) {

        throw new Error(
            responseData?.error ||
            responseData?.message ||
            "Notification server rejected the request"
        );
    }

    return responseData;
}

/*
|--------------------------------------------------------------------------
| Main Handler
|--------------------------------------------------------------------------
*/

export default async function handler(
    req,
    res
) {

    setCorsHeaders(res);

    /*
     * OPTIONS / CORS preflight
     */
    if (req.method === "OPTIONS") {

        return res
            .status(204)
            .end();
    }

    /*
     * Only POST
     */
    if (req.method !== "POST") {

        return res
            .status(405)
            .json({
                success: false,
                message:
                    "POST only allowed"
            });
    }

    try {

        /*
         * Parse request body
         */
        const body =
            req.body || {};

        const uid =
            safeString(
                body.uid,
                128
            );

        const newDeviceId =
            safeString(
                body.newDeviceId,
                256
            );

        /*
         * Validate UID
         */
        if (!uid) {

            return res
                .status(400)
                .json({
                    success: false,
                    message:
                        "UID is required"
                });
        }

        if (!isValidUid(uid)) {

            return res
                .status(400)
                .json({
                    success: false,
                    message:
                        "Invalid UID"
                });
        }

        /*
         * Validate device ID
         */
        if (!newDeviceId) {

            return res
                .status(400)
                .json({
                    success: false,
                    message:
                        "newDeviceId is required"
                });
        }

        if (
            !isValidDeviceId(
                newDeviceId
            )
        ) {

            return res
                .status(400)
                .json({
                    success: false,
                    message:
                        "Invalid device ID"
                });
        }

        /*
         * Redis keys
         */
        const redisKey =
            getRedisKey(
                uid,
                newDeviceId
            );

        const cooldownKey =
            getCooldownKey(
                uid,
                newDeviceId
            );

        /*
         * Check resend cooldown
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
                    success: false,

                    message:
                        "Please wait before requesting another OTP.",

                    retryAfter:
                        ttl > 0
                            ? ttl
                            : RESEND_COOLDOWN
                });
        }

        /*
         * Get original signup device
         *
         * IMPORTANT:
         * FCM token is never accepted from
         * the Android client.
         */
        const signupDevice =
            await getSignupDevice(
                uid
            );

        if (!signupDevice) {

            return res
                .status(404)
                .json({
                    success: false,

                    message:
                        "Original signup device not found"
                });
        }

        const originalDeviceId =
            signupDevice.deviceId;

        const originalFcmToken =
            signupDevice.fcmToken;

        /*
         * Validate original device ID
         */
        if (!originalDeviceId) {

            console.error(
                "2FA OTP: Original device ID missing",
                {
                    uid
                }
            );

            return res
                .status(404)
                .json({
                    success: false,

                    message:
                        "Original signup device ID not found"
                });
        }

        /*
         * Validate original FCM token
         */
        if (!originalFcmToken) {

            console.error(
                "2FA OTP: Original FCM token missing",
                {
                    uid,
                    originalDeviceId
                }
            );

            return res
                .status(404)
                .json({
                    success: false,

                    message:
                        "Original device notification token not found"
                });
        }

        /*
         * Do not send new-device OTP to
         * the original signup device.
         */
        if (
            newDeviceId ===
            originalDeviceId
        ) {

            return res
                .status(400)
                .json({
                    success: false,

                    message:
                        "This device is already the original signup device"
                });
        }

        /*
         * Generate secure OTP
         */
        const otp =
            generateOtp();

        /*
         * Store only OTP hash.
         */
        const otpHash =
            hashOtp(otp);

        const otpData = {

            otpHash,

            uid,

            deviceIdHash:
                hashDeviceId(
                    newDeviceId
                ),

            attempts: 0,

            createdAt:
                Date.now()
        };

        /*
         * Save OTP
         */
        await redis.set(
            redisKey,
            JSON.stringify(
                otpData
            ),
            {
                ex: OTP_EXPIRY
            }
        );

        /*
         * Resend cooldown
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
         * Send OTP to original device
         */
        try {

            await sendSecureNotification({

                notificationToken:
                    originalFcmToken,

                uid,

                newDeviceId,

                otp
            });

        } catch (
            notificationError
        ) {

            /*
             * Notification failed.
             *
             * Remove OTP and cooldown so
             * the user can retry.
             */
            await redis.del(
                redisKey
            );

            await redis.del(
                cooldownKey
            );

            console.error(
                "2FA OTP notification failed:",
                notificationError
            );

            return res
                .status(502)
                .json({
                    success: false,

                    message:
                        "Failed to send login verification OTP"
                });
        }

        /*
         * SUCCESS
         *
         * Never return the OTP.
         */
        return res
            .status(200)
            .json({

                success: true,

                message:
                    "Login verification OTP sent successfully",

                expiresIn:
                    OTP_EXPIRY,

                retryAfter:
                    RESEND_COOLDOWN
            });

    } catch (error) {

        console.error(
            "Send 2FA OTP Error:",
            error
        );

        return res
            .status(500)
            .json({

                success: false,

                message:
                    "Failed to send login verification OTP"
            });
    }
}
