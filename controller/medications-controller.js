const knex = require("knex")(require("../knexfile"));

//find all
const findAll = async (_req, res) => {
  try {
    const medications = await knex("medications")
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
const findOne = async (req, res) => {
  try {
    const medicationId = req.params.id;

    const medication = await knex("medications")
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

module.exports = {
  findAll,
  findOne,
};
