// МИНИМАЛЬНЫЙ ТЕСТ
console.log('=== МИНИМАЛЬНЫЙ ТЕСТ ===');

// 1. Проверяем загрузку DOM
console.log('DOM загружен?', document.readyState);

// 2. Проверяем элементы
const container = document.getElementById('coursesContainer');
const loading = document.getElementById('coursesLoading');
console.log('Контейнер:', container);
console.log('Loading:', loading);

// 3. Простой тест создания карточки
setTimeout(async () => {
    console.log('Запускаем тест...');
    
    try {
        const courses = await getCourses();
        console.log('Курсы получены:', courses.length);
        
        if (loading) loading.style.display = 'none';
        
        if (container && courses.length > 0) {
            // Просто добавляем текст
            container.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-success">
                        <h4>Тест успешен!</h4>
                        <p>Загружено ${courses.length} курсов</p>
                        <p>Первый курс: ${courses[0].name}</p>
                    </div>
                </div>
            `;
            container.style.display = 'block';
            console.log('✅ Тест выполнен');
        }
    } catch (error) {
        console.error('Ошибка теста:', error);
    }
}, 1000);