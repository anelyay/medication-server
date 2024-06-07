const express = require("express");
const cors = require("cors");
const multer = require ("multer");
const tesseract = require("node-tesseract-ocr");
const dotenv = require("dotenv");
dotenv.config();

const PORT = process.env.PORT || 8080;

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const upload = multer({ dest: "backend/uploads/" });

app.post("/files", upload.single("screenshots"), (req, res) => {
  // return received files info back to frontend
  res.json(req.file.originalname);
  console.log(req.file);

  const config = {
    lang: "eng",
    oem: 1,
    psm: 3,
  };

  tesseract
    .recognize(req.file.path, config)
    .then((text) => {
      ///////// text PRINT RESULT OF RECOGNITION ////////////
      console.log("Text:", text);
    })
    .catch((error) => {
      console.log(error.message);
    });
});

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
