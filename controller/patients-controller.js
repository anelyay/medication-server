const knex = require("knex")(require("../knexfile"));

const selectPatientFields = () => [
  "id",
  "patient_name",
  "patient_dob",
  "patient_allergy",
  "patient_md",
];

//get all patients
const index = async (_req, res) => {
  try {
    const patients = await knex("patients").select(selectPatientFields());

    res.status(200).json(patients);
  } catch (error) {
    res.status(500).json({ message: `Error retrieving patients: ${error}` });
  }
};

//get one patient
const findOne = async (req, res) => {
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

// const remove = async (req, res) => {
//     try {
//         const rowsDeleted = await knex("patients")
//         .where({id: re})
//     } catch (error) {

//     }
// }

module.exports = {
  index,
  findOne,
};
