// ========== ГЛАВНАЯ СТРАНИЦА ==========

// Загружаем API ключ при старте
loadApiKey();

/**
 * Инициализация страницы
 */
async function initPage() {
    console.log('🚀 Инициализация страницы начата');
    
    // Проверяем доступность API
    checkApiAvailability();
    
    // Инициализируем tooltip'ы Bootstrap
    initTooltips();
    
    // Настраиваем плавный скролл для якорных ссылок
    setupSmoothScroll();
    
    console.log('🔍 Вызываем initCourses()');
    
    // Инициализируем модуль курсов
    if (typeof initCourses === 'function') {
        await initCourses();
        console.log('✅ Курсы инициализированы');
    } else {
        console.error('❌ Функция initCourses не найдена!');
    }
    
    console.log('🔍 Вызываем initTutors()');
    
    // Инициализируем модуль репетиторов
    if (typeof initTutors === 'function') {
        await initTutors();
        console.log('✅ Репетиторы инициализированы');
    } else {
        console.error('❌ Функция initTutors не найдена!');
    }
    
    console.log('🎉 Страница готова к работе');
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
        console.log(`✅ Инициализировано ${tooltips.length} tooltip'ов`);
    }
}

/**
 * Настраивает плавный скролл для якорных ссылок
 */
function setupSmoothScroll() {
    const anchors = document.querySelectorAll('a[href^="#"]');
    if (anchors.length === 0) return;
    
    anchors.forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            
            // Пропускаем пустые ссылки и ссылки на модальные окна
            if (href === '#' || href.startsWith('#!') || href.includes('modal')) {
                return;
            }
            
            const target = document.querySelector(href);
            if (target && href !== '#') {
                e.preventDefault();
                
                const header = document.querySelector('header');
                const headerHeight = header ? header.offsetHeight : 80;
                
                // Проверяем поддержку smooth scroll
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                
                try {
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                } catch (error) {
                    // Fallback для старых браузеров
                    window.scrollTo(0, targetPosition);
                }
            }
        });
    });
    console.log(`✅ Плавный скролл настроен для ${anchors.length} ссылок`);
}

// Запускаем инициализацию когда DOM загружен
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPage);
} else {
    initPage();
}

// Экспортируем функции для глобального доступа
window.initPage = initPage;
window.initTooltips = initTooltips;