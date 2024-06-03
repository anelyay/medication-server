const patientData = require("../seed-data/patients.js");
const medicationData = require("../seed-data/medications.js");

exports.seed = async function (knex) {
  await knex("patients").del();
  await knex("medications").del();
  await knex("patients").insert(patientData);
  await knex("medications").insert(medicationData);
};
