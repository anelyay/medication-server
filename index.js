const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const PORT = process.env.PORT || 8080;

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.send(`<h1>Welcome to my Server</h1>`);
});

// Routes
const patientsRouter = require("./routes/patient-route");
const medicationsRouter = require("./routes/medication-route");
app.use("/patients", patientsRouter);
app.use("/medications", medicationsRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
