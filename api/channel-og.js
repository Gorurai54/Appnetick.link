export default async function handler(req, res) {

    const uid = req.query.uid;
    const cid = req.query.cid;

    if (!cid) {
        return res.status(404).send("Channel Not Found");
    }

    try {

        const response = await fetch(
            `https://users-f0dd7-default-rtdb.asia-southeast1.firebasedatabase.app/Channels/${cid}.json`
        );

        const data = await response.json();

        if (!data) {
            return res.status(404).send("Channel Not Found");
        }

        const title =
            data.name || "Appnetick Channel";

        const description =
            data.description || "Join Channel";

        const image =
            data.logo ||
            "https://appnetick-link.vercel.app/default.png";

        const redirectUrl =
            `https://appnetick-link.vercel.app/user/channel?uid=${uid}&cid=${cid}`;

        res.setHeader(
            "Content-Type",
            "text/html"
        );

        res.send(`
<!DOCTYPE html>
<html>
<head>

<title>${title}</title>

<meta property="og:type" content="website">
<meta property="og:site_name" content="Appnetick">

<meta property="og:title"
content="${title}">

<meta property="og:description"
content="${description}">

<meta property="og:image"
content="${image}">

<meta property="og:url"
content="${redirectUrl}">

<meta name="twitter:card"
content="summary_large_image">

<meta name="twitter:title"
content="${title}">

<meta name="twitter:description"
content="${description}">

<meta name="twitter:image"
content="${image}">

<meta http-equiv="refresh"
content="0;url=${redirectUrl}">

</head>
<body>

Redirecting...

</body>
</html>
        `);

    } catch (e) {

        res.status(500).send(e.toString());

    }

}
