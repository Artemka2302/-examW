// ========== API КОНФИГУРАЦИЯ ==========

const API_BASE_URL = 'http://exam-api-courses.std-900.ist.mospolytech.ru';
const DEFAULT_API_KEY = '32342745-3e72-4fcc-8f7a-a5a0c1703144';

// Рабочий CORS прокси
const CORS_PROXY = 'https://api.corsproxy.io/?';
// Или альтернатива: 'https://corsproxy.io/?'

let API_KEY = DEFAULT_API_KEY;

/**
 * Определяет, где мы работаем
 */
function getEnvironment() {
    const hostname = window.location.hostname;
    return {
        isLocalhost: hostname === 'localhost' || hostname === '127.0.0.1',
        isGitHubPages: hostname.includes('github.io'),
        hostname
    };
}

/**
 * Устанавливает API ключ
 */ 

function setApiKey(key) {
    API_KEY = key;
    localStorage.setItem('polyLangApiKey', key);
    console.log('API ключ установлен:', key.substring(0, 8) + '...');
}

/** 
  * Загружает API ключ из localStorage
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
 * Создает URL с API ключом (с CORS прокси если нужно)
 */
function getApiUrl(endpoint) {
    if (!API_KEY) {
        console.error('API ключ не установлен!');
        showNotification('Ошибка: API ключ не установлен', 'danger');
        return null;
    }
    
    // Убедимся, что endpoint начинается с /
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : '/' + endpoint;
    
    // Создаем базовый URL
    const baseUrl = `${API_BASE_URL}${normalizedEndpoint}?api_key=${API_KEY}`;
    
    // Проверяем окружение
    const env = getEnvironment();
    
    // Если на GitHub Pages - используем CORS прокси
    if (env.isGitHubPages) {
        const proxiedUrl = CORS_PROXY + encodeURIComponent(baseUrl);
        console.log(`🌐 GitHub Pages: используем CORS прокси`);
        console.log(`   Оригинальный URL: ${baseUrl}`);
        console.log(`   Прокси URL: ${proxiedUrl.substring(0, 100)}...`);
        return proxiedUrl;
    }
    
    // Локально или на другом хостинге - прямой доступ
    console.log(`📍 ${env.isLocalhost ? 'Локально' : 'Продакшен'}: прямой доступ к API`);
    return baseUrl;
}

/**
 * Улучшенный запрос к API с обработкой CORS
 */
async function apiRequest(endpoint, method = 'GET', data = null) {
    const url = getApiUrl(endpoint);
    
    if (!url) {
        throw new Error('Не удалось создать URL запроса');
    }
    
    console.log(`API запрос: ${method} ${endpoint}`);
    
    const headers = {
        'Content-Type': 'application/json'
    };
    
    // Для CORS прокси могут потребоваться дополнительные заголовки
    const env = getEnvironment();
    if (env.isGitHubPages) {
        headers['X-Requested-With'] = 'XMLHttpRequest';
        headers['Accept'] = 'application/json';
    }
    
    const options = {
        method: method,
        headers: headers,
        mode: 'cors',
        cache: 'no-cache'
    };
    
    if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
    }
    
    try {
        console.log(`Отправляем запрос на: ${url.substring(0, 150)}...`);
        
        const response = await fetch(url, options);
        
        console.log(`Ответ получен, статус: ${response.status}`);
        
        // Проверяем, является ли ответ JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.warn('Ответ не JSON:', text.substring(0, 200));
            throw new Error(`Сервер вернул не JSON: ${text.substring(0, 100)}`);
        }
        
        const result = await response.json();
        
        if (!response.ok) {
            console.error('Ошибка API:', result);
            throw new Error(result.error || `HTTP ${response.status}: ${response.statusText}`);
        }
        
        console.log(`✅ Успешный ответ от ${endpoint}`);
        return result;
        
    } catch (error) {
        console.error('❌ Ошибка при выполнении запроса:', error);
        
        // Определяем тип ошибки
        let errorMessage = error.message;
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            errorMessage = 'Ошибка сети. Проверьте подключение к интернету.';
        } else if (error.message.includes('CORS') || error.message.includes('origin')) {
            errorMessage = 'Ошибка CORS. API не разрешает запросы с этого домена.';
        }
        
        showNotification(`Ошибка API: ${errorMessage}`, 'danger');
        throw error;
    }
}
 
// ========== API ФУНКЦИИ ==========

/**
 * Получить список курсов
 */
async function getCourses() {
    try {
        console.log('📚 Загрузка курсов с API...');
        const courses = await apiRequest('/api/courses', 'GET');
        console.log(`✅ Загружено курсов: ${courses?.length || 0}`);
        return courses || [];
    } catch (error) {
        console.error('Ошибка получения курсов:', error);
        // Если на GitHub Pages и произошла ошибка CORS, покажем сообщение
        const env = getEnvironment();
        if (env.isGitHubPages) {
            showNotification('На GitHub Pages API недоступен из-за CORS. Запустите локально.', 'warning');
        }
        return [];
    }
}

/**
 * Получить список репетиторов
 */
async function getTutors() {
    try {
        console.log('👨‍🏫 Загрузка репетиторов с API...');
        const tutors = await apiRequest('/api/tutors', 'GET');
        console.log(`✅ Загружено репетиторов: ${tutors?.length || 0}`);
        return tutors || [];
    } catch (error) {
        console.error('Ошибка получения репетиторов:', error);
        return [];
    }
}

/**
 * Получить список заявок пользователя
 */
async function getOrders() {
    try {
        console.log('📋 Загрузка заявок с API...');
        return await apiRequest('/api/orders', 'GET');
    } catch (error) {
        console.error('Ошибка получения заявок:', error);
        return [];
    }
}

/**
 * Создать новую заявку
 */
async function createOrder(orderData) {
    try {
        console.log('📝 Создание заявки:', orderData);
        return await apiRequest('/api/orders', 'POST', orderData);
    } catch (error) {
        console.error('Ошибка создания заявки:', error);
        throw error;
    }
}

/**
 * Обновить существующую заявку
 */
async function updateOrder(orderId, orderData) {
    try {
        console.log(`✏️ Обновление заявки ${orderId}:`, orderData);
        return await apiRequest(`/api/orders/${orderId}`, 'PUT', orderData);
    } catch (error) {
        console.error('Ошибка обновления заявки:', error);
        throw error;
    }
}

/**
 * Удалить заявку
 */
async function deleteOrder(orderId) {
    try {
        console.log(`🗑️ Удаление заявки ${orderId}`);
        return await apiRequest(`/api/orders/${orderId}`, 'DELETE');
    } catch (error) {
        console.error('Ошибка удаления заявки:', error);
        throw error;
    }
}

/**
 * Получить информацию о конкретном курсе
 */
async function getCourseById(courseId) {
    try {
        console.log(`📘 Загрузка курса ${courseId} с API...`);
        return await apiRequest(`/api/courses/${courseId}`, 'GET');
    } catch (error) {
        console.error(`Ошибка получения курса ${courseId}:`, error);
        return null;
    }
}

/**
 * Получить информацию о конкретном репетиторе
 */
async function getTutorById(tutorId) {
    try {
        console.log(`👤 Загрузка репетитора ${tutorId} с API...`);
        return await apiRequest(`/api/tutors/${tutorId}`, 'GET');
    } catch (error) {
        console.error(`Ошибка получения репетитора ${tutorId}:`, error);
        return null;
    }
}

/**
 * Получить информацию о конкретной заявке
 */
async function getOrderById(orderId) {
    try {
        console.log(`📄 Загрузка заявки ${orderId} с API...`);
        return await apiRequest(`/api/orders/${orderId}`, 'GET');
    } catch (error) {
        console.error(`Ошибка получения заявки ${orderId}:`, error);
        return null;
    }
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