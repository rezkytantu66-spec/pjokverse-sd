const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

app.get("/", (req, res) => {
  res.send("Server Multiplayer PJOK 3D Aktif!");
});

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
      avatarType: data.avatarType || 1,
      pos: Array.isArray(data.pos) ? data.pos : [0, 0, 5],
      rotY: 0,
      isMoving: false,
      worldMap: data.worldMap || "stadium",
      score: 0,
      characterLevel: 1,
      questionLevel: 1,
      correctCount: 0,
      readExploreCount: 0,
      completedSchoolCount: 0,
      isEliminated: false,
    };
    io.emit("updatePlayers", players);
  });

  socket.on("changeWorld", (data) => {
    if (players[socket.id]) {
      players[socket.id].worldMap = data.worldMap || "stadium";
      if (Array.isArray(data.pos)) {
        players[socket.id].pos = data.pos;
      }
      players[socket.id].isMoving = false;
      io.emit("playerMoved", {
        id: socket.id,
        ...players[socket.id],
      });
      io.emit("updatePlayers", players);
    }
  });

  socket.on("movePlayer", (data) => {
    if (players[socket.id]) {
      players[socket.id] = {
        ...players[socket.id],
        ...data,
        pos: Array.isArray(data.pos) ? data.pos : players[socket.id].pos,
        rotY: typeof data.rotY === "number" ? data.rotY : players[socket.id].rotY,
        isMoving: Boolean(data.isMoving),
        worldMap: data.worldMap || players[socket.id].worldMap || "stadium",
      };
      socket.broadcast.emit("playerMoved", {
        id: socket.id,
        ...players[socket.id],
      });
    }
  });

  socket.on("eliminationState", (isEliminated) => {
    if (players[socket.id]) {
      players[socket.id].isEliminated = Boolean(isEliminated);
      io.emit("updatePlayers", players);
    }
  });

  socket.on("startAdventureAll", ({ faseId }) => {
    io.emit("adventureStarted", { faseId });
  });

  socket.on("startBridgeRaceAll", ({ faseId }) => {
    io.emit("bridgeRaceStarted", { faseId });
  });

  socket.on("removeStudent", ({ studentId, studentName, faseId }) => {
    if (studentId && players[studentId]) {
      delete players[studentId];
    }
    if (studentName) {
      Object.keys(players).forEach((pid) => {
        if (
          players[pid].faseId === faseId &&
          String(players[pid].name).trim().toLowerCase() ===
            String(studentName).trim().toLowerCase()
        ) {
          delete players[pid];
        }
      });
    }
    io.emit("kickedByTeacher", { targetId: studentId, targetName: studentName });
    io.emit("updatePlayers", players);
  });

  socket.on("disconnect", () => {
    if (players[socket.id]) {
      delete players[socket.id];
      io.emit("updatePlayers", players);
    }
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});