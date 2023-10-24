import { WebSocketServer } from "ws";
const wss = new WebSocketServer({ port: 8080, clientTracking: true }, console.log("Running on port 8080"));
let playerList = [];

wss.on("connection", function connection(ws) {
  ws.on("message", function message(data) {
    if (playerList.length === 0) {
        playerList.push([ws, data]);
        ws.send("Kindly wait for a match");
    }
    else if (playerList.length === 1) {
        console.log("" + data + " got matched with " + playerList[0][1]);
        ws.send("You got matched with " + playerList[0][1]);
        playerList[0][0].send("You got matched with " + data);
        playerList = playerList.splice(0, 1);
    }
  });

  ws.send("Connected to Game Server!");
});