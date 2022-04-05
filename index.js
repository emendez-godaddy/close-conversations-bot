const express = require("express");
const router = require("./src/routes/liveEngage");

const app = express();
const port = 3001;

app.use("/live-engage", router);

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
