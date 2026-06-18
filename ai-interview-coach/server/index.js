const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const mammoth = require("mammoth");
const { default: pdf } = require("pdf-parse");

require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

const extractCvText = async (fileName) => {
  const filePath = path.join(__dirname, "uploads", fileName);
  const extension = path.extname(fileName).toLowerCase();

  if (extension === ".pdf") {
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdf(dataBuffer);
    return pdfData.text;
  }

  if (extension === ".docx") {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }

  if (extension === ".doc") {
    return "Old .doc files are uploaded successfully, but text extraction is not supported yet. Please use .docx for best results.";
  }

  return "";
};

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Server is running!" });
});

app.post("/api/upload-cv", upload.single("cv"), (req, res) => {
  res.json({ success: true, fileName: req.file.filename });
});

app.post("/api/generate-questions", async (req, res) => {
  try {
    const { fileName, jobDescription, language } = req.body;

    const hasJobDescription =
      jobDescription && jobDescription.trim().length > 0;

    let cvText = "";

    if (fileName) {
      cvText = await extractCvText(fileName);
    }

    console.log("Extracted CV text preview:", cvText.slice(0, 300));

    const questions =
      language === "he"
        ? hasJobDescription
          ? `1. ספרי לי על עצמך ולמה התפקיד הזה מעניין אותך.
2. אילו כישורים מקורות החיים שלך מתאימים לתיאור המשרה?
3. תארי פרויקט React שבנית.
4. איך היית משתמשת ב-Node.js ו-Express בתפקיד הזה?
5. איזה ניסיון יש לך עם MySQL?
6. באילו חלקים מתיאור המשרה את הכי חזקה?
7. מה תצטרכי ללמוד כדי להתאים יותר לתפקיד?
8. תארי אתגר שנתקלת בו בפרויקט.
9. איך את מתמודדת עם דד-ליינים ופידבק?
10. למה כדאי לחברה הזאת לגייס אותך?`
          : `1. ספרי לי על עצמך.
2. למה את רוצה להיות מפתחת Full Stack?
3. הסבירי על פרויקט React שבנית.
4. איך מחברים בין React ל-Node.js?
5. למה משתמשים ב-Express?
6. איך עובדים עם MySQL?
7. תארי אתגר שהיה לך בפרויקט.
8. איך את מטפלת בשגיאות ב-API?
9. מה החוזקות שלך כמפתחת ג׳וניור?
10. למה כדאי לנו לגייס אותך?`
        : hasJobDescription
        ? `1. Tell me about yourself and why this role interests you.
2. Which skills from your CV match this job description?
3. Describe a React project you built.
4. How would you use Node.js and Express in this role?
5. What experience do you have with MySQL?
6. What parts of this job description are you strongest in?
7. What would you need to learn for this role?
8. Describe a challenge you faced in a project.
9. How do you handle deadlines and feedback?
10. Why should this company hire you?`
        : `1. Tell me about yourself.
2. Why do you want to become a Full Stack Developer?
3. Explain a React project you built.
4. How do you connect React to Node.js?
5. What is Express used for?
6. How do you work with MySQL?
7. Describe a challenge you had in a project.
8. How do you handle errors in an API?
9. What are your strengths as a junior developer?
10. Why should we hire you?`;

    res.json({
      success: true,
      questions,
      cvTextPreview: cvText.slice(0, 500),
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed generating questions",
      error: error.message,
    });
  }
});

app.post("/api/evaluate-interview", async (req, res) => {
  const { questions, answers, language } = req.body;

  const detailedFeedback = questions.map((question, index) => {
    const answer = answers[index] || "";
    const score = answer.length > 120 ? 9 : answer.length > 50 ? 7 : 4;
    return { question, answer, score };
  });

  const averageScore =
    detailedFeedback.reduce((sum, item) => sum + item.score, 0) /
    detailedFeedback.length;

  const feedback =
    language === "he"
      ? `ציון כללי: ${averageScore.toFixed(1)}/10

חוזקות:
- השקעת וענית על השאלות
- יש בסיס טוב לתרגול ראיונות
- התשובות מתחילות להראות ניסיון וחשיבה

מה לשפר:
- להוסיף דוגמאות ספציפיות מפרויקטים
- להסביר החלטות טכניות בצורה ברורה יותר
- להרחיב תשובות קצרות`
      : `Overall Score: ${averageScore.toFixed(1)}/10

Strengths:
- Good effort
- Answered most questions
- Demonstrated communication skills

Areas to Improve:
- Add more detail
- Use specific examples
- Explain technical decisions more clearly`;

  res.json({
    success: true,
    averageScore: averageScore.toFixed(1),
    detailedFeedback,
    feedback,
  });
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});