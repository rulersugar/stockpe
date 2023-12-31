const express = require("express");
const app = express();
const btoa = require("btoa");
const superagent = require("superagent");
const config = require("./config.json");
const stocksImport = require("./stocks.json");
const math = require("mathjs");
const crypto = require("crypto");
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
const userDetails = {};
const uuidList = [];

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
    const pictures = {};
    pictures[playerList[0].clientID] = playerList[0].clientAvatar;
    pictures[req.query.clientID] = req.query.clientAvatar;
    res.send({ status: "matched", clientID: playerList[0].clientID, clientName: playerList[0].clientName, clientAvatar: playerList[0].clientAvatar });
    matchedList.push([playerList[0].clientID, req.query.clientID, req.query.clientName, playerList[0].clientName, req.query.clientAvatar]);
    gamersList.push([playerList[0].clientID, req.query.clientID, req.query.clientName, playerList[0].clientName, pictures]);
    playerList.splice(0, 1);
  }
  else if (pair.length === 1) {
    res.send({ status: "matched", clientID: pair[0][1], clientName: pair[0][2], clientAvatar: pair[0][4] });
    matchedList.splice(0, 1);
  }
  else if ((playerList.length === 1) && (filterCheck.length === 1)) {
    res.send({ status: "waiting" });
  }
});

app.get("/login", (req, res) => {
  if (req.query.uuid === undefined) {
    const uuid = crypto.randomUUID();
    uuidList.push(uuid);
    res.status(200).send({ result: uuid });
  }
  else if ((typeof userDetails[req.query.uuid]) !== "undefined") {
    let i = 0;
    for (const uuid of uuidList) {
      if (uuid === req.query.uuid) {
        uuidList.splice(i, 1);
        for (const uuid in userDetails) {
          if (uuid === req.query.uuid) {
            const userInfo = userDetails[uuid];
            userInfo.OAuthComplete = true;
            delete userDetails[uuid];
            res.send(userInfo);
            break;
          }
        }
        break;
      }
      else {
        i = i + 1;
      }
    }
  }
  else if ((uuidList.includes(req.query.uuid)) && (req.query.initialRequest === "true")) {
    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientID}&redirect_uri=https://${hostname}/auth&response_type=code&scope=openid%20profile%20email&state=${req.query.uuid}`);
  }
  else {
    res.send({ OAuthComplete: false });
  }
});

app.get("/auth", async (req, res) => {
  if (uuidList.includes(req.query.state) === true) {
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
    };
    const userInfo = await superagent.get("https://openidconnect.googleapis.com/v1/userinfo").set(header);
    
    if (userInfo.body.email_verified === true) {
      userDetails[req.query.state] = userInfo.body;
      res.send("You've been logged in. Kindly get back to the application.");
    }
    else {
      res.send("Your Google Account has not yet been verified. Kindly verify your Google Account and try again.");
    }
  }
  else {
    res.status(403).send("Unauthorized.");
    console.log(req);
  }
});

app.get("/stocks", (_req, res) => {
  res.json(stocks);
});

app.post("/balance", (req, res) => {
  const response = stocks;
  const portfolio = req.body;
  let i = 0;
  let n = 0;
  let balance = 0;

  function responseIteration(symbol) {
    if (symbol === response[i].Symbol) {
        const returnResponse = response[i].Price;
        i = 0;
        return returnResponse;
    }
    else {
        i = i + 1;
        return new Promise((resolve, _reject) => setTimeout(() => resolve(responseIteration(symbol)), 0));
    }
  }

  async function calcBalance() {
    if (n <= (portfolio.length - 1)) {
        const { id, qty } = portfolio[n];
        const idPrice = await responseIteration(id);
        const stockPrice = (qty * idPrice);
        balance = balance + stockPrice;
        n = n + 1;
        return new Promise((resolve, _reject) => setTimeout(() => resolve(calcBalance()), 0));
    }
    else {
        return balance;
    }
  }

  async function wrapper() {
    const bal = await calcBalance();
    res.send({
      result: bal
    });
  }

  wrapper();
});

app.get("/result", (req, res) => {
  const pair = gamersList.filter(match => ((match[0] === req.query.clientID) || (match[1] === req.query.clientID)));
  const index = gamersList.findIndex(match => ((match[0] === req.query.clientID) || (match[1] === req.query.clientID)));
  if (pair[0].length === 5) {
    const obj = {};
    obj[req.query.clientID] = req.query.balance;
    gamersList[index].push(obj);
    res.send({
      result: "await"
    });
  }
  else if ((Object.keys(pair[0][5])[0] !== req.query.clientID) || (Object.keys(pair[0][5]).length !== 1)) {
    (gamersList[index][5])[req.query.clientID] = req.query.balance;
    const objKeys = Object.keys(((gamersList[index])[5]));
    const result = math.compare(gamersList[index][5][objKeys[0]], gamersList[index][5][objKeys[1]]);
    let splicedData;

    if (!Array.isArray(gamersList[index][5]["downloaded"])) {
      gamersList[index][5]["downloaded"] = [ req.query.clientID ];
    }
    else {
      splicedData = gamersList.splice(index, 1);
    }

    if (result === 1) {
      (!Array.isArray(splicedData)) ? (res.send({ winner: objKeys[0], winnerAvatar: gamersList[index][4][objKeys[0]], data: gamersList[index][5] })) : (res.send({ winner: objKeys[0], winnerAvatar: splicedData[0][4][objKeys[0]], data: splicedData[0][5] }));
    }
    else if (result === -1) {
      (!Array.isArray(splicedData)) ? (res.send({ winner: objKeys[1], winnerAvatar: gamersList[index][4][objKeys[1]], data: gamersList[index][5] })) : (res.send({ winner: objKeys[1], winnerAvatar: splicedData[0][4][objKeys[1]], data: splicedData[0][5] }));
    }
    else if (result === 0) {
      (!Array.isArray(splicedData)) ? (res.send({ winner: "tie", data: gamersList[index][5] })) : (res.send({ winner: "tie", data: splicedData[0][5] }));
    }
  }
  else {
    res.send({
      result: "await"
    });
  }
});