const express = require('express');
const app = express();
// For parsing application/json
app.use(express.json());
// For parsing application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));
const PORT = 3000;
const playerList = [];
const matchedList = [];

app.listen(PORT, (error) => {
    if (!error) {
        console.log("Server is Successfully Running, and App is listening on port " + PORT);
    }
    else {
        console.log("Error occurred, server can't start", error);
    }
  }
);

app.get('/', (req, res) => {
  const pair = matchedList.filter(match => (match[0] === req.query.clientID));
  const filterCheck = playerList.filter(player => (player.clientID === req.query.clientID));
  if ((playerList.length === 0) && (pair.length === 0)) {
    playerList.push(req.query);
    res.send("Kindly wait for a match");
  }
  else if ((playerList.length === 1) && (filterCheck.length === 0) && (pair.length === 0)) {
    console.log("" + req.query.clientName + " got matched with " + playerList[0].clientName);
    res.send("You got matched with " + playerList[0].clientName);
    matchedList.push([playerList[0].clientID, req.query.clientID, req.query.clientName]);
    playerList.splice(0, 1);
  }
  else if (pair.length === 1) {
    res.send("You got matched with " + pair[0][2]);
    matchedList.splice(0, 1);
    pair.splice(0, 1);
  }
  else if ((playerList.length === 1) && (filterCheck.length === 1)) {
    res.send("Kindly wait for a match");
  }
  res.status(200);
});