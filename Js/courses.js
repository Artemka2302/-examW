// ========== МОДУЛЬ РАБОТЫ С КУРСАМИ ==========

// Конфигурация пагинации
const COURSES_PER_PAGE = 5; // По ТЗ: 5 курсов на странице
let allCourses = []; // Все курсы с сервера
let filteredCourses = []; // Отфильтрованные курсы
let currentPage = 1; // Текущая страница
let totalPages = 1; // Всего страниц

/**
 * Инициализация модуля курсов
 */
async function initCourses() {
    console.log('Инициализация модуля курсов...');
    
    // Загружаем курсы с сервера
    await loadCourses();
    
    // Настраиваем обработчики событий
    setupCourseEventListeners();
    
    // Показываем кнопку "Подать заявку"
    document.getElementById('openOrderBtn').style.display = 'inline-flex';
}

/**
 * Загружает курсы с сервера
 */
async function loadCourses() {
    try {
        // Показываем индикатор загрузки
        showLoadingState(true);
        
        // Получаем курсы из API
        const courses = await getCourses();
        
        if (courses && Array.isArray(courses)) {
            allCourses = courses;
            filteredCourses = [...courses];
            
            console.log(`Загружено курсов: ${courses.length}`);
            
            // Отображаем курсы
            displayCourses();
            
            // Инициализируем пагинацию
            initPagination();
            
            // Показываем уведомление при успешной загрузке
            showNotification(`Загружено ${courses.length} курсов`, 'success', 3000);
        } else {
            throw new Error('Неверный формат данных курсов');
        }
    } catch (error) {
        console.error('Ошибка загрузки курсов:', error);
        showNotification('Не удалось загрузить курсы. Проверьте подключение.', 'danger');
        
        // Показываем состояние "нет курсов"
        showNoCoursesState();
    } finally {
        // Скрываем индикатор загрузки
        showLoadingState(false);
    }
}

/**
 * Отображает курсы на текущей странице
 */
function displayCourses() {
    const container = document.getElementById('coursesContainer');
    const pagination = document.getElementById('coursesPagination');
    
    if (!container || filteredCourses.length === 0) {
        showNoCoursesState();
        return;
    }
    
    // Рассчитываем курсы для текущей страницы
    const startIndex = (currentPage - 1) * COURSES_PER_PAGE;
    const endIndex = startIndex + COURSES_PER_PAGE;
    const pageCourses = filteredCourses.slice(startIndex, endIndex);
    
    // Очищаем контейнер
    container.innerHTML = '';
    
    // Добавляем курсы в контейнер
    pageCourses.forEach(course => {
        const courseCard = createCourseCard(course);
        container.appendChild(courseCard);
    });
    
    // Показываем контейнер
    container.style.display = 'flex';
    
    // Обновляем пагинацию
    updatePagination();
    
    // Показываем пагинацию если нужно
    if (totalPages > 1) {
        pagination.style.display = 'flex';
    } else {
        pagination.style.display = 'none';
    }
}

/**
 * Создает карточку курса
 * @param {Object} course - Данные курса
 * @returns {HTMLElement} Элемент карточки
 */
function createCourseCard(course) {
    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-4';
    
    // Определяем цвет бейджа по уровню
    let levelClass = '';
    let levelText = '';
    
    switch(course.level?.toLowerCase()) {
        case 'beginner':
            levelClass = 'level-beginner';
            levelText = 'Начальный';
            break;
        case 'intermediate':
            levelClass = 'level-intermediate';
            levelText = 'Средний';
            break;
        case 'advanced':
            levelClass = 'level-advanced';
            levelText = 'Продвинутый';
            break;
        default:
            levelClass = 'level-beginner';
            levelText = course.level || 'Не указан';
    }
    
    // Рассчитываем общую продолжительность в часах
    const totalHours = course.total_length * course.week_length;
    
    // Форматируем даты начала
    const startDates = course.start_dates?.slice(0, 3) || []; // Берем первые 3 даты
    const formattedDates = startDates.map(date => {
        const d = new Date(date);
        return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
    }).join(', ');
    
    col.innerHTML = `
        <div class="card course-card shadow-sm h-100">
            <!-- Бейдж уровня -->
            <div class="course-level-badge ${levelClass}">
                ${levelText}
            </div>
            
            <!-- Изображение курса -->
            <div class="course-image">
                <i class="bi bi-translate"></i>
            </div>
            
            <!-- Тело карточки -->
            <div class="course-body">
                <h5 class="course-title">${course.name}</h5>
                <p class="course-description" data-bs-toggle="tooltip" title="${course.description}">
                    ${truncateText(course.description, 120)}
                </p>
                
                <!-- Детали курса -->
                <div class="course-details">
                    <div class="course-details-item">
                        <span class="course-details-label">Преподаватель</span>
                        <span class="course-details-value">${course.teacher}</span>
                    </div>
                    <div class="course-details-item">
                        <span class="course-details-label">Часов</span>
                        <span class="course-details-value">${totalHours}</span>
                    </div>
                    <div class="course-details-item">
                        <span class="course-details-label">Недель</span>
                        <span class="course-details-value">${course.total_length}</span>
                    </div>
                </div>
            </div>
            
            <!-- Футер карточки -->
            <div class="course-action">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <span class="text-muted small">Стоимость:</span>
                        <h6 class="mb-0">${course.course_fee_per_hour} ₽/час</h6>
                    </div>
                    <button type="button" 
                            class="btn btn-primary btn-sm"
                            onclick="selectCourse(${course.id})"
                            data-course-id="${course.id}">
                        <i class="bi bi-info-circle me-1"></i>Подробнее
                    </button>
                </div>
            </div>
        </div>
    `;
    
    return col;
}

/**
 * Инициализирует пагинацию
 */
function initPagination() {
    totalPages = Math.ceil(filteredCourses.length / COURSES_PER_PAGE);
    currentPage = 1;
}

/**
 * Обновляет отображение пагинации
 */
function updatePagination() {
    const pagination = document.getElementById('coursesPagination');
    if (!pagination) return;
    
    const ul = pagination.querySelector('ul');
    if (!ul) return;
    
    ul.innerHTML = '';
    
    // Кнопка "Назад"
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `
        <a class="page-link" href="#" onclick="changePage(${currentPage - 1})" aria-label="Предыдущая">
            <i class="bi bi-chevron-left"></i>
        </a>
    `;
    ul.appendChild(prevLi);
    
    // Номера страниц
    for (let i = 1; i <= totalPages; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === currentPage ? 'active' : ''}`;
        li.innerHTML = `
            <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
        `;
        ul.appendChild(li);
    }
    
    // Кнопка "Вперед"
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `
        <a class="page-link" href="#" onclick="changePage(${currentPage + 1})" aria-label="Следующая">
            <i class="bi bi-chevron-right"></i>
        </a>
    `;
    ul.appendChild(nextLi);
}

/**
 * Меняет текущую страницу
 * @param {number} page - Номер страницы
 */
function changePage(page) {
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    displayCourses();
    
    // Прокручиваем к началу блока курсов
    const coursesSection = document.getElementById('courses');
    if (coursesSection) {
        const headerHeight = document.querySelector('header')?.offsetHeight || 80;
        const sectionPosition = coursesSection.getBoundingClientRect().top + window.pageYOffset - headerHeight;
        window.scrollTo({
            top: sectionPosition,
            behavior: 'smooth'
        });
    }
}

/**
 * Показывает/скрывает состояние загрузки
 * @param {boolean} show - Показать состояние загрузки
 */
function showLoadingState(show) {
    const loading = document.getElementById('coursesLoading');
    const container = document.getElementById('coursesContainer');
    const noCourses = document.getElementById('noCourses');
    const pagination = document.getElementById('coursesPagination');
    
    if (loading) {
        loading.style.display = show ? 'block' : 'none';
    }
    
    if (container && !show) {
        container.style.display = filteredCourses.length > 0 ? 'flex' : 'none';
    }
    
    if (pagination && !show) {
        pagination.style.display = 'none';
    }
    
    if (noCourses) {
        noCourses.style.display = 'none';
    }
}

/**
 * Показывает состояние "нет курсов"
 */
function showNoCoursesState() {
    const container = document.getElementById('coursesContainer');
    const noCourses = document.getElementById('noCourses');
    const pagination = document.getElementById('coursesPagination');
    
    if (container) {
        container.style.display = 'none';
    }
    
    if (noCourses) {
        noCourses.style.display = 'block';
    }
    
    if (pagination) {
        pagination.style.display = 'none';
    }
}

/**
 * Настраивает обработчики событий для курсов
 */
function setupCourseEventListeners() {
    // Форма поиска
    const searchForm = document.getElementById('courseSearchForm');
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            searchCourses();
        });
    }
    
    // Кнопка сброса поиска
    const resetBtn = document.getElementById('resetSearch');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetSearch);
    }
    
    // Реальный поиск при изменении полей
    const searchInput = document.getElementById('searchName');
    const searchSelect = document.getElementById('searchLevel');
    
    if (searchInput) {
        searchInput.addEventListener('input', debounce(searchCourses, 500));
    }
    
    if (searchSelect) {
        searchSelect.addEventListener('change', searchCourses);
    }
}

/**
 * Ищет курсы по заданным критериям
 */
function searchCourses() {
    const searchName = document.getElementById('searchName').value.toLowerCase().trim();
    const searchLevel = document.getElementById('searchLevel').value;
    
    filteredCourses = allCourses.filter(course => {
        // Фильтрация по названию
        const nameMatch = !searchName || 
                         course.name.toLowerCase().includes(searchName) ||
                         course.description.toLowerCase().includes(searchName);
        
        // Фильтрация по уровню
        const levelMatch = !searchLevel || course.level === searchLevel;
        
        return nameMatch && levelMatch;
    });
    
    // Сбрасываем на первую страницу
    currentPage = 1;
    
    // Отображаем результат
    displayCourses();
    
    // Показываем сообщение о количестве найденных курсов
    if (filteredCourses.length === 0) {
        showNotification('Курсы не найдены. Попробуйте другие параметры поиска.', 'warning');
    } else {
        showNotification(`Найдено курсов: ${filteredCourses.length}`, 'info', 2000);
    }
}

/**
 * Сбрасывает поиск
 */
function resetSearch() {
    document.getElementById('searchName').value = '';
    document.getElementById('searchLevel').value = '';
    
    filteredCourses = [...allCourses];
    currentPage = 1;
    
    displayCourses();
    showNotification('Поиск сброшен', 'info', 2000);
}

/**
 * Выбирает курс для оформления заявки
 * @param {number} courseId - ID курса
 */
function selectCourse(courseId) {
    console.log('Выбран курс:', courseId);
    
    // Находим курс
    const course = allCourses.find(c => c.id === courseId);
    if (!course) {
        showNotification('Курс не найден', 'danger');
        return;
    }
    
    // Показываем подробную информацию о курсе
    showCourseDetails(course);
    
    // Здесь позже добавим открытие модального окна для заявки
    showNotification(`Выбран курс: "${course.name}"`, 'success');
}

/**
 * Показывает подробную информацию о курсе
 * @param {Object} course - Данные курса
 */
function showCourseDetails(course) {
    const totalHours = course.total_length * course.week_length;
    
    const modalContent = `
        <div class="modal fade" id="courseDetailsModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${course.name}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-8">
                                <h6>Описание</h6>
                                <p>${course.description}</p>
                                
                                <h6 class="mt-4">Детали курса</h6>
                                <div class="row">
                                    <div class="col-6">
                                        <p><strong>Преподаватель:</strong><br>${course.teacher}</p>
                                        <p><strong>Уровень:</strong><br>${course.level}</p>
                                    </div>
                                    <div class="col-6">
                                        <p><strong>Длительность:</strong><br>${course.total_length} недель</p>
                                        <p><strong>Часов в неделю:</strong><br>${course.week_length}</p>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="card">
                                    <div class="card-body">
                                        <h6>Стоимость</h6>
                                        <p class="display-6 text-primary">${course.course_fee_per_hour} ₽/час</p>
                                        <p class="text-muted">Всего: ${totalHours * course.course_fee_per_hour} ₽</p>
                                        
                                        <h6 class="mt-4">Даты начала</h6>
                                        <ul class="list-unstyled">
                                            ${course.start_dates?.slice(0, 5).map(date => {
                                                const d = new Date(date);
                                                return `<li>• ${formatDate(date)} ${formatTime(date.split('T')[1])}</li>`;
                                            }).join('') || '<li>Не указаны</li>'}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Закрыть</button>
                        <button type="button" class="btn btn-primary" onclick="openOrderForm(${course.id})">
                            <i class="bi bi-pencil-square me-1"></i>Подать заявку
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Добавляем модальное окно в DOM
    let modal = document.getElementById('courseDetailsModal');
    if (modal) {
        modal.remove();
    }
    
    document.body.insertAdjacentHTML('beforeend', modalContent);
    
    // Показываем модальное окно
    const modalInstance = new bootstrap.Modal(document.getElementById('courseDetailsModal'));
    modalInstance.show();
}

/**
 * Открывает форму заявки для выбранного курса
 * @param {number} courseId - ID курса
 */
function openOrderForm(courseId) {
    console.log('Открываем форму заявки для курса:', courseId);
    // Позже реализуем
    showNotification('Форма заявки будет реализована позже', 'info');
}

/**
 * Дебаунс функция для поиска
 * @param {Function} func - Функция для выполнения
 * @param {number} wait - Время ожидания в мс
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}