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

<meta property="og:title" content="${name}">
<meta property="og:description" content="${description}">
<meta property="og:image" content="${logo}">
<meta property="og:type" content="website">

<title>${name}</title>

<meta http-equiv="refresh"
content="0;url=/user/channel?uid=${req.query.uid}&cid=${cid}">

</head>
<body>

Redirecting...

</body>
</html>
`);
}
