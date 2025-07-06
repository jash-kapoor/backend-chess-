const express = require("express");
const socket = require("socket.io");
const http = require("http");
const { Chess } = require("chess.js");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socket(server);

const chess = new Chess();
let players = {};

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "Public")));

app.get("/", (req, res) => {
    res.render("index", { title: "Chess Game" });
});

io.on("connection", function(uniquesocket) {
    if (!players.white) {
        players.white = uniquesocket.id;
        uniquesocket.emit("playerRole", "w");
    } else if (!players.black) {
        players.black = uniquesocket.id;
        uniquesocket.emit("playerRole", "b");
    } else {
        uniquesocket.emit("spectatorRole");
    }

    uniquesocket.on("move", (move) => {
        try {
            const turn = chess.turn();
            const playerId = uniquesocket.id;

            if (turn === "w" && playerId !== players.white) return;
            if (turn === "b" && playerId !== players.black) return;

            const result = chess.move(move);
            if (result) {
                io.emit("move", move);
                io.emit("boardState", chess.fen());
            } else {
                uniquesocket.emit("invalidMove", move);
            }
        } catch (err) {
            uniquesocket.emit("invalidMove", move);
        }
    });

    uniquesocket.on("disconnect", function() {
        if (uniquesocket.id === players.white) {
            delete players.white;
        } else if (uniquesocket.id === players.black) {
            delete players.black;
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, function() {
    console.log(`Listening on port ${PORT}`);
});

