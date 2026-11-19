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
  console.log("Terhubung:", socket.id);

  socket.on("joinGame", (data) => {
    players[socket.id] = {
      id: socket.id,
      name: data.name || "Siswa",
      faseId: data.faseId || "fase-a",
      color: data.color || "#3b82f6",
      avatarType: data.avatarType || "boy",
      pos: [0, 0, 5],
      rotY: 0,
      isMoving: false,
      isTalking: false,
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

  // Status siswa sedang menekan tombol bicara
  socket.on("talkingState", (isTalking) => {
    if (players[socket.id]) {
      players[socket.id].isTalking = isTalking;
      io.emit("playerTalking", { id: socket.id, isTalking });
    }
  });

  // Penerus sinyal WebRTC (Voice Chat) antar siswa
  socket.on("voice-signal", ({ to, signal }) => {
    io.to(to).emit("voice-signal", {
      from: socket.id,
      signal,
    });
  });

  socket.on("disconnect", () => {
    delete players[socket.id];
    io.emit("updatePlayers", players);
  });
});

app.get("/", (req, res) => {
  res.send("Server PJOKVerse SD + Voice Chat Aktif!");
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});