const mongoose = require("mongoose");

//-- PrivateChat
//-- ensemble de message lié à une conversation privée dans un tableau
const PrivateChat = mongoose.model("PrivateChat", {
  seId: String,
  seAvatar: String,
  seName: String,
  reId: String,
  reAvatar: String,
  reName: String,
  chat: [Object],
});

module.exports = PrivateChat;
