const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const players = {};

io.on("connection", (socket) => {
  socket.on("joinGame", (data) => {
    players[socket.id] = {
      id: socket.id,
      name: data.name || "Siswa",
      faseId: data.faseId || "fase-a",
      color: data.color || "#3b82f6",
      avatarType: data.avatarType || "av-01",
      pos: [0, 0, 5],
      rotY: 0,
      isMoving: false,
      isEliminated: false,
    };
    io.emit("updatePlayers", players);
  });

  socket.on("movePlayer", (data) => {
    if (players[socket.id]) {
      players[socket.id].pos = data.pos;
      players[socket.id].rotY = data.rotY;
      players[socket.id].isMoving = data.isMoving;
      socket.broadcast.emit("playerMoved", players[socket.id]);
    }
  });

  socket.on("eliminationState", (isEliminated) => {
    if (players[socket.id]) {
      players[socket.id].isEliminated = Boolean(isEliminated);
      io.emit("updatePlayers", players);
    }
  });

  socket.on("startAdventureAll", ({ faseId }) => {
    Object.values(players).forEach((p) => {
      if (p.faseId === faseId) {
        p.isEliminated = false;
      }
    });
    io.emit("updatePlayers", players);
    io.emit("adventureStarted", { faseId });
  });

  socket.on("disconnect", () => {
    delete players[socket.id];
    io.emit("updatePlayers", players);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server PJOKVerse berjalan di port ${PORT}`);
});