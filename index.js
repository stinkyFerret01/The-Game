//////---1---////// SERVER CONFIG
const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();

app.use(express.json());
app.use(cors());

//////---2---////// DATABASE-CONFIG
const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/The-Game-Data");

//-2a-// modeles
const Player = mongoose.model("Player", {
  mail: String,
  name: String,
  account: {
    salt: String,
    hash: String,
    token: String,
    accessLevel: Number,
  },
  settings: {},
  score: { score: Number, level: Number },
});

//////---3---////// AUTHENTIFICATION

//-3a-// cryptage de MDP, génération de tokens
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");

//-3b-// authentification administrateur
const isAdmin = async (req, res, next) => {
  try {
    const admin = await Player.findById(req.body.id);
    console.log(admin.account.isAdmin);
    if (admin.account.accessLevel > 1) {
      console.log("ok");
      return next();
    } else {
      return res
        .status(401)
        .json({ error: "Unauthorized", player: admin.name });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

//////---4---////// ROUTES

//--4a--// test
app.post("/game/admin", isAdmin, async (req, res) => {
  res.json({ message: "youre an admin" });
});

//--4b--// enregistrement de joueurs (signUp)
app.post("/player/signup", async (req, res) => {
  try {
    if (
      req.body.name === undefined ||
      req.body.mail === undefined ||
      req.body.password === undefined
    ) {
      res.status(400).json({
        Alerte:
          "Les informations que vous nous avez transmises ne permettent pas la création de votre compte(infos manquantes ou invalides)",
        Détails:
          "pour vous enregistrer, vous devez nous transmettre un nom, une adresse mail et un mot de passe",
      });
    } else {
      const player = await Player.findOne({ name: req.body.name });
      if (player === null) {
        const newSalt = uid2(16);
        const newHash = SHA256(req.body.password + newSalt).toString(encBase64);
        const token = uid2(32);
        const newPlayer = new Player({
          mail: req.body.mail,
          name: req.body.name,
          account: {
            salt: newSalt,
            hash: newHash,
            token: token,
            accessLevel: 0,
          },
          settings: {},
          score: { score: 0, level: 1 },
        });
        await newPlayer.save();
        res.status(200).json({
          message: "enregistrement terminé!",
          playerData: {
            name: newPlayer.name,
            score: newPlayer.score,
            token: newPlayer.account.token,
            accessLevel: newPlayer.account.accessLevel,
          },
        });
      } else {
        res.status(400).json({
          Alerte: "Un joueur a déja choisi ce nom!",
        });
      }
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//--4c--// connection de joueurs (login)
app.post("/player/login", async (req, res) => {
  try {
    const connectingPlayer = await Player.findOne({ mail: req.body.mail });
    if (connectingPlayer === null) {
      res
        .status(400)
        .json({ Alerte: "votre Mot de passe ou votre email est invalide..." });
    } else if (
      connectingPlayer.account.hash ===
      SHA256(req.body.password + connectingPlayer.account.salt).toString(
        encBase64
      )
    ) {
      console.log(connectingPlayer);
      genToken = uid2(32);
      connectingPlayer.account.token = genToken;
      await connectingPlayer.save();
      res.status(200).json({
        message: "Vous êtes connecté!",
        playerData: {
          name: connectingPlayer.name,
          score: connectingPlayer.score,
          token: connectingPlayer.account.token,
          accessLevel: connectingPlayer.account.accessLevel,
        },
      });
    } else {
      res.status(400).json({
        Alerte: "votre Mot de passe ou votre email est invalide!",
      });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//--4d--// connection automatique de joueurs via leur token (autologin)
app.post("/player/autologin", async (req, res) => {
  try {
    const connectingPlayer = await Player.findOne({ name: req.body.name });
    if (connectingPlayer === null) {
      res.status(400).json({
        Alerte:
          "vous ne faites pas parti de notre base de données, vous devez vous enregistrer",
      });
    } else if (connectingPlayer.account.token !== req.body.token) {
      res.status(400).json({
        Alerte: "votre token a expiré, vous devez vous reconnecter",
      });
    } else {
      res.status(200).json({
        message: "Vous êtes connecté!",
        playerData: {
          name: connectingPlayer.name,
          score: connectingPlayer.score,
          accessLevel: connectingPlayer.account.accessLevel,
        },
      });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//--4e--// acces au leader-board
app.get("/game/lead", async (req, res) => {
  try {
    const leaderBoard = [];
    const playersData = await Player.find();
    playersData.forEach((player) =>
      leaderBoard.push({ name: player.name, score: player.score.score })
    );
    leaderBoard.sort(function (a, b) {
      return b.score - a.score;
    });
    res.status(200).json({ leaderBoard: leaderBoard });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//--404--//
app.all("*", (req, res) => {
  res.status(404).json({ Alerte: "Page not found" });
});

//////---5---//////PORT CONFIG
app.listen(3000, () => {
  console.log("Server has started");
});
