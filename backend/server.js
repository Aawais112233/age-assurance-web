const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).send("Backend is running ✅");
});

const baseDir = path.join(__dirname, "multimodal");
const faceDir = path.join(baseDir, "face");
const voiceDir = path.join(baseDir, "voice");
const textDir = path.join(baseDir, "text");
const metadataDir = path.join(baseDir, "metadata");

[baseDir, faceDir, voiceDir, textDir, metadataDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const storage = multer.memoryStorage();
const upload = multer({ storage });

function cleanCsv(value) {
  if (value === undefined || value === null) return "";
  return String(value).replace(/"/g, '""');
}

app.post(
  "/submit",
  upload.fields([
    { name: "face", maxCount: 1 },
    { name: "voice", maxCount: 1 },
  ]),
  (req, res) => {
    console.log("🔥 Data received from frontend");

    try {
      const participantId = req.body.participantId;
      const textAnswers = JSON.parse(req.body.textAnswers);
      const metadata = JSON.parse(req.body.metadata);

      if (!participantId) {
        return res.status(400).json({
          success: false,
          message: "Missing participant ID",
        });
      }

      if (!req.files || !req.files.face || !req.files.voice) {
        return res.status(400).json({
          success: false,
          message: "Missing face or voice file",
        });
      }

      const faceFile = req.files.face[0];
      const voiceFile = req.files.voice[0];

      fs.writeFileSync(
        path.join(faceDir, `${participantId}.jpg`),
        faceFile.buffer
      );

      fs.writeFileSync(
        path.join(voiceDir, `${participantId}.wav`),
        voiceFile.buffer
      );

      const textCsvPath = path.join(textDir, "text_answers.csv");
      const metadataCsvPath = path.join(metadataDir, "metadata.csv");

      if (!fs.existsSync(textCsvPath)) {
        fs.writeFileSync(textCsvPath, "id,q1,q2,q3\n");
      }

      if (!fs.existsSync(metadataCsvPath)) {
        fs.writeFileSync(metadataCsvPath, "id,age,gender\n");
      }

      fs.appendFileSync(
        textCsvPath,
        `"${cleanCsv(participantId)}","${cleanCsv(textAnswers.q1)}","${cleanCsv(
          textAnswers.q2
        )}","${cleanCsv(textAnswers.q3)}"\n`
      );

      fs.appendFileSync(
        metadataCsvPath,
        `"${cleanCsv(participantId)}","${cleanCsv(metadata.age)}","${cleanCsv(
          metadata.gender
        )}"\n`
      );

      console.log("✅ Saved participant:", participantId);

      res.json({
        success: true,
        message: "Data saved successfully",
        participantId,
      });
    } catch (error) {
      console.error("❌ Error saving data:", error);

      res.status(500).json({
        success: false,
        message: "Error saving data",
        error: error.message,
      });
    }
  }
);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});