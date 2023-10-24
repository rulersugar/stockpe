const webSocket = new self.WebSocket("wss://c17c-2409-40f4-11-9268-2116-e049-500f-cd72.ngrok-free.app");
webSocket.onopen = (event) => {
    webSocket.send("Riya");
};
webSocket.onmessage = (event) => {
    console.log(event.data);
    alert(event.data);
};