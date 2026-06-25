export default async function handler(req, res) {

  const cid = req.query.cid;

  if (!cid) {
    return res.status(404).send("Channel Not Found");
  }

  const response = await fetch(
    `https://users-f0dd7-default-rtdb.asia-southeast1.firebasedatabase.app/Channels/${cid}.json`
  );

  const data = await response.json();

  if (!data) {
    return res.status(404).send("Channel Not Found");
  }

  const name = data.name || "Channel";
  const description = data.description || "";
  const logo = data.logo || "";

  return res.status(200).send(`
<!DOCTYPE html>
<html>
<head>

<meta property="og:site_name" content="Appnetick">

<meta property="og:site_name" content="Appnetick">

<meta property="og:title" content="${name}">
<meta property="og:description" content="${description}">
<meta property="og:image" content="${logo}">
<meta property="og:url" content="https://appnetick-link.vercel.app/user/channel/invite?uid=${req.query.uid}&cid=${cid}">
<meta property="og:type" content="website">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${name}">
<meta name="twitter:description" content="${description}">
<meta name="twitter:image" content="${logo}">

<title>${name}</title>

<meta http-equiv="refresh"
content="0;url=/user/channel.html?uid=${req.query.uid}&cid=${cid}">

</head>
<body>

Redirecting...

</body>
</html>
`);
}
