const DATABASE_URL =
    "https://appnetic1000-default-rtdb.firebaseio.com";

const OTP_UID = "UJ1G3C70YMT59RUGB";


function clean(value) {
    if (value === undefined || value === null) {
        return "";
    }

    return String(value).trim();
}


async function firebaseGet(path) {

    const response = await fetch(
        `${DATABASE_URL}/${path}.json`
    );

    if (!response.ok) {
        throw new Error(
            `Firebase GET failed: ${response.status}`
        );
    }

    return await response.json();
}


async function firebasePut(path, data) {

    const response = await fetch(
        `${DATABASE_URL}/${path}.json`,
        {
            method: "PUT",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(data)
        }
    );

    if (!response.ok) {
        throw new Error(
            `Firebase PUT failed: ${response.status}`
        );
    }

    return await response.json();
}


async function firebasePatch(path, data) {

    const response = await fetch(
        `${DATABASE_URL}/${path}.json`,
        {
            method: "PATCH",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(data)
        }
    );

    if (!response.ok) {
        throw new Error(
            `Firebase PATCH failed: ${response.status}`
        );
    }

    return await response.json();
}


function generateKey() {

    const chars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    let result = "-";

    for (let i = 0; i < 19; i++) {
        result += chars.charAt(
            Math.floor(Math.random() * chars.length)
        );
    }

    return result;
}


export default async function handler(req, res) {

    if (req.method !== "POST") {

        return res.status(405).json({
            success: false,
            error: "POST method required"
        });
    }


    try {

        const body = req.body || {};

        const mode = clean(body.mode).toLowerCase();

        const toUid = clean(body.toUid);

        const message = clean(body.message);


        if (mode !== "user" && mode !== "otp") {

            return res.status(400).json({
                success: false,
                error: "mode must be 'user' or 'otp'"
            });
        }


        if (!toUid) {

            return res.status(400).json({
                success: false,
                error: "toUid is required"
            });
        }


        if (!message) {

            return res.status(400).json({
                success: false,
                error: "message is required"
            });
        }


        /*
        |--------------------------------------------------------------------------
        | DETERMINE SENDER
        |--------------------------------------------------------------------------
        */

        let fromUid;

        if (mode === "otp") {

            fromUid = OTP_UID;

        } else {

            fromUid = clean(body.fromUid);

            if (!fromUid) {

                return res.status(400).json({
                    success: false,
                    error: "fromUid is required in user mode"
                });
            }
        }


        if (fromUid === toUid) {

            return res.status(400).json({
                success: false,
                error: "Sender and receiver cannot be same"
            });
        }


        /*
        |--------------------------------------------------------------------------
        | GET SENDER
        |--------------------------------------------------------------------------
        */

        const sender = await firebaseGet(
            `Users/${encodeURIComponent(fromUid)}`
        );


        if (!sender) {

            return res.status(404).json({
                success: false,
                error: "Sender account not found"
            });
        }


        /*
        |--------------------------------------------------------------------------
        | GET RECEIVER
        |--------------------------------------------------------------------------
        */

        const receiver = await firebaseGet(
            `Users/${encodeURIComponent(toUid)}`
        );


        if (!receiver) {

            return res.status(404).json({
                success: false,
                error: "Receiver account not found"
            });
        }


        /*
        |--------------------------------------------------------------------------
        | USER INFORMATION
        |--------------------------------------------------------------------------
        */

        let senderUsername =
            clean(sender.Username) ||
            clean(sender.username);

        let senderAvatar =
            clean(sender.avatar) ||
            clean(sender.Avatar) ||
            clean(sender.logo);


        let receiverUsername =
            clean(receiver.Username) ||
            clean(receiver.username);

        let receiverAvatar =
            clean(receiver.avatar) ||
            clean(receiver.Avatar) ||
            clean(receiver.logo);


        /*
        |--------------------------------------------------------------------------
        | OTP ACCOUNT FALLBACK
        |--------------------------------------------------------------------------
        */

        if (mode === "otp" && !senderUsername) {
            senderUsername = "OTP Verification";
        }


        /*
        |--------------------------------------------------------------------------
        | MESSAGE KEY
        |--------------------------------------------------------------------------
        */

        const pushKey = generateKey();

        const time = Date.now();


        /*
        |--------------------------------------------------------------------------
        | CHAT MESSAGE
        |--------------------------------------------------------------------------
        */

        const messageMap = {

            typ: "txt",

            txt: message,

            From: fromUid,

            to: toUid,

            usrnm: senderUsername,

            pp: senderAvatar,

            timestamp: String(time),

            key: pushKey,

            stts: "Sent"
        };


        /*
        |--------------------------------------------------------------------------
        | RECEIVER CHAT COPY
        |--------------------------------------------------------------------------
        */

        const receiverMessageMap = {

            ...messageMap,

            stts: "Delivered"
        };


        /*
        |--------------------------------------------------------------------------
        | SENDER INBOX
        |--------------------------------------------------------------------------
        */

        const senderInbox = {

            lastMsg: message,

            msgType: "txt",

            lastMsgTime: time,

            from: fromUid,

            to: toUid,

            chatUserName: receiverUsername,

            chatUserPP: receiverAvatar,

            stts: "Sent"
        };


        /*
        |--------------------------------------------------------------------------
        | RECEIVER INBOX
        |--------------------------------------------------------------------------
        */

        const receiverInbox = {

            lastMsg: message,

            msgType: "txt",

            lastMsgTime: time,

            from: fromUid,

            to: toUid,

            chatUserName: senderUsername,

            chatUserPP: senderAvatar,

            stts: "Delivered",

            unreadCount: 1
        };


        /*
        |--------------------------------------------------------------------------
        | WRITE CHAT
        |--------------------------------------------------------------------------
        */

        await firebasePut(
            `chat/${encodeURIComponent(fromUid)}/${encodeURIComponent(toUid)}/${encodeURIComponent(pushKey)}`,
            messageMap
        );


        await firebasePut(
            `chat/${encodeURIComponent(toUid)}/${encodeURIComponent(fromUid)}/${encodeURIComponent(pushKey)}`,
            receiverMessageMap
        );


        /*
        |--------------------------------------------------------------------------
        | WRITE SENDER INBOX
        |--------------------------------------------------------------------------
        */

        await firebasePatch(
            `InboxList/${encodeURIComponent(fromUid)}/${encodeURIComponent(toUid)}`,
            senderInbox
        );


        /*
        |--------------------------------------------------------------------------
        | WRITE RECEIVER INBOX
        |--------------------------------------------------------------------------
        */

        await firebasePatch(
            `InboxList/${encodeURIComponent(toUid)}/${encodeURIComponent(fromUid)}`,
            receiverInbox
        );


        /*
        |--------------------------------------------------------------------------
        | SUCCESS
        |--------------------------------------------------------------------------
        */

        return res.status(200).json({

            success: true,

            mode: mode,

            messageKey: pushKey,

            fromUid: fromUid,

            toUid: toUid,

            timestamp: time,

            message: "Message created successfully"
        });


    } catch (error) {

        console.error(
            "SEND MESSAGE ERROR:",
            error
        );

        return res.status(500).json({

            success: false,

            error: error.message ||
                "Internal server error"
        });
    }
}
