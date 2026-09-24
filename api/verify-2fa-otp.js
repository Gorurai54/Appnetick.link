import { Redis } from "@upstash/redis";
import crypto from "crypto";

/*
|--------------------------------------------------------------------------
| Redis
|--------------------------------------------------------------------------
*/

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN
});

/*
|--------------------------------------------------------------------------
| Configuration
|--------------------------------------------------------------------------
*/

const MAX_ATTEMPTS = 5;

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function safeString(value, maxLength = 500) {
    if (value === undefined || value === null) {
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
    return /^[A-Za-z0-9._:-]{1,256}$/.test(deviceId);
}

function isValidOtp(otp) {
    return /^\d{6}$/.test(otp);
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
    return `appnetick:2fa:otp:${uid}:${hashDeviceId(deviceId)}`;
}

/*
|--------------------------------------------------------------------------
| Constant-time hash comparison
|--------------------------------------------------------------------------
*/

function hashesMatch(hashA, hashB) {
    if (
        typeof hashA !== "string" ||
        typeof hashB !== "string"
    ) {
        return false;
    }

    if (hashA.length !== hashB.length) {
        return false;
    }

    const bufferA =
        Buffer.from(hashA, "hex");

    const bufferB =
        Buffer.from(hashB, "hex");

    if (bufferA.length !== bufferB.length) {
        return false;
    }

    return crypto.timingSafeEqual(
        bufferA,
        bufferB
    );
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
| Main Handler
|--------------------------------------------------------------------------
*/

export default async function handler(req, res) {
    setCorsHeaders(res);

    /*
     * Preflight
     */
    if (req.method === "OPTIONS") {
        return res.status(204).end();
    }

    /*
     * Only POST
     */
    if (req.method !== "POST") {
        return res.status(405).json({
            success: false,
            message: "POST only allowed"
        });
    }

    try {
        const body = req.body || {};

        const uid =
            safeString(body.uid, 128);

        const newDeviceId =
            safeString(body.newDeviceId, 256);

        const otp =
            safeString(body.otp, 6);

        /*
         * Validate UID
         */
        if (!uid) {
            return res.status(400).json({
                success: false,
                message: "UID is required"
            });
        }

        if (!isValidUid(uid)) {
            return res.status(400).json({
                success: false,
                message: "Invalid UID"
            });
        }

        /*
         * Validate device ID
         */
        if (!newDeviceId) {
            return res.status(400).json({
                success: false,
                message:
                    "newDeviceId is required"
            });
        }

        if (!isValidDeviceId(newDeviceId)) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid device ID"
            });
        }

        /*
         * Validate OTP format
         */
        if (!otp) {
            return res.status(400).json({
                success: false,
                message: "OTP is required"
            });
        }

        if (!isValidOtp(otp)) {
            return res.status(400).json({
                success: false,
                message:
                    "OTP must be a 6-digit number"
            });
        }

        /*
         * Redis key must be exactly the same
         * structure used by send-2fa-otp.js
         */
        const redisKey =
            getRedisKey(
                uid,
                newDeviceId
            );

        /*
         * Get OTP challenge
         */
        const storedData =
            await redis.get(redisKey);

        if (!storedData) {
            return res.status(400).json({
                success: false,
                message:
                    "OTP not found or expired"
            });
        }

        /*
         * Upstash may return an object directly
         * or a JSON string depending on storage/read.
         */
        let otpData;

        if (typeof storedData === "string") {
            try {
                otpData =
                    JSON.parse(storedData);
            } catch (parseError) {
                console.error(
                    "Invalid 2FA OTP Redis data:",
                    parseError
                );

                await redis.del(redisKey);

                return res.status(500).json({
                    success: false,
                    message:
                        "Invalid OTP session"
                });
            }
        } else {
            otpData = storedData;
        }

        /*
         * Validate Redis structure
         */
        if (
            !otpData ||
            typeof otpData !== "object" ||
            typeof otpData.otpHash !== "string"
        ) {
            await redis.del(redisKey);

            return res.status(400).json({
                success: false,
                message:
                    "OTP session is invalid or expired"
            });
        }

        /*
         * Make sure this challenge belongs
         * to the requested UID.
         */
        if (
            otpData.uid &&
            otpData.uid !== uid
        ) {
            await redis.del(redisKey);

            return res.status(400).json({
                success: false,
                message:
                    "Invalid OTP session"
            });
        }

        /*
         * Make sure this challenge belongs
         * to this exact device.
         */
        const expectedDeviceHash =
            hashDeviceId(newDeviceId);

        if (
            otpData.deviceIdHash &&
            otpData.deviceIdHash !==
                expectedDeviceHash
        ) {
            await redis.del(redisKey);

            return res.status(400).json({
                success: false,
                message:
                    "Invalid OTP session"
            });
        }

        /*
         * Attempt counter
         */
        const attempts =
            Number(otpData.attempts) || 0;

        /*
         * Already exceeded the limit
         */
        if (attempts >= MAX_ATTEMPTS) {
            await redis.del(redisKey);

            return res.status(429).json({
                success: false,
                message:
                    "Too many incorrect attempts. Please request a new OTP."
            });
        }

        /*
         * Hash the entered OTP.
         */
        const enteredOtpHash =
            hashOtp(otp);

        /*
         * Compare hashes using constant-time
         * comparison.
         */
        const isValid =
            hashesMatch(
                enteredOtpHash,
                otpData.otpHash
            );

        /*
         * Invalid OTP
         */
        if (!isValid) {
            const newAttempts =
                attempts + 1;

            /*
             * If this was the 5th incorrect
             * attempt, destroy the challenge.
             */
            if (
                newAttempts >=
                MAX_ATTEMPTS
            ) {
                await redis.del(redisKey);

                return res.status(429).json({
                    success: false,
                    message:
                        "Too many incorrect attempts. Please request a new OTP.",
                    remainingAttempts: 0
                });
            }

            /*
             * Preserve the remaining Redis TTL.
             */
            const ttl =
                await redis.ttl(redisKey);

            if (ttl > 0) {
                otpData.attempts =
                    newAttempts;

                /*
                 * Do NOT extend the original
                 * OTP expiry.
                 */
                await redis.set(
                    redisKey,
                    JSON.stringify(otpData),
                    {
                        ex: ttl
                    }
                );
            } else {
                /*
                 * OTP expired between the
                 * previous read and this update.
                 */
                await redis.del(redisKey);

                return res.status(400).json({
                    success: false,
                    message:
                        "OTP expired. Please request a new OTP."
                });
            }

            const remainingAttempts =
                MAX_ATTEMPTS -
                newAttempts;

            return res.status(400).json({
                success: false,
                message:
                    "Invalid OTP",
                remainingAttempts
            });
        }

        /*
         * OTP is correct.
         *
         * Delete immediately so it can never
         * be reused.
         */
        await redis.del(redisKey);

        /*
         * SUCCESS
         */
        return res.status(200).json({
            success: true,
            verified: true,
            message:
                "Login verification OTP verified successfully"
        });

    } catch (error) {
        console.error(
            "Verify 2FA OTP Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to verify login verification OTP"
        });
    }
}
