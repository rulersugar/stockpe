const express = require("express");
const app = express();
const btoa = require("btoa");
const superagent = require("superagent");
const config = require("./config.json");
// For parsing application/json
app.use(express.json());
// For parsing application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));
const { clientID, clientSecret, hostname } = config;
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

app.get("/login", (req, res) => {
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientID}&redirect_uri=https://${hostname}/auth&response_type=code&scope=openid%20profile%20email`)
});

app.get("/auth", async (req, res) => {
  const headers = {
    Authorization: `Basic ${btoa(`${clientID}:${clientSecret}`)}`,
    "Content-Type": "x-www-form-urlencoded"
  };
  const queryParams = {
    grant_type: "authorization_code",
    code: req.query.code,
    redirect_uri: `https://${hostname}/auth`
  };

  const request = await superagent.post("https://oauth2.googleapis.com/token").query(queryParams).set(headers);
  const userToken = request.body.access_token;
  const header = {
    Authorization: `Bearer ${userToken}`
  }
  const userInfo = await superagent.get("https://openidconnect.googleapis.com/v1/userinfo").set(header);
  console.log(userInfo);
  res.send("OK");
});