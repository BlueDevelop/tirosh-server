const mongoose = require("mongoose");
const router = require("express").Router();
const auth = require("../auth");
const Updates = mongoose.model("Updates");

//POST new update route (required, only authenticated users have access)
router.post("/", auth.required, (req, res, next) => {
  const {
    body: { update }
  } = req;

  if (!update.text) {
    return res.status(422).json({
      errors: {
        text: "is required"
      }
    });
  }

  update.created = new Date();
  const finalUpdate = new Updates(update);

  return finalUpdate.save().then(() => res.json({ update: "saved" }));
});

//GET allUpdates route (optional, everyone has access)
router.get("/all", auth.optional, (req, res, next) => {
  return Updates.find().then(updates => {
    return res.json({ updates: updates });
  });
});

module.exports = router;