const {
    usersDB,
    dataDB
} = require("../lib/firebase");

const cors =
    require("../lib/cors");

const crypto =
    require("crypto");


/*
============================================================
HELPERS
============================================================
*/


function normalizeUsername(value) {

    return String(value || "")
        .trim()
        .replace(/^@+/, "")
        .toLowerCase();

}


function safeString(value) {

    return String(value || "").trim();

}


/*
============================================================
EMAIL VALIDATION
============================================================
*/

function isValidEmail(email) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
    );

}


/*
============================================================
GENERATE SECURE 12-DIGIT STATUS CODE
============================================================

Uses crypto.randomInt instead of Math.random().

============================================================
*/

function generateStatusCode() {

    let code = "";

    for (let i = 0; i < 3; i++) {

        code += String(
            crypto.randomInt(
                0,
                10000
            )
        ).padStart(4, "0");

    }

    return code;

}


/*
============================================================
HASH STATUS CODE
============================================================
*/

function hashStatusCode(code) {

    return crypto
        .createHash("sha256")
        .update(
            String(code),
            "utf8"
        )
        .digest("hex");

}


/*
============================================================
GENERATE REQUEST ID
============================================================
*/

function generateRequestId() {

    return (
        "REQ_" +
        crypto
            .randomBytes(10)
            .toString("hex")
            .toUpperCase()
    );

}


/*
============================================================
FIND USER
============================================================

Priority:

1. UsernameIndex/{username}
2. Users/{uid}
3. Firebase exact Username search
4. Case-insensitive fallback

============================================================
*/


async function findUser(username) {

    /*
    --------------------------------------------------------
    UsernameIndex
    --------------------------------------------------------
    */

    const indexSnapshot =
        await usersDB
            .ref(
                "UsernameIndex/" +
                username
            )
            .once("value");


    let uid = null;


    if (
        indexSnapshot.exists()
    ) {

        uid =
            String(
                indexSnapshot.val()
            ).trim();

    }


    /*
    --------------------------------------------------------
    If index gave UID, load user directly
    --------------------------------------------------------
    */

    if (uid) {

        const userSnapshot =
            await usersDB
                .ref(
                    "Users/" +
                    uid
                )
                .once("value");


        if (
            userSnapshot.exists()
        ) {

            const value =
                userSnapshot.val() || {};


            return {

                uid:
                    value.uid ||
                    uid,

                username:
                    value.Username ||
                    value.username ||
                    username,

                full_name:
                    value.full_name ||
                    "",

                email:
                    value.email ||
                    "",

                avatar:
                    value.avatar ||
                    "",

                verified:
                    value.verified === true ||
                    value.verify === true

            };

        }

    }


    /*
    --------------------------------------------------------
    Firebase indexed search
    --------------------------------------------------------
    */

    const snapshot =
        await usersDB
            .ref("Users")
            .orderByChild("Username")
            .equalTo(username)
            .limitToFirst(1)
            .once("value");


    let user = null;


    snapshot.forEach(
        child => {

            if (user) {
                return;
            }


            const value =
                child.val() || {};


            user = {

                uid:
                    value.uid ||
                    child.key,

                username:
                    value.Username ||
                    value.username ||
                    username,

                full_name:
                    value.full_name ||
                    "",

                email:
                    value.email ||
                    "",

                avatar:
                    value.avatar ||
                    "",

                verified:
                    value.verified === true ||
                    value.verify === true

            };

        }
    );


    if (user) {

        return user;

    }


    /*
    --------------------------------------------------------
    Case-insensitive fallback
    --------------------------------------------------------
    */

    const allSnapshot =
        await usersDB
            .ref("Users")
            .once("value");


    allSnapshot.forEach(
        child => {

            if (user) {
                return;
            }


            const value =
                child.val() || {};


            const storedUsername =
                normalizeUsername(
                    value.Username ||
                    value.username ||
                    ""
                );


            if (
                storedUsername ===
                username
            ) {

                user = {

                    uid:
                        value.uid ||
                        child.key,

                    username:
                        value.Username ||
                        value.username ||
                        username,

                    full_name:
                        value.full_name ||
                        "",

                    email:
                        value.email ||
                        "",

                    avatar:
                        value.avatar ||
                        "",

                    verified:
                        value.verified === true ||
                        value.verify === true

                };

            }

        }
    );


    return user;

}


/*
============================================================
SAFE VERIFICATION DATA
============================================================

Never expose private verification key or status code.

============================================================
*/


function safeVerificationData(
    value
) {

    if (!value) {

        return null;

    }


    return {

        request_id:
            value.request_id ||
            "",

        verification_status:
            value.verification_status ||
            "pending",

        submitted_at:
            value.submitted_at ||
            0,

        reviewed_at:
            value.reviewed_at ||
            0,

        rejection_reason:
            value.rejection_reason ||
            ""

    };

}


/*
============================================================
SEND CUSTOM EMAIL
============================================================

Uses existing Appnetick /api/send-otp.js custom email
system.

IMPORTANT:

EMAIL_ADMIN_SECRET remains server-side only.

============================================================
*/


async function sendCustomEmail({

    email,
    subject,
    title,
    message,
    details,
    footerMessage

}) {

    const secret =
        safeString(
            process.env.EMAIL_ADMIN_SECRET
        );


    const endpoint =
        safeString(
            process.env.APPNETICK_EMAIL_ENDPOINT
        ) ||
        "https://appnetick-link.vercel.app/api/send-otp.js";


    if (!secret) {

        throw new Error(
            "EMAIL_ADMIN_SECRET is not configured."
        );

    }


    if (!email || !isValidEmail(email)) {

        throw new Error(
            "Invalid recipient email."
        );

    }


    const response =
        await fetch(
            endpoint,
            {

                method:
                    "POST",

                headers: {

                    "Content-Type":
                        "application/json"

                },

                body:
                    JSON.stringify({

                        type:
                            "custom",

                        admin_secret:
                            secret,

                        email:
                            email,

                        subject:
                            subject,

                        title:
                            title,

                        message:
                            message,

                        details:
                            details,

                        footer_message:
                            footerMessage

                    })

            }
        );


    let result = null;


    try {

        result =
            await response.json();

    } catch (e) {

        result = null;

    }


    if (
        !response.ok ||
        !result ||
        result.success !== true
    ) {

        console.error(
            "Custom verification email failed:",
            result
        );

        throw new Error(
            "Unable to send verification email."
        );

    }


    return true;

}


/*
============================================================
MAIN HANDLER
============================================================
*/


module.exports =
    async function handler(
        req,
        res
    ) {


    /*
    ========================================================
    CORS
    ========================================================
    */

    if (
        cors(req, res)
    ) {

        return;

    }


    /*
    ========================================================
    DETERMINE ACTION
    ========================================================
    */

    const action =
        typeof req.query.action === "string"
            ? req.query.action
                .trim()
                .toLowerCase()
            : "";


    /*
    ========================================================
    CHECK USERNAME
    ========================================================
    */

    if (
        action === "check-username"
    ) {


        if (
            req.method !== "GET"
        ) {

            return res
                .status(405)
                .json({

                    success:false,

                    error:
                        "Method not allowed."

                });

        }


        try {

            let username =
                req.query.username;


            if (
                !username ||
                typeof username !== "string"
            ) {

                return res
                    .status(400)
                    .json({

                        success:false,

                        error:
                            "Username is required."

                    });

            }


            username =
                normalizeUsername(
                    username
                );


            if (!username) {

                return res
                    .status(400)
                    .json({

                        success:false,

                        error:
                            "Invalid username."

                    });

            }


            if (
                username.length > 50
            ) {

                return res
                    .status(400)
                    .json({

                        success:false,

                        error:
                            "Invalid username."

                    });

            }


            const user =
                await findUser(
                    username
                );


            if (!user) {

                return res
                    .status(200)
                    .json({

                        success:true,

                        exists:false

                    });

            }


            const verificationSnapshot =
                await dataDB
                    .ref(
                        `VerificationRequests/${user.uid}`
                    )
                    .once("value");


            let verification =
                null;


            if (
                verificationSnapshot.exists()
            ) {

                verification =
                    safeVerificationData(
                        verificationSnapshot.val()
                    );

            }


            return res
                .status(200)
                .json({

                    success:true,

                    exists:true,

                    user:user,

                    verification:
                        verification

                });


        } catch(error) {

            console.error(
                "verification check-username:",
                error
            );


            return res
                .status(500)
                .json({

                    success:false,

                    error:
                        "Internal server error."

                });

        }

    }


    /*
    ========================================================
    STATUS
    ========================================================

    NEW:

    GET /api/verification?action=status&status_code=123456789012

    Username is NOT required.

    ========================================================
    */

    if (
        action === "status"
    ) {


        if (
            req.method !== "GET"
        ) {

            return res
                .status(405)
                .json({

                    success:false,

                    error:
                        "Method not allowed."

                });

        }


        try {

            /*
            ------------------------------------------------
            STATUS CODE
            ------------------------------------------------
            */

            const rawStatusCode =
                typeof req.query.status_code === "string"
                    ? req.query.status_code.trim()
                    : "";


            if (!rawStatusCode) {

                return res
                    .status(400)
                    .json({

                        success:false,

                        error:
                            "Status code is required."

                    });

            }


            /*
            ------------------------------------------------
            Exactly 12 digits
            ------------------------------------------------
            */

            if (
                !/^\d{12}$/.test(
                    rawStatusCode
                )
            ) {

                return res
                    .status(400)
                    .json({

                        success:false,

                        code:
                            "INVALID_STATUS_CODE",

                        error:
                            "Invalid verification status code."

                    });

            }


            /*
            ------------------------------------------------
            HASH
            ------------------------------------------------
            */

            const statusHash =
                hashStatusCode(
                    rawStatusCode
                );


            /*
            ------------------------------------------------
            LOOKUP STATUS CODE
            ------------------------------------------------
            */

            const codeSnapshot =
                await dataDB
                    .ref(
                        `VerificationStatusCodes/${statusHash}`
                    )
                    .once("value");


            if (
                !codeSnapshot.exists()
            ) {

                return res
                    .status(200)
                    .json({

                        valid:false,

                        code:
                            "INVALID_STATUS_CODE",

                        error:
                            "Invalid verification status code."

                    });

            }


            const codeData =
                codeSnapshot.val() || {};


            const uid =
                safeString(
                    codeData.uid
                );


            const requestId =
                safeString(
                    codeData.request_id
                );


            if (
                !uid ||
                !requestId
            ) {

                return res
                    .status(200)
                    .json({

                        valid:false,

                        code:
                            "INVALID_STATUS_CODE",

                        error:
                            "Invalid verification status code."

                    });

            }


            /*
            ------------------------------------------------
            LOAD USER
            ------------------------------------------------
            */

            const userSnapshot =
                await usersDB
                    .ref(
                        `Users/${uid}`
                    )
                    .once("value");


            if (
                !userSnapshot.exists()
            ) {

                return res
                    .status(200)
                    .json({

                        valid:false,

                        code:
                            "ACCOUNT_NOT_FOUND",

                        error:
                            "Account not found."

                    });

            }


            const userData =
                userSnapshot.val() || {};


            /*
            ------------------------------------------------
            LOAD VERIFICATION REQUEST
            ------------------------------------------------
            */

            const verificationSnapshot =
                await dataDB
                    .ref(
                        `VerificationRequests/${uid}`
                    )
                    .once("value");


            if (
                !verificationSnapshot.exists()
            ) {

                return res
                    .status(200)
                    .json({

                        valid:false,

                        code:
                            "REQUEST_NOT_FOUND",

                        error:
                            "Verification request not found."

                    });

            }


            const verification =
                verificationSnapshot.val() || {};


            /*
            ------------------------------------------------
            ENSURE CODE BELONGS TO SAME REQUEST
            ------------------------------------------------
            */

            if (
                String(
                    verification.request_id ||
                    ""
                ) !== requestId
            ) {

                return res
                    .status(200)
                    .json({

                        valid:false,

                        code:
                            "INVALID_STATUS_CODE",

                        error:
                            "Invalid verification status code."

                    });

            }


            /*
            ------------------------------------------------
            SAFE RESPONSE
            ------------------------------------------------

            NEVER return:

            - status code
            - status hash
            - private verification key
            - email
            - phone
            - legal name

            ------------------------------------------------
            */

            const safeUser = {

                username:
                    userData.Username ||
                    userData.username ||
                    "",

                full_name:
                    userData.full_name ||
                    "",

                avatar:
                    userData.avatar ||
                    ""

            };


            return res
                .status(200)
                .json({

                    valid:true,

                    status:
                        verification.verification_status ||
                        "pending",

                    user:
                        safeUser,

                    verification: {

                        request_id:
                            verification.request_id ||
                            requestId,

                        verification_status:
                            verification.verification_status ||
                            "pending",

                        submitted_at:
                            verification.submitted_at ||
                            0,

                        reviewed_at:
                            verification.reviewed_at ||
                            0,

                        rejection_reason:
                            verification.rejection_reason ||
                            ""

                    }

                });


        } catch(error) {

            console.error(
                "verification status:",
                error
            );


            return res
                .status(500)
                .json({

                    success:false,

                    error:
                        "Unable to fetch verification status."

                });

        }

    }


    /*
    ========================================================
    SUBMIT
    ========================================================
    */

    if (
        action === "submit"
    ) {


        if (
            req.method !== "POST"
        ) {

            return res
                .status(405)
                .json({

                    success:false,

                    error:
                        "Method not allowed."

                });

        }


        try {

            const body =
                req.body || {};


            /*
            ------------------------------------------------
            USERNAME
            ------------------------------------------------

            Username is ONLY used to identify the existing
            Appnetick account.

            UID is NEVER accepted from frontend.

            ------------------------------------------------
            */

            const username =
                normalizeUsername(
                    body.username
                );


            if (!username) {

                return res
                    .status(400)
                    .json({

                        success:false,

                        error:
                            "Username is required."

                    });

            }


            if (
                username.length > 50
            ) {

                return res
                    .status(400)
                    .json({

                        success:false,

                        error:
                            "Invalid username."

                    });

            }


            /*
            ------------------------------------------------
            FIND ACTUAL ACCOUNT
            ------------------------------------------------
            */

            const actualUser =
                await findUser(
                    username
                );


            if (!actualUser) {

                return res
                    .status(404)
                    .json({

                        success:false,

                        code:
                            "USERNAME_NOT_FOUND",

                        error:
                            "Username not found."

                    });

            }


            /*
            =================================================
            ACCOUNT EMAIL
            =================================================

            The email stored in Users is used.

            We do NOT trust a frontend email for account
            verification notifications.

            =================================================
            */

            const accountEmail =
                safeString(
                    actualUser.email
                )
                .toLowerCase();


            if (
                !accountEmail ||
                !isValidEmail(accountEmail)
            ) {

                return res
                    .status(400)
                    .json({

                        success:false,

                        code:
                            "ACCOUNT_EMAIL_NOT_FOUND",

                        error:
                            "The Appnetick account does not have a valid email address."

                    });

            }


            /*
            ------------------------------------------------
            EXISTING REQUEST
            ------------------------------------------------
            */

            const existingSnapshot =
                await dataDB
                    .ref(
                        `VerificationRequests/${actualUser.uid}`
                    )
                    .once("value");


            if (
                existingSnapshot.exists()
            ) {

                const existing =
                    existingSnapshot.val() || {};


                const existingStatus =
                    String(
                        existing.verification_status ||
                        ""
                    )
                    .trim()
                    .toLowerCase();


                /*
                --------------------------------------------
                ALREADY APPROVED
                --------------------------------------------
                */

                if (
                    existingStatus ===
                    "approved"
                ) {

                    return res
                        .status(409)
                        .json({

                            success:false,

                            code:
                                "ALREADY_VERIFIED",

                            error:
                                "This account is already verified."

                        });

                }


                /*
                --------------------------------------------
                ALREADY PENDING
                --------------------------------------------
                */

                if (
                    existingStatus ===
                    "pending"
                ) {

                    return res
                        .status(409)
                        .json({

                            success:false,

                            code:
                                "ALREADY_PENDING",

                            error:
                                "A verification application is already under review."

                        });

                }

            }


            /*
            =================================================
            REQUIRED CONFIRMATIONS
            =================================================
            */

            const authenticityConfirmed =
                body.authenticity_confirmed === true;


            const informationConfirmed =
                body.information_confirmed === true;


            const termsConfirmed =
                body.terms_confirmed === true;


            if (
                !authenticityConfirmed ||
                !informationConfirmed ||
                !termsConfirmed
            ) {

                return res
                    .status(400)
                    .json({

                        success:false,

                        error:
                            "All confirmations are required."

                    });

            }


            /*
            =================================================
            REQUEST ID
            =================================================
            */

            const requestId =
                generateRequestId();


            /*
            =================================================
            STATUS CODE
            =================================================

            RAW 12-digit code is only returned to the
            applicant once.

            Firebase stores only its SHA-256 hash.

            =================================================
            */

            const statusCode =
                generateStatusCode();


            const statusCodeHash =
                hashStatusCode(
                    statusCode
                );


            /*
            =================================================
            VERIFICATION DATA
            =================================================

            Password / PIN are NEVER saved.

            UID comes ONLY from username lookup.

            =================================================
            */

            const verificationData = {

                uid:
                    actualUser.uid,

                request_id:
                    requestId,

                username:
                    actualUser.username,

                full_name:
                    actualUser.full_name,

                legal_name:
                    safeString(
                        body.legal_name
                    ),

                email:
                    accountEmail,

                date_of_birth:
                    safeString(
                        body.date_of_birth
                    ),

                country:
                    safeString(
                        body.country
                    ),

                phone:
                    safeString(
                        body.phone
                    ),

                account_category:
                    safeString(
                        body.account_category
                    ),

                profession:
                    safeString(
                        body.profession
                    ),

                verification_reason:
                    safeString(
                        body.verification_reason
                    ),

                known_for:
                    safeString(
                        body.known_for
                    ),

                website:
                    safeString(
                        body.website
                    ),

                social_profile:
                    safeString(
                        body.social_profile
                    ),

                audience:
                    safeString(
                        body.audience
                    ),

                content_category:
                    safeString(
                        body.content_category
                    ),

                achievement:
                    safeString(
                        body.achievement
                    ),

                public_presence:
                    safeString(
                        body.public_presence
                    ),

                authenticity_confirmed:
                    authenticityConfirmed,

                information_confirmed:
                    informationConfirmed,

                terms_confirmed:
                    termsConfirmed,

                verification_status:
                    "pending",

                submitted_at:
                    Date.now(),

                reviewed_at:
                    0,

                reviewed_by:
                    "",

                rejection_reason:
                    "",

                verification_key_hash:
                    "",

                verification_key_created_at:
                    0,

                verification_key_redeemed:
                    false,

                verification_verified_at:
                    0

            };


            /*
            =================================================
            SAVE APPLICATION + STATUS CODE
            =================================================

            We save both records.

            If status-code mapping fails, application is
            removed so we don't create an application whose
            status code cannot be checked.

            =================================================
            */

            const requestRef =
                dataDB
                    .ref(
                        `VerificationRequests/${actualUser.uid}`
                    );


            const statusCodeRef =
                dataDB
                    .ref(
                        `VerificationStatusCodes/${statusCodeHash}`
                    );


            await requestRef
                .set(
                    verificationData
                );


            try {

                await statusCodeRef
                    .set({

                        uid:
                            actualUser.uid,

                        request_id:
                            requestId,

                        created_at:
                            Date.now(),

                        active:
                            true

                    });

            } catch(error) {

                /*
                --------------------------------------------
                ROLLBACK APPLICATION
                --------------------------------------------
                */

                try {

                    await requestRef.remove();

                } catch (rollbackError) {

                    console.error(
                        "Verification rollback error:",
                        rollbackError
                    );

                }


                throw error;

            }


            /*
            =================================================
            SEND STATUS CODE EMAIL
            =================================================
            */

            try {

                await sendCustomEmail({

                    email:
                        accountEmail,

                    subject:
                        "Your Appnetick verification application status code",

                    title:
                        "Application received",

                    message:
                        "Your Appnetick verification application has been successfully submitted. Use the 12-digit status code below to check your application status.",

                    details:
                        "Status code: " +
                        statusCode +
                        "\n\nRequest ID: " +
                        requestId,

                    footerMessage:
                        "Keep this status code safe. You will need it to check the status of your verification application. Appnetick will never ask you to share this code with anyone."

                });

            } catch(emailError) {

                console.error(
                    "Verification status email error:",
                    emailError
                );


                /*
                ------------------------------------------------
                IMPORTANT
                ------------------------------------------------

                Application + status code already exist.

                We do NOT delete the application just because
                email delivery failed.

                The code is returned to the frontend so the
                application page can show/save it.

                ------------------------------------------------
                */

            }


            /*
            =================================================
            SUCCESS
            =================================================

            The raw status code is returned once.

            It is NOT stored in Firebase.

            =================================================
            */

            return res
                .status(200)
                .json({

                    success:true,

                    uid:
                        actualUser.uid,

                    username:
                        actualUser.username,

                    request_id:
                        requestId,

                    status_code:
                        statusCode,

                    verification_status:
                        "pending",

                    message:
                        "Verification application submitted successfully."

                });


        } catch(error) {

            console.error(
                "verification submit:",
                error
            );


            return res
                .status(500)
                .json({

                    success:false,

                    error:
                        "Unable to submit verification application."

                });

        }

    }


    /*
    ========================================================
    UNKNOWN ACTION
    ========================================================
    */

    return res
        .status(400)
        .json({

            success:false,

            error:
                "Invalid verification action."

        });

};
