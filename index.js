//////---1---////// SERVER CONFIG

const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();

app.use(express.json());
app.use(cors());

//////---2---////// DATABASE-CONFIG

//-2a-// connexion à la base de données

//-- Online Register
const mongoose = require("mongoose");
mongoose.connect(process.env.DATABASE_URL);

//-- Local Register
// mongoose.connect("mongodb://localhost:27017/The-Game-Data");

//-2b-// modeles
//-- Player
//-- compte utilisateur
const Player = mongoose.model("Player", {
  mail: String,
  name: String,
  accessLevel: Number,
  account: {
    salt: String,
    hash: String,
    token: String,
  },
  settings: {},
  chats: [String],
  score: { score: Number, level: Number },
});

//-- PublicMessage
//-- message destiné au chat publique
const PublicMessage = mongoose.model("PublicMessage", {
  publisherId: String,
  publisherToken: String,
  publisherName: String,
  publisherMessage: String,
  publisherAccessLevel: Number,
  publicationDate: String,
});
//-- PrivateChat
//-- ensemble de message lié à une conversation privée dans un tableau
const PrivateChat = mongoose.model("PrivateChat", {
  seId: String,
  seName: String,
  reId: String,
  reName: String,
  chat: [Object],
});

//////---3---////// AUTHENTIFICATION

//-3a-// cryptage de MDP, génération de tokens
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");

//-3b-// déclaration des niveaux d'access
const bannedlvl = 0;
const restrictedlvl = 1;
const playerlvl = 2;
const player2lvl = 3;
const adminlvl = 5;
const lordlvl = 10;

//-3c-// authentification joueur connecté (non restreint)
const isPlayer = async (req, res, next) => {
  try {
    const player = await Player.findById(req.body.playerId);
    if (
      player &&
      player.account.token === req.body.playerToken &&
      player.accessLevel >= playerlvl
    ) {
      console.log("isPlayer : passed");
      const accessLevel = playerlvl.accessLevel;
      req.access = accessLevel;
      return next();
    } else {
      console.log("isPlayer : NO NO NO!!");
      return res.status(401).json({
        error: "Unauthorized",
        Alerte: "vous n'etes pas authorisé à accéder à ces données",
      });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

//-3d-// authentification joueur connecté niveau 2
const isPlayer2 = async (req, res, next) => {
  try {
    const player2 = await Player.findById(req.body.playerId);
    if (
      player2 &&
      player2.account.token === req.body.playerToken &&
      player2.accessLevel >= player2lvl
    ) {
      console.log("isPlayer2 : passed");
      const accessLevel = player2.accessLevel;
      req.access = accessLevel;
      return next();
    } else {
      console.log("isPlayer2 : NO NO NO!!");
      return res.status(401).json({
        error: "Unauthorized",
        Alerte: "vous n'etes pas authorisé à accéder à ces données",
      });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

//-3f-// authentification administrateur
const isAdmin = async (req, res, next) => {
  try {
    const admin = await Player.findById(req.body.id);
    if (admin.accessLevel >= adminlvl) {
      console.log("isAdmin : passed");
      req.accessLevel = admin.accessLevel;
      return next();
    } else {
      console.log("isAdmin : NO NO NO!!");
      return res.status(401).json({
        error: "Unauthorized",
        Alerte: "vous n'etes pas authorisé à accéder à ces données",
        player: admin.name,
      });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

//--3g--// authentification propriétaire
const isLord = async (req, res, next) => {
  try {
    const lord = await Player.findById(req.body.id);
    if (lord.accessLevel >= lordlvl) {
      console.log("isLord : passed");
      req.accessLevel = lord.accessLevel;
      return next();
    } else {
      console.log("isLord : NO NO NO!!");
      return res.status(401).json({
        error: "Unauthorized",
        Alerte: "vous n'etes pas authorisé à accéder à ces données",
        player: lord.name,
      });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

//////---4---////// ROUTES

//--4a--// test
app.post("/pc", async (req, res) => {
  const tester = await Player.findById(req.body.playerId);
  console.log(tester.chats);
  const displayit = tester.chats;
  console.log(displayit[0]);
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

//--4c--// connexion de joueurs (login)
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
          id: connectingPlayer._id,
          name: connectingPlayer.name,
          score: connectingPlayer.score,
          token: connectingPlayer.account.token,
          accessLevel: connectingPlayer.accessLevel,
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

//--4d--// connexion automatique de joueurs via leur token (autologin)
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
          id: connectingPlayer._id,
          name: connectingPlayer.name,
          score: connectingPlayer.score,
          accessLevel: connectingPlayer.accessLevel,
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
    res.status(200).json({
      message: "requete leaderBoard accordée!",
      leaderBoard: leaderBoard,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//--4f--// récupération de le liste des messages publiques
app.post("/publicchat/get", async (req, res) => {
  try {
    const publicChat = await PublicMessage.find();
    res.status(200).json({
      message: "requête gameChat accordée",
      publicChat: publicChat,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//--4g--// publication d'un message sur le chat public (game chat)
app.post("/publicchat/publish", isPlayer, async (req, res) => {
  try {
    const newPublicMessage = new PublicMessage({
      playerId: req.body.playerId,
      publisherName: req.body.publisherName,
      publisherAccessLevel: req.access,
      publisherMessage: req.body.publisherMessage,
      publicationDate: "en construction",
    });
    await newPublicMessage.save();
    const publicChat = await PublicMessage.find();
    res.status(200).json({ message: "message publié", publicChat: publicChat });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//--4h--// liste des joueurs joignables en chat privé
app.post("/chatterlist/get", isPlayer, async (req, res) => {
  try {
    const player = await Player.findById(req.body.playerId);
    const chatterList = [];
    const chatterListSens = await Player.find();
    chatterListSens.forEach(
      (chatter) =>
        chatter.name !== player.name &&
        chatterList.push({
          chatterName: chatter.name,
          chatterId: chatter._id,
          chatterAL: chatter.accessLevel,
        })
    );
    res.status(200).json({
      message: "requête chatterList accordée!",
      chatterList: chatterList,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//--4i--// récupération des chat privés
app.post("/privatechat/get", isPlayer, async (req, res) => {
  try {
    const player = await Player.findById(req.body.playerId);
    const chats = player.chats;
    const privateChats = [];
    for (let i = 0; i < chats.length; i++) {
      const chat = await PrivateChat.findById(chats[i]);
      privateChats.push(chat);
    }
    res.status(200).json({
      message: "requête PrivateChats accordée!",
      privateChats: privateChats,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//--4j--// création d'un chat privé ou addition d'un message
app.post("/privatechat/send", isPlayer2, async (req, res) => {
  try {
    let sender = await Player.findById(req.body.playerId);
    let receiver = await Player.findById(req.body.receiverId);
    if (req.body.chatId === "") {
      const newPrivateChat = new PrivateChat({
        seId: sender._id,
        seName: sender.name,
        reId: receiver._id,
        reName: receiver.name,
        receiverAccessLevel: receiver.accessLevel,
        chat: [
          {
            seName: sender.name,
            senderMessage: req.body.senderMessage,
            messageDate: "en construction",
          },
        ],
      });
      let newChats = sender.chats;
      newChats.push(newPrivateChat._id);
      await newPrivateChat.save();
      sender = await Player.findByIdAndUpdate(
        req.body.playerId,
        { chats: newChats },
        { new: true }
      );
      newChats = receiver.chats;
      newChats.push(newPrivateChat._id);
      receiver = await Player.findByIdAndUpdate(
        req.body.receiverId,
        { chats: newChats },
        { new: true }
      );
      res
        .status(200)
        .json({
          message: "message envoyé",
          newPrivateChat: newPrivateChat.chat,
        });
    } else {
      let sender = await Player.findById(req.body.playerId);
      let receiver = await Player.findById(req.body.receiverId);
      const chatToUpdate = await PrivateChat.findById(req.body.chatId);
      chatToUpdate.chat.push({
        seName: sender.name,
        senderMessage: req.body.senderMessage,
        messageDate: "en construction",
      });
      chatToUpdate.seName = sender.name;
      chatToUpdate.reName = receiver.name;
      await chatToUpdate.save();
      res
        .status(200)
        .json({ message: "message envoyé", newPrivateChat: chatToUpdate.chat });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//-- ADMIN only --//

//--4a--// ADMIN // acces à la liste des joueurs (sensible)
app.post("/admin/players", isAdmin, async (req, res) => {
  try {
    const playersList = [];
    const playersData = await Player.find();
    playersData.forEach((player) =>
      playersList.push({
        id: player._id,
        name: player.name,
        mail: player.mail,
        score: player.score,
        accessLevel: player.accessLevel,
      })
    );
    res.status(200).json({
      message: "requête playerList sensible accordée!",
      playersList: playersList,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//--4b--// ADMIN // suppression d'un joueur
app.post("/admin/ban", isAdmin, async (req, res) => {
  try {
    const playerToBan = await Player.findById(req.body.bannedId);
    if (playerToBan.accessLevel < adminlvl) {
      await Player.findByIdAndDelete(req.body.bannedId);
      const newList = [];
      const playersData = await Player.find();
      playersData.forEach((player) =>
        newList.push({
          id: player._id,
          name: player.name,
          mail: player.mail,
          score: player.score,
          accessLevel: player.accessLevel,
        })
      );
      res.status(200).json({
        message: "le joueur a été banni",
        newList: newList,
      });
    } else {
      res.status(400).json({
        Alerte:
          "vous n'êtes pas habilité à effacer ce joueur des bases de données!",
      });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//--4c--// ADMIN // suppression d'un message (chat public)

//-- LORD only --//

//--4a--// LORD // promotion ou rétrogradation d'un joueur au rang d'administrateur
app.put("/lord/promote", isLord, async (req, res) => {
  try {
    const playerToPromote = await Player.findByIdAndUpdate(
      req.body.promotedId,
      { accessLevel: req.body.newAL },
      { new: true }
    );
    const newList = [];
    const playersData = await Player.find();
    playersData.forEach((player) =>
      newList.push({
        id: player._id,
        name: player.name,
        mail: player.mail,
        score: player.score,
        accessLevel: player.accessLevel,
      })
    );
    res.status(200).json({
      message: "statut modifié!",
      name: playerToPromote.name,
      accessLevel: playerToPromote.accessLevel,
      newList: newList,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//--/404/--//
app.all("*", (req, res) => {
  res.status(404).json({ Alerte: "Page not found" });
});

//////---5---////// PORT CONFIG
app.listen(process.env.PORT || 3000, () => {
  console.log("Server has started");
});
