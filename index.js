const WebSocket = require('ws');
const https = require('https');
const fs = require('fs');

const server = https.createServer({
    cert: fs.readFileSync("./webte.fei.stuba.sk-chain-cert.pem"),
    key: fs.readFileSync("./webte.fei.stuba.sk.key")
})
const clients = {};
const games = {};

server.listen(9000);

const ws = new WebSocket.Server({server});

ws.on('connection', (socket) => {
    console.log("New connection")

    // Received a message from a client
    socket.on("message", (data) =>{
        const result = JSON.parse(data)

        // Creating new client
        if (result.method === "create") {
            const clientId = result.clientId;
            const gameId = guid();
            games[gameId] = {
                "id": gameId,
                "clients": []
            }

            const payLoad = {
                "method": "create",
                "game" : games[gameId]
            }

            const con = clients[clientId].connection;
            con.send(JSON.stringify(payLoad));
        }

        // Client wants to join a game
        if (result.method === "join") {

            // Same player cannot join twice
            if(result.joined)
                return;

            let clientId = result.clientId;
            let gameId = result.gameId;
            let game = games[gameId];

            // Cannot join invalid game code
            if(!game)
                return;

            if (game.clients.length >= 2)
                // Max players reached
                return;

            const color =  {"0": "Red", "1": "Blue"}[game.clients.length]
            const pos = {"0": [1, 1], "1": [28, 1]}[game.clients.length]
            game.clients.push({
                "clientId": clientId,
                "color": color,
                "pos": pos
            })

            const payLoad = {
                "method": "join",
                "game": game
            }

            // Inform the 1st player that the 2nd one joined
            game.clients.forEach(c => {
                clients[c.clientId].connection.send(JSON.stringify(payLoad))
            })

            // Start the game
            if (game.clients.length === 2) {
                updateGameState();

                const payLoad = {
                    "method": "play",
                    "game": game
                }

                game.clients.forEach(c => {
                    clients[c.clientId].connection.send(JSON.stringify(payLoad))
                })
            }
        }

        // Play
        if (result.method === "play") {
            const gameId = result.gameId;
            const tileX = result.tileX;
            const tileY = result.tileY;
            const color = result.color;
            let state = games[gameId].state;
            if (!state)
                state = []

            let stateA = {};
            stateA["X"] = tileX;
            stateA["Y"] = tileY;
            stateA["color"] = color;

            state.push(stateA);
            games[gameId].state = state;

        }

        if(result.method === "end") {

            const payLoad = {
                "method": "end",
                "color": result.color
            }

            result.game.clients.forEach(c => {
                clients[c.clientId].connection.send(JSON.stringify(payLoad))
            })
        }
    })

    // Generate a new clientId
    const clientId = guid();
    clients[clientId] = {
        "connection":  socket
    }

    const payLoad = {
        "method": "connect",
        "clientId": clientId
    }

    //Send back the client connection
    socket.send(JSON.stringify(payLoad))
})

function updateGameState(){

    for (const g of Object.keys(games)) {
        const game = games[g]
        const payLoad = {
            "method": "update",
            "game": game
        }

        game.clients.forEach(c => {
            clients[c.clientId].connection.send(JSON.stringify(payLoad))
        })
    }

    // A second
    setTimeout(updateGameState, 1000);
}



function S4() {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
}

// then to call it, plus stitch in '4' in the third group
const guid = () => (S4() + S4() + "-" + S4() + "-4" + S4().substr(0,3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();