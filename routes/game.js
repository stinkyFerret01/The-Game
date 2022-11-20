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
//-3a-// acces au leader-board
router.get("/game/lead", async (req, res) => {
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

//-3b-// modification du score
router.post("/game/score", isPlayer, async (req, res) => {
  try {
    const actualPlayer = await Player.findById(req.body.playerId);
    const actualScore = actualPlayer.score;
    const newScore = {
      score: Number(actualScore.score) + Number(req.body.newScore),
      level:
        Math.floor(
          (Number(actualScore.score) + Number(req.body.newScore)) / 10
        ) + 1,
    };
    const playerToUpdate = await Player.findByIdAndUpdate(
      req.body.playerId,
      { score: newScore },
      { new: true }
    );
    res.status(200).json({
      message: "requête score accordée",
      score: newScore,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
