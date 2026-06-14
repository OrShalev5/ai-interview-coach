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
<div
  style={{
    width: "100%",
    backgroundColor: "#e5e7eb",
    borderRadius: "999px",
    height: "12px",
    marginBottom: "20px",
  }}
>
  <div
    style={{
      width: `${(currentQuestion / totalQuestions) * 100}%`,
      backgroundColor: "#3b82f6",
      height: "12px",
      borderRadius: "999px",
      transition: "0.3s",
    }}
  />
</div>
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