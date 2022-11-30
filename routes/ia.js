//-0-// CONFIG
const express = require("express");
const router = express.Router();

//-2-// import des modeles
const IaGame = require("../models/Ia");

//-3a-// sauvegarde des probs générés
router.post("/ia/save", async (req, res) => {
  try {
    res.status(200).json({
      message: "probs enregistrées",
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//-3b-// appel des probs
router.post("/ia/get", async (req, res) => {
  try {
    // let modelToFind = req.body.modelToFind;
    // const models = await IaGame.find();
    res.status(200).json({
      message: "requête ia probs accordée",
      probs: "probs",
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
