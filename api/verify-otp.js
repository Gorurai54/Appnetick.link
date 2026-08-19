import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN
});

const MAX_ATTEMPTS = 5;

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "POST only allowed"
    });
  }

  try {

    const { email, otp } = req.body || {};

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: "OTP is required"
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const enteredOtp = otp.toString().trim();

    /*
     * OTP must contain exactly 6 digits
     */
    if (!/^\d{6}$/.test(enteredOtp)) {

      return res.status(400).json({
        success: false,
        message: "OTP must be 6 digits"
      });

    }

    /*
     * Same Redis key used by send-otp
     */
    const redisKey = `appnetick:otp:${normalizedEmail}`;

    /*
     * Get OTP data
     */
    const storedData = await redis.get(redisKey);

    /*
     * OTP doesn't exist
     *
     * This also happens automatically
     * after the 5-minute expiration.
     */
    if (!storedData) {

      return res.status(400).json({
        success: false,
        message: "OTP not found or expired"
      });

    }

    /*
     * Redis may return an object or a JSON string
     */
    let otpData;

    if (typeof storedData === "string") {
      otpData = JSON.parse(storedData);
    } else {
      otpData = storedData;
    }

    /*
     * Check attempts
     */
    if (otpData.attempts >= MAX_ATTEMPTS) {

      await redis.del(redisKey);

      return res.status(429).json({
        success: false,
        message: "Too many incorrect attempts. Please request a new OTP."
      });

    }

    /*
     * Verify OTP
     */
    if (enteredOtp !== otpData.otp) {

      otpData.attempts =
        (otpData.attempts || 0) + 1;

      /*
       * Get remaining TTL.
       *
       * We don't reset the 5-minute expiration.
       */
      const ttl = await redis.ttl(redisKey);

      if (ttl > 0) {

        await redis.set(
          redisKey,
          JSON.stringify(otpData),
          {
            ex: ttl
          }
        );

      }

      const remainingAttempts =
        MAX_ATTEMPTS - otpData.attempts;

      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
        remainingAttempts: remainingAttempts
      });

    }

    /*
     * OTP is correct.
     *
     * Delete immediately so it cannot
     * be reused.
     */
    await redis.del(redisKey);

    /*
     * Verification successful
     */
    return res.status(200).json({
      success: true,
      verified: true,
      message: "OTP verified successfully"
    });

  } catch (error) {

    console.error("Verify OTP Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to verify OTP"
    });

  }
}
