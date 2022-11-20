//-0-// CONFIG
const express = require("express");
const router = express.Router();

//-0a-// déclaration des niveaux d'access
const playerlvl = 2;
const player2lvl = 3;

//-1-// FONCTIONS
//-1a-// authentification joueur connecté (non restreint)
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

//-1b-// authentification joueur connecté niveau 2
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

//-1-// dater genere un objet contenant la date et l'heure sous forme de données traitées
const dater = () => {
  let time = Date.now();
  time = Math.floor(time / 1000);

  let second = time % 60;
  let minute = Math.floor((time / 60) % 60);
  let hour = Math.floor(((time + 3600) / 60 / 60) % 24);
  let displayTime = `${hour}` + ":" + `${minute}` + ":" + `${second}`;
  return {
    displayTime: displayTime,
    hour: hour,
    minute: minute,
    second: second,
  };
};

//-2-// import des modeles
const Player = require("../models/Player");
const PublicMessage = require("../models/PublicMessage");
const PrivateChat = require("../models/PrivateChat");

//-3-// ROUTES
//-3a-// récupération de le liste des messages publiques
router.post("/publicchat/get", async (req, res) => {
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

//-3b-// publication d'un message sur le chat public (game chat)
router.post("/publicchat/publish", isPlayer, async (req, res) => {
  try {
    const newPublicMessage = new PublicMessage({
      playerId: req.body.playerId,
      publisherName: req.body.publisherName,
      publisherAccessLevel: req.access,
      publisherMessage: req.body.publisherMessage,
      publicationDate: dater(),
    });
    await newPublicMessage.save();
    const publicChat = await PublicMessage.find();
    res.status(200).json({ message: "message publié", publicChat: publicChat });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//-3c-// liste des joueurs joignables en chat privé
router.post("/chatterlist/get", isPlayer, async (req, res) => {
  try {
    const player = await Player.findById(req.body.playerId);
    const chatterList = [];
    const chatterListSens = await Player.find();
    chatterListSens.forEach(
      (chatter) =>
        chatter.name !== player.name &&
        chatterList.push({
          chatterName: chatter.name,
          chatterAvatar: chatter.avatar,
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

//-3d-// récupération des chat privés
router.post("/privatechat/get", isPlayer, async (req, res) => {
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

//-3e-// création d'un chat privé ou addition d'un message
router.post("/privatechat/send", isPlayer2, async (req, res) => {
  try {
    let sender = await Player.findById(req.body.playerId);
    let receiver = await Player.findById(req.body.receiverId);
    if (req.body.chatId === "") {
      const newPrivateChat = new PrivateChat({
        seId: sender._id,
        seName: sender.name,
        seAvatar: sender.avatar,
        reId: receiver._id,
        reAvatar: receiver.avatar,
        reName: receiver.name,
        receiverAccessLevel: receiver.accessLevel,
        chat: [
          {
            seName: sender.name,
            seAvatar: sender.avatar,
            senderMessage: req.body.senderMessage,
            messageDate: dater(),
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
      res.status(200).json({
        message: "message envoyé",
        newPrivateChat: newPrivateChat.chat,
      });
    } else {
      let sender = await Player.findById(req.body.playerId);
      let receiver = await Player.findById(req.body.receiverId);
      const chatToUpdate = await PrivateChat.findById(req.body.chatId);
      chatToUpdate.chat.push({
        seName: sender.name,
        seAvatar: sender.avatar,
        senderMessage: req.body.senderMessage,
        messageDate: dater(),
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

module.exports = router;
