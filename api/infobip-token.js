export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  try {
    const body = req.body || {};

    const identity = String(body.identity || "").trim();
    const displayName = String(
      body.displayName || identity
    ).trim();

    if (!identity) {
      return res.status(400).json({
        success: false,
        error: "identity is required"
      });
    }

    // Keep identities predictable and safe.
    if (!/^[A-Za-z0-9_-]{1,64}$/.test(identity)) {
      return res.status(400).json({
        success: false,
        error: "Invalid identity"
      });
    }

    const apiKey = process.env.INFOBIP_API_KEY;
    const baseUrl = process.env.INFOBIP_BASE_URL;

    if (!apiKey || !baseUrl) {
      console.error("Infobip environment variables are missing");

      return res.status(500).json({
        success: false,
        error: "Infobip server configuration is missing"
      });
    }

    const response = await fetch(
      `${baseUrl.replace(/\/+$/, "")}/webrtc/1/token`,
      {
        method: "POST",
        headers: {
          "Authorization": `App ${apiKey}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          identity: identity,
          displayName: displayName
        })
      }
    );

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      console.error(
        "Infobip token request failed:",
        response.status,
        data
      );

      return res.status(response.status).json({
        success: false,
        error: "Infobip token request failed",
        details: data
      });
    }

    if (!data || !data.token) {
      console.error("Infobip returned no token:", data);

      return res.status(502).json({
        success: false,
        error: "Infobip did not return a token"
      });
    }

    return res.status(200).json({
      success: true,
      token: data.token,
      expirationTime: data.expirationTime || null
    });

  } catch (error) {
    console.error("Infobip token API error:", error);

    return res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
}
