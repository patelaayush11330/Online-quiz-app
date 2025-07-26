const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const questionsFile = path.join(__dirname, "questions.json");

// Load questions
const questions = JSON.parse(fs.readFileSync(questionsFile, "utf8"));

// GET questions (with optional filters)
app.get("/api/questions", (req, res) => {
  const { category, difficulty } = req.query;
  let filtered = questions;

  if (category) filtered = filtered.filter(q => q.category === category);
  if (difficulty) filtered = filtered.filter(q => q.difficulty === difficulty);

  const questionsWithoutAnswers = filtered.map(({ answer, ...rest }) => rest);

  res.json(questionsWithoutAnswers);
});


// POST answers
app.post("/api/answers", (req, res) => {
  const { answers, questionIds } = req.body;

  // Filter questions by the IDs received
  const selectedQuestions = questions.filter(q => questionIds.includes(q.id));

  let score = 0;
  const results = selectedQuestions.map((q, index) => {
    const correct = answers[index] === q.answer;
    if (correct) score++;
    return {
      question: q.question,
      correctAnswer: q.answer,
      userAnswer: answers[index] || "No Answer",
      correct
    };
  });

  res.json({ score, total: selectedQuestions.length, results });
});


app.listen(PORT, () => {
  console.log(`✅ Server is running at http://localhost:${PORT}`);
});
