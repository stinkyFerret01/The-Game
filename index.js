//////---1---////// SERVER CONFIG
const express = require("express");
const app = express();
const cors = require("cors");

require("dotenv").config();

app.use(express.json());
app.use(cors());

//////---3---////// connexion à la base de données
const mongoose = require("mongoose");
mongoose.connect(process.env.DATABASE_URL);

//////---5---////// ROUTES
//--5test--//
app.post("/test", async (req, res) => {
  console.log("test ok");
});

//--5a--// connection du joueur (3 routes)
const connectionRoutes = require("./routes/player.js");
app.use(connectionRoutes);

//--5b--// administration (promotion/retrogradation, ban...)
const adminRoutes = require("./routes/admin.js");
app.use(adminRoutes);

//--5c--// chats (gestion des messages, liste de joueurs)
const chatsRoutes = require("./routes/chats.js");
app.use(chatsRoutes);

//--5d--// settings (enregistrements des préférences du joueurs)
const settingsRoutes = require("./routes/settings.js");
app.use(settingsRoutes);

//--5e--// game (acces au leader-board)
const gameRoutes = require("./routes/game.js");
app.use(gameRoutes);

//--/404/--//
app.all("*", (req, res) => {
  res.status(404).json({ Alerte: "Page not found" });
});

//////---6---////// PORT CONFIG
const server = app.listen(process.env.PORT || 3000, () => {
  console.log("Server has started");
});

//////---7---////// SOCKETS
//-- premiere utilisation de sockets dans un projet
const socket = require("socket.io");
const io = socket(server, {
  cors: {
    origin: "*",
    credentials: true,
  },
});

global.onlinePlayers = new Map();
io.on("connection", (socket) => {
  console.log("socket connection");
  console.log(socket.id);
  socket.on("addPlayer", (data) => {
    console.log(socket.id);
    console.log("socket add-players");
    onlinePlayers.set(data.from, socket.id);
  });
  socket.on("send-msg", (data) => {
    const socketId = onlinePlayers.get(data.publisherId);
    console.log(socketId);
    const msg = {
      publisherId: data.publisherId,
      publisherName: data.publisherName,
      publisherMessage: data.publisherMessage,
      publisherAccessLevel: data.publisherAccessLevel,
      publicationDate: "none",
    };
    console.log("socket send-msg");
    if (data.publisherName && data.publisherMessage) {
      io.emit("retour", msg);
    }
  });
});
