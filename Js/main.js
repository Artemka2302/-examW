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
    
    // Настраиваем плавный скролл для якорных ссылок
    setupSmoothScroll();
    
    // Инициализируем модуль курсов
    await initCourses();
    
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

/**
 * Настраивает плавный скролл для якорных ссылок
 */
function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            
            // Пропускаем ссылки без якоря или на другую страницу
            if (href === '#' || href.startsWith('#!')) {
                return;
            }
            
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                
                // Вычисляем положение с учетом фиксированной шапки
                const headerHeight = document.querySelector('header')?.offsetHeight || 80;
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
                
                // Обновляем активное состояние в навигации (если нужно)
                updateActiveNavLink(href);
            }
        });
    });
}

/**
 * Обновляет активное состояние в навигации
 */
function updateActiveNavLink(href) {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === href) {
            link.classList.add('active');
        }
    });
}