export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  try {
    // Extra protection for this sensitive endpoint
    const adminSecret = process.env.INFOBIP_PUSH_ADMIN_SECRET;

    if (!adminSecret) {
      return res.status(500).json({
        success: false,
        error: "INFOBIP_PUSH_ADMIN_SECRET is not configured"
      });
    }

    const requestSecret =
      req.headers["x-admin-secret"];

    if (!requestSecret || requestSecret !== adminSecret) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized"
      });
    }

    const apiKey = process.env.INFOBIP_API_KEY;
    const baseUrl = process.env.INFOBIP_BASE_URL;
    const firebasePrivateKeyJson =
      process.env.FIREBASE_PRIVATE_KEY_JSON;

    if (!apiKey || !baseUrl || !firebasePrivateKeyJson) {
      return res.status(500).json({
        success: false,
        error: "Required environment variables are missing"
      });
    }

    let firebaseJson;

    try {
      firebaseJson = JSON.parse(firebasePrivateKeyJson);
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: "FIREBASE_PRIVATE_KEY_JSON is not valid JSON"
      });
    }

    const name =
      String(
        (req.body && req.body.name) ||
        "Appnetick Android WebRTC Push"
      ).trim();

    if (!name) {
      return res.status(400).json({
        success: false,
        error: "Configuration name is required"
      });
    }

    // Re-stringify so Infobip receives valid JSON text
    const privateKeyJson =
      JSON.stringify(firebaseJson);

    const response = await fetch(
      `${baseUrl.replace(/\/+$/, "")}/webrtc/1/webrtc-push-config`,
      {
        method: "POST",
        headers: {
          "Authorization": `App ${apiKey}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          name: name,
          android: {
            privateKeyJson: privateKeyJson
          }
        })
      }
    );

    const data =
      await response.json().catch(() => null);

    if (!response.ok) {
      console.error(
        "Infobip push configuration creation failed:",
        response.status,
        data
      );

      return res.status(response.status).json({
        success: false,
        error: "Infobip push configuration creation failed",
        details: data
      });
    }

    console.log(
      "Infobip push configuration created:",
      data
    );

    return res.status(200).json({
      success: true,
      id: data && data.id ? data.id : null,
      name: data && data.name ? data.name : name,
      androidConfigured:
        data && typeof data.androidConfigured !== "undefined"
          ? data.androidConfigured
          : null,
      data: data
    });

  } catch (error) {
    console.error(
      "Create Infobip push configuration error:",
      error
    );

    return res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
      }
