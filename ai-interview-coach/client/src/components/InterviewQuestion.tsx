import { useState, useEffect } from "react";

type Props = {
  question: string;
  currentQuestion: number;
  totalQuestions: number;
  answer: string;
  setAnswer: (value: string) => void;
  nextQuestion: () => void;
  isLastQuestion: boolean;
};

function InterviewQuestion({
  question,
  currentQuestion,
  totalQuestions,
  answer,
  setAnswer,
  nextQuestion,
  isLastQuestion,
}: Props) {
  const [isRecording, setIsRecording] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120);

  useEffect(() => {
    setTimeLeft(120);

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQuestion]);

const speakQuestion = () => {
  window.speechSynthesis.cancel();

  const speech = new SpeechSynthesisUtterance(question);
  const voices = window.speechSynthesis.getVoices();

  const voice =
    voices.find((v) => v.name.includes("Aria")) ||
    voices.find((v) => v.name.includes("Jenny")) ||
    voices.find((v) => v.name.includes("Google US English")) ||
    voices.find((v) => v.lang === "en-US");

  if (voice) {
    speech.voice = voice;
  }

  speech.lang = "en-US";
  speech.rate = 0.9;
  speech.pitch = 1.05;
  speech.volume = 1;

  window.speechSynthesis.speak(speech);
};
  const startRecording = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setIsRecording(true);
    recognition.start();

    recognition.onresult = (event: any) => {
      const spokenText = event.results[0][0].transcript;
      setAnswer(answer ? `${answer} ${spokenText}` : spokenText);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      alert(`Could not record your answer: ${event.error}`);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };
  };

  return (
    <div
      style={{
        marginTop: "30px",
        border: "1px solid #ddd",
        padding: "20px",
        borderRadius: "12px",
        textAlign: "left",
      }}
    >
      <p>
        Question {currentQuestion} of {totalQuestions}
      </p>

      <p>⏱️ Time Remaining: {timeLeft}s</p>

      <div
        style={{
          width: "100%",
          height: "12px",
          backgroundColor: "#e5e7eb",
          borderRadius: "999px",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            width: `${(currentQuestion / totalQuestions) * 100}%`,
            height: "100%",
            backgroundColor: "#2563eb",
            borderRadius: "999px",
            transition: "0.3s",
          }}
        />
      </div>

      <h2>{question}</h2>

      <button onClick={speakQuestion}>Read Question Aloud</button>

      <button onClick={startRecording} disabled={isRecording}>
        {isRecording ? "🎤 Listening..." : "Start Recording"}
      </button>

      <br />
      <br />

      <textarea
        rows={6}
        cols={80}
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
      />

      <br />
      <br />

      <button onClick={nextQuestion}>
        {isLastQuestion ? "Finish Interview" : "Next Question"}
      </button>
    </div>
  );
}

export default InterviewQuestion;