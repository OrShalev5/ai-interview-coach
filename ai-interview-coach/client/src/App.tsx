import { useState } from "react";
import axios from "axios";
import InterviewQuestion from "./components/InterviewQuestion";
import "./App.css";

type SavedInterview = {
  questions: string[];
  answers: string[];
  date: string;
};

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [questions, setQuestions] = useState<string[]>([]);
  const [jobDescription, setJobDescription] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answer, setAnswer] = useState("");
  const [answers, setAnswers] = useState<string[]>([]);
  const [finished, setFinished] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [savedInterview, setSavedInterview] =
    useState<SavedInterview | null>(null);
    const [language, setLanguage] = useState<"en" | "he">("en");

  const loadLastInterview = () => {
    const saved = localStorage.getItem("lastInterview");

    if (saved) {
      setSavedInterview(JSON.parse(saved));
      setShowHistory(true);
    } else {
      setMessage("No saved interview found");
    }
  };

  const uploadCV = async () => {
    if (!file) {
      setMessage("Please choose a CV first");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("cv", file);

    try {
      const uploadResponse = await axios.post(
        "http://localhost:5000/api/upload-cv",
        formData
      );

      const uploadedFileName = uploadResponse.data.fileName;

      setMessage(`Uploaded: ${file.name}`);

      const questionsResponse = await axios.post(
        "http://localhost:5000/api/generate-questions",
{
  fileName: uploadedFileName,
  jobDescription,
  language,
}
      );

      setQuestions(questionsResponse.data.questions.split("\n"));
      setCurrentQuestion(0);
      setAnswer("");
      setAnswers([]);
      setFinished(false);
      setFeedback("");
      setShowHistory(false);
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const nextQuestion = async () => {
    const updatedAnswers = [...answers];
    updatedAnswers[currentQuestion] = answer;

    setAnswers(updatedAnswers);
    setAnswer("");

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      localStorage.setItem(
        "lastInterview",
        JSON.stringify({
          questions,
          answers: updatedAnswers,
          date: new Date().toISOString(),
        })
      );

      setFinished(true);

      try {
        const feedbackResponse = await axios.post(
          "http://localhost:5000/api/evaluate-interview",
          {
            questions,
            answers: updatedAnswers,
          }
        );

        setFeedback(feedbackResponse.data.feedback);
      } catch (error) {
        console.error(error);
        setFeedback("Could not generate feedback.");
      }
    }
  };

  return (
    <div className="app">
      <h1>{language === "en" ? "AI Interview Coach" : "מאמן ראיונות AI"}</h1>

<button onClick={() => setLanguage(language === "en" ? "he" : "en")}>
  {language === "en" ? "עברית" : "English"}
</button>
      <div className="card">
        <textarea
          placeholder={
  language === "en"
    ? "Paste job description here..."
    : "הדביקי כאן תיאור משרה..."
}
          rows={8}
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
        />

        <br />
        <br />

        <input
          type="file"
          accept=".pdf"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              setFile(e.target.files[0]);
            }
          }}
        />

        <br />
        <br />

<button onClick={uploadCV} disabled={loading}>
  {loading
    ? language === "en"
      ? "Preparing Interview..."
      : "מכין ראיון..."
    : language === "en"
    ? "Upload CV"
    : "העלאת קורות חיים"}
</button>

<button onClick={loadLastInterview}>
  {language === "en" ? "View Last Interview" : "צפייה בראיון האחרון"}
</button>

        <h3 className="message">{message}</h3>
      </div>

      {questions.length > 0 && !finished && (
        <InterviewQuestion
          question={questions[currentQuestion]}
          currentQuestion={currentQuestion + 1}
          totalQuestions={questions.length}
          answer={answer}
          setAnswer={setAnswer}
          nextQuestion={nextQuestion}
          isLastQuestion={currentQuestion === questions.length - 1}
          language={language}
        />
      )}

      {finished && (
        <div style={{ marginTop: "30px", textAlign: "left" }}>
          <h2>Interview Complete</h2>

          <div className="stats">
            <div className="card stats-card">
              <h3>Questions</h3>
              <h2>{questions.length}</h2>
            </div>

            <div className="card stats-card">
              <h3>Answered</h3>
              <h2>{answers.length}</h2>
            </div>

            <div className="card stats-card">
              <h3>Status</h3>
              <h2>Complete</h2>
            </div>
          </div>

          <div className="card">
            <h3>Interview Feedback</h3>
            <pre style={{ whiteSpace: "pre-wrap" }}>{feedback}</pre>
          </div>

          {questions.map((question, index) => (
            <div key={index} className="summary-card">
              <strong>{question}</strong>
              <p>{answers[index]}</p>
            </div>
          ))}
        </div>
      )}

      {showHistory && savedInterview && (
        <div style={{ marginTop: "30px", textAlign: "left" }}>
          <h2>Last Interview</h2>
          <p>Date: {new Date(savedInterview.date).toLocaleString()}</p>

          {savedInterview.questions.map((question, index) => (
            <div key={index} className="summary-card">
              <strong>{question}</strong>
              <p>{savedInterview.answers[index]}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;