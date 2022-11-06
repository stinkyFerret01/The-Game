//////---1---////// SERVER CONFIG
const express = require("express");
const app = express();

app.use(express.json());
// app.use(cors()); //déploiement

//////---2---////// DATABASE-CONFIG
const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/The-Game-Data");

//-2a-// model
const Player = mongoose.model("Player", {
  account: {
    mail: String,
    name: String,
    salt: String,
    hash: String,
    token: String,
  },
  settings: {},
  score: { score: Number, level: Number },
});

//////---3---////// AUTHENTIFICATION

//-3a- cryptage de MDP, génération de tokens
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");

//////---4---////// ROUTES

//--4a--// test connection a la base de données
app.post("/", async (req, res) => {
  console.log(req.body.name);
  const newPlayer = new Player({
    name: req.body.name,
    mail: req.body.age,
  });
  await newPlayer.save();
  res.json({ message: req.body.name });
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
      const player = await Player.findOne({ name: req.body.name });
      //   const playerByMail = await Player.findOne({ mail: req.body.mail });
      if (player === null) {
        const newSalt = uid2(16);
        const newHash = SHA256(req.body.password + newSalt).toString(encBase64);
        const token = uid2(32);
        const newPlayer = new Player({
          account: {
            mail: req.body.mail,
            name: req.body.name,
            salt: newSalt,
            hash: newHash,
            token: token,
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
//--404--//
app.all("*", (req, res) => {
  res.status(404).json({ Alerte: "Page not found" });
});

//////---5---//////PORT CONFIG
app.listen(3000, () => {
  console.log("Server has started");
});
