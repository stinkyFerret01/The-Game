const mongoose = require("mongoose");

//-- ia
//-- data généré par l'ia
const IaGame = mongoose.model("IaGame", {
  gen: Number,
  turns: Array,
  probs: [Array],
});

module.exports = IaGame;
