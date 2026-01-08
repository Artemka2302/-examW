// ========== КОНФИГУРАЦИЯ ПРОЕКТА ==========

// API ключ 
const API_CONFIG = {
    BASE_URL: 'http://exam-api-courses.std-900.ist.mospolytech.ru',
    KEY: '32342745-3e72-4fcc-8f7a-a5a0c1703144'
};

// Экспортируем конфигурацию
if (typeof module !== 'undefined' && module.exports) {
    module.exports = API_CONFIG;
}