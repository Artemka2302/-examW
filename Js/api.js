// ========== API КОНФИГУРАЦИЯ ==========

// Базовый URL API
const API_BASE_URL = 'http://exam-api-courses.std-900.ist.mospolytech.ru';

// Определяем, где мы работаем
const isLocalhost = window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1';
const isGitHubPages = window.location.hostname.includes('github.io');

// Выбираем URL в зависимости от окружения
let BASE_URL;
if (isLocalhost) {
    // Локально - прямой доступ
    BASE_URL = API_BASE_URL;
    console.log('📍 Локальная разработка - прямой доступ к API');
} else if (isGitHubPages) {
    // GitHub Pages - через прокси (решаем проблему CORS)
    BASE_URL = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(API_BASE_URL);
    console.log('🌐 GitHub Pages - используем CORS прокси');
} else {
    // Другие хостинги
    BASE_URL = API_BASE_URL;
    console.log('🚀 Продакшен окружение');
}

console.log('Настройки API:', {
    hostname: window.location.hostname,
    isLocalhost,
    isGitHubPages,
    BASE_URL
});

const DEFAULT_API_KEY = '32342745-3e72-4fcc-8f7a-a5a0c1703144';
let API_KEY = DEFAULT_API_KEY;

/**
 * Устанавливает API ключ
 * @param {string} key - API ключ
 */
function setApiKey(key) {
    API_KEY = key;
    localStorage.setItem('polyLangApiKey', key);
    console.log('API ключ установлен:', key.substring(0, 8) + '...');
}

/**
 * Загружает API ключ из localStorage
 * Если нет в localStorage, использует ключ по умолчанию
 */
function loadApiKey() {
    const savedKey = localStorage.getItem('polyLangApiKey');
    if (savedKey) {
        API_KEY = savedKey;
        console.log('API ключ загружен из localStorage');
    } else {
        API_KEY = DEFAULT_API_KEY;
        console.log('Используется ключ API по умолчанию');
    }
}

/**
 * Создает URL с API ключом
 * @param {string} endpoint - Конечная точка API
 * @returns {string} Полный URL
 */
function getApiUrl(endpoint) {
    if (!API_KEY) {
        console.error('API ключ не установлен!');
        showNotification('Ошибка: API ключ не установлен', 'danger');
        return null;
    }
    
    // Убедимся, что endpoint начинается с /
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : '/' + endpoint;
    
    // Для GitHub Pages URL уже содержит базовый URL через прокси
    if (isGitHubPages) {
        return `${BASE_URL}${normalizedEndpoint}?api_key=${API_KEY}`;
    } else {
        return `${BASE_URL}${normalizedEndpoint}?api_key=${API_KEY}`;
    }
}

/**
 * Базовый запрос к API
 * @param {string} endpoint - Конечная точка API
 * @param {string} method - HTTP метод (GET, POST, PUT, DELETE)
 * @param {Object} data - Данные для отправки (для POST/PUT)
 * @returns {Promise} Promise с результатом
 */
async function apiRequest(endpoint, method = 'GET', data = null) {
    const url = getApiUrl(endpoint);
    
    if (!url) {
        throw new Error('Не удалось создать URL запроса');
    }
    
    console.log(`API запрос: ${method} ${endpoint}`, {
        url: url.substring(0, 100) + '...',
        data
    });
    
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        },
        // Для CORS на GitHub Pages
        mode: 'cors',
        cache: 'no-cache'
    };
    
    if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(url, options);
        
        // Проверяем, что ответ получен
        if (!response) {
            throw new Error('Нет ответа от сервера');
        }
        
        // Пробуем получить текст ответа
        const responseText = await response.text();
        
        // Проверяем, является ли ответ JSON
        let result;
        try {
            result = responseText ? JSON.parse(responseText) : {};
        } catch (parseError) {
            console.warn('Ответ не в формате JSON:', responseText);
            throw new Error(`Сервер вернул невалидный JSON: ${responseText.substring(0, 100)}`);
        }
        
        if (!response.ok) {
            throw new Error(result.error || `Ошибка ${response.status}: ${response.statusText}`);
        }
        
        console.log(`✅ API ответ от ${endpoint}:`, result);
        return result;
    } catch (error) {
        console.error('❌ Ошибка API запроса:', error);
        
        // Более информативное сообщение об ошибке
        let errorMessage = error.message;
        if (error.message.includes('Failed to fetch') || 
            error.message.includes('NetworkError') ||
            error.message.includes('CORS')) {
            errorMessage = 'Проблема с подключением к API. Возможно, CORS блокирует запрос.';
            if (isGitHubPages) {
                errorMessage += ' Используется прокси для GitHub Pages.';
            }
        }
        
        showNotification(`Ошибка API: ${errorMessage}`, 'danger');
        throw error;
    }
}

/**
 * Получить список курсов
 * @returns {Promise<Array>} Массив курсов
 */
async function getCourses() {
    try {
        console.log('📚 Загрузка курсов...');
        const courses = await apiRequest('/api/courses', 'GET');
        console.log(`✅ Получено курсов: ${courses?.length || 0}`);
        return courses || [];
    } catch (error) {
        console.error('Ошибка получения курсов:', error);
        // Возвращаем тестовые данные для разработки, если API недоступен
        if (isGitHubPages) {
            console.log('⚠️ Используем тестовые данные для GitHub Pages');
            return getTestCourses();
        }
        return [];
    }
}

/**
 * Получить список репетиторов
 * @returns {Promise<Array>} Массив репетиторов
 */
async function getTutors() {
    try {
        console.log('👨‍🏫 Загрузка репетиторов...');
        const tutors = await apiRequest('/api/tutors', 'GET');
        console.log(`✅ Получено репетиторов: ${tutors?.length || 0}`);
        return tutors || [];
    } catch (error) {
        console.error('Ошибка получения репетиторов:', error);
        // Возвращаем тестовые данные для разработки, если API недоступен
        if (isGitHubPages) {
            console.log('⚠️ Используем тестовые данные для GitHub Pages');
            return getTestTutors();
        }
        return [];
    }
}

/**
 * Получить список заявок пользователя
 * @returns {Promise<Array>} Массив заявок
 */
async function getOrders() {
    try {
        console.log('📋 Загрузка заявок...');
        const orders = await apiRequest('/api/orders', 'GET');
        console.log(`✅ Получено заявок: ${orders?.length || 0}`);
        return orders || [];
    } catch (error) {
        console.error('Ошибка получения заявок:', error);
        return [];
    }
}

/**
 * Создать новую заявку
 * @param {Object} orderData - Данные заявки
 * @returns {Promise<Object>} Созданная заявка
 */
async function createOrder(orderData) {
    try {
        console.log('📝 Создание заявки:', orderData);
        const result = await apiRequest('/api/orders', 'POST', orderData);
        console.log('✅ Заявка создана:', result);
        return result;
    } catch (error) {
        console.error('Ошибка создания заявки:', error);
        throw error;
    }
}

/**
 * Обновить существующую заявку
 * @param {number} orderId - ID заявки
 * @param {Object} orderData - Новые данные
 * @returns {Promise<Object>} Обновленная заявка
 */
async function updateOrder(orderId, orderData) {
    try {
        console.log('✏️ Обновление заявки:', orderId, orderData);
        const result = await apiRequest(`/api/orders/${orderId}`, 'PUT', orderData);
        console.log('✅ Заявка обновлена:', result);
        return result;
    } catch (error) {
        console.error('Ошибка обновления заявки:', error);
        throw error;
    }
}

/**
 * Удалить заявку
 * @param {number} orderId - ID заявки
 * @returns {Promise<Object>} Результат удаления
 */
async function deleteOrder(orderId) {
    try {
        console.log('🗑️ Удаление заявки:', orderId);
        const result = await apiRequest(`/api/orders/${orderId}`, 'DELETE');
        console.log('✅ Заявка удалена:', result);
        return result;
    } catch (error) {
        console.error('Ошибка удаления заявки:', error);
        throw error;
    }
}

/**
 * Получить информацию о конкретном курсе
 * @param {number} courseId - ID курса
 * @returns {Promise<Object>} Данные курса
 */
async function getCourseById(courseId) {
    try {
        console.log(`📘 Загрузка курса ID: ${courseId}`);
        const course = await apiRequest(`/api/courses/${courseId}`, 'GET');
        console.log('✅ Курс загружен:', course?.name);
        return course;
    } catch (error) {
        console.error(`Ошибка получения курса ${courseId}:`, error);
        return null;
    }
}

/**
 * Получить информацию о конкретном репетиторе
 * @param {number} tutorId - ID репетитора
 * @returns {Promise<Object>} Данные репетитора
 */
async function getTutorById(tutorId) {
    try {
        console.log(`👤 Загрузка репетитора ID: ${tutorId}`);
        const tutor = await apiRequest(`/api/tutors/${tutorId}`, 'GET');
        console.log('✅ Репетитор загружен:', tutor?.name);
        return tutor;
    } catch (error) {
        console.error(`Ошибка получения репетитора ${tutorId}:`, error);
        return null;
    }
}

/**
 * Получить информацию о конкретной заявке
 * @param {number} orderId - ID заявки
 * @returns {Promise<Object>} Данные заявки
 */
async function getOrderById(orderId) {
    try {
        console.log(`📄 Загрузка заявки ID: ${orderId}`);
        const order = await apiRequest(`/api/orders/${orderId}`, 'GET');
        console.log('✅ Заявка загружена:', order?.id);
        return order;
    } catch (error) {
        console.error(`Ошибка получения заявки ${orderId}:`, error);
        return null;
    }
}

// ========== ТЕСТОВЫЕ ДАННЫЕ ДЛЯ РАЗРАБОТКИ ==========

/**
 * Тестовые данные курсов для GitHub Pages
 */
function getTestCourses() {
    console.log('📚 Загрузка тестовых данных курсов');
    return [
        {
            id: 1,
            name: "Английский для начинающих",
            description: "Курс для тех, кто только начинает изучать английский язык",
            teacher: "Ирина Петрова",
            level: "Beginner",
            total_length: 8,
            week_length: 2,
            start_dates: ["2024-03-01T09:00:00", "2024-04-01T09:00:00"],
            course_fee_per_hour: 500,
            created_at: "2024-01-15T10:00:00"
        },
        {
            id: 2,
            name: "Деловой английский",
            description: "Курс для бизнес-коммуникации на английском языке",
            teacher: "Александр Смирнов",
            level: "Intermediate",
            total_length: 12,
            week_length: 3,
            start_dates: ["2024-03-15T18:00:00", "2024-04-15T18:00:00"],
            course_fee_per_hour: 800,
            created_at: "2024-01-20T11:00:00"
        },
        {
            id: 3,
            name: "Испанский язык",
            description: "Изучение испанского языка и культуры",
            teacher: "Мария Гонсалес",
            level: "Beginner",
            total_length: 10,
            week_length: 2,
            start_dates: ["2024-03-10T17:00:00"],
            course_fee_per_hour: 600,
            created_at: "2024-01-25T12:00:00"
        }
    ];
}

/**
 * Тестовые данные репетиторов для GitHub Pages
 */
function getTestTutors() {
    console.log('👨‍🏫 Загрузка тестовых данных репетиторов');
    return [
        {
            id: 1,
            name: "Ирина Петрова",
            work_experience: 5,
            languages_spoken: ["Русский", "Английский", "Французский"],
            languages_offered: ["Английский", "Французский"],
            language_level: "Advanced",
            price_per_hour: 1000
        },
        {
            id: 2,
            name: "Александр Смирнов",
            work_experience: 8,
            languages_spoken: ["Русский", "Английский", "Немецкий"],
            languages_offered: ["Английский", "Немецкий"],
            language_level: "Advanced",
            price_per_hour: 1200
        },
        {
            id: 3,
            name: "Мария Гонсалес",
            work_experience: 3,
            languages_spoken: ["Испанский", "Русский", "Английский"],
            languages_offered: ["Испанский"],
            language_level: "Intermediate",
            price_per_hour: 800
        }
    ];
}

// ========== ЭКСПОРТ ФУНКЦИЙ API ==========

// Экспортируем все API функции для глобального доступа
window.getCourses = getCourses;
window.getTutors = getTutors;
window.getOrders = getOrders;
window.createOrder = createOrder;
window.updateOrder = updateOrder;
window.deleteOrder = deleteOrder;
window.getCourseById = getCourseById;
window.getTutorById = getTutorById;
window.getOrderById = getOrderById;
window.apiRequest = apiRequest;
window.getApiUrl = getApiUrl;
window.setApiKey = setApiKey;
window.loadApiKey = loadApiKey;