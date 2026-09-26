/*
|--------------------------------------------------------------------------
| Appnetick Test Chat + Notification API
|--------------------------------------------------------------------------
|
| USERS DATABASE
| https://appnetick-default-rtdb.firebaseio.com
|
| CHAT / INBOX DATABASE
| https://appnetic1000-default-rtdb.firebaseio.com
|
|--------------------------------------------------------------------------
*/

const USERS_DATABASE_URL =
    "https://appnetick-default-rtdb.firebaseio.com";

const CHAT_DATABASE_URL =
    "https://appnetic1000-default-rtdb.firebaseio.com";

const OTP_UID =
    "UJ1G3C70YMT59RUGB";

const NOTIFICATION_URL =
    "https://chat-notification-server.onrender.com/send";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function safeString(value) {
    return typeof value === "string"
        ? value.trim()
        : "";
}

function json(res, status, data) {
    return res
        .status(status)
        .json(data);
}

/*
|--------------------------------------------------------------------------
| Firebase REST GET
|--------------------------------------------------------------------------
*/

async function firebaseGet(
    databaseUrl,
    path
) {

    const url =
        databaseUrl.replace(/\/+$/, "") +
        "/" +
        path.replace(/^\/+/, "") +
        ".json";

    const response =
        await fetch(url);

    const text =
        await response.text();

    if (!response.ok) {

        throw new Error(
            `Firebase GET failed: HTTP ${response.status} ${text}`
        );
    }

    if (
        !text ||
        text === "null"
    ) {
        return null;
    }

    try {

        return JSON.parse(text);

    } catch {

        throw new Error(
            "Firebase returned invalid JSON."
        );
    }
}

/*
|--------------------------------------------------------------------------
| Firebase REST PUT
|--------------------------------------------------------------------------
*/

async function firebasePut(
    databaseUrl,
    path,
    data
) {

    const url =
        databaseUrl.replace(/\/+$/, "") +
        "/" +
        path.replace(/^\/+/, "") +
        ".json";

    const response =
        await fetch(
            url,
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

    const text =
        await response.text();

    if (!response.ok) {

        throw new Error(
            `Firebase PUT failed: HTTP ${response.status} ${text}`
        );
    }

    if (!text) {
        return null;
    }

    try {

        return JSON.parse(text);

    } catch {

        return null;
    }
}

/*
|--------------------------------------------------------------------------
| Firebase REST PATCH
|--------------------------------------------------------------------------
*/

async function firebasePatch(
    databaseUrl,
    path,
    data
) {

    const url =
        databaseUrl.replace(/\/+$/, "") +
        "/" +
        path.replace(/^\/+/, "") +
        ".json";

    const response =
        await fetch(
            url,
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

    const text =
        await response.text();

    if (!response.ok) {

        throw new Error(
            `Firebase PATCH failed: HTTP ${response.status} ${text}`
        );
    }

    if (!text) {
        return null;
    }

    try {

        return JSON.parse(text);

    } catch {

        return null;
    }
}

/*
|--------------------------------------------------------------------------
| Generate Firebase-compatible Push Key
|--------------------------------------------------------------------------
*/

function generatePushKey() {

    const chars =
        "-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz";

    let key = "";

    for (
        let i = 0;
        i < 20;
        i++
    ) {

        key +=
            chars[
                Math.floor(
                    Math.random() *
                    chars.length
                )
            ];
    }

    return key;
}

/*
|--------------------------------------------------------------------------
| User Helpers
|--------------------------------------------------------------------------
*/

function getUsername(user) {

    return safeString(
        user?.Username ||
        user?.username ||
        user?.userName ||
        user?.name
    );
}

function getAvatar(user) {

    return safeString(
        user?.avatar ||
        user?.Avatar ||
        user?.logo ||
        user?.profilePicture ||
        user?.profilePic ||
        ""
    );
}

function getFcmToken(user) {

    return safeString(
        user?.fcmToken ||
        user?.FCMToken ||
        user?.fcm_token ||
        ""
    );
}

/*
|--------------------------------------------------------------------------
| Send FCM Chat Notification
|--------------------------------------------------------------------------
*/

async function sendChatNotification({
    receiverToken,
    senderUsername,
    message,
    senderAvatar,
    senderUid,
    receiverUid,
    messageKey
}) {

    if (!receiverToken) {

        return {

            sent: false,

            type: "OtpChat",

            reason:
                "Receiver FCM token not found"
        };
    }

    /*
    |--------------------------------------------------------------------------
    | IMPORTANT
    |--------------------------------------------------------------------------
    |
    | This is the exact notification type
    | that Android should receive.
    |
    |--------------------------------------------------------------------------
    */

    const notificationType =
        "OtpChat";

    const body = {

        token:
            receiverToken,

        title:
            senderUsername,

        body:
            message,

        username:
            senderUsername,

        subtext:
            senderUsername,

        image:
            senderAvatar,

        senderUid:
            senderUid,

        type:
            notificationType,

        receiverUid:
            receiverUid,

        messageKey:
            messageKey
    };

    const response =
        await fetch(
            NOTIFICATION_URL,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json",

                    "Accept":
                        "application/json"
                },

                body:
                    JSON.stringify(body)
            }
        );

    const text =
        await response.text();

    let responseData;

    try {

        responseData =
            JSON.parse(text);

    } catch {

        responseData =
            text;
    }

    if (!response.ok) {

        return {

            sent: false,

            status:
                response.status,

            type:
                notificationType,

            payload: {

                title:
                    senderUsername,

                body:
                    message,

                senderUid:
                    senderUid,

                receiverUid:
                    receiverUid,

                type:
                    notificationType,

                messageKey:
                    messageKey
            },

            response:
                responseData
        };
    }

    return {

        sent: true,

        status:
            response.status,

        type:
            notificationType,

        payload: {

            title:
                senderUsername,

            body:
                message,

            senderUid:
                senderUid,

            receiverUid:
                receiverUid,

            type:
                notificationType,

            messageKey:
                messageKey
        },

        response:
            responseData
    };
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
    | POST Only
    |--------------------------------------------------------------------------
    */

    if (req.method !== "POST") {

        return json(
            res,
            405,
            {
                success: false,
                error:
                    "Method not allowed"
            }
        );
    }

    try {

        /*
        |--------------------------------------------------------------------------
        | Request
        |--------------------------------------------------------------------------
        */

        const body =
            req.body || {};

        const action =
            safeString(
                body.action
            );

        const toUid =
            safeString(
                body.toUid
            );

        const message =
            safeString(
                body.message
            );

        /*
        |--------------------------------------------------------------------------
        | Validation
        |--------------------------------------------------------------------------
        */

        if (!toUid) {

            return json(
                res,
                400,
                {
                    success: false,
                    error:
                        "Receiver UID is required"
                }
            );
        }

        if (!message) {

            return json(
                res,
                400,
                {
                    success: false,
                    error:
                        "Message is required"
                }
            );
        }

        if (
            action !== "chat" &&
            action !== "notification" &&
            action !== "both"
        ) {

            return json(
                res,
                400,
                {
                    success: false,
                    error:
                        "Invalid action"
                }
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Fixed Sender
        |--------------------------------------------------------------------------
        */

        const fromUid =
            OTP_UID;

        /*
        |--------------------------------------------------------------------------
        | Get Sender
        |--------------------------------------------------------------------------
        |
        | USERS DATABASE
        |
        |--------------------------------------------------------------------------
        */

        const senderUser =
            await firebaseGet(
                USERS_DATABASE_URL,
                `Users/${encodeURIComponent(fromUid)}`
            );

        if (!senderUser) {

            return json(
                res,
                404,
                {
                    success: false,

                    error:
                        "Testing sender account not found",

                    uid:
                        fromUid
                }
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Get Receiver
        |--------------------------------------------------------------------------
        |
        | USERS DATABASE
        |
        |--------------------------------------------------------------------------
        */

        const receiverUser =
            await firebaseGet(
                USERS_DATABASE_URL,
                `Users/${encodeURIComponent(toUid)}`
            );

        if (!receiverUser) {

            return json(
                res,
                404,
                {
                    success: false,

                    error:
                        "Receiver user not found",

                    uid:
                        toUid
                }
            );
        }

        /*
        |--------------------------------------------------------------------------
        | User Information
        |--------------------------------------------------------------------------
        */

        const senderUsername =
            getUsername(senderUser) ||
            "OTP Verification";

        const receiverUsername =
            getUsername(receiverUser);

        const senderAvatar =
            getAvatar(senderUser);

        const receiverAvatar =
            getAvatar(receiverUser);

        const receiverToken =
            getFcmToken(receiverUser);

        /*
        |--------------------------------------------------------------------------
        | Timestamp
        |--------------------------------------------------------------------------
        */

        const timestamp =
            String(
                Date.now()
            );

        /*
        |--------------------------------------------------------------------------
        | Message Key
        |--------------------------------------------------------------------------
        */

        const messageKey =
            generatePushKey();

        /*
        |--------------------------------------------------------------------------
        | Base Result
        |--------------------------------------------------------------------------
        */

        const result = {

            success:
                true,

            action:
                action,

            sender: {

                uid:
                    fromUid,

                username:
                    senderUsername,

                avatar:
                    senderAvatar
            },

            receiver: {

                uid:
                    toUid,

                username:
                    receiverUsername,

                avatar:
                    receiverAvatar,

                hasFcmToken:
                    Boolean(
                        receiverToken
                    )
            },

            message:
                message,

            timestamp:
                Number(timestamp),

            messageKey:
                messageKey
        };

        /*
        |--------------------------------------------------------------------------
        | CHAT
        |--------------------------------------------------------------------------
        */

        if (
            action === "chat" ||
            action === "both"
        ) {

            /*
            |--------------------------------------------------------------------------
            | Sender Chat
            |--------------------------------------------------------------------------
            */

            const senderChat = {

                typ:
                    "txt",

                txt:
                    message,

                From:
                    fromUid,

                to:
                    toUid,

                usrnm:
                    senderUsername,

                pp:
                    senderAvatar,

                timestamp:
                    timestamp,

                key:
                    messageKey,

                stts:
                    "Sent"
            };

            /*
            |--------------------------------------------------------------------------
            | Receiver Chat
            |--------------------------------------------------------------------------
            */

            const receiverChat = {

                typ:
                    "txt",

                txt:
                    message,

                From:
                    fromUid,

                to:
                    toUid,

                usrnm:
                    senderUsername,

                pp:
                    senderAvatar,

                timestamp:
                    timestamp,

                key:
                    messageKey,

                stts:
                    "Delivered"
            };

            /*
            |--------------------------------------------------------------------------
            | Sender Inbox
            |--------------------------------------------------------------------------
            */

            const senderInbox = {

                lastMsg:
                    message,

                msgType:
                    "txt",

                lastMsgTime:
                    Number(timestamp),

                from:
                    fromUid,

                to:
                    toUid,

                chatUserName:
                    receiverUsername,

                chatUserPP:
                    receiverAvatar,

                stts:
                    "Sent"
            };

            /*
            |--------------------------------------------------------------------------
            | Receiver Inbox Existing Data
            |--------------------------------------------------------------------------
            |
            | CHAT DATABASE
            |
            |--------------------------------------------------------------------------
            */

            const receiverInboxPath =
                `InboxList/${toUid}/${fromUid}`;

            const existingReceiverInbox =
                await firebaseGet(
                    CHAT_DATABASE_URL,
                    receiverInboxPath
                );

            let unreadCount =
                0;

            if (
                existingReceiverInbox &&
                typeof
                    existingReceiverInbox.unreadCount ===
                    "number"
            ) {

                unreadCount =
                    existingReceiverInbox.unreadCount;
            }

            unreadCount += 1;

            /*
            |--------------------------------------------------------------------------
            | Receiver Inbox
            |--------------------------------------------------------------------------
            */

            const receiverInbox = {

                lastMsg:
                    message,

                msgType:
                    "txt",

                lastMsgTime:
                    Number(timestamp),

                from:
                    fromUid,

                to:
                    toUid,

                chatUserName:
                    senderUsername,

                chatUserPP:
                    senderAvatar,

                stts:
                    "Delivered",

                unreadCount:
                    unreadCount
            };

            /*
            |--------------------------------------------------------------------------
            | WRITE CHAT
            |--------------------------------------------------------------------------
            |
            | IMPORTANT:
            | These are written to:
            |
            | https://appnetic1000-default-rtdb.firebaseio.com
            |
            |--------------------------------------------------------------------------
            */

            const senderChatPath =
                `chat/${fromUid}/${toUid}/${messageKey}`;

            const receiverChatPath =
                `chat/${toUid}/${fromUid}/${messageKey}`;

            await firebasePut(
                CHAT_DATABASE_URL,
                senderChatPath,
                senderChat
            );

            await firebasePut(
                CHAT_DATABASE_URL,
                receiverChatPath,
                receiverChat
            );

            /*
            |--------------------------------------------------------------------------
            | WRITE INBOX
            |--------------------------------------------------------------------------
            */

            await firebasePatch(
                CHAT_DATABASE_URL,
                `InboxList/${fromUid}/${toUid}`,
                senderInbox
            );

            await firebasePatch(
                CHAT_DATABASE_URL,
                receiverInboxPath,
                receiverInbox
            );

            /*
            |--------------------------------------------------------------------------
            | Chat Result
            |--------------------------------------------------------------------------
            */

            result.chat = {

                sent:
                    true,

                database:
                    CHAT_DATABASE_URL,

                senderPath:
                    senderChatPath,

                receiverPath:
                    receiverChatPath,

                senderInboxPath:
                    `InboxList/${fromUid}/${toUid}`,

                receiverInboxPath:
                    receiverInboxPath,

                messageKey:
                    messageKey
            };
        }

        /*
        |--------------------------------------------------------------------------
        | NOTIFICATION
        |--------------------------------------------------------------------------
        */

        if (
            action === "notification" ||
            action === "both"
        ) {

            result.notification =
                await sendChatNotification({

                    receiverToken:
                        receiverToken,

                    senderUsername:
                        senderUsername,

                    message:
                        message,

                    senderAvatar:
                        senderAvatar,

                    senderUid:
                        fromUid,

                    receiverUid:
                        toUid,

                    messageKey:
                        messageKey
                });
        }

        /*
        |--------------------------------------------------------------------------
        | FINAL SUCCESS
        |--------------------------------------------------------------------------
        */

        const chatOk =
            !result.chat ||
            result.chat.sent === true;

        const notificationOk =
            !result.notification ||
            result.notification.sent === true;

        result.success =
            chatOk &&
            notificationOk;

        /*
        |--------------------------------------------------------------------------
        | Final Status
        |--------------------------------------------------------------------------
        */

        result.status =
            result.success
                ? "SUCCESS"
                : "FAILED";

        return json(
            res,
            result.success
                ? 200
                : 500,
            result
        );

    } catch (error) {

        console.error(
            "test-send error:",
            error
        );

        return json(
            res,
            500,
            {
                success:
                    false,

                status:
                    "FAILED",

                error:
                    error.message ||
                    "Internal server error"
            }
        );
    }
}
