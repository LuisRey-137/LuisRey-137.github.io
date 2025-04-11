// Datos de los exámenes disponibles
// En un entorno de producción, estos datos podrían cargarse desde un archivo JSON externo
const availableExams = [
    {
        id: "exam-1",
        title: "Examen 1",
        description: "Examen de práctica con problemas de álgebra, geometría y cálculo.",
        difficulty: "Intermedio",
        questions: 10,
        timeLimit: 30,
        imagePath: "assets/exam-icon.png"
    },
    {
        id: "exam-2",
        title: "Examen 2",
        description: "Examen de práctica con problemas de álgebra, geometría y cálculo.",
        difficulty: "Intermedio",
        questions: 10,
        timeLimit: 30,
        imagePath: "assets/exam-icon.png"
    }
];

/**
 * Carga los exámenes disponibles desde un JSON (simulado por ahora)
 * En el futuro, podrías reemplazar esto con una llamada fetch real
 */
async function loadAvailableExams() {
    try {
        // Simular la carga de datos (reemplazable por fetch real)
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(availableExams);
            }, 500); // Simular tiempo de carga
        });
    } catch (error) {
        console.error('Error cargando los exámenes disponibles:', error);
        return [];
    }
}

/**
 * Genera una tarjeta para un examen específico
 */
function createExamCard(exam) {
    const card = document.createElement('div');
    card.className = 'exam-card';
    
    // Formatear el tiempo límite adecuadamente
    const minutes = Math.floor(exam.timeLimit / 60);
    const seconds = exam.timeLimit % 60;
    const timeFormatted = minutes > 0 
        ? `${minutes} min${minutes > 1 ? 's' : ''}${seconds > 0 ? ` ${seconds} seg` : ''}`
        : `${seconds} segundos`;
    
    card.innerHTML = `
        <div class="exam-icon">
            <img src="${exam.imagePath || 'assets/exam-icon.png'}" alt="${exam.title}" onerror="this.src='assets/exam-icon.png'">
        </div>
        <div class="exam-details">
            <h3>${exam.title}</h3>
            <p>${exam.description}</p>
            <div class="exam-meta">
                <span class="difficulty ${exam.difficulty.toLowerCase()}">${exam.difficulty}</span>
                <span class="questions-count">${exam.questions} preguntas</span>
                <span class="time-limit">${timeFormatted}</span>
            </div>
        </div>
        <div class="exam-actions">
            <button class="start-btn" data-exam-id="${exam.id}">Comenzar</button>
        </div>
    `;
    
    // Agregar evento para iniciar el examen
    const startButton = card.querySelector('.start-btn');
    startButton.addEventListener('click', () => startExam(exam.id));
    
    return card;
}

/**
 * Inicia el examen seleccionado
 */
function startExam(examId) {
    // Redirigir al simulador de examen con el ID seleccionado
    window.location.href = `examen.html?id=${examId}`;
}

/**
 * Carga y muestra los exámenes disponibles
 */
async function displayExams() {
    const examsContainer = document.getElementById('exams-container');
    examsContainer.innerHTML = '<div class="loading">Cargando exámenes disponibles...</div>';
    
    try {
        const exams = await loadAvailableExams();
        
        if (exams.length === 0) {
            examsContainer.innerHTML = '<div class="no-exams">No hay exámenes disponibles en este momento.</div>';
            return;
        }
        
        // Limpiar el contenedor
        examsContainer.innerHTML = '';
        
        // Agregar cada examen como una tarjeta
        exams.forEach(exam => {
            const card = createExamCard(exam);
            examsContainer.appendChild(card);
        });
        
    } catch (error) {
        console.error('Error mostrando los exámenes:', error);
        examsContainer.innerHTML = '<div class="error">Error al cargar los exámenes. Por favor, intenta nuevamente más tarde.</div>';
    }
}

// Inicializar la página cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    displayExams();
});