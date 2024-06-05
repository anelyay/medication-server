const knex = require("knex")(require("../knexfile"));

const selectPatientFields = () => [
  "id",
  "patient_name",
  knex.raw("DATE_FORMAT(patient_dob, '%Y-%m-%d') AS patient_dob"),
  "patient_allergy",
  "patient_md",
];

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}.${month}.${day}`;
};

//get all patients
const findPatients = async (_req, res) => {
  try {
    const patients = await knex("patients").select(selectPatientFields());

    res.status(200).json(patients);
  } catch (error) {
    res.status(500).json({ message: `Error retrieving patients: ${error}` });
  }
};

//get one patient
const findPatient = async (req, res) => {
  try {
    const patientFound = await knex("patients")
      .select(selectPatientFields())
      .where({
        id: req.params.id,
      });

    if (patientFound.length === 0) {
      return res.status(404).json({
        message: `Patient with ID ${req.params.id} not found`,
      });
    }

    const patientData = patientFound[0];

    res.status(200).json(patientData);
  } catch (error) {
    res.status(500).json({
      message: `Unable to retrieve data for patient with ID ${req.params.id}`,
    });
  }
};

//remove a patient
const removePatient = async (req, res) => {
  try {
    const rowsDeleted = await knex("patients")
      .where({ id: req.params.id })
      .delete();

    if (rowsDeleted === 0) {
      return res
        .status(404)
        .json({ message: `Patient with ID ${req.params.id} not found` });
    }

    res.sendStatus(204);
  } catch (error) {
    res.status(500).json({ message: `Unable to delete patient; ${error}` });
  }
};

// add a patient

const addPatient = async (req, res) => {
  const { patient_name, patient_dob, patient_allergy, patient_md } = req.body;

  const errors = [];

  if (!patient_name) errors.push({ msg: "Patient name is required" });
  if (!patient_dob) errors.push({ msg: "Date of Birth is required" });
  if (!patient_md) errors.push({ msg: "Primary Doctor is required" });

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  try {
    const formattedPatientDob = formatDate(patient_dob);

    const result = await knex("patients").insert({
      patient_name,
      patient_dob: formattedPatientDob,
      patient_allergy,
      patient_md,
    });

    const newPatientId = result[0];

    const newPatient = await knex("patients")
      .where({ id: newPatientId })
      .select(selectPatientFields())
      .first();

    res.status(201).json(newPatient);
  } catch (error) {
    res.status(500).json({ error: "Failed to create a new patient" });
  }
};

//update a patient
const updatePatient = async (req, res) => {
  const { patient_name, patient_dob, patient_allergy, patient_md } = req.body;

  const errors = [];
  if (!patient_name) errors.push({ msg: "Patient name is required" });
  if (!patient_dob) errors.push({ msg: "Date of Birth is required" });
  if (!patient_md) errors.push({ msg: "Primary Doctor is required" });

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  try {
    const rowsUpdated = await knex("patients")
      .where({ id: req.params.id })
      .update({ patient_name, patient_dob, patient_allergy, patient_md });

    if (rowsUpdated === 0) {
      return res.status(404).json({
        message: `Patient with ID ${req.params.id} not found`,
      });
    }

    const updatedPatient = await knex("patients")
      .select(selectPatientFields())
      .where({ id: req.params.id })
      .first();

    res.json(updatedPatient);
  } catch (error) {
    res.status(500).json({
      message: `Unable to update warehouse with ID ${req.params.id}`,
    });
  }
};

const findMedicationsByPatient = async (req, res) => {
  try {
    const patientId = req.params.id;

    const medications = await knex("medications")
      .join("patients", "medications.patient_id", "patients.id")
      .join(
        "schedule",
        "medications.id",
        "schedule.medication_id"
      )
      .select(
        "medications.id as id",
        "patients.patient_name",
        "med_name",
        "med_dose",
        "schedule.med_time",
        "schedule.med_taken",
        "quantity",
        "notes"
      )
      .where("medications.patient_id", patientId);

    if (medications.length === 0) {
      return res.status(404).json({
        message: `No medications found for patient with ID ${patientId}`,
      });
    }

    const formattedMedications = medications.map((pill) => ({
      ...pill,
      med_taken: pill.med_taken === 1,
    }));

    res.status(200).json(formattedMedications);
  } catch (error) {
    res.status(500).json({
      message: `Unable to retrieve medications for patient with ID ${patientId}: ${error.message}`,
    });
  }
};


module.exports = {
  findPatients,
  findPatient,
  removePatient,
  addPatient,
  updatePatient,
  findMedicationsByPatient,
};
