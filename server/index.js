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
  console.log("Siswa bergabung:", socket.id);

  socket.on("joinGame", (data) => {
players[socket.id] = {
      id: socket.id,
      name: data.name || "Siswa",
      faseId: data.faseId,
      color: data.color || "#3b82f6",
      avatarType: data.avatarType || "boy",
      pos: [0, 0, 5],
      rotY: 0,
      isMoving: false,
    };    io.emit("updatePlayers", players);
  });

  socket.on("movePlayer", (data) => {
    if (players[socket.id]) {
      players[socket.id].pos = data.pos;
      players[socket.id].rotY = data.rotY;
      players[socket.id].isMoving = data.isMoving;
      socket.broadcast.emit("playerMoved", {
        id: socket.id,
        ...players[socket.id],
      });
    }
  });

  socket.on("disconnect", () => {
    console.log("Siswa keluar:", socket.id);
    delete players[socket.id];
    io.emit("updatePlayers", players);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server Multiplayer PJOK berjalan di port ${PORT}`);
});