// ========== ГЛАВНАЯ СТРАНИЦА ==========

// Загружаем API ключ при старте
loadApiKey();

/**
 * Инициализация страницы
 */
async function initPage() {
    console.log('Инициализация главной страницы...');
    
    // Проверяем доступность API
    setTimeout(() => {
        checkApiAvailability();
    }, 1000);
    
    // Инициализируем tooltip'ы Bootstrap
    initTooltips();
    
    // Здесь будем загружать курсы, репетиторов и т.д.
    console.log('Страница готова к работе');
}

/**
 * Инициализирует Bootstrap tooltip'ы
 */
function initTooltips() {
    const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    if (tooltips.length > 0) {
        tooltips.forEach(tooltip => {
            new bootstrap.Tooltip(tooltip);
        });
    }
}

// Запускаем инициализацию когда DOM загружен
document.addEventListener('DOMContentLoaded', initPage);