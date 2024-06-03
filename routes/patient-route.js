const express = require("express");
const router = express.Router();
const patientsController = require("../controller/patients-controller");

router.route("/").get(patientsController.index);
// .post(patientsController.add);

router
  .route("/:id")
  .get(patientsController.findOne)
  .delete(patientsController.remove);
//   .put(patientsController.update);

router.route("/:id/medications");
// .get(patientsController.findAllForOne);

module.exports = router;
