let examData = null;
let currentQuestion = 0;
let score = 0;
let timeLeft = 30;
let userAnswers = [];
let timerInterval;
let reviewMode = false;

async function loadExamData() {
    try {
        const response = await fetch('./examenes/data.json');
        examData = await response.json();
        timeLeft = examData.timeLimit;
        initializeExam();
    } catch (error) {
        console.error('Error cargando los datos del examen:', error);
    }
}

function initializeExam() {
    // Crear y agregar el navegador de preguntas
    const navigator = createQuestionNavigator();
    const container = document.querySelector('.container');
    container.insertBefore(navigator, document.getElementById('quiz'));
    
    showQuestion();
    timerInterval = setInterval(updateTimer, 1000);
}

// Modificación en la función showQuestion() para cambiar la disposición de las preguntas de tipo reading
function showQuestion() {
    const quizContainer = document.getElementById('quiz');
    
    // Si estamos en modo de revisión final
    if (reviewMode) {
        let content = `
            <div class="final-message">
                <h3>¡Has completado todas las preguntas!</h3>
                <p>Ahora puedes:</p>
                <ul>
                    <li>Revisar tus respuestas haciendo clic en los números de pregunta en la parte superior.</li>
                    <li>O finalizar el examen y ver tus resultados haciendo clic en el botón "Ver Resultados".</li>
                </ul>
                <p class="questions-stats">Has respondido ${userAnswers.filter(answer => answer !== undefined).length} de ${examData.questions.length} preguntas.</p>
            </div>
        `;
        
        quizContainer.innerHTML = content;
        document.getElementById('nextBtn').textContent = 'Ver Resultados';
        document.getElementById('progress').textContent = 'Revisión Final';
        return;
    }
    
    // Si no estamos en modo de revisión, mostrar pregunta normal
    const question = examData.questions[currentQuestion];
    let content = '';
    
    // Verificar si es una pregunta de tipo reading
    if (question.type === "reading" && examData.readingSection) {
        // Nuevo layout para preguntas de tipo reading con disposición de dos columnas
        content += `
            <div class="reading-question-layout">
                <div class="reading-section" id="readingSection">
                    <h3 class="section-title">${examData.readingSection.title}</h3>
                    <div class="content">
                        <p>${examData.readingSection.content}</p>
                    </div>
                </div>
                
                <div class="question-section">
                    <div class="question">
                        <h3>${question.question}</h3>
                        <div class="options">
                            ${question.options.map((option, index) => {
                                const isAnswered = userAnswers[currentQuestion] !== undefined;
                                const isSelected = isAnswered && userAnswers[currentQuestion] === index;
                                return `
                                    <label>
                                        <input type="radio" name="question" value="${index}" ${isSelected ? 'checked' : ''}>
                                        ${option}
                                    </label>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    } else {
        // Layout estándar para preguntas normales
        const processedQuestion = question.question;
        let optionsHTML = '';
        
        question.options.forEach((option, index) => {
            const isAnswered = userAnswers[currentQuestion] !== undefined;
            const isSelected = isAnswered && userAnswers[currentQuestion] === index;
            optionsHTML += `
                <label>
                    <input type="radio" name="question" value="${index}" ${isSelected ? 'checked' : ''}>
                    ${option}
                </label>
            `;
        });

        content += `
            <div class="question">
                <h3>${processedQuestion}</h3>
                <div class="options">
                    ${optionsHTML}
                </div>
            </div>
        `;
    }

    quizContainer.innerHTML = content;
    
    // Actualizar el progreso
    document.getElementById('progress').textContent = 
        `Pregunta ${currentQuestion + 1} de ${examData.questions.length}`;
    
    // Cambiar el texto del botón dependiendo de si es la última pregunta
    document.getElementById('nextBtn').textContent = 
        currentQuestion === examData.questions.length - 1 ? 'Terminar' : 'Siguiente';
        
    // Actualizar el navegador de preguntas
    updateQuestionNavigator();
    
    // Renderizar las expresiones matemáticas después de actualizar el contenido
    if (window.MathJax) {
        MathJax.typesetPromise();
    }
}

function createQuestionNavigator() {
    const container = document.createElement('div');
    container.className = 'question-navigator';
    
    examData.questions.forEach((_, index) => {
        const indicator = document.createElement('div');
        indicator.className = 'question-indicator';
        indicator.setAttribute('data-question', index);
        
        // Agregar número de pregunta
        indicator.textContent = index + 1;
        
        // Actualizar estado inicial
        if (userAnswers[index] !== undefined) {
            indicator.classList.add('answered');
        }
        
        // Marcar la pregunta actual
        if (index === currentQuestion) {
            indicator.classList.add('current');
        }
        
        // Agregar evento de click
        indicator.addEventListener('click', () => navigateToQuestion(index));
        
        container.appendChild(indicator);
    });
    
    return container;
}

function navigateToQuestion(questionIndex) {
    // Si estamos en modo de revisión, salimos de él
    if (reviewMode) {
        reviewMode = false;
    }
    
    if (questionIndex === currentQuestion && !reviewMode) return;
    
    // Guardar la respuesta actual antes de navegar
    saveAnswer();
    
    // Actualizar la pregunta actual
    currentQuestion = questionIndex;
    showQuestion();
    updateQuestionNavigator();
}

function updateQuestionNavigator() {
    const indicators = document.querySelectorAll('.question-indicator');
    
    indicators.forEach((indicator, index) => {
        // Actualizar estado de respondida
        indicator.classList.toggle('answered', userAnswers[index] !== undefined);
        // Actualizar pregunta actual
        indicator.classList.toggle('current', index === currentQuestion && !reviewMode);
    });
    
    // Si estamos en modo revisión, ninguna pregunta está "activa"
    if (reviewMode) {
        indicators.forEach(indicator => {
            indicator.classList.remove('current');
        });
    }
}

function updateTimer() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const timerElement = document.getElementById('timer');
    timerElement.textContent = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    if (timeLeft <= 5) {
        timerElement.classList.add('warning');
    }
    
    if (timeLeft === 0) {
        finishExam();
    } else {
        timeLeft--;
    }
}

function saveAnswer() {
    const selectedOption = document.querySelector('input[name="question"]:checked');
    if (selectedOption) {
        const selectedValue = parseInt(selectedOption.value);
        userAnswers[currentQuestion] = selectedValue;
        
        // Corregir la lógica para calcular la puntuación
        // Verificamos si la respuesta anterior estaba correcta antes de incrementar el score
        const previousAnswer = userAnswers[currentQuestion];
        const correctAnswer = examData.questions[currentQuestion].correct;
        
        if (selectedValue === correctAnswer) {
            // Si no hay una respuesta anterior correcta, incrementamos el score
            if (previousAnswer !== correctAnswer) {
                score++;
            }
        } else {
            // Si la respuesta anterior era correcta y ahora no, decrementamos el score
            if (previousAnswer === correctAnswer) {
                score--;
            }
        }
        
        // Actualizar el navegador después de guardar la respuesta
        updateQuestionNavigator();
    }
}

function showFeedback() {
    const detailedFeedback = document.getElementById('detailed-feedback');
    let feedbackHTML = '';
    
    examData.questions.forEach((question, index) => {
        const userAnswer = userAnswers[index];
        const isCorrect = userAnswer === question.correct;
        const userAnswerText = userAnswer !== undefined ? question.options[userAnswer] : "Sin responder";
        
        feedbackHTML += `
            <div class="feedback-item ${isCorrect ? 'correct' : 'incorrect'}">
                <strong>Pregunta ${index + 1}:</strong> ${question.question}<br>
                Tu respuesta: ${userAnswerText}<br>
                Respuesta correcta: ${question.options[question.correct]}<br>
                ${question.feedback}
            </div>
        `;
    });
    
    detailedFeedback.innerHTML = feedbackHTML;
    
    // Renderizar las expresiones matemáticas en la retroalimentación
    if (window.MathJax) {
        MathJax.typesetPromise();
    }
}

function calculateStatistics() {
    const totalQuestions = examData.questions.length;
    const answeredQuestions = userAnswers.filter(answer => answer !== undefined).length;
    const unansweredQuestions = totalQuestions - answeredQuestions;
    
    // Calcular respuestas correctas e incorrectas
    let correctAnswers = 0;
    for (let i = 0; i < totalQuestions; i++) {
        if (userAnswers[i] === examData.questions[i].correct) {
            correctAnswers++;
        }
    }
    
    const incorrectAnswers = answeredQuestions - correctAnswers;
    const percentage = (correctAnswers / totalQuestions) * 100;
    
    // Calcular tiempo promedio por pregunta
    const totalTimeUsed = examData.timeLimit - timeLeft;
    const averageTimePerQuestion = answeredQuestions > 0 ? 
        (totalTimeUsed / answeredQuestions).toFixed(1) : 0;
    
    // Calcular tasa de aciertos por tipo de pregunta
    const questionTypes = {};
    examData.questions.forEach((question, index) => {
        const type = question.type || 'general';
        if (!questionTypes[type]) {
            questionTypes[type] = { total: 0, correct: 0 };
        }
        questionTypes[type].total++;
        if (userAnswers[index] === question.correct) {
            questionTypes[type].correct++;
        }
    });

    return {
        totalQuestions,
        answeredQuestions,
        unansweredQuestions,
        correctAnswers,
        incorrectAnswers,
        percentage,
        averageTimePerQuestion,
        questionTypes
    };
}

function finishExam() {
    clearInterval(timerInterval);
    document.getElementById('quiz').style.display = 'none';
    document.getElementById('nextBtn').style.display = 'none';
    document.getElementById('results').style.display = 'block';
    
    const stats = calculateStatistics();
    
    // Actualizar la puntuación con el valor calculado
    document.getElementById('score').textContent = stats.correctAnswers;
    document.getElementById('percentage').textContent = stats.percentage.toFixed(1);
    
    // Mostrar resultados detallados
    const statsHTML = `
        <div class="statistics-container">
            <h3>Estadísticas Generales</h3>
            <p>Puntuación final: ${stats.correctAnswers} de ${stats.totalQuestions}</p>
            <p>Porcentaje de aciertos: ${stats.percentage.toFixed(1)}%</p>
            <p>Preguntas respondidas: ${stats.answeredQuestions} de ${stats.totalQuestions}</p>
            <p>Preguntas sin responder: ${stats.unansweredQuestions}</p>
            <p>Respuestas correctas: ${stats.correctAnswers}</p>
            <p>Respuestas incorrectas: ${stats.incorrectAnswers}</p>
            <p>Tiempo promedio por pregunta: ${stats.averageTimePerQuestion} segundos</p>
            
            <h3>Rendimiento por Tipo de Pregunta</h3>
            ${Object.entries(stats.questionTypes).map(([type, data]) => `
                <div class="question-type-stat">
                    <h4>${type.charAt(0).toUpperCase() + type.slice(1)}</h4>
                    <p>Aciertos: ${data.correct} de ${data.total}</p>
                    <p>Porcentaje: ${((data.correct / data.total) * 100).toFixed(1)}%</p>
                </div>
            `).join('')}
        </div>
    `;
    
    document.getElementById('results').innerHTML = `
        <h2>Resultados del examen</h2>
        ${statsHTML}
        <h3>Retroalimentación detallada:</h3>
        <div id="detailed-feedback"></div>
    `;
    
    showFeedback();
}

document.getElementById('nextBtn').addEventListener('click', () => {
    saveAnswer(); // Guarda la respuesta actual si existe
    
    // Si estamos en modo de revisión y hacemos clic en "Ver Resultados"
    if (reviewMode) {
        finishExam();
        return;
    }
    
    // Si es la última pregunta, activar modo de revisión
    if (currentQuestion === examData.questions.length - 1) {
        reviewMode = true;
        showQuestion(); // Mostrar pantalla de revisión
    } else {
        // Avanzar a la siguiente pregunta
        currentQuestion++;
        showQuestion();
    }
});


// Cargar el examen cuando se carga la página
document.addEventListener('DOMContentLoaded', loadExamData);