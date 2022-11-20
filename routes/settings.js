//-0-// CONFIG
const express = require("express");
const router = express.Router();

//-0a-// déclaration des niveaux d'access
const playerlvl = 2;

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

//-2-// import des modeles
const Player = require("../models/Player");

//-3-// ROUTES
//-3a-// modification de l'avatar
router.post("/avatar/update", isPlayer, async (req, res) => {
  try {
    console.log();
    const playerToUpdate = await Player.findByIdAndUpdate(
      req.body.playerId,
      { avatar: req.body.avatar },
      { new: true }
    );
    res.status(200).json({
      message: "requête avatar accordée",
      newAvatarUrl: playerToUpdate.avatar,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
