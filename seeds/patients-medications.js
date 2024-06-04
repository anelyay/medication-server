const patientData = require("../seed-data/patients.js");
const medicationData = require("../seed-data/medications.js");
const scheduleData = require("../seed-data/schedule.js");

exports.seed = async function (knex) {
  await knex("patients").del();
  await knex("medications").del();
  await knex("schedule").del();
  await knex("patients").insert(patientData);
  await knex("medications").insert(medicationData);
  await knex("schedule").insert(scheduleData);
};
