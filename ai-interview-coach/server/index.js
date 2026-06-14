const express = require("express");
const cors = require("cors");
const multer = require("multer");

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

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running!",
  });
});

app.post("/api/upload-cv", upload.single("cv"), (req, res) => {
  res.json({
    success: true,
    fileName: req.file.filename,
  });
});

app.post("/api/generate-questions", async (req, res) => {
  const { jobDescription } = req.body;

  const hasJobDescription =
    jobDescription && jobDescription.trim().length > 0;

  const questions = hasJobDescription
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
  });
});

app.post("/api/evaluate-interview", async (req, res) => {
  const { questions, answers } = req.body;

  const detailedFeedback = questions.map((question, index) => {
    const answer = answers[index] || "";
    const score = answer.length > 120 ? 9 : answer.length > 50 ? 7 : 4;

    return {
      question,
      answer,
      score,
      strengths:
        answer.length > 50
          ? ["Clear answer", "Good effort", "Relevant response"]
          : ["You attempted the question"],
      improvements:
        answer.length > 50
          ? ["Add more specific examples", "Explain your technical decisions"]
          : ["Write a fuller answer", "Use examples from your projects"],
    };
  });

  const averageScore =
    detailedFeedback.reduce((sum, item) => sum + item.score, 0) /
    detailedFeedback.length;

  res.json({
    success: true,
    averageScore: averageScore.toFixed(1),
    detailedFeedback,
  });
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});