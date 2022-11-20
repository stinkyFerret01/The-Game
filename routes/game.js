//-0-// CONFIG
const express = require("express");
const router = express.Router();

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

module.exports = router;
