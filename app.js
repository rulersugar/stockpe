const express = require("express");
const app = express();
const btoa = require("btoa");
const superagent = require("superagent");
const config = require("./config.json");
const stocksImport = require("./stocks.json");
const math = require("mathjs");
const stocks = stocksImport.list;
// For parsing application/json
app.use(express.json());
// For parsing application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));
const { clientID, clientSecret, hostname } = config;
const PORT = 3000;
const playerList = [];
const matchedList = [];
const gamersList = [];

function startStockPriceRandomizer() {
  setInterval(randomizeStockPrices, Math.floor(Math.random() * (90 - 10) + 10) * 1000);
}

function randomizeStockPrices() {
  const realisticPriceChange = () => (Math.random() * 0.4 - 0.2); // Simulate price change between -20% to 20%
  for (let i = 0; i < stocks.length; i++) {
    const stock = stocks[i];
    const previousPrice = stock.Price;
    const priceChange = realisticPriceChange();
    const newPrice = Math.max(0.01, stock.Price + priceChange).toFixed(2); // Ensure the price has at most 2 digits after the decimal point
    stock.Price = parseFloat(newPrice);
    const priceDiff = stock.Price - previousPrice;
    if (priceDiff > 0) {
      stock.medium = "inc";
      stock.percent = parseFloat((priceDiff / previousPrice * 100).toFixed(2));
    } else if (priceDiff < 0) {
      stock.medium = "dec";
      stock.percent = parseFloat((priceDiff / previousPrice * 100).toFixed(2));
    } else {
      stock.medium = "same";
      stock.percent = 0.00;
    }
  }
}

setInterval(randomizeStockPrices, 6000); // Randomize every 6 seconds

app.listen(PORT, (error) => {
    if (!error) {
        console.log("Server is Successfully Running, and App is listening on port " + PORT);
        startStockPriceRandomizer();
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
    res.send({ status: "matched", clientID: playerList[0].clientID, clientName: playerList[0].clientName });
    matchedList.push([playerList[0].clientID, req.query.clientID, req.query.clientName, playerList[0].clientName]);
    gamersList.push([playerList[0].clientID, req.query.clientID, req.query.clientName, playerList[0].clientName]);
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

app.get("/login", (_req, res) => {
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientID}&redirect_uri=https://${hostname}/auth&response_type=code&scope=openid%20profile%20email`);
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

  res.send(userInfo);
});

app.get("/stocks", (_req, res) => {
  res.json(stocks);
});

app.get("/result", (req, res) => {
  const pair = gamersList.filter(match => (match[0] === req.body.clientID));
  const index = gamersList.indexOf(pair);
  if (pair[4] === undefined) {
    const obj = {};
    obj[req.query.clientID] = req.query.balance;
    gamersList[index].push(obj);
  }
  else {
    gamersList[index][4][req.query.clientID] = req.query.balance;
    const objKeys = gamersList[index][4].keys();
    let splicedData;
  
    if (objKeys.length === 2) {
      const result = math.compare(gamersList[index][4][objKeys[0]], gamersList[index][4][objKeys[1]]);

      if (gamersList[index][4]["downloaded"] === undefined) {
        gamersList[index][4]["downloaded"] = [ req.query.clientID ];
      }
      else {
        splicedData = gamersList.splice(index, 1);
      }

      if (result === 1) {
        (splicedData === undefined) ? (res.send({ winner: objKeys[0], data: gamersList[index][4]})) : (res.send({ winner: objKeys[0], data: splicedData[4]}));
      }
      else if (result === -1) {
        (splicedData === undefined) ? (res.send({ winner: objKeys[1], data: gamersList[index][4]})) : (res.send({ winner: objKeys[1], data: splicedData[4]}));
      }
      else if (result === 0) {
        (splicedData === undefined) ? (res.send({ winner: "tie", data: gamersList[index][4]})) : (res.send({ winner: "tie", data: splicedData[4]}));
      }
    }
  }
});