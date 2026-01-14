// ========== МОДУЛЬ РАБОТЫ С РЕПЕТИТОРАМИ ==========

console.log('👨‍🏫 Модуль репетиторов загружен');

let allTutors = [];
let filteredTutors = [];

/**
 * Инициализация модуля репетиторов
 */
async function initTutors() {
    console.log('🚀 Инициализация модуля репетиторов...');
    
    try {
        await loadTutors();
        setupTutorEventListeners();
        
    } catch (error) {
        console.error('Ошибка инициализации репетиторов:', error);
        showNotification('Ошибка загрузки репетиторов', 'danger');
    }
}

/**
 * Загружает репетиторов с сервера
 */
async function loadTutors() {
    console.log('📥 Загрузка репетиторов...');
    
    try {
        // Показываем загрузку
        document.getElementById('tutorsLoading').style.display = 'block';
        
        const tutors = await getTutors();
        console.log('✅ Получено репетиторов:', tutors.length);
        console.log('Пример первого репетитора:', tutors[0]);
        
        allTutors = tutors;
        filteredTutors = [...tutors];
        
        // Скрываем загрузку
        document.getElementById('tutorsLoading').style.display = 'none';
        
        // Отображаем
        displayTutors();
        
    } catch (error) {
        console.error('❌ Ошибка загрузки репетиторов:', error);
        document.getElementById('tutorsLoading').innerHTML = 
            '<div class="alert alert-danger">Ошибка загрузки репетиторов</div>';
    }
}

/**
 * Отображает репетиторов
 */
function displayTutors() {
    console.log('🎨 Отображаем репетиторов:', filteredTutors.length);
    
    const container = document.getElementById('tutorsContainer');
    const loading = document.getElementById('tutorsLoading');
    const noTutors = document.getElementById('noTutors');
    
    if (!container) {
        console.error('❌ Контейнер репетиторов не найден!');
        return;
    }
    
    // Скрываем loading
    if (loading) loading.style.display = 'none';
    
    // Если нет репетиторов
    if (filteredTutors.length === 0) {
        if (noTutors) noTutors.style.display = 'block';
        container.style.display = 'none';
        return;
    }
    
    // Скрываем "нет репетиторов"
    if (noTutors) noTutors.style.display = 'none';
    
    // Очищаем контейнер
    container.innerHTML = '';
    
    // Добавляем репетиторов
    filteredTutors.forEach(tutor => {
        const tutorCard = createTutorCard(tutor);
        container.appendChild(tutorCard);
    });
    
    // Показываем контейнер
    container.style.display = 'flex';
    console.log('✅ Репетиторы отображены');
}

/**
 * Создает карточку репетитора
 */
function createTutorCard(tutor) {
    console.log('Создаем карточку для репетитора:', tutor.name);
    
    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-4 mb-4';
    
    // Форматируем языки
    const languagesOffered = Array.isArray(tutor.languages_offered) 
        ? tutor.languages_offered.join(', ')
        : tutor.languages_offered || 'Не указано';
    
    const languagesSpoken = Array.isArray(tutor.languages_spoken)
        ? tutor.languages_spoken.join(', ')
        : tutor.languages_spoken || 'Не указано';
    
    // Уровень с цветом
    let levelClass = 'bg-secondary';
    let levelText = tutor.language_level || 'Не указан';
    
    if (tutor.language_level === 'Beginner') {
        levelClass = 'bg-success';
        levelText = 'Начальный';
    } else if (tutor.language_level === 'Intermediate') {
        levelClass = 'bg-warning';
        levelText = 'Средний';
    } else if (tutor.language_level === 'Advanced') {
        levelClass = 'bg-danger';
        levelText = 'Продвинутый';
    }
    
    col.innerHTML = `
        <div class="card h-100 border shadow-sm tutor-card">
            <div class="card-body">
                <div class="d-flex align-items-start mb-3">
                    <!-- Аватар -->
                    <div class="tutor-avatar me-3">
                        <i class="bi bi-person-circle text-primary" style="font-size: 3rem;"></i>
                    </div>
                    <!-- Информация -->
                    <div>
                        <h5 class="card-title mb-1">${tutor.name}</h5>
                        <div class="d-flex align-items-center mb-2">
                            <span class="badge ${levelClass} me-2">${levelText}</span>
                            <small class="text-muted">
                                <i class="bi bi-clock-history me-1"></i>
                                ${tutor.work_experience || 0} лет опыта
                            </small>
                        </div>
                    </div>
                </div>
                
                <!-- Языки -->
                <div class="mb-3">
                    <h6 class="small text-muted mb-2">
                        <i class="bi bi-translate me-1"></i>Преподаёт:
                    </h6>
                    <p class="mb-2">${languagesOffered}</p>
                    
                    <h6 class="small text-muted mb-2">
                        <i class="bi bi-chat-text me-1"></i>Говорит:
                    </h6>
                    <p class="mb-0">${languagesSpoken}</p>
                </div>
                
                <!-- Стоимость -->
                <div class="mt-auto">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <span class="text-muted small">Стоимость:</span>
                            <h4 class="mb-0 text-primary">${tutor.price_per_hour || 0} ₽/час</h4>
                        </div>
                        <button type="button" 
                                class="btn btn-outline-primary btn-sm"
                                onclick="selectTutor(${tutor.id})">
                            <i class="bi bi-eye me-1"></i>Выбрать
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    return col;
}

/**
 * Настраивает обработчики событий
 */
function setupTutorEventListeners() {
    // Форма поиска репетиторов
    const searchForm = document.getElementById('tutorSearchForm');
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            searchTutors();
        });
    }
    
    // Кнопка сброса поиска
    const resetBtn = document.getElementById('resetTutorSearch');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetTutorSearch);
    }
    
    // Реальный поиск при изменении полей
    const languageSelect = document.getElementById('tutorLanguage');
    const levelSelect = document.getElementById('tutorLevel');
    const experienceSelect = document.getElementById('tutorExperience');
    
    if (languageSelect) {
        languageSelect.addEventListener('change', searchTutors);
    }
    
    if (levelSelect) {
        levelSelect.addEventListener('change', searchTutors);
    }
    
    if (experienceSelect) {
        experienceSelect.addEventListener('change', searchTutors);
    }
}

/**
 * Ищет репетиторов по критериям
 */
function searchTutors() {
    console.log('🔍 Поиск репетиторов...');
    
    const language = document.getElementById('tutorLanguage').value;
    const level = document.getElementById('tutorLevel').value;
    const experience = document.getElementById('tutorExperience').value;
    
    console.log('Критерии поиска:', { language, level, experience });
    
    filteredTutors = allTutors.filter(tutor => {
        // Фильтрация по языку
        let languageMatch = true;
        if (language) {
            if (Array.isArray(tutor.languages_offered)) {
                languageMatch = tutor.languages_offered.includes(language);
            } else {
                languageMatch = tutor.languages_offered === language;
            }
        }
        
        // Фильтрация по уровню
        const levelMatch = !level || tutor.language_level === level;
        
        // Фильтрация по опыту
        let experienceMatch = true;
        if (experience) {
            const minExperience = parseInt(experience);
            experienceMatch = tutor.work_experience >= minExperience;
        }
        
        return languageMatch && levelMatch && experienceMatch;
    });
    
    // Отображаем результат
    displayTutors();
    
    // Показываем уведомление
    if (filteredTutors.length === 0) {
        showNotification('Репетиторы не найдены. Попробуйте другие параметры.', 'warning');
    } else {
        showNotification(`Найдено репетиторов: ${filteredTutors.length}`, 'info', 2000);
    }
}

/**
 * Сбрасывает поиск репетиторов
 */
function resetTutorSearch() {
    document.getElementById('tutorLanguage').value = '';
    document.getElementById('tutorLevel').value = '';
    document.getElementById('tutorExperience').value = '';
    
    filteredTutors = [...allTutors];
    displayTutors();
    
    showNotification('Поиск сброшен', 'info', 2000);
}

/**
 * Выбирает репетитора
 */
function selectTutor(tutorId) {
    console.log('🎯 Выбран репетитор ID:', tutorId);
    
    const tutor = allTutors.find(t => t.id === tutorId);
    if (tutor) {
        showNotification(`Выбран репетитор: ${tutor.name}`, 'success');
        // TODO: открыть форму заявки для репетитора
    }
}

// Экспортируем функции
window.initTutors = initTutors;
window.selectTutor = selectTutor;
window.searchTutors = searchTutors;
window.resetTutorSearch = resetTutorSearch;

// Автозапуск
setTimeout(() => {
    console.log('🔧 Автозапуск модуля репетиторов');
    if (typeof initTutors === 'function') {
        initTutors();
    }
}, 100);    