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
  .route("/activity-log")
  .post(medicationController.logActivity)
  .get(medicationController.getActivityLog);

router.route("/:id/taken").put(medicationController.markMedicationAsTaken);

module.exports = router;
