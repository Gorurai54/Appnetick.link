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

    if (!/^[A-Za-z0-9_-]{1,64}$/.test(identity)) {
      return res.status(400).json({
        success: false,
        error: "Invalid identity"
      });
    }

    const apiKey = process.env.INFOBIP_API_KEY;
    const baseUrl = process.env.INFOBIP_BASE_URL;

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: "INFOBIP_API_KEY is missing"
      });
    }

    if (!baseUrl) {
      return res.status(500).json({
        success: false,
        error: "INFOBIP_BASE_URL is missing"
      });
    }

    const endpoint =
      `${baseUrl.replace(/\/+$/, "")}/webrtc/1/token`;

    console.log("Infobip endpoint:", endpoint);
    console.log("Identity:", identity);

    const response = await fetch(endpoint, {

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
    });

    const responseText = await response.text();

    console.log(
      "Infobip HTTP status:",
      response.status
    );

    console.log(
      "Infobip response:",
      responseText
    );

    let data;

    try {
      data = JSON.parse(responseText);
    } catch (e) {
      data = {
        raw: responseText
      };
    }

    if (!response.ok) {

      return res.status(502).json({
        success: false,
        error: "Infobip rejected the request",
        infobipStatus: response.status,
        infobipResponse: data
      });
    }

    if (!data || !data.token) {

      return res.status(502).json({
        success: false,
        error: "Infobip returned no token",
        infobipResponse: data
      });
    }

    return res.status(200).json({
      success: true,
      token: data.token,
      expirationTime: data.expirationTime || null
    });

  } catch (error) {

    console.error(
      "Infobip token exception:",
      error
    );

    return res.status(500).json({
      success: false,
      error: "Infobip request exception",
      message: error.message,
      name: error.name
    });
  }
}
