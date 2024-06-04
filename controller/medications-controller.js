const knex = require("knex")(require("../knexfile"));

//find all
const findMedications = async (_req, res) => {
  try {
    const medications = await knex("medications")
      .join("patients", "medications.patient_id", "patients.id")
      .join("schedule", "medications.id", "schedule.medication_id")
      .select(
        "medications.id",
        "patients.patient_name",
        "medications.med_name",
        "medications.med_dose",
        "schedule.med_time",
        "schedule.med_taken",
        "medications.quantity"
      );

    const formattedMedications = medications.map((pill) => ({
      ...pill,
      med_taken: pill.med_taken === 1,
    }));

    res.status(200).json(formattedMedications);
  } catch (error) {
    res.status(500).json({ message: `Error retrieving medications: ${error}` });
  }
};

//find one medication
const findMedication = async (req, res) => {
  try {
    const medicationId = req.params.id;

    const medication = await knex("medications")
      .join("patients", "medications.patient_id", "patients.id")
      .join("schedule", "medications.id", "schedule.medication_id")
      .select(
        "medications.id",
        "patients.patient_name",
        "medications.med_name",
        "medications.med_dose",
        "schedule.med_time",
        "schedule.med_taken",
        "medications.quantity"
      )
      .where("medications.id", medicationId)
      .first();

    if (!medication) {
      return res.status(404).json({
        message: `medication with ID ${medicationId} not found`,
      });
    }

    const formattedMedication = {
      ...medication,
      med_taken: medication.med_taken === 1,
    };

    res.status(200).json(formattedMedication);
  } catch (error) {
    res.status(500).json({
      message: `Unable to retrieve medication with ID ${medicationId}`,
    });
  }
};


//update medication
const updateMedication = async (req, res) => {
  const medicationId = req.params.id;
  const {
    patient_id,
    med_name,
    med_dose,
    quantity,
  } = req.body;

  const errors = [];

  if (!patient_id) errors.push({ msg: "Patient ID is required" });
  if (!med_name) errors.push({ msg: "Medication name is required" });
  if (!med_dose) errors.push({ msg: "Dose is required" });
  if (!med_schedule) errors.push({ msg: "Schedule is required" });
  if (!med_time) errors.push({ msg: "Time is required" });
  if (quantity === undefined) {
    errors.push({ msg: "Quantity is required" });
  } else if (isNaN(quantity)) {
    errors.push({ msg: "Quantity must be a number" });
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  try {
    const rowsUpdated = await knex("medications")
      .where({ id: medicationId })
      .update({
        patient_id,
        med_name,
        med_dose,
        med_schedule,
        med_time,
        med_taken: med_taken ? 1 : 0,
        quantity,
      });

    if (rowsUpdated === 0) {
      return res.status(404).json({
        message: `Medication with ID ${medicationId} not found`,
      });
    }

    const updatedMedication = await knex("medications")
      .join("patients", "medications.patient_id", "patients.id")
      .select(
        "medications.id as id",
        "patients.patient_name",
        "med_name",
        "med_dose",
        "med_schedule",
        "med_time",
        "med_taken",
        "quantity"
      )
      .where("medications.id", medicationId)
      .first();

    const formattedMedication = {
      ...updatedMedication,
      med_taken: updatedMedication.med_taken === 1,
    };

    res.status(200).json(formattedMedication);
  } catch (error) {
    res.status(500).json({
      message: `Failed to update medication: ${error.message}`,
    });
  }
};

//add a medication
const addMedication = async (req, res) => {
  const {
    patient_id,
    med_name,
    med_dose,
    med_schedule,
    med_time,
    med_taken,
    quantity,
  } = req.body;

  const errors = [];

  if (!patient_id) errors.push({ msg: "Patient ID is required" });
  if (!med_name) errors.push({ msg: "Medication name is required" });
  if (!med_dose) errors.push({ msg: "Dose is required" });
  if (!med_schedule) errors.push({ msg: "Schedule is required" });
  if (!med_time) errors.push({ msg: "Time is required" });
  if (quantity === undefined) {
    errors.push({ msg: "Quantity is required" });
  } else if (isNaN(quantity)) {
    errors.push({ msg: "Quantity must be a number" });
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  try {
    const result = await knex("medications").insert({
      patient_id,
      med_name,
      med_dose,
      med_schedule,
      med_time,
      med_taken: med_taken ? 1 : 0,
      quantity,
    });

    const newMedicationId = result[0];

    const newMedication = await knex("medications")
      .join("patients", "medications.patient_id", "patients.id")
      .select(
        "medications.id as id",
        "patients.patient_name",
        "med_name",
        "med_dose",
        "med_schedule",
        "med_time",
        "med_taken",
        "quantity"
      )
      .where("medications.id", newMedicationId)
      .first();

    const formattedMedication = {
      ...newMedication,
      med_taken: newMedication.med_taken === 1,
    };

    res.status(201).json(formattedMedication);
  } catch (error) {
    res
      .status(500)
      .json({ message: `Failed to create a new medication: ${error.message}` });
  }
};

//remove a med
const removeMedication = async (req, res) => {
  try {
    const medicationId = req.params.id;

    const rowsDeleted = await knex("medications")
      .where({ id: medicationId })
      .delete();

    if (rowsDeleted === 0) {
      return res
        .status(404)
        .json({ message: `Medication with ID ${medicationId} not found` });
    }

    res
      .status(200)
      .json({
        message: `Medication with ID ${medicationId} successfully deleted`,
      });
  } catch (error) {
    res
      .status(500)
      .json({ message: `Unable to delete medication: ${error}` });
  }
};



module.exports = {
  findMedications,
  findMedication,
  updateMedication,
  addMedication,
  removeMedication,
};
