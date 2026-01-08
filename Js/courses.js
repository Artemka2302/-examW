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
    console.log('=== DISPLAY COURSES START ===');
    
    const container = document.getElementById('coursesContainer');
    const loading = document.getElementById('coursesLoading');
    const noCourses = document.getElementById('noCourses');
    
    console.log('Элементы:', {container: !!container, loading: !!loading});
    console.log('Данные:', {filtered: filteredCourses.length, totalPages, currentPage});
    
    if (!container) {
        console.error('❌ Контейнер не найден!');
        return;
    }
    
    // Скрываем loading
    if (loading) {
        loading.style.display = 'none';
    }
    
    // Если нет курсов
    if (filteredCourses.length === 0) {
        if (noCourses) noCourses.style.display = 'block';
        container.style.display = 'none';
        return;
    }   
    
    // Скрываем "нет курсов"
    if (noCourses) noCourses.style.display = 'none';
    
    // Рассчитываем курсы для текущей страницы
    const startIndex = (currentPage - 1) * COURSES_PER_PAGE;
    const endIndex = startIndex + COURSES_PER_PAGE;
    const pageCourses = filteredCourses.slice(startIndex, endIndex);
    
    console.log(`📄 Страница ${currentPage}: ${pageCourses.length} курсов`);
    
    // Очищаем контейнер
    container.innerHTML = '';
    
    // Добавляем курсы
    pageCourses.forEach(course => {
        const courseCard = createCourseCard(course);
        container.appendChild(courseCard);
    });
    
    // Показываем контейнер
    container.style.display = 'flex';
    console.log('✅ Контейнер отображен');
    
    // Пагинация - только ОДИН вызов
    console.log('🔢 Вызываем updatePagination...');
    updatePagination(); // ← updatePagination сама управляет отображением
    
    console.log('=== DISPLAY COURSES END ===');
}
/**
 * Создает карточку курса
 * @param {Object} course - Данные курса
 * @returns {HTMLElement} Элемент карточки
 */
function createCourseCard(course) {
    console.log('Создаем карточку для:', course.name);
    
    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-4 mb-4';
    
    // Перевод уровня
    let levelText = course.level;
    let levelClass = 'bg-secondary';
    
    switch(course.level) {
        case 'Beginner':
            levelText = 'Начальный';
            levelClass = 'bg-success';
            break;
        case 'Intermediate':
            levelText = 'Средний';
            levelClass = 'bg-warning';
            break;
        case 'Advanced':
            levelText = 'Продвинутый';
            levelClass = 'bg-danger';
            break;
    }
    
    // Простая версия - только текст
    col.innerHTML = `
        <div class="card h-100 border shadow-sm">
            <div class="card-body">
                <h5 class="card-title">${course.name}</h5>
                <h6 class="card-subtitle mb-2 text-muted">
                    <i class="bi bi-person"></i> ${course.teacher}
                </h6>
                <p class="card-text">${course.description.substring(0, 100)}...</p>
                
                <div class="mt-3">
                    <span class="badge ${levelClass}">${levelText}</span>
                    <span class="badge bg-info ms-2">
                        <i class="bi bi-calendar-week"></i> ${course.total_length} недель
                    </span>
                    <span class="badge bg-primary ms-2">
                        <i class="bi bi-cash"></i> ${course.course_fee_per_hour} ₽/час
                    </span>
                </div>
            </div>
            <div class="card-footer bg-transparent">
                <button class="btn btn-primary w-100" onclick="selectCourse(${course.id})">
                    <i class="bi bi-info-circle me-1"></i>Подробнее
                </button>
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
/**
 * Обновляет отображение пагинации
 */
/**
 * Обновляет отображение пагинации
 */
function updatePagination() {
    console.log('🔄 updatePagination ВЫЗВАНА');
    
    const pagination = document.getElementById('coursesPagination');
    console.log('pagination элемент найден:', !!pagination);
    
    if (!pagination) {
        console.error('❌ Нет элемента пагинации!');
        return;
    }
    
    // Рассчитываем totalPages ЕЩЕ РАЗ на всякий случай
    const calculatedTotalPages = Math.ceil(filteredCourses.length / COURSES_PER_PAGE);
    console.log(`🔢 totalPages: ${calculatedTotalPages} (${filteredCourses.length} / ${COURSES_PER_PAGE})`);
    
    // Если 1 страница или меньше - скрываем
    if (calculatedTotalPages <= 1) {
        pagination.style.display = 'none';
        console.log('🔢 Пагинация скрыта (1 страница)');
        return;
    }
    
    // Создаем HTML пагинации
    let html = '<ul class="pagination justify-content-center">';
    
    // Кнопка "Назад"
    html += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage - 1}); return false;">
                <i class="bi bi-chevron-left"></i>
            </a>
        </li>
    `;
    
    // Кнопки страниц
    for (let i = 1; i <= calculatedTotalPages; i++) {
        html += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="#" onclick="changePage(${i}); return false;">${i}</a>
            </li>
        `;
    }
    
    // Кнопка "Вперед"
    html += `
        <li class="page-item ${currentPage === calculatedTotalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage + 1}); return false;">
                <i class="bi bi-chevron-right"></i>
            </a>
        </li>
    `;
    
    html += '</ul>';
    
    // Обновляем элемент
    pagination.innerHTML = html;
    pagination.style.display = 'flex';
    
    console.log('✅ Пагинация создана и показана');
    console.log('HTML:', html);
} 
/**
 * Меняет текущую страницу
 * @param {number} page - Номер страницы
 */
function changePage(page) {
    console.log(`🎯 changePage вызвана: ${page}`);
    
    // Пересчитываем totalPages
    const calculatedTotalPages = Math.ceil(filteredCourses.length / COURSES_PER_PAGE);
    
    if (page < 1 || page > calculatedTotalPages) {
        console.log(`❌ Неверная страница: ${page} (допустимо 1-${calculatedTotalPages})`);
        return;
    }
    
    currentPage = page;
    console.log(`✅ Установлена страница: ${currentPage}`);
    
    displayCourses();
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
async function selectCourse(courseId) {
    console.log('Выбран курс ID:', courseId);
    
    try {
        // Показываем загрузку
        showNotification('Загружаем информацию о курсе...', 'info', 2000);
        
        // Находим курс в уже загруженных данных
        let course = allCourses.find(c => c.id === courseId);
        
        // Если не нашли, пробуем загрузить с сервера
        if (!course) {
            course = await getCourseById(courseId);
        }
        
        if (!course) {
            throw new Error('Курс не найден');
        }
        
        // Показываем детали
        showCourseDetails(course);
        
    } catch (error) {
        console.error('Ошибка при выборе курса:', error);
        showNotification(`Ошибка: ${error.message}`, 'danger');
    }   
}

/**
 * Показывает подробную информацию о курсе
 * @param {Object} course - Данные курса
 */
function showCourseDetails(course) {
    console.log('🎨 showCourseDetails для:', course.name);
    
    // Удаляем старый модальный если есть
    let oldModal = document.getElementById('courseDetailsModal');
    if (oldModal) {
        oldModal.remove();
        console.log('Старый модальный удален');
    }
    
    // Рассчитываем часы и стоимость
    const totalHours = course.total_length * course.week_length;
    const totalCost = totalHours * course.course_fee_per_hour;
    
    // Форматируем даты
    let datesHtml = '<li>Даты не указаны</li>';
    if (course.start_dates && course.start_dates.length > 0) {
        datesHtml = course.start_dates.slice(0, 3).map(dateStr => {
            try {
                const date = new Date(dateStr);
                return `<li>${date.toLocaleDateString('ru-RU')}</li>`;
            } catch(e) {
                return `<li>${dateStr}</li>`;
            }
        }).join('');
    }
    
    // Создаем модальное окно
    const modalHTML = `
    <div class="modal fade" id="courseDetailsModal" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">${course.name}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <h6>Описание</h6>
                    <p>${course.description}</p>
                    
                    <h6 class="mt-4">Информация</h6>
                    <table class="table table-sm">
                        <tr>
                            <td><strong>Преподаватель:</strong></td>
                            <td>${course.teacher}</td>
                        </tr>
                        <tr>
                            <td><strong>Уровень:</strong></td>
                            <td><span class="badge bg-primary">${course.level}</span></td>
                        </tr>
                        <tr>
                            <td><strong>Длительность:</strong></td>
                            <td>${course.total_length} недель (${totalHours} часов)</td>
                        </tr>
                        <tr>
                            <td><strong>Стоимость:</strong></td>
                            <td><strong>${course.course_fee_per_hour} ₽/час</strong> (всего: ${totalCost} ₽)</td>
                        </tr>
                    </table>
                    
                    <h6 class="mt-4">Даты начала</h6>
                    <ul>${datesHtml}</ul>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Закрыть</button>
                    <button type="button" class="btn btn-primary" onclick="openOrderForm(${course.id})">
                        Подать заявку
                    </button>
                </div>
            </div>
        </div>
    </div>
    `;
    
    // Добавляем в DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    console.log('Модальное окно добавлено в DOM');
    
    // Показываем модальное окно
    const modalElement = document.getElementById('courseDetailsModal');
    if (modalElement) {
        console.log('Элемент модального найден, показываем...');
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
        console.log('Модальное окно показано');
    } else {
        console.error('❌ Элемент модального не найден после добавления!');
    }
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