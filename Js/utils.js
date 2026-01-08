// ========== УТИЛИТНЫЕ ФУНКЦИИ ==========

// ... предыдущие функции остаются ...

/**
 * Показывает уведомление пользователю
 * @param {string} message - Текст сообщения
 * @param {string} type - Тип (success, danger, warning, info)
 * @param {number} duration - Длительность показа в миллисекундах
 */
function showNotification(message, type = 'info', duration = 5000) {
    // Создаем область для уведомлений, если её нет
    let notificationArea = document.getElementById('notification-area');
    
    if (!notificationArea) {
        notificationArea = document.createElement('div');
        notificationArea.id = 'notification-area';
        notificationArea.className = 'position-fixed top-0 end-0 p-3';
        notificationArea.style.cssText = 'z-index: 1060; max-width: 350px;';
        document.body.appendChild(notificationArea);
    }
    
    // Создаем уведомление
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show`;
    notification.style.cssText = 'min-width: 300px; margin-bottom: 10px;';
    
    // Иконка в зависимости от типа
    let icon = '';
    switch(type) {
        case 'success':
            icon = 'bi-check-circle-fill';
            break;
        case 'danger':
            icon = 'bi-exclamation-circle-fill';
            break;
        case 'warning':
            icon = 'bi-exclamation-triangle-fill';
            break;
        case 'info':
        default:
            icon = 'bi-info-circle-fill';
    }
    
    notification.innerHTML = `
        <i class="bi ${icon} me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // Добавляем в область уведомлений
    notificationArea.appendChild(notification);
    
    // Автоматическое скрытие через заданное время
    if (duration > 0) {
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, duration);
    }
    
    return notification;
}

/**
 * Проверяет доступность API
 */
async function checkApiAvailability() {
    try {
        const courses = await getCourses();
        if (Array.isArray(courses)) {
            showNotification('API подключен успешно', 'success', 3000);
            return true;
        }
    } catch (error) {
        console.warn('API недоступен:', error);
        showNotification('API временно недоступен', 'warning', 5000);
        return false;
    }
}