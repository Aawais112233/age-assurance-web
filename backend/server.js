const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

const supabase = createClient(
  "https://powqbhwqtzbrslyygphp.supabase.co",
  "sb_publishable_VjFnyzxT2VTknv_e6qdNVg_RF6hybYt"
);

const upload = multer({ storage: multer.memoryStorage() });

app.get("/", (req, res) => {
  res.status(200).send("Backend is running ✅");
});

app.post(
  "/submit",
  upload.fields([
    { name: "face", maxCount: 1 },
    { name: "voice", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      console.log("🔥 Data received from frontend");

      const participantId = req.body.participantId;
      const textAnswers = JSON.parse(req.body.textAnswers);
      const metadata = JSON.parse(req.body.metadata);

      const faceFile = req.files.face[0];
      const voiceFile = req.files.voice[0];

      const facePath = `${participantId}.jpg`;
      const voicePath = `${participantId}.wav`;

      const { error: faceError } = await supabase.storage
        .from("face")
        .upload(facePath, faceFile.buffer, {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (faceError) throw faceError;

      const { error: voiceError } = await supabase.storage
        .from("voice")
        .upload(voicePath, voiceFile.buffer, {
          contentType: "audio/wav",
          upsert: true,
        });

      if (voiceError) throw voiceError;

      const { data: faceUrlData } = supabase.storage
        .from("face")
        .getPublicUrl(facePath);

      const { data: voiceUrlData } = supabase.storage
        .from("voice")
        .getPublicUrl(voicePath);

      const { error: dbError } = await supabase.from("participants").insert([
        {
          id: participantId,
          age: metadata.age,
          gender: metadata.gender,
          q1: textAnswers.q1,
          q2: textAnswers.q2,
          q3: textAnswers.q3,
          face_url: faceUrlData.publicUrl,
          voice_url: voiceUrlData.publicUrl,
        },
      ]);

      if (dbError) throw dbError;

      console.log("✅ Saved to Supabase:", participantId);

      res.json({
        success: true,
        message: "Data saved to Supabase",
        participantId,
      });
    } catch (error) {
      console.error("❌ Supabase save error:", error);

      res.status(500).json({
        success: false,
        message: "Error saving to Supabase",
        error: error.message,
      });
    }
  }
);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});