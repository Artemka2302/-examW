// ========== ПРОКСИ ДЛЯ GITHUB PAGES ==========

(function() {
    console.log('🔧 Proxy API для GitHub Pages загружен');
    
    const API_KEY = '32342745-3e72-4fcc-8f7a-a5a0c1703144';
    const API_ENDPOINT = 'http://exam-api-courses.std-900.ist.mospolytech.ru';
    
    // Проверяем, на GitHub Pages ли мы
    const isGitHubPages = window.location.hostname.includes('github.io');
    const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1';
    
    console.log('Среда:', { isGitHubPages, isLocalhost });
    
    // Список CORS прокси (будем пробовать по очереди)
    const CORS_PROXIES = [
        'https://api.allorigins.win/raw?url=',
        'https://corsproxy.io/?',
        'https://cors-anywhere.herokuapp.com/'
    ];
    
    /**
     * Умный запрос к API через прокси если нужно
     */
    async function smartApiRequest(endpoint, method = 'GET', data = null) {
        const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : '/' + endpoint;
        const fullUrl = `${API_ENDPOINT}${normalizedEndpoint}?api_key=${API_KEY}`;
        
        console.log(`API запрос: ${method} ${endpoint}`);
        
        // Если локально, пробуем прямой запрос
        if (isLocalhost) {
            try {
                return await directRequest(fullUrl, method, data);
            } catch (error) {
                console.log('Локальный запрос не удался, пробуем прокси...');
                return await tryProxies(fullUrl, method, data);
            }
        }
        
        // На GitHub Pages сразу используем прокси
        return await tryProxies(fullUrl, method, data);
    }
    
    /**
     * Прямой запрос (для localhost)
     */
    async function directRequest(url, method, data) {
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        if (data && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(data);
        }
        
        const response = await fetch(url, options);
        
        if (!response.ok) {
            throw new Error(`Ошибка ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
    }
    
    /**
     * Пробуем разные прокси по очереди
     */
    async function tryProxies(originalUrl, method, data) {
        let lastError = null;
        
        for (let i = 0; i < CORS_PROXIES.length; i++) {
            const proxy = CORS_PROXIES[i];
            const proxyUrl = proxy + encodeURIComponent(originalUrl);
            
            console.log(`Пробуем прокси ${i + 1}: ${proxy}`);
            
            try {
                const options = {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                };
                
                if (data && (method === 'POST' || method === 'PUT')) {
                    options.body = JSON.stringify(data);
                }
                
                const response = await fetch(proxyUrl, options);
                
                if (!response.ok) {
                    throw new Error(`Прокси ${i + 1}: Ошибка ${response.status}`);
                }
                
                const result = await response.json();
                console.log(`✅ Успех через прокси ${i + 1}`);
                return result;
                
            } catch (error) {
                console.log(`❌ Прокси ${i + 1} не сработал:`, error.message);
                lastError = error;
                continue;
            }
        }
        
        throw new Error(`Все прокси не сработали. Последняя ошибка: ${lastError?.message}`);
    }
    
    // ========== ПЕРЕОПРЕДЕЛЯЕМ ГЛОБАЛЬНЫЕ ФУНКЦИИ ==========
    
    // Сохраняем оригинальные функции если они есть
    const originalFunctions = {
        getCourses: window.getCourses,
        getTutors: window.getTutors,
        getOrders: window.getOrders,
        apiRequest: window.apiRequest
    };
    
    // Переопределяем основные API функции
    window.getCourses = async function() {
        console.log('📚 Получаем курсы через прокси...');
        try {
            const result = await smartApiRequest('/api/courses');
            console.log(`✅ Получено курсов: ${result.length}`);
            return result;
        } catch (error) {
            console.error('❌ Ошибка получения курсов:', error);
            showNotification('Не удалось загрузить курсы', 'warning');
            return [];
        }
    };
    
    window.getTutors = async function() {
        console.log('👨‍🏫 Получаем репетиторов через прокси...');
        try {
            const result = await smartApiRequest('/api/tutors');
            console.log(`✅ Получено репетиторов: ${result.length}`);
            return result;
        } catch (error) {
            console.error('❌ Ошибка получения репетиторов:', error);
            showNotification('Не удалось загрузить репетиторов', 'warning');
            return [];
        }
    };
    
    window.getOrders = async function() {
        console.log('📝 Получаем заявки через прокси...');
        try {
            const result = await smartApiRequest('/api/orders');
            console.log(`✅ Получено заявок: ${result.length}`);
            return result;
        } catch (error) {
            console.error('❌ Ошибка получения заявок:', error);
            showNotification('Не удалось загрузить заявки', 'warning');
            return [];
        }
    };
    
    // Переопределяем apiRequest для работы с заявками
    window.apiRequest = async function(endpoint, method = 'GET', data = null) {
        return await smartApiRequest(endpoint, method, data);
    };
    
    // Обновляем вспомогательные функции
    window.createOrder = async function(orderData) {
        return await smartApiRequest('/api/orders', 'POST', orderData);
    };
    
    window.updateOrder = async function(orderId, orderData) {
        return await smartApiRequest(`/api/orders/${orderId}`, 'PUT', orderData);
    };
    
    window.deleteOrder = async function(orderId) {
        return await smartApiRequest(`/api/orders/${orderId}`, 'DELETE');
    };
    
    console.log('✅ Proxy API настроен');
})();