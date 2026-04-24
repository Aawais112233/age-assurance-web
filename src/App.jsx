import { useState, useRef } from "react";

function App() {
  const [screen, setScreen] = useState("welcome");
  const [capturedImage, setCapturedImage] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isRecording, setIsRecording] = useState(false);

  const [textAnswers, setTextAnswers] = useState({
    q1: "",
    q2: "",
    q3: "",
  });

  const [metadata, setMetadata] = useState({
    age: "",
    gender: "",
  });

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      streamRef.current = stream;
      videoRef.current.srcObject = stream;
    } catch (error) {
      alert("Camera error: " + error.message);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const captureImage = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageDataUrl = canvas.toDataURL("image/jpeg");
    setCapturedImage(imageDataUrl);
    stopCamera();
  };

  const retakeImage = () => {
    setCapturedImage(null);
    startCamera();
  };

  const confirmImage = () => {
    setScreen("voice");
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      audioChunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });

        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);

        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setIsRecording(true);
    } catch (error) {
      alert("Microphone error: " + error.message);
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const retakeVoice = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    setAudioUrl(null);
    audioChunksRef.current = [];
  };

  const confirmVoice = () => {
    setScreen("text");
  };

  const updateAnswer = (field, value) => {
    setTextAnswers({
      ...textAnswers,
      [field]: value,
    });
  };

  const saveTextAnswers = () => {
    if (
      textAnswers.q1.trim() === "" ||
      textAnswers.q2.trim() === "" ||
      textAnswers.q3.trim() === ""
    ) {
      alert("Please answer all text questions.");
      return;
    }

    setScreen("metadata");
  };

  const updateMetadata = (field, value) => {
    setMetadata({
      ...metadata,
      [field]: value,
    });
  };

  const saveMetadata = () => {
    if (metadata.age.trim() === "" || metadata.gender.trim() === "") {
      alert("Please enter age and gender.");
      return;
    }

    console.log("Collected Data:", {
      capturedImage,
      audioUrl,
      textAnswers,
      metadata,
    });

    setScreen("complete");
  };

  if (screen === "welcome") {
    return (
      <div style={styles.container}>
        <h1>Multimodal Age Assurance</h1>
        <p>This web app is part of a PhD research study on age assurance.</p>
        <button onClick={() => setScreen("consent")}>Start</button>
      </div>
    );
  }

  if (screen === "consent") {
    return (
      <div style={styles.container}>
        <h2>Consent Form</h2>
        <p>Please read and confirm your consent to participate in this study.</p>
        <button onClick={() => setScreen("camera")}>I Agree</button>
      </div>
    );
  }

  if (screen === "camera") {
    return (
      <div style={styles.container}>
        <h2>Camera</h2>

        {!capturedImage && (
          <>
            <video ref={videoRef} autoPlay playsInline style={styles.video} />
            <canvas ref={canvasRef} style={{ display: "none" }} />

            <br />
            <br />

            <button onClick={startCamera}>Open Camera</button>
            <button onClick={captureImage} style={styles.buttonSpacing}>
              Capture Image
            </button>
          </>
        )}

        {capturedImage && (
          <>
            <img src={capturedImage} alt="Captured" style={styles.previewImage} />

            <br />
            <br />

            <button onClick={retakeImage}>Retake</button>
            <button onClick={confirmImage} style={styles.buttonSpacing}>
              Confirm
            </button>
          </>
        )}
      </div>
    );
  }

  if (screen === "voice") {
    return (
      <div style={styles.container}>
        <h2>Voice Recording</h2>

        {!isRecording && !audioUrl && (
          <button onClick={startVoiceRecording}>Start Recording</button>
        )}

        {isRecording && (
          <>
            <p>Recording...</p>
            <button onClick={stopVoiceRecording}>Stop Recording</button>
          </>
        )}

        {audioUrl && !isRecording && (
          <>
            <p>Recording completed. Please listen before confirming.</p>

            <audio controls src={audioUrl}></audio>

            <br />
            <br />

            <button onClick={retakeVoice}>Retake Voice</button>
            <button onClick={confirmVoice} style={styles.buttonSpacing}>
              Confirm Voice
            </button>
          </>
        )}
      </div>
    );
  }

  if (screen === "text") {
    return (
      <div style={styles.formContainer}>
        <h2>Text Questions</h2>
        <p>Please answer the following behavioural questions.</p>

        <label style={styles.label}>
          1. What do you usually do online in your free time?
        </label>
        <textarea
          style={styles.textarea}
          value={textAnswers.q1}
          onChange={(e) => updateAnswer("q1", e.target.value)}
          placeholder="Type your answer here..."
        />

        <label style={styles.label}>
          2. How do you decide whether an online account or profile is trustworthy?
        </label>
        <textarea
          style={styles.textarea}
          value={textAnswers.q2}
          onChange={(e) => updateAnswer("q2", e.target.value)}
          placeholder="Type your answer here..."
        />

        <label style={styles.label}>
          3. What would you do if someone online asked for your personal information?
        </label>
        <textarea
          style={styles.textarea}
          value={textAnswers.q3}
          onChange={(e) => updateAnswer("q3", e.target.value)}
          placeholder="Type your answer here..."
        />

        <button onClick={saveTextAnswers}>Save Text Answers</button>
      </div>
    );
  }

  if (screen === "metadata") {
    return (
      <div style={styles.formContainer}>
        <h2>Metadata</h2>
        <p>Please enter your age and gender.</p>

        <label style={styles.label}>Age</label>
        <input
          type="number"
          style={styles.input}
          value={metadata.age}
          onChange={(e) => updateMetadata("age", e.target.value)}
          placeholder="Enter your age"
        />

        <label style={styles.label}>Gender</label>
        <select
          style={styles.input}
          value={metadata.gender}
          onChange={(e) => updateMetadata("gender", e.target.value)}
        >
          <option value="">Select gender</option>
          <option value="female">Female</option>
          <option value="male">Male</option>
          <option value="non-binary">Non-binary</option>
          <option value="prefer-not-to-say">Prefer not to say</option>
          <option value="other">Other</option>
        </select>

        <button onClick={saveMetadata}>Save Metadata</button>
      </div>
    );
  }

  if (screen === "complete") {
    return (
      <div style={styles.container}>
        <h2>Study Data Collected</h2>
        <p>Thank you. Your data has been saved temporarily.</p>
      </div>
    );
  }

  return null;
}

const styles = {
  container: {
    textAlign: "center",
    marginTop: "80px",
    fontFamily: "Arial",
  },
  formContainer: {
    width: "600px",
    maxWidth: "90%",
    margin: "50px auto",
    fontFamily: "Arial",
  },
  video: {
    width: "400px",
    marginTop: "20px",
    border: "1px solid #ccc",
  },
  previewImage: {
    width: "400px",
    marginTop: "20px",
    border: "1px solid #ccc",
  },
  buttonSpacing: {
    marginLeft: "12px",
  },
  label: {
    display: "block",
    marginTop: "20px",
    marginBottom: "8px",
    fontWeight: "bold",
  },
  textarea: {
    width: "100%",
    minHeight: "90px",
    padding: "10px",
    fontSize: "15px",
    marginBottom: "10px",
  },
  input: {
    width: "100%",
    padding: "10px",
    fontSize: "15px",
    marginBottom: "15px",
  },
};

export default App;