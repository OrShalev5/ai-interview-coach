import { useState } from "react";
import axios from "axios";
import InterviewQuestion from "./components/InterviewQuestion";
import "./App.css";
import { jsPDF } from "jspdf";

type SavedInterview = {
  questions: string[];
  answers: string[];
  date: string;
  language?: "en" | "he";
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
  const [feedback, setFeedback] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [savedInterview, setSavedInterview] =
    useState<SavedInterview | null>(null);
  const [language, setLanguage] = useState<"en" | "he">("en");
  const [history, setHistory] = useState<SavedInterview[]>([]);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [selectedInterview, setSelectedInterview] =
    useState<SavedInterview | null>(null);
  const [interviewType, setInterviewType] = useState("general");
  const [showWelcome, setShowWelcome] = useState(true);
const [theme, setTheme] = useState<"light" | "dark">("light");
  const isHebrew = language === "he";

  const loadLastInterview = () => {
    const saved = localStorage.getItem("lastInterview");

    if (saved) {
      setSavedInterview(JSON.parse(saved));
      setShowHistory(true);
      setShowAllHistory(false);
      setSelectedInterview(null);
      setMessage("");
    } else {
      setMessage(isHebrew ? "לא נמצא ראיון שמור" : "No saved interview found");
    }
  };

  const loadInterviewHistory = () => {
    const savedHistory = JSON.parse(
      localStorage.getItem("interviewHistory") || "[]"
    );

    setHistory(savedHistory);
    setShowAllHistory(true);
    setShowHistory(false);
    setSelectedInterview(null);
  };

  const uploadCV = async () => {
    if (!file) {
      setMessage(
        isHebrew ? "בחרי קודם קובץ קורות חיים" : "Please choose a CV first"
      );
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

      setMessage(isHebrew ? `הועלה: ${file.name}` : `Uploaded: ${file.name}`);

      const questionsResponse = await axios.post(
        "http://localhost:5000/api/generate-questions",
        {
          fileName: uploadedFileName,
          jobDescription,
          language,
          interviewType,
        }
      );

const cleanedQuestions = questionsResponse.data.questions
  .split("\n")
  .map((q: string) => q.trim())
  .filter((q: string) => q.length > 0)
  .slice(0, 10);

setQuestions(cleanedQuestions);
      setCurrentQuestion(0);
      setAnswer("");
      setAnswers([]);
      setFinished(false);
      setFeedback("");
      setShowHistory(false);
      setShowAllHistory(false);
      setSelectedInterview(null);
    } catch (error) {
      console.error(error);
      setMessage(isHebrew ? "משהו השתבש" : "Something went wrong");
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
      const newInterview: SavedInterview = {
        questions,
        answers: updatedAnswers,
        date: new Date().toISOString(),
        language,
      };

      const existingHistory = JSON.parse(
        localStorage.getItem("interviewHistory") || "[]"
      );

      localStorage.setItem(
        "interviewHistory",
        JSON.stringify([newInterview, ...existingHistory])
      );

      localStorage.setItem("lastInterview", JSON.stringify(newInterview));

      setFinished(true);

      try {
        const feedbackResponse = await axios.post(
          "http://localhost:5000/api/evaluate-interview",
          {
            questions,
            answers: updatedAnswers,
            language,
          }
        );

        setFeedback(feedbackResponse.data.feedback);
      } catch (error) {
        console.error(error);
        setFeedback(
          isHebrew ? "לא ניתן היה ליצור משוב." : "Could not generate feedback."
        );
      }
    }
  };

  const downloadReport = () => {
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text("AI Interview Report", 20, 20);

    doc.setFontSize(12);
    doc.text(`Date: ${new Date().toLocaleString()}`, 20, 35);

    let y = 50;

    questions.forEach((question, index) => {
      const cleanQuestion = isHebrew
        ? `Question ${index + 1}`
        : `Q${index + 1}: ${question}`;

      const cleanAnswer = isHebrew
        ? `Answer: ${answers[index] ? "Saved in app" : "No answer"}`
        : `A: ${answers[index] || "No answer"}`;

      doc.text(cleanQuestion, 20, y);
      y += 10;

      const splitAnswer = doc.splitTextToSize(cleanAnswer, 170);
      doc.text(splitAnswer, 20, y);
      y += splitAnswer.length * 8 + 10;

      if (y > 260) {
        doc.addPage();
        y = 20;
      }
    });

    doc.save("Interview_Report.pdf");
  };

if (showWelcome) {
  return (
    <div className={`welcome-page ${theme}`} dir={isHebrew ? "rtl" : "ltr"}>
      <h1>{isHebrew ? "מאמן ראיונות AI" : "AI Interview Coach"}</h1>

<div className="top-controls">
  <button
    className="small-btn"
    title={isHebrew ? "החלפת שפה" : "Change Language"}
    onClick={() => setLanguage(isHebrew ? "en" : "he")}
  >
    🌐
  </button>

  <button
    className="small-btn"
    title={
      theme === "light"
        ? isHebrew
          ? "מצב כהה"
          : "Dark Mode"
        : isHebrew
        ? "מצב בהיר"
        : "Light Mode"
    }
    onClick={() => setTheme(theme === "light" ? "dark" : "light")}
  >
    {theme === "light" ? "🌙" : "☀️"}
  </button>
</div>

<p>
  {isHebrew
    ? "העלי קורות חיים, הוסיפי תיאור משרה (לא חובה), והתאמני לראיון עבודה מותאם אישית. בסיום תקבלי משוב ודוח מסכם לשיפור הביצועים שלך."
    : "Upload your CV, optionally add a job description, and practice a personalized interview. At the end you'll receive feedback and a report to help improve your interview skills."}
</p>
<ul>
  <li>{isHebrew ? "✔ שאלות מותאמות לקורות החיים" : "✔ Questions tailored to your CV"}</li>
  <li>{isHebrew ? "✔ תמיכה בעברית ובאנגלית" : "✔ English and Hebrew support"}</li>
  <li>{isHebrew ? "✔ משוב אישי בסיום" : "✔ Personalized feedback"}</li>
</ul>

      <button onClick={() => setShowWelcome(false)}>
        {isHebrew ? "התחלת ראיון" : "Start Interview"}
      </button>
    </div>
  );
}

return (
  <div className={`app ${theme}`} dir={isHebrew ? "rtl" : "ltr"}>
<h1>{isHebrew ? "מאמן ראיונות AI" : "AI Interview Coach"}</h1>

<div className="top-controls">
  <button
    className="small-btn"
    title={isHebrew ? "החלפת שפה" : "Change Language"}
    onClick={() => setLanguage(isHebrew ? "en" : "he")}
  >
    🌐
  </button>

  <button
    className="small-btn"
    title={
      theme === "light"
        ? (isHebrew ? "מצב כהה" : "Dark Mode")
        : (isHebrew ? "מצב בהיר" : "Light Mode")
    }
    onClick={() => setTheme(theme === "light" ? "dark" : "light")}
  >
    {theme === "light" ? "🌙" : "☀️"}
  </button>
</div>

      <div className="card">
        <textarea
          placeholder={
            isHebrew
              ? "הדביקי כאן תיאור משרה..."
              : "Paste job description here..."
          }
          rows={8}
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
        />

        <br />
        <br />

        <select
  value={interviewType}
  onChange={(e) => setInterviewType(e.target.value)}
>
  <option value="general">
    {isHebrew ? "ראיון כללי" : "General Interview"}
  </option>
  <option value="hr">
    {isHebrew ? "ראיון HR" : "HR Interview"}
  </option>
  <option value="behavioral">
    {isHebrew ? "ראיון התנהגותי" : "Behavioral Interview"}
  </option>
  <option value="technical">
    {isHebrew ? "ראיון מקצועי / טכני" : "Professional / Technical Interview"}
  </option>
  <option value="customer-service">
    {isHebrew ? "שירות לקוחות" : "Customer Service"}
  </option>
  <option value="sales">
    {isHebrew ? "מכירות" : "Sales"}
  </option>
  <option value="finance">
    {isHebrew ? "בנקאות / פיננסים" : "Banking / Finance"}
  </option>
  <option value="management">
    {isHebrew ? "ניהול" : "Management"}
  </option>
</select>

        <br />
        <br />

        <label className="file-upload">
          {isHebrew ? "בחירת קובץ קורות חיים" : "Choose CV File"}
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            style={{ display: "none" }}
            onChange={(e) => {
              if (e.target.files?.[0]) {
                setFile(e.target.files[0]);
              }
            }}
          />
        </label>

        <p>
          {file ? file.name : isHebrew ? "לא נבחר קובץ" : "No file selected"}
        </p>

        <button onClick={uploadCV} disabled={loading}>
          {loading
            ? isHebrew
              ? "מכין ראיון..."
              : "Preparing Interview..."
            : isHebrew
            ? "העלאת קורות חיים"
            : "Upload CV"}
        </button>

        <button onClick={loadLastInterview}>
          {isHebrew ? "צפייה בראיון האחרון" : "View Last Interview"}
        </button>

        <button onClick={loadInterviewHistory}>
          {isHebrew ? "צפייה בכל הראיונות" : "View All Interviews"}
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
        <div
          style={{
            marginTop: "30px",
            textAlign: isHebrew ? "right" : "left",
          }}
        >
          <h2>{isHebrew ? "הראיון הסתיים" : "Interview Complete"}</h2>

          <button onClick={downloadReport}>
            {isHebrew ? "הורדת דוח PDF" : "Download PDF Report"}
          </button>

          <br />
          <br />

          <div className="stats">
            <div className="card stats-card">
              <h3>{isHebrew ? "שאלות" : "Questions"}</h3>
              <h2>{questions.length}</h2>
            </div>

            <div className="card stats-card">
              <h3>{isHebrew ? "נענו" : "Answered"}</h3>
              <h2>{answers.length}</h2>
            </div>

            <div className="card stats-card">
              <h3>{isHebrew ? "סטטוס" : "Status"}</h3>
              <h2>{isHebrew ? "הושלם" : "Complete"}</h2>
            </div>
          </div>

          {feedback && (
  <div className="card">
    <h2>
      {isHebrew ? "ציון כללי" : "Overall Score"}:
      {" "}
      {feedback.overallScore}/10
    </h2>

    <p>{feedback.summary}</p>
  </div>
)}

          {questions.map((question, index) => (
            <div key={index} className="summary-card">
              <strong>{question}</strong>
              <p>{answers[index]}</p>
            </div>
          ))}
        </div>
      )}

      {showHistory && savedInterview && (
        <div
          style={{
            marginTop: "30px",
            textAlign: isHebrew ? "right" : "left",
          }}
        >
          <h2>{isHebrew ? "ראיון אחרון" : "Last Interview"}</h2>
          <p>
            {isHebrew ? "תאריך" : "Date"}:{" "}
            {new Date(savedInterview.date).toLocaleString()}
          </p>

          {savedInterview.questions.map((question, index) => (
            <div key={index} className="summary-card">
              <strong>{question}</strong>
              <p>{savedInterview.answers[index]}</p>
            </div>
          ))}
        </div>
      )}

      {showAllHistory && (
        <div
          style={{
            marginTop: "30px",
            textAlign: isHebrew ? "right" : "left",
          }}
        >
          <h2>{isHebrew ? "היסטוריית ראיונות" : "Interview History"}</h2>

          {history.length === 0 && (
            <p>
              {isHebrew
                ? "אין עדיין ראיונות שמורים"
                : "No saved interviews yet"}
            </p>
          )}

          {history.map((interview, index) => (
            <div
              key={index}
              className="summary-card"
              style={{ cursor: "pointer" }}
              onClick={() => setSelectedInterview(interview)}
            >
              <strong>{new Date(interview.date).toLocaleString()}</strong>
              <p>
                {isHebrew
                  ? `${interview.questions.length} שאלות`
                  : `${interview.questions.length} Questions`}
              </p>
            </div>
          ))}
        </div>
      )}

      {selectedInterview && (
        <div className="card">
          <h2>{isHebrew ? "פרטי ראיון" : "Interview Details"}</h2>

          {selectedInterview.questions.map((question, index) => (
            <div key={index} className="summary-card">
              <strong>{question}</strong>
              <p>{selectedInterview.answers[index]}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;