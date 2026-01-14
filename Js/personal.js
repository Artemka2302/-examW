// ========== ЛИЧНЫЙ КАБИНЕТ ==========

console.log('👤 Модуль личного кабинета загружен');

// Конфигурация пагинации для заявок
const ORDERS_PER_PAGE = 5;
let allOrders = [];
let filteredOrders = [];
let currentOrdersPage = 1;
let totalOrdersPages = 1;

// Глобальные переменные для редактирования
let editingOrderData = null;

/**
 * Инициализация личного кабинета
 */
async function initPersonalPage() {
    console.log('🚀 Инициализация личного кабинета...');
    
    // Проверяем, что мы на странице личного кабинета
    if (!document.getElementById('ordersTable')) {
        console.log('❌ Не на странице личного кабинета');
        return;
    }
    
    // Загружаем API ключ
    loadApiKey();
    
    // Загружаем заявки пользователя
    await loadOrders();
    
    // Настраиваем обработчики событий
    setupPersonalEventListeners();
    setupEditOrderListeners();
    
    console.log('✅ Личный кабинет инициализирован');
}

/**
 * Загружает заявки пользователя с сервера
 */
async function loadOrders() {
    console.log('📥 Загрузка заявок пользователя...');
    
    try {
        // Показываем состояние загрузки
        showLoadingStatePersonal(true);
        
        // Получаем заявки из API
        const orders = await getOrders();
        
        if (orders && Array.isArray(orders)) {
            allOrders = orders;
            filteredOrders = [...orders];
            
            console.log(`✅ Загружено заявок: ${orders.length}`);
            
            // Отображаем заявки
            displayOrders();
            
            // Инициализируем пагинацию
            initOrdersPagination();
            
            // Показываем уведомление
            if (orders.length === 0) {
                showNotification('У вас пока нет заявок', 'info');
            } else {
                showNotification(`Загружено ${orders.length} заявок`, 'success', 3000);
            }
        } else {
            throw new Error('Неверный формат данных заявок');
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки заявок:', error);
        showNotification('Не удалось загрузить заявки. Проверьте подключение.', 'danger');
        showNoOrdersState();
    } finally {
        // Скрываем индикатор загрузки
        showLoadingStatePersonal(false);
    }
}

/**
 * Отображает заявки на текущей странице
 */
function displayOrders() {
    console.log('🎨 Отображение заявок...');
    
    const tableBody = document.getElementById('ordersTableBody');
    const loading = document.getElementById('ordersLoading');
    const noOrders = document.getElementById('noOrders');
    
    if (!tableBody) {
        console.error('❌ Таблица заявок не найдена!');
        return;
    }
    
    // Скрываем loading
    if (loading) {
        loading.style.display = 'none';
    }
    
    // Если нет заявок
    if (filteredOrders.length === 0) {
        if (noOrders) {
            noOrders.style.display = 'block';
        }
        if (tableBody) {
            tableBody.innerHTML = '';
        }
        hideOrdersPagination();
        return;
    }
    
    // Скрываем "нет заявок"
    if (noOrders) {
        noOrders.style.display = 'none';
    }
    
    // Рассчитываем заявки для текущей страницы
    const startIndex = (currentOrdersPage - 1) * ORDERS_PER_PAGE;
    const endIndex = startIndex + ORDERS_PER_PAGE;
    const pageOrders = filteredOrders.slice(startIndex, endIndex);
    
    console.log(`📄 Страница ${currentOrdersPage}: ${pageOrders.length} заявок`);
    
    // Очищаем таблицу
    tableBody.innerHTML = '';
    
    // Добавляем заявки в таблицу
    pageOrders.forEach((order, index) => {
        const row = createOrderRow(order, startIndex + index + 1);
        tableBody.appendChild(row);
    });
    
    // Показываем пагинацию
    updateOrdersPagination();
    
    console.log('✅ Заявки отображены в таблице');
}

/**
 * Создает строку таблицы для заявки
 * @param {Object} order - Данные заявки
 * @param {number} orderNumber - Порядковый номер
 * @returns {HTMLElement} Элемент строки таблицы
 */
function createOrderRow(order, orderNumber) {
    console.log('📝 Создание строки для заявки:', order.id);
    
    const row = document.createElement('tr');
    row.setAttribute('data-order-id', order.id);
    
    // Определяем тип заявки (курс или репетитор)
    let itemName = 'Не указано';
    if (order.course_id) {
        itemName = `Курс #${order.course_id}`;
    } else if (order.tutor_id) {
        itemName = `Репетитор #${order.tutor_id}`;
    }
    
    // Форматируем дату
    let formattedDate = 'Не указана';
    if (order.date_start) {
        try {
            const date = new Date(order.date_start);
            formattedDate = date.toLocaleDateString('ru-RU');
        } catch (e) {
            formattedDate = order.date_start;
        }
    }
    
    // Форматируем время
    let formattedTime = order.time_start || 'Не указано';
    
    // Форматируем стоимость
    const formattedPrice = order.price ? `${order.price} ₽` : '0 ₽';
    
    row.innerHTML = `
        <th scope="row">${orderNumber}</th>
        <td>${itemName}</td>
        <td>${formattedDate}</td>
        <td>${formattedTime}</td>
        <td><strong>${formattedPrice}</strong></td>
        <td>
            <div class="btn-group btn-group-sm" role="group">
                <button type="button" class="btn btn-info" onclick="viewOrderDetails(${order.id})">
                    <i class="bi bi-eye"></i>
                </button>
                <button type="button" class="btn btn-warning" onclick="editOrder(${order.id})">
                    <i class="bi bi-pencil"></i>
                </button>
                <button type="button" class="btn btn-danger" onclick="deleteOrderConfirm(${order.id})">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        </td>
    `;
    
    return row;
}

/**
 * Инициализирует пагинацию заявок
 */
function initOrdersPagination() {
    totalOrdersPages = Math.ceil(filteredOrders.length / ORDERS_PER_PAGE);
    currentOrdersPage = 1;
}

/**
 * Обновляет отображение пагинации заявок
 */
function updateOrdersPagination() {
    const pagination = document.getElementById('ordersPagination');
    
    if (!pagination) {
        console.error('❌ Пагинация заявок не найдена!');
        return;
    }
    
    if (totalOrdersPages <= 1) {
        pagination.style.display = 'none';
        return;
    }
    
    // Создаем HTML пагинации
    let html = '<ul class="pagination justify-content-center">';
    
    // Кнопка "Назад"
    html += `
        <li class="page-item ${currentOrdersPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changeOrdersPage(${currentOrdersPage - 1}); return false;">
                <i class="bi bi-chevron-left"></i>
            </a>
        </li>
    `;
    
    // Кнопки страниц
    for (let i = 1; i <= totalOrdersPages; i++) {
        html += `
            <li class="page-item ${i === currentOrdersPage ? 'active' : ''}">
                <a class="page-link" href="#" onclick="changeOrdersPage(${i}); return false;">${i}</a>
            </li>
        `;
    }
    
    // Кнопка "Вперед"
    html += `
        <li class="page-item ${currentOrdersPage === totalOrdersPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changeOrdersPage(${currentOrdersPage + 1}); return false;">
                <i class="bi bi-chevron-right"></i>
            </a>
        </li>
    `;
    
    html += '</ul>';
    
    // Обновляем элемент
    pagination.innerHTML = html;
    pagination.style.display = 'flex';
    
    console.log('✅ Пагинация заявок обновлена');
}

/**
 * Скрывает пагинацию заявок
 */
function hideOrdersPagination() {
    const pagination = document.getElementById('ordersPagination');
    if (pagination) {
        pagination.style.display = 'none';
    }
}

/**
 * Меняет текущую страницу заявок
 * @param {number} page - Номер страницы
 */
function changeOrdersPage(page) {
    const calculatedTotalPages = Math.ceil(filteredOrders.length / ORDERS_PER_PAGE);
    
    if (page < 1 || page > calculatedTotalPages) {
        return;
    }
    
    currentOrdersPage = page;
    displayOrders();
}

/**
 * Показывает/скрывает состояние загрузки
 * @param {boolean} show - Показать состояние загрузки
 */
function showLoadingStatePersonal(show) {
    const loading = document.getElementById('ordersLoading');
    const table = document.getElementById('ordersTableBody');
    
    if (loading) {
        loading.style.display = show ? 'block' : 'none';
    }
    
    if (table && !show) {
        table.style.display = filteredOrders.length > 0 ? 'table-row-group' : 'none';
    }
}

/**
 * Показывает состояние "нет заявок"
 */
function showNoOrdersState() {
    const tableBody = document.getElementById('ordersTableBody');
    const noOrders = document.getElementById('noOrders');
    const pagination = document.getElementById('ordersPagination');
    
    if (tableBody) {
        tableBody.innerHTML = '';
    }
    
    if (noOrders) {
        noOrders.style.display = 'block';
    }
    
    if (pagination) {
        pagination.style.display = 'none';
    }
}

/**
 * Настраивает обработчики событий для личного кабинета
 */
function setupPersonalEventListeners() {
    console.log('🔧 Настройка обработчиков личного кабинета');
    
    // Кнопка обновления списка заявок
    const refreshBtn = document.getElementById('refreshOrders');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            showNotification('Обновление списка заявок...', 'info');
            await loadOrders();
        });
    }
}

/**
 * Просмотр деталей заявки
 * @param {number} orderId - ID заявки
 */
async function viewOrderDetails(orderId) {
    console.log('👁️ Просмотр деталей заявки:', orderId);
    
    try {
        // Загружаем данные заявки
        const order = await getOrderById(orderId);
        
        if (!order) {
            throw new Error('Заявка не найдена');
        }
        
        // Создаем модальное окно с деталями
        showOrderDetailsModal(order);
        
    } catch (error) {
        console.error('Ошибка просмотра заявки:', error);
        showNotification(`Ошибка: ${error.message}`, 'danger');
    }
}

/**
 * Показывает модальное окно с деталями заявки
 * @param {Object} order - Данные заявки
 */
function showOrderDetailsModal(order) {
    console.log('📋 Показ деталей заявки:', order.id);
    
    // Удаляем старое модальное окно если есть
    let oldModal = document.getElementById('orderDetailsModal');
    if (oldModal) {
        oldModal.remove();
    }
    
    // Создаем HTML модального окна
    const modalHTML = `
    <div class="modal fade" id="orderDetailsModal" tabindex="-1">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">
                        <i class="bi bi-info-circle text-primary me-2"></i>
                        Детали заявки #${order.id}
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="row">
                        <div class="col-md-6">
                            <h6>Основная информация</h6>
                            <table class="table table-sm">
                                <tr>
                                    <td><strong>Тип:</strong></td>
                                    <td>${order.course_id ? 'Курс' : 'Репетитор'}</td>
                                </tr>
                                <tr>
                                    <td><strong>ID:</strong></td>
                                    <td>${order.course_id || order.tutor_id}</td>
                                </tr>
                                <tr>
                                    <td><strong>Дата начала:</strong></td>
                                    <td>${order.date_start}</td>
                                </tr>
                                <tr>
                                    <td><strong>Время:</strong></td>
                                    <td>${order.time_start}</td>
                                </tr>
                                <tr>
                                    <td><strong>Количество человек:</strong></td>
                                    <td>${order.persons}</td>
                                </tr>
                                <tr>
                                    <td><strong>Продолжительность:</strong></td>
                                    <td>${order.duration} часов</td>
                                </tr>
                            </table>
                        </div>
                        <div class="col-md-6">
                            <h6>Стоимость и опции</h6>
                            <table class="table table-sm">
                                <tr>
                                    <td><strong>Общая стоимость:</strong></td>
                                    <td><span class="badge bg-success">${order.price} ₽</span></td>
                                </tr>
                                <tr>
                                    <td><strong>Стоимость на человека:</strong></td>
                                    <td>${Math.round(order.price / order.persons)} ₽</td>
                                </tr>
                            </table>
                            
                            <h6 class="mt-3">Примененные опции</h6>
                            <div class="d-flex flex-wrap gap-2">
                                ${order.early_registration ? '<span class="badge bg-info">Ранняя регистрация</span>' : ''}
                                ${order.group_enrollment ? '<span class="badge bg-info">Групповая запись</span>' : ''}
                                ${order.intensive_course ? '<span class="badge bg-warning">Интенсивный курс</span>' : ''}
                                ${order.supplementary ? '<span class="badge bg-primary">Доп. материалы</span>' : ''}
                                ${order.personalized ? '<span class="badge bg-primary">Индивидуальные занятия</span>' : ''}
                                ${order.excursions ? '<span class="badge bg-success">Экскурсии</span>' : ''}
                                ${order.assessment ? '<span class="badge bg-secondary">Оценка уровня</span>' : ''}
                                ${order.interactive ? '<span class="badge bg-danger">Интерактивная платформа</span>' : ''}
                            </div>
                        </div>
                    </div>
                    
                    <div class="mt-4">
                        <h6>Дополнительная информация</h6>
                        <p class="text-muted small">
                            Дата создания: ${order.created_at}<br>
                            ID студента: ${order.student_id}
                        </p>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                        Закрыть
                    </button>
                </div>
            </div>
        </div>
    </div>
    `;
    
    // Добавляем в DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Показываем модальное окно
    const modalElement = document.getElementById('orderDetailsModal');
    if (modalElement) {
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
    }
}

// ========== РЕДАКТИРОВАНИЕ ЗАЯВОК ==========

/**
 * Редактирование заявки
 * @param {number} orderId - ID заявки
 */
async function editOrder(orderId) {
    console.log('✏️ Редактирование заявки:', orderId);
    
    try {
        // Показываем загрузку
        showNotification('Загрузка данных заявки...', 'info');
        
        // Загружаем данные заявки
        const order = await getOrderById(orderId);
        
        if (!order) {
            throw new Error('Заявка не найдена');
        }
        
        // Сохраняем данные
        editingOrderData = order;
        
        // Заполняем форму редактирования
        await fillEditOrderForm(order);
        
        // Открываем модальное окно редактирования
        openEditOrderModal();
        
        // Скрываем уведомление
        showNotification('Форма редактирования загружена', 'success', 2000);
        
    } catch (error) {
        console.error('Ошибка редактирования заявки:', error);
        showNotification(`Ошибка: ${error.message}`, 'danger');
    }
}
function calculateEditOrderCost() {
    console.log('🧮 Расчет стоимости для редактирования...');
    
    if (!editingOrderData) {
        console.log('❌ Нет данных заявки для расчета');
        return editingOrderData?.price || 0;
    }
    
    // Получаем значения из формы
    const dateStr = document.getElementById('editOrderDate').value;
    const timeStr = document.getElementById('editOrderTime').value;
    const persons = parseInt(document.getElementById('editOrderPersons').value) || 1;
    
    // Получаем состояние чекбоксов
    const options = {
        early_registration: document.getElementById('editOptionEarly').checked,
        group_enrollment: document.getElementById('editOptionGroup').checked,
        intensive_course: document.getElementById('editOptionIntensive').checked,
        supplementary: document.getElementById('editOptionMaterials').checked,
        personalized: document.getElementById('editOptionPersonal').checked,
        excursions: document.getElementById('editOptionExcursions').checked,
        assessment: document.getElementById('editOptionAssessment').checked,
        interactive: document.getElementById('editOptionInteractive').checked
    };
    
    // Базовая стоимость из оригинальной заявки
    const basePrice = editingOrderData.price || 0;
    const basePersons = editingOrderData.persons || 1;
    const basePricePerPerson = Math.round(basePrice / basePersons);
    
    // Рассчитываем новую стоимость на основе изменений
    let newPrice = basePricePerPerson * persons;
    
    // Простая логика корректировки стоимости
    // Можно сделать более сложную как на главной странице
    if (options.supplementary) {
        newPrice += 2000 * persons; // Дополнительные материалы
    }
    
    if (options.assessment) {
        newPrice += 300; // Оценка уровня
    }
    
    // Применяем скидки
    if (options.early_registration) {
        newPrice *= 0.9; // -10%
    }
    
    if (options.group_enrollment && persons >= 5) {
        newPrice *= 0.85; // -15%
    }
    
    // Применяем надбавки
    if (options.intensive_course) {
        newPrice *= 1.2; // +20%
    }
    
    if (options.excursions) {
        newPrice *= 1.25; // +25%
    }
    
    if (options.interactive) {
        newPrice *= 1.5; // +50%
    }
    
    // Округляем
    newPrice = Math.round(newPrice);
    
    // Обновляем отображение
    updateEditOrderDisplay(newPrice, persons);
    
    console.log('💰 Новая стоимость:', newPrice, '₽');
    
    return newPrice;
}
/**
 * Обновляет отображение стоимости в форме редактирования
 */
function updateEditOrderDisplay(price, persons) {
    const priceElement = document.getElementById('editOrderPrice');
    const perPersonElement = document.getElementById('editPricePerPerson');
    
    if (!priceElement || !perPersonElement) {
        console.error('❌ Элементы стоимости не найдены');
        return;
    }
    
    const perPerson = Math.round(price / persons);
    
    priceElement.textContent = `${price} ₽`;
    perPersonElement.textContent = `${perPerson} ₽/чел`;
}
/**
 * Заполняет форму редактирования данными заявки
 * @param {Object} order - Данные заявки
 */
async function fillEditOrderForm(order) {
    console.log('📝 Заполнение формы редактирования заявки:', order.id);
    
    // Проверяем существование элементов перед заполнением
    const checkboxes = [
        'editOptionEarly', 'editOptionGroup', 'editOptionIntensive',
        'editOptionMaterials', 'editOptionPersonal', 'editOptionExcursions',
        'editOptionAssessment', 'editOptionInteractive'
    ];
    
    // Проверяем, что все элементы существуют
    const missingElements = [];
    checkboxes.forEach(id => {
        if (!document.getElementById(id)) {
            missingElements.push(id);
        }
    });
    
    if (missingElements.length > 0) {
        console.error('❌ Не найдены элементы формы:', missingElements);
        showNotification('Ошибка: форма редактирования не загружена полностью', 'danger');
        return;
    }
    
    // Устанавливаем заголовок
    const titleElement = document.getElementById('editModalTitle');
    if (titleElement) {
        titleElement.textContent = `Редактирование заявки #${order.id}`;
    }
    
    // Устанавливаем ID заявки
    const idElement = document.getElementById('editOrderId');
    if (idElement) {
        idElement.value = order.id;
    }
    
    // Заполняем основную информацию
    const dateElement = document.getElementById('editOrderDate');
    const timeElement = document.getElementById('editOrderTime');
    const personsElement = document.getElementById('editOrderPersons');
    
    if (dateElement) {
        dateElement.value = order.date_start || '';
        // Устанавливаем минимальную и максимальную дату
        const today = new Date();
        dateElement.min = today.toISOString().split('T')[0];
        const nextYear = new Date();
        nextYear.setFullYear(nextYear.getFullYear() + 1);
        dateElement.max = nextYear.toISOString().split('T')[0];
    }
    
    if (timeElement) {
        timeElement.value = order.time_start || '';
    }
    
    if (personsElement) {
        personsElement.value = order.persons || 1;
    }
    
    // Заполняем чекбоксы опций (теперь безопасно)
    document.getElementById('editOptionEarly').checked = order.early_registration || false;
    document.getElementById('editOptionGroup').checked = order.group_enrollment || false;
    document.getElementById('editOptionIntensive').checked = order.intensive_course || false;
    document.getElementById('editOptionMaterials').checked = order.supplementary || false;
    document.getElementById('editOptionPersonal').checked = order.personalized || false;
    document.getElementById('editOptionExcursions').checked = order.excursions || false;
    document.getElementById('editOptionAssessment').checked = order.assessment || false;
    document.getElementById('editOptionInteractive').checked = order.interactive || false;
    
    // Отображаем информацию о курсе/репетиторе
    await displayEditOrderItemInfo(order);
    
    // Отображаем текущую стоимость
    updateEditOrderPrice(order);
    
    // Вызываем расчет стоимости после небольшой задержки
    setTimeout(() => {
        calculateEditOrderCost();
    }, 100);
    
    console.log('✅ Форма редактирования заполнена');
}
/**
 * Отображает информацию о курсе/репетиторе в форме редактирования
 * @param {Object} order - Данные заявки
 */
async function displayEditOrderItemInfo(order) {
    const itemNameElement = document.getElementById('editSelectedItemName');
    const orderTypeElement = document.getElementById('editOrderType');
    
    if (!itemNameElement || !orderTypeElement) {
        console.error('❌ Элементы формы редактирования не найдены');
        return;
    }
    
    if (order.course_id) {
        // Это курс
        orderTypeElement.value = 'course';
        
        try {
            const course = await getCourseById(order.course_id);
            if (course) {
                itemNameElement.innerHTML = `
                    <strong>Курс:</strong> ${course.name}<br>
                    <small>Преподаватель: ${course.teacher}</small>
                `;
                itemNameElement.className = 'alert alert-info py-2';
            } else {
                itemNameElement.textContent = `Курс #${order.course_id} (не найден)`;
                itemNameElement.className = 'alert alert-warning py-2';
            }
        } catch (error) {
            itemNameElement.textContent = `Курс #${order.course_id}`;
            itemNameElement.className = 'alert alert-warning py-2';
        }
        
    } else if (order.tutor_id) {
        // Это репетитор
        orderTypeElement.value = 'tutor';
        
        try {
            const tutor = await getTutorById(order.tutor_id);
            if (tutor) {
                itemNameElement.innerHTML = `
                    <strong>Репетитор:</strong> ${tutor.name}<br>
                    <small>Опыт: ${tutor.work_experience} лет</small>
                `;
                itemNameElement.className = 'alert alert-success py-2';
            } else {
                itemNameElement.textContent = `Репетитор #${order.tutor_id} (не найден)`;
                itemNameElement.className = 'alert alert-warning py-2';
            }
        } catch (error) {
            itemNameElement.textContent = `Репетитор #${order.tutor_id}`;
            itemNameElement.className = 'alert alert-warning py-2';
        }
    } else {
        itemNameElement.textContent = 'Не выбрано';
        itemNameElement.className = 'alert alert-warning py-2';
    }
}

/**
 * Обновляет отображение стоимости в форме редактирования
 * @param {Object} order - Данные заявки
 */
function updateEditOrderPrice(order) {
    const priceElement = document.getElementById('editOrderPrice');
    const perPersonElement = document.getElementById('editPricePerPerson');
    
    if (!priceElement || !perPersonElement) {
        console.error('❌ Элементы стоимости не найдены');
        return;
    }
    
    const price = order.price || 0;
    const persons = order.persons || 1;
    const perPerson = Math.round(price / persons);
    
    priceElement.textContent = `${price} ₽`;
    perPersonElement.textContent = `${perPerson} ₽/чел`;
}

/**
 * Открывает модальное окно редактирования
 */
function openEditOrderModal() {
    console.log('📋 Открытие модального окна редактирования');
    
    const modalElement = document.getElementById('editOrderModal');
    if (!modalElement) {
        console.error('❌ Модальное окно редактирования не найдено');
        showNotification('Ошибка: модальное окно редактирования не найдено', 'danger');
        return;
    }
    
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
}

/**
 * Сохраняет изменения заявки
 */
async function saveEditedOrder() {
    console.log('💾 Сохранение изменений заявки');
    
    if (!editingOrderData) {
        showNotification('Нет данных для сохранения', 'warning');
        return;
    }
    
    // Проверяем валидность формы
    if (!validateEditOrderForm()) {
        return;
    }
    
    try {
        // Показываем загрузку
        showNotification('Сохранение изменений...', 'info');
        
        // Рассчитываем новую стоимость
        const newPrice = calculateEditOrderCost();
        
        // Собираем данные из формы
        const orderData = collectEditOrderData();
        
        // Добавляем рассчитанную стоимость
        const priceElement = document.getElementById('editOrderPrice');
        if (priceElement && priceElement.textContent) {
            const priceText = priceElement.textContent.replace(' ₽', '').trim();
            orderData.price = parseInt(priceText) || editingOrderData.price;
        } else {
            orderData.price = editingOrderData.price;
        }
        
        console.log('📦 Данные для обновления:', orderData);
        
        // Отправляем PUT запрос
        const result = await updateOrder(editingOrderData.id, orderData);
        
        // Успех
        showNotification('Заявка успешно обновлена!', 'success');
        
        // Закрываем модальное окно
        const modal = bootstrap.Modal.getInstance(document.getElementById('editOrderModal'));
        if (modal) {
            modal.hide();
        }
        
        // Обновляем список заявок
        await loadOrders();
        
        console.log('✅ Заявка обновлена:', result);
        
    } catch (error) {
        console.error('❌ Ошибка обновления заявки:', error);
        showNotification(`Ошибка: ${error.message}`, 'danger');
    }
}

/**
 * Проверяет валидность формы редактирования
 */
function validateEditOrderForm() {
    const orderDate = document.getElementById('editOrderDate').value;
    const orderTime = document.getElementById('editOrderTime').value;
    const orderPersons = document.getElementById('editOrderPersons').value;
    
    let errors = [];
    
    if (!orderDate) {
        errors.push('Не указана дата начала');
    }
    
    if (!orderTime) {
        errors.push('Не указано время занятия');
    }
    
    if (!orderPersons || orderPersons < 1 || orderPersons > 20) {
        errors.push('Количество студентов должно быть от 1 до 20');
    }
    
    if (errors.length > 0) {
        showNotification(`Ошибки заполнения: ${errors.join(', ')}`, 'warning');
        return false;
    }
    
    return true;
}

/**
 * Собирает данные из формы редактирования
 */
function collectEditOrderData() {
    const orderDate = document.getElementById('editOrderDate').value;
    const orderTime = document.getElementById('editOrderTime').value;
    const orderPersons = parseInt(document.getElementById('editOrderPersons').value);
    
    // Собираем опции
    const options = {
        early_registration: document.getElementById('editOptionEarly').checked,
        group_enrollment: document.getElementById('editOptionGroup').checked,
        intensive_course: document.getElementById('editOptionIntensive').checked,
        supplementary: document.getElementById('editOptionMaterials').checked,
        personalized: document.getElementById('editOptionPersonal').checked,
        excursions: document.getElementById('editOptionExcursions').checked,
        assessment: document.getElementById('editOptionAssessment').checked,
        interactive: document.getElementById('editOptionInteractive').checked
    };
    
    // Базовые данные
    let orderData = {
        date_start: orderDate,
        time_start: orderTime,
        persons: orderPersons,
        ...options
    };
    
    // Сохраняем тип и ID (если они есть в оригинальной заявке)
    if (editingOrderData.course_id) {
        orderData.course_id = editingOrderData.course_id;
        orderData.tutor_id = null;
    } else if (editingOrderData.tutor_id) {
        orderData.tutor_id = editingOrderData.tutor_id;
        orderData.course_id = null;
    }
    
    return orderData;
}

/**
 * Настраивает обработчики для формы редактирования
 */
function setupEditOrderListeners() {
    console.log('🔧 Настройка обработчиков формы редактирования');
    
    // Кнопка сохранения изменений
    const saveBtn = document.getElementById('saveEditOrderBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveEditedOrder);
    } else {
        console.error('❌ Кнопка сохранения не найдена');
    }
    
    // Добавляем обработчики для пересчета стоимости
    const dateInput = document.getElementById('editOrderDate');
    const timeSelect = document.getElementById('editOrderTime');
    const personsInput = document.getElementById('editOrderPersons');
    const checkboxes = document.querySelectorAll('#editOrderOptions input[type="checkbox"]');
    
    if (dateInput) {
        dateInput.addEventListener('change', calculateEditOrderCost);
    }
    
    if (timeSelect) {
        timeSelect.addEventListener('change', calculateEditOrderCost);
    }
    
    if (personsInput) {
        personsInput.addEventListener('input', calculateEditOrderCost);
        personsInput.addEventListener('change', calculateEditOrderCost);
    }
    
    if (checkboxes.length > 0) {
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', calculateEditOrderCost);
        });
    }
    
    // Обработчики для закрытия модального окна
    const modal = document.getElementById('editOrderModal');
    if (modal) {
        modal.addEventListener('show.bs.modal', function() {
            console.log('📋 Модальное окно редактирования открывается');
        });
        
        modal.addEventListener('hidden.bs.modal', function () {
            console.log('📋 Модальное окно редактирования закрыто');
            editingOrderData = null;
            
            // Сбрасываем форму
            const form = document.getElementById('editOrderForm');
            if (form) form.reset();
            
            const itemNameElement = document.getElementById('editSelectedItemName');
            if (itemNameElement) {
                itemNameElement.textContent = 'Не выбрано';
                itemNameElement.className = 'alert alert-warning py-2';
            }
            
            const priceElement = document.getElementById('editOrderPrice');
            const perPersonElement = document.getElementById('editPricePerPerson');
            if (priceElement) priceElement.textContent = '0 ₽';
            if (perPersonElement) perPersonElement.textContent = '0 ₽/чел';
        });
    } else {
        console.error('❌ Модальное окно редактирования не найдено');
    }
    
    console.log('✅ Обработчики формы редактирования настроены');
}
// ========== УДАЛЕНИЕ ЗАЯВОК ==========

/**
 * Подтверждение удаления заявки
 * @param {number} orderId - ID заявки
 */
function deleteOrderConfirm(orderId) {
    console.log('🗑️ Подтверждение удаления заявки:', orderId);
    
    // Создаем модальное окно подтверждения
    const confirmHTML = `
    <div class="modal fade" id="deleteConfirmModal" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title text-danger">
                        <i class="bi bi-exclamation-triangle me-2"></i>
                        Подтверждение удаления
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <p>Вы уверены, что хотите удалить заявку #${orderId}?</p>
                    <p class="text-muted small">Это действие нельзя отменить.</p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                        Нет, отмена
                    </button>
                    <button type="button" class="btn btn-danger" onclick="deleteOrderConfirmed(${orderId})">
                        Да, удалить
                    </button>
                </div>
            </div>
        </div>
    </div>
    `;
    
    // Удаляем старое модальное окно если есть
    let oldModal = document.getElementById('deleteConfirmModal');
    if (oldModal) {
        oldModal.remove();
    }
    
    // Добавляем в DOM
    document.body.insertAdjacentHTML('beforeend', confirmHTML);
    
    // Показываем модальное окно
    const modalElement = document.getElementById('deleteConfirmModal');
    if (modalElement) {
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
    }
}

/**
 * Удаление заявки после подтверждения
 * @param {number} orderId - ID заявки
 */
async function deleteOrderConfirmed(orderId) {
    console.log('🗑️ Удаление заявки:', orderId);
    
    try {
        // Показываем загрузку
        showNotification('Удаление заявки...', 'info');
        
        // Отправляем DELETE запрос
        const result = await deleteOrder(orderId);
        
        // Успех
        showNotification('Заявка успешно удалена!', 'success');
        
        // Закрываем модальное окно подтверждения
        const confirmModal = bootstrap.Modal.getInstance(document.getElementById('deleteConfirmModal'));
        if (confirmModal) {
            confirmModal.hide();
        }
        
        // Обновляем список заявок
        await loadOrders();
        
        console.log('✅ Заявка удалена:', result);
        
    } catch (error) {
        console.error('❌ Ошибка удаления заявки:', error);
        showNotification(`Ошибка: ${error.message}`, 'danger');
    }
}

// ========== ЭКСПОРТ ФУНКЦИЙ ==========

// Экспортируем функции для глобального доступа
window.initPersonalPage = initPersonalPage;
window.viewOrderDetails = viewOrderDetails;
window.editOrder = editOrder;
window.deleteOrderConfirm = deleteOrderConfirm;
window.deleteOrderConfirmed = deleteOrderConfirmed;
window.changeOrdersPage = changeOrdersPage;
window.saveEditedOrder = saveEditedOrder;

// Автозапуск при загрузке страницы
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPersonalPage);
} else {
    initPersonalPage();
}