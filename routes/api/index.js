const express = require("express");
const router = express.Router();

router.use("/users", require("./users"));
router.use("/updates", require("./updates"));

module.exports = router;
