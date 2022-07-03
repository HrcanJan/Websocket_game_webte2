//Inspirovane https://github.com/hnasr/javascript_playground/blob/master/websocket-cell-game/index.html
let joined = false;
let clientId = null;
let gameId = null;
let playerColor = null;
let playerPos;
let playerDir = [0, 1];

let up = false;
let down = false;
let left = false;
let right = true;
let end = false;

const hp = [];

for(let i = 0; i < 30; i++){
    hp[i] = [];
    for(let j = 0; j < 20; j++)
        hp[i][j] = 0;
}

const btnCreate = document.getElementById("btnCreate");
const btnJoin = document.getElementById("btnJoin");
const txtGameId = document.getElementById("txtGameId");
const winner = document.getElementById("winner");

const c = document.getElementById("MyCanvas");
const ctx = c.getContext("2d");

const setFilled = (x, y, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(x * 20, y * 20, 20, 20);
}

hp.forEach((row, x) => {
    hp.forEach((cell, y) => {
        setFilled(x, y,  "white")
    })
})

const socket = new WebSocket('wss://site76.webte.fei.stuba.sk:9000');

btnJoin.addEventListener("click", () => {

    gameId = txtGameId.value;

    const payLoad = {
        "method": "join",
        "clientId": clientId,
        "gameId": gameId,
        "joined": joined
    }

    socket.send(JSON.stringify(payLoad));

})

btnCreate.addEventListener("click", () => {

    const payLoad = {
        "method": "create",
        "clientId": clientId
    }

    socket.send(JSON.stringify(payLoad));

})

socket.onmessage = message => {

    const response = JSON.parse(message.data);

    // Connect
    if (response.method === "connect"){
        clientId = response.clientId;
    }

    // Create
    if (response.method === "create"){
        gameId = response.game.id;
        txtGameId.value = response.game.id;
    }

    // Play
    if (response.method === "play"){
        setInterval(() => {
            if(!end) {
                playerPos[0] += playerDir[0];
                playerPos[1] += playerDir[1];

                if (playerPos[0] > 29 || playerPos[0] < 0 || playerPos[1] > 19 || playerPos[1] < 0 ||
                    hp[playerPos[0]][playerPos[1]] === 1) {
                    const payLoad = {
                        "method": "end",
                        "color": playerColor,
                        "game": response.game
                    }

                    socket.send(JSON.stringify(payLoad))
                }

                hp[playerPos[0]][playerPos[1]] = 1;
                setFilled(playerPos[1], playerPos[0], playerColor);

                const payLoad = {
                    "method": "play",
                    "clientId": clientId,
                    "gameId": gameId,
                    "tileX": playerPos[0],
                    "tileY": playerPos[1],
                    "color": playerColor,
                }

                socket.send(JSON.stringify(payLoad))
            }

        }, 1000);

        document.onkeydown = (e) => {
            e = e || window.event;

            if(e.keyCode === 37){
                if(!right){
                    playerDir = [0, -1];
                    left = true;
                    up = false;
                    down = false;
                    right = false;
                }
            }
            else if(e.keyCode === 38){
                if(!down){
                    playerDir = [-1, 0];
                    left = false;
                    up = true;
                    down = false;
                    right = false;
                }
            }
            else if(e.keyCode === 39){
                if(!left){
                    playerDir = [0, 1];
                    left = false;
                    up = false;
                    down = false;
                    right = true;
                }
            }
            else if(e.keyCode === 40){
                if(!up){
                    playerDir = [1, 0];
                    left = false;
                    up = false;
                    down = true;
                    right = false;
                }
            }
        }
    }

    // Update
    if (response.method === "update") {
        if (!response.game.state) return;

        response.game.state.forEach( state => {
            setFilled(state["Y"], state["X"], state["color"]);
            hp[state["X"]][state["Y"]] = 1;
        })
    }

    // Join
    if (response.method === "join"){
        joined = true;
        const game = response.game;

        game.clients.forEach (cl => {
            if (cl.clientId === clientId) {
                playerColor = cl.color;
                playerPos = cl.pos;
            }
        })
    }

    // End
    if(response.method === "end"){
        end = true;

        if(response.color === "Red")
            winner.textContent = "Blue wins!"
        else
            winner.textContent = "Red wins!"
    }
}

// W3Schools
function copy() {
    /* Get the text field */
    let copyText = document.getElementById("txtGameId");

    /* Select the text field */
    copyText.select();
    copyText.setSelectionRange(0, 99999); /* For mobile devices */

    /* Copy the text inside the text field */
    navigator.clipboard.writeText(copyText.value);
}