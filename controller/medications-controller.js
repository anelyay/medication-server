const knex = require("knex")(require("../knexfile"));

// log activity
const logActivity = async (
  medicationId,
  med_taken,
  med_time,
  updatedQuantity
) => {
  try {
    const takenAt = new Date().toISOString().slice(0, 19).replace("T", " ");
    await knex("activity_log").insert({
      med_taken,
      med_time: `${new Date().toISOString().slice(0, 10)} ${med_time}`,
      medication_id: medicationId,
      taken_at: takenAt,
      quantity: updatedQuantity,
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
    throw error;
  }
};

// get log activity
const getActivityLog = async (req, res) => {
  try {
    const logs = await knex("activity_log").join(
      "medications",
      "activity_log.medication_id",
      "medications.id"
    );
    join("patients", "medications.patient_id", "patients.id").select(
      "activity_log.id",
      "patients.patient_name",
      "medications.med_name",
      "activity_log.action",
      "activity_log.quantity",
      "activity_log.taken_at"
    );

    res.status(200).json(logs);
  } catch (error) {
    res
      .status(500)
      .json({ message: `Failed to retrieve activity logs: ${error.message}` });
  }
};

//find all
const findMedications = async (_req, res) => {
  try {
    const medications = await knex("medications")
      .join("patients", "medications.patient_id", "patients.id")
      .leftJoin("schedule", "medications.id", "schedule.medication_id")
      .select(
        "medications.id as medication_id",
        "patients.patient_name",
        "medications.med_name",
        "medications.med_dose",
        "schedule.med_time",
        "schedule.med_taken",
        "medications.quantity",
        "medications.notes"
      );

    const formattedMedications = medications.reduce((acc, row) => {
      const existingMedication = acc.find(
        (med) => med.medication_id === row.medication_id
      );

      if (!existingMedication) {
        acc.push({
          medication_id: row.medication_id,
          patient_name: row.patient_name,
          med_name: row.med_name,
          med_dose: row.med_dose,
          quantity: row.quantity,
          notes: row.notes,
          schedule: row.med_time
            ? [{ med_time: row.med_time, med_taken: row.med_taken === 1 }]
            : [],
        });
      } else if (row.med_time) {
        existingMedication.schedule.push({
          med_time: row.med_time,
          med_taken: row.med_taken === 1,
        });
      }

      return acc;
    }, []);

    res.status(200).json(formattedMedications);
  } catch (error) {
    res.status(500).json({ message: `Error retrieving medications: ${error}` });
  }
};

//find one medication
const findMedication = async (req, res) => {
  try {
    const medicationId = req.params.id;

    const rows = await knex("medications")
      .join("patients", "medications.patient_id", "patients.id")
      .join("schedule", "medications.id", "schedule.medication_id")
      .select(
        "medications.id as medication_id",
        "patients.patient_name",
        "medications.med_name",
        "medications.med_dose",
        "schedule.med_time",
        "schedule.med_taken",
        "medications.quantity",
        "medications.notes"
      )
      .where("medications.id", medicationId);

    if (rows.length === 0) {
      return res.status(404).json({
        message: `Medication with ID ${medicationId} not found`,
      });
    }

    const medication = rows.reduce((acc, row) => {
      if (!acc.medication_id) {
        acc.medication_id = row.medication_id;
        acc.patient_name = row.patient_name;
        acc.med_name = row.med_name;
        acc.med_dose = row.med_dose;
        acc.quantity = row.quantity;
        (acc.notes = row.notes), (acc.schedule = []);
      }
      acc.schedule.push({
        med_time: row.med_time,
        med_taken: row.med_taken === 1,
      });
      return acc;
    }, {});

    res.status(200).json(medication);
  } catch (error) {
    res.status(500).json({
      message: `Unable to retrieve medication with ID ${medicationId}`,
    });
  }
};

//update medication
const updateMedication = async (req, res) => {
  const medicationId = req.params.id;
  const { patient_id, med_name, med_dose, quantity, notes, schedule } =
    req.body;

  const errors = [];

  if (!patient_id) errors.push({ msg: "Patient ID is required" });
  if (!med_name) errors.push({ msg: "Medication name is required" });
  if (!med_dose) errors.push({ msg: "Dose is required" });
  if (quantity === undefined || quantity <= 0) {
    errors.push({ msg: "Quantity must be a number greater than 0" });
  } else if (isNaN(quantity)) {
    errors.push({ msg: "Quantity must be a number" });
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  try {
    const medication = await knex("medications")
      .where({ id: medicationId })
      .select("patient_id")
      .first();

    if (!medication) {
      return res.status(404).json({
        message: `Medication with ID ${medicationId} not found`,
      });
    }

    const { patient_id: medicationPatientId } = medication;


    const rowsUpdated = await knex("medications")
      .where({ id: medicationId })
      .update({
        patient_id,
        med_name,
        med_dose,
        quantity,
        notes,
      });

    if (rowsUpdated === 0) {
      return res.status(404).json({
        message: `Medication with ID ${medicationId} not found`,
      });
    }

    if (schedule && Array.isArray(schedule)) {
      await knex("schedule").where({ medication_id: medicationId }).delete();

      const scheduleEntries = schedule.map(({ med_time, med_taken }) => ({
        medication_id: medicationId,
        med_time,
        med_taken: med_taken ? 1 : 0,
      }));

      await knex("schedule").insert(scheduleEntries);
    }

    const updatedMedication = await knex("medications")
      .join("patients", "medications.patient_id", "patients.id")
      .leftJoin("schedule", "medications.id", "schedule.medication_id")
      .select(
        "medications.id as id",
        "patients.patient_name",
        "med_name",
        "med_dose",
        "quantity",
        "notes",
        "schedule.med_time",
        "schedule.med_taken"
      )
      .where("medications.id", medicationId)
      .first();

    res.status(200).json(updatedMedication);
  } catch (error) {
    res.status(500).json({
      message: `Failed to update medication: ${error.message}`,
    });
  }
};

//add a medication
const addMedication = async (req, res) => {
  const { patient_id, med_name, med_dose, med_times, quantity } = req.body;

  const errors = [];

  if (!patient_id) errors.push({ msg: "Patient ID is required" });
  if (!med_name) errors.push({ msg: "Medication name is required" });
  if (!med_dose) errors.push({ msg: "Dose is required" });
  if (!med_times || !Array.isArray(med_times) || med_times.length === 0) {
    errors.push({ msg: "Schedule is required and must be a non-empty array" });
  }
  if (quantity === undefined || quantity <= 0) {
    errors.push({ msg: "Quantity must be a number greater than 0" });
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
      quantity,
    });

    const newMedicationId = result[0];

    const scheduleEntries = med_times.map((med_time) => ({
      medication_id: newMedicationId,
      med_time,
    }));

    await knex("schedule").insert(scheduleEntries);

    const newMedication = await knex("medications")
      .join("patients", "medications.patient_id", "patients.id")
      .select(
        "medications.id as id",
        "patients.patient_name",
        "med_name",
        "med_dose",
        "quantity"
      )
      .where("medications.id", newMedicationId)
      .first();

    res.status(201).json(newMedication);
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

    res.status(200).json({
      message: `Medication with ID ${medicationId} successfully deleted`,
    });
  } catch (error) {
    res.status(500).json({ message: `Unable to delete medication: ${error}` });
  }
};

//mark as taken
const markMedicationAsTaken = async (req, res) => {
  const { medication_id, med_time, med_taken } = req.body;

  try {
    const medication = await knex("medications")
      .where({ id: medication_id })
      .first();

    if (!medication) {
      return res.status(404).json({ error: "Medication not found" });
    }

    const rowsUpdated = await knex("schedule")
      .where({ medication_id, med_time })
      .update({ med_taken: med_taken ? 1 : 0 });

    if (rowsUpdated === 0) {
      return res.status(404).json({ error: "Schedule entry not found" });
    }

    const originalQuantity = medication.quantity;
    const newQuantity = originalQuantity - 1;

    await knex("medications")
      .where({ id: medication_id })
      .update({ quantity: newQuantity });

    await logActivity(
      medication_id,
      med_taken ? 1 : 0,
      med_time,
      newQuantity
    );


    res
      .status(200)
      .json({ message: "Medication taken status updated successfully" });
  } catch (error) {
    console.error("Error updating medication taken status:", error);
    res.status(500).json({ error: "Unable to update medication taken status" });
  }
};

module.exports = {
  findMedications,
  findMedication,
  updateMedication,
  addMedication,
  removeMedication,
  logActivity,
  markMedicationAsTaken,
  getActivityLog,
};
