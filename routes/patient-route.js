const express = require("express");
const router = express.Router();
const patientsController = require("../controller/patients-controller");

router
  .route("/")
  .get(patientsController.findPatients)
  .post(patientsController.addPatient);

router
  .route("/:id")
  .get(patientsController.findPatient)
  .delete(patientsController.removePatient)
  .put(patientsController.updatePatient);

router
  .route("/:id/medications")
  .get(patientsController.findMedicationsByPatient);

module.exports = router;
