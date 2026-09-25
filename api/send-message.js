/*
|--------------------------------------------------------------------------
| /api/send-message.js
|--------------------------------------------------------------------------
| Reusable message API
|
| Modes:
|
| 1. user
|    Any user -> Any user
|
| 2. otp
|    OTP Verification account -> User
|
| OTP UID:
|    UJ1G3C70YMT59RUGB
|
|--------------------------------------------------------------------------
*/

const DATABASE_URL =
    "https://appnetic1000-default-rtdb.firebaseio.com";

const OTP_UID =
    "UJ1G3C70YMT59RUGB";


/*
|--------------------------------------------------------------------------
| Existing notification server
|--------------------------------------------------------------------------
*/

const NOTIFICATION_URL =
    "https://chat-notification-server.onrender.com/send";


/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function clean(value, maxLength = 1000) {

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


/*
|--------------------------------------------------------------------------
| Firebase REST GET
|--------------------------------------------------------------------------
*/

async function firebaseGet(path) {

    const response = await fetch(
        `${DATABASE_URL}/${path}.json`
    );

    if (!response.ok) {

        throw new Error(
            `Firebase GET failed: HTTP ${response.status}`
        );
    }

    return await response.json();
}


/*
|--------------------------------------------------------------------------
| Firebase REST PUT
|--------------------------------------------------------------------------
*/

async function firebasePut(path, data) {

    const response = await fetch(
        `${DATABASE_URL}/${path}.json`,
        {
            method: "PUT",

            headers: {
                "Content-Type":
                    "application/json"
            },

            body:
                JSON.stringify(data)
        }
    );

    if (!response.ok) {

        const text =
            await response.text();

        throw new Error(
            `Firebase PUT failed: HTTP ${response.status} ${text}`
        );
    }

    return await response.json();
}


/*
|--------------------------------------------------------------------------
| Firebase REST PATCH
|--------------------------------------------------------------------------
*/

async function firebasePatch(path, data) {

    const response = await fetch(
        `${DATABASE_URL}/${path}.json`,
        {
            method: "PATCH",

            headers: {
                "Content-Type":
                    "application/json"
            },

            body:
                JSON.stringify(data)
        }
    );

    if (!response.ok) {

        const text =
            await response.text();

        throw new Error(
            `Firebase PATCH failed: HTTP ${response.status} ${text}`
        );
    }

    return await response.json();
}


/*
|--------------------------------------------------------------------------
| Generate Firebase-style push key
|--------------------------------------------------------------------------
|
| For now we generate a unique key locally.
|
*/

function generatePushKey() {

    const chars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    let key = "-";

    for (let i = 0; i < 19; i++) {

        key += chars.charAt(
            Math.floor(
                Math.random() * chars.length
            )
        );
    }

    return key;
}


/*
|--------------------------------------------------------------------------
| Generate a unique numeric value for unread increment
|--------------------------------------------------------------------------
|
| Firebase REST does not accept:
|
| ServerValue.increment(1)
|
| as the final value.
|
| Therefore we first read the existing unreadCount and
| calculate the next value.
|
*/

function getUnreadCount(value) {

    if (
        typeof value === "number" &&
        Number.isFinite(value)
    ) {
        return value;
    }

    const parsed =
        Number(value);

    if (
        Number.isFinite(parsed) &&
        parsed >= 0
    ) {
        return parsed;
    }

    return 0;
}


/*
|--------------------------------------------------------------------------
| Get user information
|--------------------------------------------------------------------------
*/

async function getUser(uid) {

    const data =
        await firebaseGet(
            `Users/${encodeURIComponent(uid)}`
        );


    if (
        !data ||
        typeof data !== "object"
    ) {

        return null;
    }


    return {

        uid,

        username:
            clean(data.Username) ||
            clean(data.username),

        avatar:
            clean(data.avatar) ||
            clean(data.Avatar) ||
            clean(data.logo) ||
            clean(data.profilePicture),

        fcmToken:
            clean(data.fcmToken)
    };
}


/*
|--------------------------------------------------------------------------
| Send normal chat notification
|--------------------------------------------------------------------------
*/

async function sendChatNotification({

    receiverToken,

    sender,

    receiverUid,

    message,

    messageKey
}) {

    /*
    |--------------------------------------------------------------------------
    | No FCM token
    |--------------------------------------------------------------------------
    */

    if (!receiverToken) {

        return {

            sent: false,

            reason:
                "Receiver FCM token not found"
        };
    }


    /*
    |--------------------------------------------------------------------------
    | Same structure as existing Android code
    |--------------------------------------------------------------------------
    */

    const body = {

        token:
            receiverToken,

        title:
            sender.username,

        body:
            message,

        username:
            sender.username,

        subtext:
            sender.username,

        image:
            sender.avatar,

        /*
        | Existing Android code sends senderToken.
        |
        | For server-generated messages we don't need the
        | sender's current token for Firebase delivery,
        | but we preserve the field for your notification
        | server / existing notification logic.
        */
        senderToken:
            sender.fcmToken || "",

        senderUid:
            sender.uid,

        type:
            "chat",

        receiverUid:
            receiverUid,

        messageKey:
            messageKey
    };


    try {

        const response =
            await fetch(
                NOTIFICATION_URL,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(body)
                }
            );


        const responseText =
            await response.text();


        if (!response.ok) {

            return {

                sent: false,

                reason:
                    `Notification server returned HTTP ${response.status}`,

                response:
                    responseText
            };
        }


        return {

            sent: true,

            response:
                responseText
        };


    } catch (error) {

        return {

            sent: false,

            reason:
                error.message
        };
    }
}


/*
|--------------------------------------------------------------------------
| Main API
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

    if (req.method === "OPTIONS") {

        return res
            .status(204)
            .end();
    }


    /*
    |--------------------------------------------------------------------------
    | POST ONLY
    |--------------------------------------------------------------------------
    */

    if (req.method !== "POST") {

        return res
            .status(405)
            .json({

                success: false,

                error:
                    "POST method required"
            });
    }


    try {

        const body =
            req.body || {};


        /*
        |--------------------------------------------------------------------------
        | Request values
        |--------------------------------------------------------------------------
        */

        const mode =
            clean(
                body.mode,
                20
            ).toLowerCase();


        const toUid =
            clean(
                body.toUid,
                128
            );


        const message =
            clean(
                body.message,
                5000
            );


        /*
        |--------------------------------------------------------------------------
        | Validate mode
        |--------------------------------------------------------------------------
        */

        if (
            mode !== "user" &&
            mode !== "otp"
        ) {

            return res
                .status(400)
                .json({

                    success: false,

                    error:
                        "mode must be 'user' or 'otp'"
                });
        }


        /*
        |--------------------------------------------------------------------------
        | Validate receiver
        |--------------------------------------------------------------------------
        */

        if (!toUid) {

            return res
                .status(400)
                .json({

                    success: false,

                    error:
                        "toUid is required"
                });
        }


        /*
        |--------------------------------------------------------------------------
        | Validate message
        |--------------------------------------------------------------------------
        */

        if (!message) {

            return res
                .status(400)
                .json({

                    success: false,

                    error:
                        "message is required"
                });
        }


        /*
        |--------------------------------------------------------------------------
        | Determine sender
        |--------------------------------------------------------------------------
        */

        let fromUid;


        if (mode === "otp") {

            /*
            | OTP sender is always fixed.
            */

            fromUid =
                OTP_UID;

        } else {

            fromUid =
                clean(
                    body.fromUid,
                    128
                );


            if (!fromUid) {

                return res
                    .status(400)
                    .json({

                        success: false,

                        error:
                            "fromUid is required in user mode"
                    });
            }
        }


        /*
        |--------------------------------------------------------------------------
        | Prevent self message
        |--------------------------------------------------------------------------
        */

        if (
            fromUid ===
            toUid
        ) {

            return res
                .status(400)
                .json({

                    success: false,

                    error:
                        "Sender and receiver cannot be the same"
                });
        }


        /*
        |--------------------------------------------------------------------------
        | Load sender
        |--------------------------------------------------------------------------
        */

        const sender =
            await getUser(
                fromUid
            );


        if (!sender) {

            return res
                .status(404)
                .json({

                    success: false,

                    error:
                        "Sender account not found"
                });
        }


        /*
        |--------------------------------------------------------------------------
        | Load receiver
        |--------------------------------------------------------------------------
        */

        const receiver =
            await getUser(
                toUid
            );


        if (!receiver) {

            return res
                .status(404)
                .json({

                    success: false,

                    error:
                        "Receiver account not found"
                });
        }


        /*
        |--------------------------------------------------------------------------
        | OTP fallback username
        |--------------------------------------------------------------------------
        */

        if (
            mode === "otp" &&
            !sender.username
        ) {

            sender.username =
                "OTP Verification";
        }


        /*
        |--------------------------------------------------------------------------
        | Generate message key
        |--------------------------------------------------------------------------
        */

        const pushKey =
            generatePushKey();


        const time =
            Date.now();


        /*
        |--------------------------------------------------------------------------
        | CHAT MESSAGE
        |--------------------------------------------------------------------------
        */

        const messageMap = {

            typ:
                "txt",

            txt:
                message,

            From:
                fromUid,

            to:
                toUid,

            usrnm:
                sender.username,

            pp:
                sender.avatar,

            timestamp:
                String(time),

            key:
                pushKey,

            stts:
                "Sent"
        };


        /*
        |--------------------------------------------------------------------------
        | RECEIVER CHAT COPY
        |--------------------------------------------------------------------------
        */

        const receiverMessageMap = {

            ...messageMap,

            stts:
                "Delivered"
        };


        /*
        |--------------------------------------------------------------------------
        | SENDER INBOX
        |--------------------------------------------------------------------------
        */

        const senderInbox = {

            lastMsg:
                message,

            msgType:
                "txt",

            lastMsgTime:
                time,

            from:
                fromUid,

            to:
                toUid,

            chatUserName:
                receiver.username,

            chatUserPP:
                receiver.avatar,

            stts:
                "Sent"
        };


        /*
        |--------------------------------------------------------------------------
        | READ CURRENT RECEIVER INBOX
        |--------------------------------------------------------------------------
        |
        | This is required because your Android code uses:
        |
        | ServerValue.increment(1)
        |
        | We reproduce that behavior here.
        |
        */

        const existingReceiverInbox =
            await firebaseGet(
                `InboxList/${encodeURIComponent(toUid)}/${encodeURIComponent(fromUid)}`
            );


        const currentUnread =
            getUnreadCount(
                existingReceiverInbox?.unreadCount
            );


        const newUnreadCount =
            currentUnread + 1;


        /*
        |--------------------------------------------------------------------------
        | RECEIVER INBOX
        |--------------------------------------------------------------------------
        */

        const receiverInbox = {

            lastMsg:
                message,

            msgType:
                "txt",

            lastMsgTime:
                time,

            from:
                fromUid,

            to:
                toUid,

            chatUserName:
                sender.username,

            chatUserPP:
                sender.avatar,

            stts:
                "Delivered",

            unreadCount:
                newUnreadCount
        };


        /*
        |--------------------------------------------------------------------------
        | WRITE SENDER CHAT
        |--------------------------------------------------------------------------
        */

        await firebasePut(

            `chat/${encodeURIComponent(fromUid)}/${encodeURIComponent(toUid)}/${encodeURIComponent(pushKey)}`,

            messageMap
        );


        /*
        |--------------------------------------------------------------------------
        | WRITE RECEIVER CHAT
        |--------------------------------------------------------------------------
        */

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
        | SEND NOTIFICATION
        |--------------------------------------------------------------------------
        */

        const notification =
            await sendChatNotification({

                receiverToken:
                    receiver.fcmToken,

                sender:
                    sender,

                receiverUid:
                    toUid,

                message:
                    message,

                messageKey:
                    pushKey
            });


        /*
        |--------------------------------------------------------------------------
        | SUCCESS
        |--------------------------------------------------------------------------
        |
        | IMPORTANT:
        |
        | Database message is already created even if
        | notification fails.
        |
        */

        return res
            .status(200)
            .json({

                success:
                    true,

                mode:
                    mode,

                message:
                    "Message sent successfully",

                messageKey:
                    pushKey,

                fromUid:
                    fromUid,

                toUid:
                    toUid,

                timestamp:
                    time,

                chat: {

                    sender:
                        true,

                    receiver:
                        true
                },

                inbox: {

                    sender:
                        true,

                    receiver:
                        true,

                    unreadCount:
                        newUnreadCount
                },

                notification:
                    notification
            });


    } catch (error) {

        console.error(
            "SEND MESSAGE API ERROR:",
            error
        );


        return res
            .status(500)
            .json({

                success:
                    false,

                error:
                    error.message ||
                    "Internal server error"
            });
    }
}
