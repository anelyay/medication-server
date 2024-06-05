const express = require("express");
const router = express.Router();
const medicationController = require("../controller/medications-controller");

router
  .route("/")
  .get(medicationController.findMedications)
  .post(medicationController.addMedication);

router
  .route("/:id")
  .get(medicationController.findMedication)
  .delete(medicationController.removeMedication)
  .put(medicationController.updateMedication);

router
  .route("/log")
  .post(medicationController.logActivity)

router
  .route("/log/:id")
  .get(medicationController.getActivityLog);

router.route("/taken/:id")
  .put(medicationController.markMedicationAsTaken);

module.exports = router;
