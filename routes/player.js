//-0-// CONFIG
const express = require("express");
const router = express.Router();

//-0a-// déclaration des niveaux d'access
const playerlvl = 2;

//-1-// cryptage de MDP, génération de tokens
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");

//-2-// import des modeles
const Player = require("../models/Player");

//-3-// ROUTES
//-3a-// enregistrement de joueurs (signUp)
router.post("/player/signup", async (req, res) => {
  try {
    if (
      req.body.name === "" ||
      req.body.mail === "" ||
      req.body.password === "" ||
      req.body.confirmPassword === ""
    ) {
      res.status(202).json({
        alert: "tous les champs de ce formulaire doivent être remplis",
      });
    } else if (req.body.name.length < 3 || req.body.name.length > 10) {
      res.status(202).json({
        alert: "votre nom doit contenir entre 3 et 10 caractères",
      });
    } else if (req.body.password.length < 6 || req.body.password.length > 12) {
      res.status(202).json({
        alert: "votre mot de passe doit contenir entre 6 et 12 caractères",
      });
    } else if (req.body.password !== req.body.confirmPassword) {
      res.status(202).json({
        alert:
          "le mot de passe et la confirmation du mot de passe doivent être strictement identiques",
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
          avatar:
            "https://avatars.dicebear.com/api/male/john.svg?background=%230000ff",
          accessLevel: playerlvl,
          account: {
            salt: newSalt,
            hash: newHash,
            token: token,
          },
          settings: {},
          score: { score: 0, level: 1 },
        });
        await newPlayer.save();
        res.status(200).json({
          message: "enregistrement terminé!",
          playerData: {
            id: newPlayer._id,
            name: newPlayer.name,
            avatar: newPlayer.avatar,
            score: newPlayer.score,
            token: newPlayer.account.token,
            accessLevel: newPlayer.account.accessLevel,
          },
        });
      } else {
        res.status(202).json({
          alert: "un joueur a déja choisi ce nom!",
        });
      }
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//-3b-// connexion de joueurs (login)
router.post("/player/login", async (req, res) => {
  try {
    const connectingPlayer = await Player.findOne({ mail: req.body.mail });
    if (connectingPlayer === null) {
      res
        .status(202)
        .json({ alert: "votre Mot de passe/email est invalide..." });
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
          id: connectingPlayer._id,
          name: connectingPlayer.name,
          avatar: connectingPlayer.avatar,
          score: connectingPlayer.score,
          token: connectingPlayer.account.token,
          accessLevel: connectingPlayer.accessLevel,
        },
      });
    } else {
      res.status(202).json({
        alert: "votre Mot de passe/email est invalide!",
      });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//-3c-// connexion automatique de joueurs via leur token (autologin)
router.post("/player/autologin", async (req, res) => {
  try {
    const connectingPlayer = await Player.findOne({ name: req.body.name });
    if (connectingPlayer === null) {
      res.status(202).json({
        alert:
          "vous ne faites pas parti de notre base de données, vous devez vous enregistrer",
      });
    } else if (connectingPlayer.account.token !== req.body.token) {
      res.status(202).json({
        alert: "votre token a expiré, vous devez vous reconnecter",
      });
    } else {
      res.status(200).json({
        message: "vous êtes connecté!",
        playerData: {
          id: connectingPlayer._id,
          name: connectingPlayer.name,
          avatar: connectingPlayer.avatar,
          score: connectingPlayer.score,
          accessLevel: connectingPlayer.accessLevel,
        },
      });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
