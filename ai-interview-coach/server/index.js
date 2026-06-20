const OpenAI = require("openai");
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const mammoth = require("mammoth");
const { default: pdf } = require("pdf-parse");

require("dotenv").config();

const app = express();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
    const { fileName, jobDescription, language, interviewType } = req.body;

    let cvText = "";

    if (fileName) {
      cvText = await extractCvText(fileName);
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            language === "he"
              ? "את מאמנת ראיונות עבודה מקצועית. צרי בדיוק 10 שאלות ראיון בעברית בלבד. השאלות צריכות להתאים לסוג הראיון, לקורות החיים ולתיאור המשרה. אל תוסיפי הסברים."
              : "You are a professional job interview coach. Generate exactly 10 interview questions in English only. Questions must fit the interview type, CV, and job description. Do not add explanations.",
        },
        {
          role: "user",
          content: `
Interview type: ${interviewType || "general"}

CV:
${cvText.slice(0, 4000)}

Job description:
${jobDescription || "No job description provided"}

Generate exactly 10 numbered interview questions.
Each question must be on its own line.
Do not add blank lines.
Do not add headings, explanations, introductions, or extra text.
`,
        },
      ],
    });

    res.json({
      success: true,
      questions: completion.choices[0].message.content,
      cvTextPreview: cvText.slice(0, 500),
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed generating AI questions",
      error: error.message,
    });
  }
});

app.post("/api/evaluate-interview", async (req, res) => {
  try {
    const { questions, answers, language } = req.body;

    const interviewText = questions
      .map(
        (question, index) => `
Question ${index + 1}:
${question}

Answer:
${answers[index] || "No answer"}
`
      )
      .join("\n");

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            language === "he"
              ? "את מאמנת ראיונות עבודה מקצועית. החזירי JSON תקין בלבד בעברית."
              : "You are a professional interview coach. Return valid JSON only in English.",
        },
        {
          role: "user",
          content: `
Evaluate this interview.

${interviewText}

Return ONLY valid JSON in this format:

{
  "overallScore": 8,
  "summary": "Overall feedback",
  "questions": [
    {
      "questionNumber": 1,
      "score": 8,
      "good": "What was good",
      "improve": "What should improve"
    }
  ]
}

Do not include markdown.
Do not include explanations.
Return valid JSON only.
`,
        },
      ],
    });

    const rawFeedback = completion.choices[0].message.content;
    const cleanedFeedback = rawFeedback
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const parsedFeedback = JSON.parse(cleanedFeedback);

    res.json({
      success: true,
      feedback: parsedFeedback,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed evaluating interview",
      error: error.message,
    });
  }
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});