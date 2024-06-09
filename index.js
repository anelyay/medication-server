const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const PORT = process.env.PORT || 8080;

const app = express();

app.use(cors());
app.use(express.json());


const patientsRouter = require("./routes/patient-route");
const medicationsRouter = require("./routes/medication-route");
app.use("/patients", patientsRouter);
app.use("/medications", medicationsRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
