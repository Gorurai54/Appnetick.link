export default async function handler(req, res) {

    if (req.method !== "POST") {

        return res.status(405).json({
            error: "Method not allowed"
        });

    }


    try {

        const {
            secretKey,
            versionCode,
            versionName,
            apkUrl,
            message,
            forceUpdate
        } = req.body || {};


        /* =========================================
           SECRET KEY CHECK
        ========================================= */

        if (
            !secretKey ||
            secretKey !== process.env.UPDATE_SECRET_KEY
        ) {

            return res.status(401).json({
                error: "Invalid secret key."
            });

        }


        /* =========================================
           VALIDATION
        ========================================= */

        if (
            !versionCode ||
            !versionName ||
            !apkUrl
        ) {

            return res.status(400).json({
                error: "Missing update information."
            });

        }


        if (
            !apkUrl.startsWith("https://") &&
            !apkUrl.startsWith("http://")
        ) {

            return res.status(400).json({
                error: "Invalid APK URL."
            });

        }


        /* =========================================
           UPDATE DATA
        ========================================= */

        const updateData = {

            versionCode:
                Number(versionCode),

            versionName:
                String(versionName),

            apkUrl:
                String(apkUrl),

            message:
                String(
                    message ||
                    "A new version of Appnetick is available."
                ),

            forceUpdate:
                Boolean(forceUpdate)

        };


        /* =========================================
           FIREBASE DATABASE
        ========================================= */

        const firebaseUrl =
            "https://appnetick-data-default-rtdb.firebaseio.com/AppUpdate.json";


        const firebaseResponse =
            await fetch(
                firebaseUrl,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            updateData
                        )
                }
            );


        if (!firebaseResponse.ok) {

            const errorText =
                await firebaseResponse.text();

            console.error(
                "Firebase error:",
                errorText
            );

            return res.status(500).json({
                error:
                    "Firebase update failed."
            });

        }


        return res.status(200).json({

            success: true,

            message:
                "Update published successfully.",

            data:
                updateData

        });


    } catch (error) {

        console.error(error);

        return res.status(500).json({

            error:
                "Internal server error."

        });

    }

}
