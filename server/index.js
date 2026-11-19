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

app.get("/", (req, res) => {
  res.send("Server PJOK 3D Multiplayer Aktif!");
});

io.on("connection", (socket) => {
  socket.on("joinGame", (data) => {
    players[socket.id] = {
      id: socket.id,
      name: data.name || "Siswa",
      faseId: data.faseId || "fase-a",
      color: data.color || "#3b82f6",
      avatarType: data.avatarType || 1,
      pos: [0, 0, 5],
      rotY: 0,
      isMoving: false,
      isEliminated: false,
      worldMap: "stadium",
      characterLevel: 1,
      questionLevel: 1,
      score: 0,
      correctCount: 0,
      readExploreCount: 0,
    };
    io.emit("updatePlayers", players);
  });

  socket.on("movePlayer", (data) => {
    if (!players[socket.id]) return;
    players[socket.id] = {
      ...players[socket.id],
      ...data,
      id: socket.id,
    };
    socket.broadcast.emit("playerMoved", players[socket.id]);
  });

  socket.on("eliminationState", (isEliminated) => {
    if (!players[socket.id]) return;
    players[socket.id].isEliminated = Boolean(isEliminated);
    io.emit("updatePlayers", players);
  });

  socket.on("startAdventureAll", ({ faseId }) => {
    io.emit("adventureStarted", { faseId });
  });

  // Fitur Guru Menghapus Karakter Siswa
  socket.on("removeStudent", ({ studentId, studentName, faseId }) => {
    if (studentId && players[studentId]) {
      delete players[studentId];
    } else if (studentName) {
      Object.keys(players).forEach((id) => {
        if (
          players[id].faseId === faseId &&
          players[id].name.toLowerCase() === String(studentName).toLowerCase()
        ) {
          delete players[id];
        }
      });
    }
    io.emit("kickedByTeacher", { targetId: studentId, targetName: studentName });
    io.emit("updatePlayers", players);
  });

  socket.on("disconnect", () => {
    delete players[socket.id];
    io.emit("updatePlayers", players);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});