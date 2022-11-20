const mongoose = require("mongoose");

//-- Player
//-- données de l'utilisateur
const Player = mongoose.model("Player", {
  mail: String,
  name: String,
  avatar: String,
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

module.exports = Player;
