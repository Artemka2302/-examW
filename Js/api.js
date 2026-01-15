// ========== API КОНФИГУРАЦИЯ ==========

const API_BASE_URL = 'http://exam-api-courses.std-900.ist.mospolytech.ru';
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
    
    return `${API_BASE_URL}${normalizedEndpoint}?api_key=${API_KEY}`;
}

/**
 * JSONP запрос (обход CORS для GitHub Pages)
 * @param {string} url - URL для запроса
 * @returns {Promise} Promise с результатом
 */
function jsonpRequest(url) {
    return new Promise((resolve, reject) => {
        // Создаем уникальное имя для callback
        const callbackName = `jsonp_callback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Добавляем callback в window
        window[callbackName] = function(data) {
            // Очищаем
            delete window[callbackName];
            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
            
            console.log(`✅ JSONP ответ получен для: ${url}`);
            
            // Проверяем наличие ошибки в ответе
            if (data && data.error) {
                reject(new Error(data.error));
            } else {
                resolve(data);
            }
        };
        
        // Добавляем параметр callback в URL
        const jsonpUrl = url + (url.includes('?') ? '&' : '?') + 
                        `callback=${callbackName}&_=${Date.now()}`;
        
        // Создаем script тег
        const script = document.createElement('script');
        script.src = jsonpUrl;
        script.type = 'text/javascript';
        
        // Обработчик ошибок
        script.onerror = function() {
            delete window[callbackName];
            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
            reject(new Error(`JSONP запрос не удался: ${url}`));
        };
        
        // Таймаут
        setTimeout(() => {
            if (window[callbackName]) {
                delete window[callbackName];
                if (script.parentNode) {
                    script.parentNode.removeChild(script);
                }
                reject(new Error('JSONP таймаут'));
            }
        }, 10000); // 10 секунд таймаут
        
        // Добавляем script в DOM
        document.head.appendChild(script);
        
        console.log(`🔧 JSONP запрос: ${jsonpUrl.substring(0, 100)}...`);
    });
}

/**
 * Универсальный запрос к API (использует fetch или JSONP)
 * @param {string} endpoint - Конечная точка API
 * @param {string} method - HTTP метод (GET, POST, PUT, DELETE)
 * @param {Object} data - Данные для отправки
 * @returns {Promise} Promise с результатом
 */
async function universalApiRequest(endpoint, method = 'GET', data = null) {
    const isGitHubPages = window.location.hostname.includes('github.io');
    const isLocalhost = window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1';
    
    // Для GET запросов на GitHub Pages пробуем JSONP
    if (method === 'GET' && isGitHubPages && !isLocalhost) {
        try {
            console.log(`🌐 GitHub Pages: пытаемся JSONP для ${endpoint}`);
            const url = getApiUrl(endpoint);
            const result = await jsonpRequest(url);
            return result;
        } catch (jsonpError) {
            console.warn(`JSONP не сработал для ${endpoint}:`, jsonpError);
            // Пробуем fetch с тестовыми данными как запасной вариант
            return getFallbackData(endpoint);
        }
    }
    
    // Для остальных случаев используем обычный fetch
    return apiRequest(endpoint, method, data);
}

/**
 * Обычный fetch запрос к API
 */
async function apiRequest(endpoint, method = 'GET', data = null) {
    const url = getApiUrl(endpoint);
    
    if (!url) {
        throw new Error('Не удалось создать URL запроса');
    }
    
    console.log(`API ${method} запрос: ${endpoint}`);
    
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(url, options);
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const result = await response.json();
        console.log(`✅ API ответ от ${endpoint}:`, result);
        return result;
    } catch (error) {
        console.error('❌ Ошибка API запроса:', error);
        
        // Если на GitHub Pages и fetch не сработал, возвращаем тестовые данные
        const isGitHubPages = window.location.hostname.includes('github.io');
        if (isGitHubPages && method === 'GET') {
            console.log('🔄 Возвращаем тестовые данные для GitHub Pages');
            return getFallbackData(endpoint);
        }
        
        showNotification(`Ошибка API: ${error.message}`, 'danger');
        throw error;
    }
}

/**
 * Возвращает тестовые данные для GitHub Pages
 */
function getFallbackData(endpoint) {
    console.log(`📦 Используем тестовые данные для: ${endpoint}`);
    
    if (endpoint === '/api/courses' || endpoint === 'api/courses') {
        return TEST_COURSES;
    }
    
    if (endpoint === '/api/tutors' || endpoint === 'api/tutors') {
        return TEST_TUTORS;
    }
    
    if (endpoint.includes('/api/orders')) {
        // Для заявок возвращаем пустой массив или тестовые данные
        return [];
    }
    
    // Для конкретного курса/репетитора
    if (endpoint.includes('/api/courses/')) {
        const id = parseInt(endpoint.split('/').pop());
        return TEST_COURSES.find(course => course.id === id) || null;
    }
    
    if (endpoint.includes('/api/tutors/')) {
        const id = parseInt(endpoint.split('/').pop());
        return TEST_TUTORS.find(tutor => tutor.id === id) || null;
    }
    
    return [];
}

// ========== ТЕСТОВЫЕ ДАННЫЕ ==========

const TEST_COURSES = [
    {
        "id": 1,
        "name": "Introduction to Russian language",
        "description": "A beginner course on Russian language learning.",
        "teacher": "Viktor Sergeevich",
        "level": "Beginner",
        "total_length": 8,
        "week_length": 2,
        "start_dates": [
            "2024-03-01T09:00:00",
            "2024-04-01T09:00:00",
            "2024-05-01T09:00:00"
        ],
        "course_fee_per_hour": 200,
        "created_at": "2024-01-05T17:30:00"
    },
    {
        "id": 2,
        "name": "Advanced Spanish for Professionals",
        "description": "Advanced Spanish course for business professionals.",
        "teacher": "Luisa Martinez",
        "level": "Advanced",
        "total_length": 12,
        "week_length": 3,
        "start_dates": [
            "2024-03-15T18:00:00",
            "2024-04-15T18:00:00"
        ],
        "course_fee_per_hour": 300,
        "created_at": "2024-01-10T10:15:00"
    },
    {
        "id": 3,
        "name": "French Conversation for Beginners",
        "description": "Learn basic French conversation skills.",
        "teacher": "Pierre Dupont",
        "level": "Beginner",
        "total_length": 10,
        "week_length": 2,
        "start_dates": [
            "2024-02-20T17:00:00",
            "2024-03-20T17:00:00"
        ],
        "course_fee_per_hour": 250,
        "created_at": "2024-01-12T14:45:00"
    },
    {
        "id": 4,
        "name": "Japanese Language and Culture",
        "description": "Comprehensive Japanese language and cultural studies.",
        "teacher": "Akiko Tanaka",
        "level": "Intermediate",
        "total_length": 16,
        "week_length": 3,
        "start_dates": [
            "2024-04-01T10:00:00"
        ],
        "course_fee_per_hour": 350,
        "created_at": "2024-01-18T11:30:00"
    },
    {
        "id": 5,
        "name": "Italian Culinary Language Course",
        "description": "Learn Italian through culinary vocabulary and culture.",
        "teacher": "Marco Rossi",
        "level": "Beginner",
        "total_length": 8,
        "week_length": 2,
        "start_dates": [
            "2024-03-10T15:00:00",
            "2024-04-10T15:00:00"
        ],
        "course_fee_per_hour": 280,
        "created_at": "2024-01-20T16:20:00"
    }
];

const TEST_TUTORS = [
    {
        "id": 1,
        "name": "Irina Petrovna",
        "work_experience": 5,
        "languages_spoken": ["English", "Spanish", "Russian"],
        "languages_offered": ["Russian", "English"],
        "language_level": "Advanced",
        "price_per_hour": 500
    },
    {
        "id": 2,
        "name": "Viktor Sergeevich",
        "work_experience": 8,
        "languages_spoken": ["Russian", "English", "German"],
        "languages_offered": ["Russian", "English"],
        "language_level": "Advanced",
        "price_per_hour": 600
    },
    {
        "id": 3,
        "name": "Luisa Martinez",
        "work_experience": 6,
        "languages_spoken": ["Spanish", "English", "French"],
        "languages_offered": ["Spanish", "English"],
        "language_level": "Advanced",
        "price_per_hour": 550
    },
    {
        "id": 4,
        "name": "Pierre Dupont",
        "work_experience": 4,
        "languages_spoken": ["French", "English"],
        "languages_offered": ["French"],
        "language_level": "Intermediate",
        "price_per_hour": 450
    },
    {
        "id": 5,
        "name": "Akiko Tanaka",
        "work_experience": 7,
        "languages_spoken": ["Japanese", "English"],
        "languages_offered": ["Japanese"],
        "language_level": "Advanced",
        "price_per_hour": 650
    },
    {
        "id": 6,
        "name": "Marco Rossi",
        "work_experience": 3,
        "languages_spoken": ["Italian", "English"],
        "languages_offered": ["Italian"],
        "language_level": "Intermediate",
        "price_per_hour": 400
    }
];

// ========== API ФУНКЦИИ ==========

/**
 * Получить список курсов
 */
async function getCourses() {
    try {
        const courses = await universalApiRequest('/api/courses', 'GET');
        console.log(`📚 Получено курсов: ${courses?.length || 0}`);
        return courses || [];
    } catch (error) {
        console.error('Ошибка получения курсов:', error);
        return TEST_COURSES; // Возвращаем тестовые данные
    }
}

/**
 * Получить список репетиторов
 */
async function getTutors() {
    try {
        const tutors = await universalApiRequest('/api/tutors', 'GET');
        console.log(`👨‍🏫 Получено репетиторов: ${tutors?.length || 0}`);
        return tutors || [];
    } catch (error) {
        console.error('Ошибка получения репетиторов:', error);
        return TEST_TUTORS; // Возвращаем тестовые данные
    }
}

/**
 * Получить список заявок пользователя
 */
async function getOrders() {
    try {
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
    return await apiRequest('/api/orders', 'POST', orderData);
}

/**
 * Обновить существующую заявку
 */
async function updateOrder(orderId, orderData) {
    return await apiRequest(`/api/orders/${orderId}`, 'PUT', orderData);
}

/**
 * Удалить заявку
 */
async function deleteOrder(orderId) {
    return await apiRequest(`/api/orders/${orderId}`, 'DELETE');
}

/**
 * Получить информацию о конкретном курсе
 */
async function getCourseById(courseId) {
    try {
        return await universalApiRequest(`/api/courses/${courseId}`, 'GET');
    } catch (error) {
        console.error(`Ошибка получения курса ${courseId}:`, error);
        return TEST_COURSES.find(course => course.id === courseId) || null;
    }
}

/**
 * Получить информацию о конкретном репетиторе
 */
async function getTutorById(tutorId) {
    try {
        return await universalApiRequest(`/api/tutors/${tutorId}`, 'GET');
    } catch (error) {
        console.error(`Ошибка получения репетитора ${tutorId}:`, error);
        return TEST_TUTORS.find(tutor => tutor.id === tutorId) || null;
    }
}

/**
 * Получить информацию о конкретной заявке
 */
async function getOrderById(orderId) {
    try {
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
window.universalApiRequest = universalApiRequest;
window.jsonpRequest = jsonpRequest;
window.getApiUrl = getApiUrl;
window.setApiKey = setApiKey;
window.loadApiKey = loadApiKey;