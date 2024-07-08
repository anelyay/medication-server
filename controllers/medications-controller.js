///
const knex = require("knex")(require("../knexfile"));
const cron = require("node-cron");
const schedule = require("node-schedule");
const moment = require("moment-timezone");

const logActivity = async (
  userId,
  medicationId,
  med_taken,
  med_time,
  updatedQuantity
) => {
  try {
    const user = await knex("users")
      .select("timezone")
      .where("id", userId)
      .first();

    if (!user) {
       throw new Error("User timezone not found");
    }

    const formattedMedTime = moment
      .tz(med_time, "YYYY-MM-DD HH:mm", "UTC")
      .tz(user.timezone)
      .format("YYYY-MM-DD HH:mm");

    await knex("activity_log").insert({
      user_id: userId,
      med_taken,
      med_time: formattedMedTime,
      medication_id: medicationId,
      quantity: updatedQuantity,
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
    throw error;
  }
};

const getActivityLog = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const user = await knex("users")
      .select("timezone")
      .where("id", userId)
      .first();

    if (!user || !user.timezone) {
      return res.status(400).json({ error: "User timezone not found" });
    }

    const timezone = user.timezone;

    const logs = await knex("activity_log")
      .join("medications", "activity_log.medication_id", "medications.id")
      .select(
        "activity_log.id",
        "medications.med_name",
        "activity_log.quantity",
        "activity_log.log_time"
      )
      .where({
        "activity_log.medication_id": id,
        "activity_log.user_id": userId,
      });

    const formattedLogs = logs.map((log) => ({
      ...log,
      log_time: moment(log.log_time).tz(timezone).format("YYYY-MM-DD HH:mm"),
    }));

    res.status(200).json(formattedLogs);
  } catch (error) {
    res
      .status(500)
      .json({ message: `Failed to retrieve activity logs: ${error.message}` });
  }
};

const findMedications = async (req, res) => {
  const userId = req.user.id;

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
      )
      .where("patients.user_id", userId);

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

const findMedication = async (req, res) => {
  try {
    const medicationId = req.params.id;
    const userId = req.user.id;

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
      .where("medications.id", medicationId)
      .andWhere("patients.user_id", userId);

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
        acc.notes = row.notes;
        acc.schedule = [];
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
      message: `Unable to retrieve medication with ID ${req.params.id}`,
    });
  }
};

const updateMedication = async (req, res) => {
  const medicationId = req.params.id;
  const { patient_id, med_name, med_dose, quantity, notes, schedule } =
    req.body;
  const userId = req.user.id;

  const errors = [];

  if (!patient_id) errors.push({ msg: "Patient ID is required" });
  if (!med_name) errors.push({ msg: "Medication name is required" });
  if (!med_dose) errors.push({ msg: "Dose is required" });
  if (quantity === undefined || quantity <= 0) {
    errors.push({ msg: "Quantity must be a number greater than 0" });
  } else if (isNaN(quantity)) {
    errors.push({ msg: "Quantity must be a number" });
  }
  if (!Array.isArray(schedule) || schedule.some((entry) => !entry.med_time)) {
    errors.push({ msg: "Invalid schedule format" });
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  try {
    const medication = await knex("medications")
      .join("patients", "medications.patient_id", "patients.id")
      .where("medications.id", medicationId)
      .andWhere("patients.user_id", userId)
      .first();

    if (!medication) {
      return res.status(404).json({
        message: `Medication with ID ${medicationId} not found`,
      });
    }

    await knex("medications").where({ id: medicationId }).update({
      patient_id,
      med_name,
      med_dose,
      quantity,
      notes,
      user_id: userId,
    });

    const currentSchedule = await knex("schedule")
      .where({ medication_id: medicationId })
      .select("id", "med_time");

    const currentScheduleMap = currentSchedule.reduce((acc, entry) => {
      acc[entry.med_time] = entry;
      return acc;
    }, {});

    const scheduleEntries = schedule.map((entry) => {
      return {
        medication_id: medicationId,
        med_time: entry.med_time,
        user_id: userId,
      };
    });

    await knex.transaction(async (trx) => {
      await trx("schedule").where({ medication_id: medicationId }).del();
      await trx("schedule").insert(scheduleEntries);
    });

    const updatedMedication = await knex("medications")
      .join("patients", "medications.patient_id", "patients.id")
      .leftJoin("schedule", "medications.id", "schedule.medication_id")
      .select(
        "medications.id as id",
        "patients.patient_name",
        "medications.med_name",
        "medications.med_dose",
        "medications.quantity",
        "medications.notes",
        "schedule.med_time"
      )
      .where("medications.id", medicationId)
      .andWhere("patients.user_id", userId)
      .first();

    res.status(200).json(updatedMedication);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: `Failed to update medication: ${error.message}`,
    });
  }
};

const addMedication = async (req, res) => {
  const userId = req.user.id;
  const { patient_id, med_name, med_dose, schedule, quantity, notes } =
    req.body;

  const errors = [];

  if (!patient_id) errors.push({ msg: "Patient ID is required" });
  if (!med_name) errors.push({ msg: "Medication name is required" });
  if (!med_dose) errors.push({ msg: "Dose is required" });
  if (!schedule || !Array.isArray(schedule) || schedule.length === 0) {
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
      notes,
      user_id: userId,
    });

    const newMedicationId = result[0];

    const scheduleEntries = schedule.map((entry) => ({
      medication_id: newMedicationId,
      med_time: entry.med_time,
      med_taken: entry.med_taken,
      user_id: userId,
    }));

    await knex("schedule").insert(scheduleEntries);

    const newMedication = await knex("medications")
      .join("patients", "medications.patient_id", "patients.id")
      .select(
        "medications.id as id",
        "patients.patient_name",
        "med_name",
        "med_dose",
        "quantity",
        "notes"
      )
      .where("medications.id", newMedicationId)
      .andWhere("patients.user_id", userId)
      .first();

    res.status(201).json(newMedication);
  } catch (error) {
    res
      .status(500)
      .json({ message: `Failed to create a new medication: ${error.message}` });
  }
};

const removeMedication = async (req, res) => {
  const medicationId = req.params.id;
  const userId = req.user.id;

  try {
    const rowsDeleted = await knex("medications")
      .join("patients", "medications.patient_id", "patients.id")
      .where("medications.id", medicationId)
      .andWhere("patients.user_id", userId)
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

const markMedicationAsTaken = async (req, res) => {
  const userId = req.user.id;
  const { medication_id, med_time, med_taken } = req.body;

  try {
    const medication = await knex("medications")
      .where({ id: medication_id, user_id: userId })
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
      userId,
      medication_id,
      med_taken ? 1 : 0,
      med_time,
      newQuantity
    );

    res
      .status(200)
      .json({ message: "Medication status has been updated successfully!" });
  } catch (error) {
    console.error("Error updating medication taken status:", error);
    res.status(500).json({ error: "Unable to update medication taken status" });
  }
};

const markMedicationAsTakenWithNFC = async (req, res) => {
  const userId = req.user.id;
  const { id: medication_id, time: med_time, taken: med_taken } = req.query;

  try {
    const medication = await knex("medications")
      .where({ id: medication_id, user_id: userId })
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
      userId,
      medication_id,
      med_taken ? 1 : 0,
      med_time,
      newQuantity
    );

    res
      .status(200)
      .json({ message: "Medication status has been updated successfully!" });
  } catch (error) {
    console.error("Error updating medication taken status:", error);
    res.status(500).json({ error: "Unable to update medication taken status" });
  }
};



// cron.schedule("22 20 * * *", async () => {
//   try {
//     await knex("schedule").update({ med_taken: false });
//   } catch (error) {
//     console.error("Error resetting med_taken status:", error);
//   }
// });

// const getNextMidnightDate = (timezone) => {
//   const nextMidnight = moment.tz(timezone).endOf("day").add(1, "second");
//   return nextMidnight.toDate(); // Convert to JavaScript Date object
// };

// const resetMedTaken = async (userId) => {
//   try {
//     await knex("schedule")
//       .update({ med_taken: false })
//       .where({ user_id: userId });
//     console.log(
//       `Reset med_taken for user ${userId} at ${moment().format(
//         "YYYY-MM-DD HH:mm:ss"
//       )}`
//     );
//   } catch (error) {
//     console.error(
//       `Error resetting med_taken status for user ${userId}:`,
//       error
//     );
//   }
// };

// const scheduleMidnightReset = async () => {
//   try {
//     const users = await knex("users").select("id", "timezone");

//     users.forEach((user) => {
//       const nextMidnightDate = getNextMidnightDate(user.timezone);
//       console.log(
//         `Scheduling reset for user ${user.id} at ${nextMidnightDate} (${user.timezone})`
//       );

//       schedule.scheduleJob(nextMidnightDate, async () => {
//         await resetMedTaken(user.id);
//       });

//       console.log(
//         `Midnight reset scheduled for user ${user.id} in ${user.timezone}`
//       );
//     });

//   } catch (error) {
//     console.error("Error scheduling midnight reset:", error);
//   }
// };

// scheduleMidnightReset();


module.exports = {
  logActivity,
  getActivityLog,
  findMedications,
  findMedication,
  updateMedication,
  addMedication,
  removeMedication,
  markMedicationAsTaken,
  markMedicationAsTakenWithNFC,
};
