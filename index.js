//////---1---////// SERVER CONFIG
const express = require("express");
const app = express();
const axios = require("axios");
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
    isAdmin: String,
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
    if (admin.account.isAdmin === "true") {
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
  console.log("ok");
  res.json({ message: "youre an admin" });
});

//--4b--// enregistrement de joueurs (signUp)
app.post("/player/signup", async (req, res) => {
  try {
    console.log("Tout marche bien serveur");
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
      console.log(req.body.name);
      const player = await Player.findOne({ name: req.body.name });
      console.log(player);
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
            isAdmin: "false",
          },
          settings: {},
          score: { score: 0, level: 1 },
        });
        await newPlayer.save();
        res.status(200).json({ message: "enregistrement terminé!" });
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
      genToken = uid2(32);
      connectingPlayer.account.token = genToken;
      await connectingPlayer.save();
      res.status(200).json({
        message: "Vous êtes connecté!",
        token: connectingPlayer.account.token,
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

//--4d--// acces au leader-board
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
    res.status(200).json(leaderBoard);
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
