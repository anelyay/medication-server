const express = require("express");
const cors = require("cors");
const multer = require("multer");
const tesseract = require("node-tesseract-ocr");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");
dotenv.config();

const PORT = process.env.PORT || 8080;

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const medicin_arr = [
  "ASPIRIN",
  "ROCHE",
  "ROCHE-POSAY",
  "METHYL",
  "FOLANTE",
  "ADVIL",
  "TYLENOL",
];

const upload = multer({ dest: "backend/uploads" });

app.post("/files", upload.single("screenshots"), (req, res) => {
  console.log(req.file);

  // Configuration for Tesseract
  const config = {
    lang: "eng",
    oem: 1,
    psm: 3,
  };

  tesseract
    .recognize(req.file.path, config)
    .then((text) => {
      console.log("Result text: ", text);

      // Convert text to uppercase
      let result_upper = text.toUpperCase();
      console.log("Res_upper text: ", result_upper);

      // Convert text to array
      var result_array = result_upper.split(/(\s+)/);

      let foundElement = null;
      for (const element of result_array) {
        console.log(element);
        if (medicin_arr.includes(element)) {
          foundElement = element;
          console.log("Found:", element);
          break; // Break out of the loop once a match is found
        }
      }

      // Return recognized text or a not found message
      if (foundElement) {
        res.json({ found: foundElement });
      } else {
        res.json({ found: null });
      }

      // Clean up the uploaded file
      fs.unlink(req.file.path, (err) => {
        if (err) {
          console.error("Failed to delete uploaded file", err);
        }
      });
    })
    .catch((error) => {
      console.error("Error processing image:", error.message);
      res.status(500).json({ error: error.message });

      // Clean up the uploaded file in case of an error
      fs.unlink(req.file.path, (err) => {
        if (err) {
          console.error("Failed to delete uploaded file after error", err);
        }
      });
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
