const express = require("express");
const router = express.Router();
const medicationController = require("../controller/medications-controller");

router.route("/");
//   .post(medicationController.add);

router.route("/:id");
//   .get(medicationController.findOne)
//   .delete(medicationController.remove)
//   .put(medicationController.update);

module.exports = router;
