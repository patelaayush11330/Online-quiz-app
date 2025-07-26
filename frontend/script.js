let currentQuestion = 0;
let questions = [];
let answers = [];
let timer;
let timeLeft = 15;

function startQuiz() {
  const category = document.getElementById("category").value;
  const difficulty = document.getElementById("difficulty").value;

  let url = `http://localhost:3000/api/questions`;
  if (category || difficulty) {
    const params = new URLSearchParams();
    if (category) params.append("category", category);
    if (difficulty) params.append("difficulty", difficulty);
    url += "?" + params.toString();
  }

  fetch(url)
    .then(res => res.json())
    .then(data => {
      questions = data;
      currentQuestion = 0;
      answers = [];
      showQuestion();
    });
}

function showQuestion() {
  clearInterval(timer);
  timeLeft = 15;

  const question = questions[currentQuestion];
  const quizBox = document.getElementById("quiz-box");
  document.getElementById("next-btn").style.display = "none";

  quizBox.innerHTML = `
    <h3>${question.question}</h3>
    ${question.options
      .map(
        (opt, idx) =>
          `<div class="option"><input type="radio" name="option" value="${opt}" id="opt${idx}" />
           <label for="opt${idx}">${opt}</label></div>`
      )
      .join("")}
    <button id="submit-btn">Submit</button>
  `;

  document.getElementById("submit-btn").addEventListener("click", submitAnswer);

  startTimer();
}

function startTimer() {
  const timerDisplay = document.getElementById("timer");
  timerDisplay.style.display = "block";
  timerDisplay.innerText = `Time left: ${timeLeft}s`;

  timer = setInterval(() => {
    timeLeft--;
    timerDisplay.innerText = `Time left: ${timeLeft}s`;
    if (timeLeft <= 0) {
      clearInterval(timer);
      submitAnswer(); // Auto-submit if time runs out
    }
  }, 1000);
}

function submitAnswer() {
  clearInterval(timer);

  const selected = document.querySelector('input[name="option"]:checked');
  const selectedAnswer = selected ? selected.value : "No Answer";
  answers[currentQuestion] = selectedAnswer;

  const correctAnswer = getCorrectAnswer(questions[currentQuestion].id);
  const allOptions = document.querySelectorAll('input[name="option"]');

  allOptions.forEach(opt => {
    opt.disabled = true;
    if (opt.value === correctAnswer) {
      opt.parentElement.style.backgroundColor = "lightgreen";
    } else if (opt.checked) {
      opt.parentElement.style.backgroundColor = "lightcoral";
    }
  });

  document.getElementById("submit-btn").style.display = "none";
  document.getElementById("next-btn").style.display = "inline-block";
}

function getCorrectAnswer(id) {
  const question = questions.find(q => q.id === id);
  return question.answer; // Only works if we kept the full question object
}

document.getElementById("next-btn").addEventListener("click", () => {
  currentQuestion++;
  if (currentQuestion < questions.length) {
    showQuestion();
  } else {
    submitAnswers();
  }
});

function submitAnswers() {
  const questionIds = questions.map(q => q.id);

  fetch("http://localhost:3000/api/answers", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ answers, questionIds })
  })
    .then(res => res.json())
    .then(data => {
      document.getElementById("quiz-box").innerHTML = `
        <h3>You scored ${data.score} out of ${data.total}</h3>
        ${data.results
          .map(
            r => `
            <div>
              <p><strong>Q:</strong> ${r.question}</p>
              <p>Your Answer: <span style="color:${r.correct ? 'green' : 'red'}">${r.userAnswer}</span></p>
              <p>Correct Answer: ${r.correctAnswer}</p>
              <hr/>
            </div>
          `
          )
          .join("")}
      `;
      document.getElementById("next-btn").style.display = "none";
      document.getElementById("timer").style.display = "none";
    });
}
