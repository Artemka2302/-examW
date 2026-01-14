// ========== МОДУЛЬ РАБОТЫ С ЗАЯВКАМИ ==========

console.log('📝 Модуль заявок загружен');

// Глобальные переменные для текущего выбора
let currentSelectedItem = null;
let currentItemType = ''; // 'course' или 'tutor'
let currentItemData = null;

/**
 * Инициализация модуля заявок
 */
function initOrders() {
    console.log('🚀 Инициализация модуля заявок...');
    
    // Настраиваем обработчики для модального окна
    setupOrderModalListeners();
    
    // Настраиваем обработчики для кнопок открытия формы
    setupOrderButtons();
    
    // Инициализируем расчет стоимости
    initCostCalculation();
}

/**
 * Настраивает обработчики для модального окна заявки
 */
function setupOrderModalListeners() {
    const modal = document.getElementById('orderModal');
    
    if (!modal) {
        console.error('❌ Модальное окно заявки не найдено!');
        return;
    }
    
    // При открытии модального окна
    modal.addEventListener('show.bs.modal', function (event) {
        console.log('📋 Модальное окно заявки открывается');
        
        // Обновляем заголовок
        document.getElementById('orderModalTitle').textContent = 'Оформление заявки';
        
        // НЕ сбрасываем форму здесь! Только обновляем данные
        if (currentSelectedItem && currentItemData) {
            updateSelectedItemInfo();
            calculateTotalCost();
        } else {
            // Если ничего не выбрано, показываем предупреждение
            const itemNameElement = document.getElementById('selectedItemName');
            if (itemNameElement) {
                itemNameElement.textContent = 'Не выбрано';
                itemNameElement.className = 'alert alert-warning py-2';
            }
        }
    });
    
    // При скрытии модального окна
    modal.addEventListener('hide.bs.modal', function () {
        console.log('📋 Модальное окно заявки скрывается');
    });
    
    // При закрытии модального окна
    modal.addEventListener('hidden.bs.modal', function () {
        console.log('📋 Модальное окно заявки закрыто');
        resetOrderForm();
        currentSelectedItem = null;
        currentItemData = null;
        currentItemType = '';
    });
    
    // Обработчик отправки формы
    const submitBtn = document.getElementById('submitOrderBtn');
    if (submitBtn) {
        submitBtn.addEventListener('click', submitOrder);
    }
    
    console.log('✅ Обработчики модального окна настроены');
}

/**
 * Настраивает кнопки открытия формы заявки
 */
function setupOrderButtons() {
    // Кнопка в блоке курсов
    const openOrderBtn = document.getElementById('openOrderBtn');
    if (openOrderBtn) {
        openOrderBtn.addEventListener('click', function() {
            if (!currentSelectedItem) {
                showNotification('Пожалуйста, сначала выберите курс или репетитора', 'warning');
                return;
            }
        });
    }
    
    console.log('✅ Кнопки заявки настроены');
}

/**
 * Инициализирует расчет стоимости
 */
function initCostCalculation() {
    console.log('💰 Инициализация расчета стоимости...');
    
    // Элементы для расчета
    const orderDate = document.getElementById('orderDate');
    const orderTime = document.getElementById('orderTime');
    const orderPersons = document.getElementById('orderPersons');
    const options = document.querySelectorAll('#orderOptions input[type="checkbox"]');
    
    if (!orderDate || !orderTime || !orderPersons) {
        console.error('❌ Элементы для расчета не найдены');
        return;
    }
    
    // Обработчики для пересчета стоимости
    const recalculate = () => {
        if (currentItemData) {
            calculateTotalCost();
        }
    };
    
    // Дата начала
    if (orderDate) {
        orderDate.addEventListener('change', recalculate);
        
        // Устанавливаем минимальную дату (сегодня)
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0];
        orderDate.min = formattedDate;
        
        // Устанавливаем максимальную дату (через год)
        const nextYear = new Date();
        nextYear.setFullYear(nextYear.getFullYear() + 1);
        const formattedMaxDate = nextYear.toISOString().split('T')[0];
        orderDate.max = formattedMaxDate;
        
        // Устанавливаем значение по умолчанию (через неделю)
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        const formattedDefaultDate = nextWeek.toISOString().split('T')[0];
        orderDate.value = formattedDefaultDate;
    }
    
    // Время
    if (orderTime) {
        orderTime.addEventListener('change', recalculate);
    }
    
    // Количество студентов
    if (orderPersons) {
        orderPersons.addEventListener('input', recalculate);
        orderPersons.addEventListener('change', recalculate);
    }
    
    // Дополнительные опции
    options.forEach(option => {
        option.addEventListener('change', recalculate);
    });
    
    console.log('✅ Расчет стоимости инициализирован');
}

/**
 * Выбирает курс для оформления заявки
 * @param {number} courseId - ID курса
 */
async function selectCourseForOrder(courseId) {
    console.log('🎯 Выбор курса для заявки:', courseId);
    
    try {
        // Находим курс в загруженных данных
        let course = allCourses?.find(c => c.id === courseId);
        
        // Если не нашли, загружаем с сервера
        if (!course) {
            course = await getCourseById(courseId);
        }
        
        if (!course) {
            throw new Error('Курс не найден');
        }
        
        // Сохраняем данные
        currentSelectedItem = courseId;
        currentItemType = 'course';
        currentItemData = course;
        
        // Обновляем информацию в модальном окне
        updateSelectedItemInfo();
        
        // Показываем уведомление
        showNotification(`Выбран курс: ${course.name}`, 'success');
        
        // Открываем модальное окно
        openOrderModal();
        
    } catch (error) {
        console.error('Ошибка выбора курса:', error);
        showNotification(`Ошибка: ${error.message}`, 'danger');
    }
}

/**
 * Выбирает репетитора для оформления заявки
 * @param {number} tutorId - ID репетитора
 */
async function selectTutorForOrder(tutorId) {
    console.log('🎯 Выбор репетитора для заявки:', tutorId);
    
    try {
        // Находим репетитора в загруженных данных
        let tutor = allTutors?.find(t => t.id === tutorId);
        
        // TODO: Если не нашли, загружаем с сервера (нужно реализовать getTutorById)
        
        if (!tutor) {
            throw new Error('Репетитор не найден');
        }
        
        // Сохраняем данные
        currentSelectedItem = tutorId;
        currentItemType = 'tutor';
        currentItemData = tutor;
        
        // Обновляем информацию в модальном окне
        updateSelectedItemInfo();
        
        // Показываем уведомление
        showNotification(`Выбран репетитор: ${tutor.name}`, 'success');
        
        // Открываем модальное окно
        openOrderModal();
        
    } catch (error) {
        console.error('Ошибка выбора репетитора:', error);
        showNotification(`Ошибка: ${error.message}`, 'danger');
    }
}

/**
 * Обновляет информацию о выбранном элементе в форме
 */
function updateSelectedItemInfo() {
    const itemNameElement = document.getElementById('selectedItemName');
    const orderTypeElement = document.getElementById('orderType');
    const orderItemIdElement = document.getElementById('orderItemId');
    
    if (!itemNameElement || !orderTypeElement || !orderItemIdElement) {
        console.error('❌ Элементы формы не найдены');
        return;
    }
    
    if (!currentItemData) {
        itemNameElement.textContent = 'Не выбрано';
        itemNameElement.className = 'alert alert-warning py-2';
        return;
    }
    
    // Устанавливаем тип и ID
    orderTypeElement.value = currentItemType;
    orderItemIdElement.value = currentSelectedItem;
    
    // Обновляем отображаемое имя
    if (currentItemType === 'course') {
        itemNameElement.innerHTML = `
            <strong>Курс:</strong> ${currentItemData.name}<br>
            <small>Преподаватель: ${currentItemData.teacher}</small>
        `;
        itemNameElement.className = 'alert alert-info py-2';
    } else if (currentItemType === 'tutor') {
        itemNameElement.innerHTML = `
            <strong>Репетитор:</strong> ${currentItemData.name}<br>
            <small>Опыт: ${currentItemData.work_experience} лет</small>
        `;
        itemNameElement.className = 'alert alert-success py-2';
    }
    
    console.log(`✅ Обновлена информация: ${currentItemType} ID ${currentSelectedItem}`);
}

/**
 * Открывает модальное окно заявки
 */
function openOrderModal() {
    const modalElement = document.getElementById('orderModal');
    if (!modalElement) {
        console.error('❌ Модальное окно не найдено');
        return;
    }
    
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
}

/**
 * Рассчитывает общую стоимость по формуле из ТЗ
 */
function calculateTotalCost() {
    console.log('🧮 Расчет стоимости...');
    
    if (!currentItemData) {
        console.log('❌ Нет данных для расчета');
        updateCostDisplay(0, 0, 0, 0);
        return;
    }
    
    // Получаем значения из формы
    const dateStr = document.getElementById('orderDate').value;
    const timeStr = document.getElementById('orderTime').value;
    const persons = parseInt(document.getElementById('orderPersons').value) || 1;
    
    // Получаем состояние чекбоксов
    const options = {
        early_registration: document.getElementById('optionEarly').checked,
        group_enrollment: document.getElementById('optionGroup').checked,
        intensive_course: document.getElementById('optionIntensive').checked,
        supplementary: document.getElementById('optionMaterials').checked,
        personalized: document.getElementById('optionPersonal').checked,
        excursions: document.getElementById('optionExcursions').checked,
        assessment: document.getElementById('optionAssessment').checked,
        interactive: document.getElementById('optionInteractive').checked
    };
    
    // Базовые параметры в зависимости от типа
    let baseFeePerHour = 0;
    let totalHours = 0;
    
    if (currentItemType === 'course') {
        baseFeePerHour = currentItemData.course_fee_per_hour || 0;
        totalHours = (currentItemData.total_length || 0) * (currentItemData.week_length || 0);
    } else if (currentItemType === 'tutor') {
        baseFeePerHour = currentItemData.price_per_hour || 0;
        totalHours = 1; // Для репетитора по умолчанию 1 час, можно сделать настройку
    }
    
    // Проверяем наличие необходимых данных
    if (!dateStr || !timeStr || baseFeePerHour === 0 || totalHours === 0) {
        console.log('⚠️ Не все данные для расчета');
        updateCostDisplay(0, 0, 0, 0);
        return;
    }
    
    // 1. Множитель выходных/праздников
    let isWeekendOrHoliday = 1;
    const date = new Date(dateStr);
    const dayOfWeek = date.getDay(); // 0 - воскресенье, 6 - суббота
    
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        isWeekendOrHoliday = 1.5;
    }
    // TODO: Добавить проверку на праздники (можно использовать справочник)
    
    // 2. Надбавки за утро/вечер
    let morningSurcharge = 0;
    let eveningSurcharge = 0;
    
    const hour = parseInt(timeStr.split(':')[0]);
    if (hour >= 9 && hour < 12) {
        morningSurcharge = 400;
    } else if (hour >= 18 && hour < 20) {
        eveningSurcharge = 1000;
    }
    
    // 3. Базовая стоимость
    let baseCost = (baseFeePerHour * totalHours * isWeekendOrHoliday) + morningSurcharge + eveningSurcharge;
    
    // 4. Применяем опции (надбавки)
    let surcharges = 0;
    
    // Дополнительные материалы (фиксированная сумма за студента)
    if (options.supplementary) {
        surcharges += 2000 * persons;
    }
    
    // Индивидуальные занятия (фиксированная сумма в неделю)
    if (options.personalized && currentItemType === 'course') {
        surcharges += 1500 * (currentItemData.total_length || 0);
    }
    
    // Оценка уровня
    if (options.assessment) {
        surcharges += 300;
    }
    
    // Процентные надбавки
    let percentageMultiplier = 1;
    
    if (options.intensive_course) {
        percentageMultiplier += 0.20; // +20%
    }
    
    if (options.excursions) {
        percentageMultiplier += 0.25; // +25%
    }
    
    if (options.interactive) {
        percentageMultiplier += 0.50; // +50%
    }
    
    // Применяем процентные надбавки
    baseCost *= percentageMultiplier;
    
    // 5. Применяем скидки
    let discounts = 0;
    let discountMultiplier = 1;
    
    // Скидка за раннюю регистрацию (если дата > чем через месяц)
    if (options.early_registration) {
        const today = new Date();
        const orderDate = new Date(dateStr);
        const monthLater = new Date(today);
        monthLater.setMonth(monthLater.getMonth() + 1);
        
        if (orderDate > monthLater) {
            discountMultiplier -= 0.10; // -10%
        }
    }
    
    // Скидка за групповую запись
    if (options.group_enrollment && persons >= 5) {
        discountMultiplier -= 0.15; // -15%
    }
    
    // Применяем скидки (нельзя меньше 0)
    discountMultiplier = Math.max(discountMultiplier, 0);
    baseCost *= discountMultiplier;
    
    // Рассчитываем скидки в рублях для отображения
    const originalCost = (baseFeePerHour * totalHours * isWeekendOrHoliday) + morningSurcharge + eveningSurcharge;
    const costAfterSurcharges = originalCost * percentageMultiplier + surcharges;
    discounts = costAfterSurcharges * (1 - discountMultiplier);
    
    // 6. Умножаем на количество студентов
    let totalCost = baseCost * persons;
    
    // Округляем до целых рублей
    totalCost = Math.round(totalCost);
    surcharges = Math.round(surcharges);
    discounts = Math.round(discounts);
    
    console.log('📊 Результаты расчета:', {
        baseFeePerHour,
        totalHours,
        persons,
        isWeekendOrHoliday,
        morningSurcharge,
        eveningSurcharge,
        percentageMultiplier,
        discountMultiplier,
        totalCost
    });
    
    // Обновляем отображение
    updateCostDisplay(totalCost, originalCost * persons, surcharges, discounts);
    
    return totalCost;
}

/**
 * Обновляет отображение стоимости в форме
 */
function updateCostDisplay(total, base, surcharges, discounts) {
    const baseCostElement = document.getElementById('baseCost');
    const surchargesElement = document.getElementById('surcharges');
    const discountsElement = document.getElementById('discounts');
    const totalCostElement = document.getElementById('totalCost');
    const costPerPersonElement = document.getElementById('costPerPerson');
    
    const persons = parseInt(document.getElementById('orderPersons').value) || 1;
    const perPerson = Math.round(total / persons);
    
    if (baseCostElement) baseCostElement.textContent = `${Math.round(base)} ₽`;
    if (surchargesElement) surchargesElement.textContent = `+${surcharges} ₽`;
    if (discountsElement) discountsElement.textContent = `-${discounts} ₽`;
    if (totalCostElement) totalCostElement.textContent = `${total} ₽`;
    if (costPerPersonElement) costPerPersonElement.textContent = `${perPerson} ₽/чел`;
    
    console.log(`💰 Стоимость обновлена: ${total} ₽ (${perPerson} ₽/чел)`);
}

/**
 * Сбрасывает форму заявки
 */
function resetOrderForm() {
    console.log('🔄 Сброс полей формы заявки');
    
    // Сбрасываем только поля ввода, НЕ выбранный элемент
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    // Устанавливаем значения по умолчанию
    document.getElementById('orderDate').value = nextWeek.toISOString().split('T')[0];
    document.getElementById('orderTime').value = '';
    document.getElementById('orderPersons').value = 1;
    
    // Сбрасываем чекбоксы
    const checkboxes = document.querySelectorAll('#orderOptions input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    
    // Обновляем стоимость (будет 0 если нет выбранного элемента)
    calculateTotalCost();
}

/**
 * Отправляет заявку на сервер
 */
async function submitOrder() {
    console.log('📤 Отправка заявки...');
    
    // Проверяем заполненность полей
    if (!validateOrderForm()) {
        return;
    }
    
    try {
        // Показываем загрузку
        showNotification('Отправка заявки...', 'info');
        
        // Собираем данные
        const orderData = collectOrderData();
        
        console.log('📦 Данные заявки:', orderData);
        
        // Отправляем на сервер
        const result = await createOrder(orderData);
        
        // Успех
        showNotification('Заявка успешно отправлена!', 'success');
        
        // Закрываем модальное окно
        const modal = bootstrap.Modal.getInstance(document.getElementById('orderModal'));
        if (modal) {
            modal.hide();
        }
        
        // Сбрасываем форму
        resetOrderForm();
        
        console.log('✅ Заявка создана:', result);
        
    } catch (error) {
        console.error('❌ Ошибка отправки заявки:', error);
        showNotification(`Ошибка: ${error.message}`, 'danger');
    }
    showNotification(`Заявка успешно создана! Номер заявки: ${result.id}`, 'success', 5000);
}

/**
 * Проверяет валидность формы заявки
 */
function validateOrderForm() {
    const orderType = document.getElementById('orderType').value;
    const orderItemId = document.getElementById('orderItemId').value;
    const orderDate = document.getElementById('orderDate').value;
    const orderTime = document.getElementById('orderTime').value;
    const orderPersons = document.getElementById('orderPersons').value;
    
    let errors = [];
    
    if (!orderType || !orderItemId) {
        errors.push('Не выбран курс или репетитор');
    }
    
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
 * Собирает данные заявки из формы
 */
function collectOrderData() {
    const orderType = document.getElementById('orderType').value;
    const orderItemId = parseInt(document.getElementById('orderItemId').value);
    const orderDate = document.getElementById('orderDate').value;
    const orderTime = document.getElementById('orderTime').value;
    const orderPersons = parseInt(document.getElementById('orderPersons').value);
    
    // Рассчитываем стоимость
    const totalPrice = calculateTotalCost();
    
    // Собираем опции
    const options = {
        early_registration: document.getElementById('optionEarly').checked,
        group_enrollment: document.getElementById('optionGroup').checked,
        intensive_course: document.getElementById('optionIntensive').checked,
        supplementary: document.getElementById('optionMaterials').checked,
        personalized: document.getElementById('optionPersonal').checked,
        excursions: document.getElementById('optionExcursions').checked,
        assessment: document.getElementById('optionAssessment').checked,
        interactive: document.getElementById('optionInteractive').checked
    };
    
    // Определяем курс или репетитор
    let orderData = {
        date_start: orderDate,
        time_start: orderTime,
        persons: orderPersons,
        price: totalPrice,
        ...options
    };
    
    if (orderType === 'course') {
        orderData.course_id = orderItemId;
        orderData.tutor_id = null;
        
        // Для курса вычисляем продолжительность
        if (currentItemData && currentItemType === 'course') {
            orderData.duration = (currentItemData.total_length || 0) * (currentItemData.week_length || 0);
        }
    } else if (orderType === 'tutor') {
        orderData.tutor_id = orderItemId;
        orderData.course_id = null;
        
        // Для репетитора по умолчанию 1 час
        orderData.duration = 1;
    }
    
    return orderData;
}

// Экспортируем функции
window.initOrders = initOrders;
window.selectCourseForOrder = selectCourseForOrder;
window.selectTutorForOrder = selectTutorForOrder;
window.openOrderModal = openOrderModal;
window.calculateTotalCost = calculateTotalCost;

// Автозапуск
