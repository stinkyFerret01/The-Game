//-0-// CONFIG
const express = require("express");
const router = express.Router();

//-0a-// déclaration des niveaux d'access
const adminlvl = 5;

//-1-// FONCTIONS
//-1a-// authentification administrateur
const isAdmin = async (req, res, next) => {
  try {
    const admin = await Player.findById(req.body.playerId);
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

//-2-// import des modeles
const Player = require("../models/Player");

//-3-// ROUTES
//-3a-// ADMIN // acces à la liste des joueurs (sensible)
router.post("/admin/players", isAdmin, async (req, res) => {
  try {
    const playersList = [];
    const playersData = await Player.find();
    playersData.forEach((player) =>
      playersList.push({
        id: player._id,
        name: player.name,
        avatar: player.avatar,
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

//-3b-// ADMIN // suppression d'un joueur
router.post("/admin/ban", isAdmin, async (req, res) => {
  try {
    const banner = await Player.findById(req.body.playerId);
    const playerToBan = await Player.findById(req.body.bannedId);
    if (banner.accessLevel > playerToBan.accessLevel) {
      await Player.findByIdAndDelete(req.body.bannedId);
      const newList = [];
      const playersData = await Player.find();
      playersData.forEach((player) =>
        newList.push({
          id: player._id,
          name: player.name,
          avatar: player.avatar,
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

//-3D-// LORD // promotion ou rétrogradation d'un joueur au rang d'administrateur
router.put("/lord/promote", isAdmin, async (req, res) => {
  try {
    const promoter = await Player.findById(req.body.playerId);
    const promoted = await Player.findById(req.body.promotedId);
    if (
      promoter.accessLevel > promoted.accessLevel &&
      req.body.newAL < promoter.accessLevel
    ) {
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
          avatar: player.avatar,
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
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
