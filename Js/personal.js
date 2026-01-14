// ========== ЛИЧНЫЙ КАБИНЕТ ==========

console.log('👤 Модуль личного кабинета загружен');

// Конфигурация пагинации для заявок
const ORDERS_PER_PAGE = 5;
let allOrders = [];
let filteredOrders = [];
let currentOrdersPage = 1;
let totalOrdersPages = 1;

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
            console.log('Пример заявки:', orders[0]);
            
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
        // TODO: Можно загрузить название курса по ID
    } else if (order.tutor_id) {
        itemName = `Репетитор #${order.tutor_id}`;
        // TODO: Можно загрузить имя репетитора по ID
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
    
    // Форма поиска заявок (если будет добавлена позже)
    const searchForm = document.getElementById('orderSearchForm');
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            searchOrders();
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
        const order = await apiRequest(`/api/orders/${orderId}`, 'GET');
        
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

/**
 * Редактирование заявки
 * @param {number} orderId - ID заявки
 */
/**
 * Редактирование заявки
 * @param {number} orderId - ID заявки
 */
async function editOrder(orderId) {
    console.log('✏️ Редактирование заявки:', orderId);
    
    try {
        // Загружаем данные заявки
        const order = await getOrderById(orderId);
        
        if (!order) {
            throw new Error('Заявка не найдена');
        }
        
        // Создаем простое информационное модальное окно
        showEditInfoModal(orderId);
        
    } catch (error) {
        console.error('Ошибка редактирования заявки:', error);
        showNotification(`Ошибка: ${error.message}`, 'danger');
    }
}
function showEditInfoModal(orderId) {
    console.log('📋 Показ инфо-модального окна для редактирования заявки:', orderId);
    
    // Удаляем старое модальное окно если есть
    let oldModal = document.getElementById('editInfoModal');
    if (oldModal) {
        oldModal.remove();
    }
    
    // Создаем HTML простого модального окна
    const modalHTML = `
    <div class="modal fade" id="editInfoModal" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title text-primary">
                        <i class="bi bi-pencil-square me-2"></i>
                        Редактирование заявки #${orderId}
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="alert alert-info">
                        <i class="bi bi-info-circle me-2"></i>
                        Для редактирования заявки необходимо перейти на главную страницу
                    </div>
                    <p class="text-muted">
                        Форма редактирования доступна только на главной странице сайта, 
                        так как использует общее модальное окно для создания и редактирования заявок.
                    </p>
                    <div class="text-center py-3">
                        <a href="index.html" class="btn btn-primary btn-lg">
                            <i class="bi bi-arrow-right-circle me-2"></i>Перейти на главную страницу
                        </a>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Закрыть</button>
                </div>
            </div>
        </div>
    </div>
    `;
    
    // Добавляем в DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Показываем модальное окно
    const modalElement = document.getElementById('editInfoModal');
    if (modalElement) {
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
    }
}

/**
 * Заполняет форму данными заявки для редактирования
 * @param {Object} order - Данные заявки
 */
function fillOrderFormForEditing(order) {
    console.log('📝 Заполнение формы для редактирования заявки:', order.id);
    
    // Обновляем заголовок
    document.getElementById('orderModalTitle').textContent = 'Редактирование заявки';
    
    // Заполняем поля
    document.getElementById('orderDate').value = order.date_start;
    document.getElementById('orderTime').value = order.time_start;
    document.getElementById('orderPersons').value = order.persons;
    
    // Заполняем чекбоксы
    document.getElementById('optionEarly').checked = order.early_registration || false;
    document.getElementById('optionGroup').checked = order.group_enrollment || false;
    document.getElementById('optionIntensive').checked = order.intensive_course || false;
    document.getElementById('optionMaterials').checked = order.supplementary || false;
    document.getElementById('optionPersonal').checked = order.personalized || false;
    document.getElementById('optionExcursions').checked = order.excursions || false;
    document.getElementById('optionAssessment').checked = order.assessment || false;
    document.getElementById('optionInteractive').checked = order.interactive || false;
    
    // Добавляем скрытое поле с ID заявки
    let orderIdField = document.getElementById('editOrderId');
    if (!orderIdField) {
        orderIdField = document.createElement('input');
        orderIdField.type = 'hidden';
        orderIdField.id = 'editOrderId';
        orderIdField.name = 'editOrderId';
        document.getElementById('orderForm').appendChild(orderIdField);
    }
    orderIdField.value = order.id;
    
    // Обновляем информацию о выбранном элементе
    updateSelectedItemInfo();
    
    // Пересчитываем стоимость
    calculateTotalCost();
}

/**
 * Открывает модальное окно в режиме редактирования
 * @param {number} orderId - ID заявки
 */
function openOrderModalForEditing(orderId) {
    console.log('📋 Открытие модального окна для редактирования заявки:', orderId);
    
    const modalElement = document.getElementById('orderModal');
    if (!modalElement) {
        console.error('❌ Модальное окно заявки не найдено');
        
        // Если модального окна нет на странице (мы в личном кабинете),
        // нужно перейти на главную страницу для редактирования
        showNotification('Для редактирования заявки перейдите на главную страницу', 'warning');
        return;
    }
    
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
    
    // Сохраняем ID заявки в data-атрибут модального окна
    modalElement.setAttribute('data-edit-order-id', orderId);
    
    // Обновляем кнопку отправки
    const submitBtn = document.getElementById('submitOrderBtn');
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="bi bi-check-circle me-1"></i>Сохранить изменения';
        submitBtn.onclick = function() {
            updateOrderOnServer(orderId);
        };
    }
}

/**
 * Обновляет заявку на сервере
 * @param {number} orderId - ID заявки
 */
async function updateOrderOnServer(orderId) {
    console.log('🔄 Обновление заявки на сервере:', orderId);
    
    // Проверяем заполненность полей
    if (!validateOrderForm()) {
        return;
    }
    
    try {
        // Показываем загрузку
        showNotification('Сохранение изменений...', 'info');
        
        // Собираем данные
        const orderData = collectOrderData();
        
        // Отправляем PUT запрос
        const result = await updateOrder(orderId, orderData);
        
        // Успех
        showNotification('Заявка успешно обновлена!', 'success');
        
        // Закрываем модальное окно
        const modal = bootstrap.Modal.getInstance(document.getElementById('orderModal'));
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

// Экспортируем функции
window.initPersonalPage = initPersonalPage;
window.viewOrderDetails = viewOrderDetails;
window.editOrder = editOrder;
window.deleteOrderConfirm = deleteOrderConfirm;
window.deleteOrderConfirmed = deleteOrderConfirmed;
window.changeOrdersPage = changeOrdersPage;

// Автозапуск при загрузке страницы
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPersonalPage);
} else {
    initPersonalPage();
}