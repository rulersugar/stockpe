const express = require("express");
const app = express();
// For parsing application/json
app.use(express.json());
// For parsing application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));
const PORT = 3000;
const playerList = [];
const matchedList = [];
const gamersList = [];

app.listen(PORT, (error) => {
    if (!error) {
        console.log("Server is Successfully Running, and App is listening on port " + PORT);
    }
    else {
        console.log("Error occurred, server can't start", error);
    }
  }
);

app.get("/match", (req, res) => {
  const pair = matchedList.filter(match => (match[0] === req.query.clientID));
  const filterCheck = playerList.filter(player => (player.clientID === req.query.clientID));
  if ((playerList.length === 0) && (pair.length === 0)) {
    playerList.push(req.query);
    res.send({ status: "waiting" });
  }
  else if ((playerList.length === 1) && (filterCheck.length === 0) && (pair.length === 0)) {
    console.log("" + req.query.clientName + " got matched with " + playerList[0].clientName);
    res.send({ status: "matched", clientID: playerList[0].clientID, clientName: playerList[0].clientName });
    matchedList.push([playerList[0].clientID, req.query.clientID, req.query.clientName, playerList[0].clientName]);
    playerList.splice(0, 1);
  }
  else if (pair.length === 1) {
    res.send({ status: "matched", clientID: pair[0][1], clientName: pair[0][2] });
    matchedList.splice(0, 1);
    gamersList.push(pair);
    pair.splice(0, 1);
  }
  else if ((playerList.length === 1) && (filterCheck.length === 1)) {
    res.send({ status: "waiting" });
  }
  res.status(200);
});