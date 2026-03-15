// Ждем загрузки DOM
document.addEventListener('DOMContentLoaded', function() {
    
    // === ПЛАВНАЯ ПРОКРУТКА ДЛЯ ЯКОРЕЙ ===
    const anchors = document.querySelectorAll('a[href^="#"]:not([href="#"])');
    
    anchors.forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // === МОБИЛЬНОЕ МЕНЮ ===
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navList = document.getElementById('navList');
    
    if (mobileMenuBtn && navList) {
        // Открытие/закрытие меню
        mobileMenuBtn.addEventListener('click', function() {
            navList.classList.toggle('active');
            const isExpanded = navList.classList.contains('active');
            this.setAttribute('aria-expanded', isExpanded);
            
            // Блокировка прокрутки при открытом меню
            document.body.style.overflow = isExpanded ? 'hidden' : '';
        });
        
        // Закрытие меню при клике на ссылку
        const menuLinks = navList.querySelectorAll('a');
        menuLinks.forEach(link => {
            link.addEventListener('click', function() {
                navList.classList.remove('active');
                mobileMenuBtn.setAttribute('aria-expanded', 'false');
                document.body.style.overflow = '';
            });
        });
        
        // Закрытие меню при клике вне его
        document.addEventListener('click', function(e) {
            if (navList.classList.contains('active') && 
                !navList.contains(e.target) && 
                !mobileMenuBtn.contains(e.target)) {
                navList.classList.remove('active');
                mobileMenuBtn.setAttribute('aria-expanded', 'false');
                document.body.style.overflow = '';
            }
        });
        
        // Закрытие меню при изменении размера окна
        window.addEventListener('resize', function() {
            if (window.innerWidth > 768 && navList.classList.contains('active')) {
                navList.classList.remove('active');
                mobileMenuBtn.setAttribute('aria-expanded', 'false');
                document.body.style.overflow = '';
            }
        });
    }
    
    // === МОДАЛЬНОЕ ОКНО ТРЕНЕРА ===
    const modalOverlay = document.getElementById('coachModal');
    const openButtons = document.querySelectorAll('#openCoachModal, .coach-details-btn');
    const closeButtons = document.querySelectorAll('#closeCoachModal, #closeModalBtn');
    
    if (modalOverlay) {
        // Функция открытия модального окна
        function openModal() {
            modalOverlay.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            
            // Анимация появления
            setTimeout(() => {
                modalOverlay.style.opacity = '1';
            }, 10);
        }
        
        // Функция закрытия модального окна
        function closeModal() {
            modalOverlay.style.opacity = '0';
            setTimeout(() => {
                modalOverlay.style.display = 'none';
                document.body.style.overflow = '';
            }, 300);
        }
        
        // Открытие по кнопкам
        openButtons.forEach(btn => {
            btn.addEventListener('click', openModal);
        });
        
        // Закрытие по кнопкам
        closeButtons.forEach(btn => {
            btn.addEventListener('click', closeModal);
        });
        
        // Закрытие по клику на фон
        modalOverlay.addEventListener('click', function(e) {
            if (e.target === modalOverlay) {
                closeModal();
            }
        });
        
        // Закрытие по ESC
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && modalOverlay.style.display === 'flex') {
                closeModal();
            }
        });
    }
    
    // === ОПТИМИЗАЦИЯ ДЛЯ МОБИЛЬНЫХ УСТРОЙСТВ ===
    function checkMobileOptimization() {
        if (window.innerWidth <= 768) {
            // Отключаем сложные эффекты на мобильных
            document.body.classList.add('mobile-view');
        } else {
            document.body.classList.remove('mobile-view');
        }
    }
    
    // Проверяем при загрузке
    checkMobileOptimization();
    
    // Проверяем при изменении размера окна
    window.addEventListener('resize', function() {
        checkMobileOptimization();
    });
    
    // === ЛЕНИВАЯ ЗАГРУЗКА ИЗОБРАЖЕНИЙ ===
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    const src = img.getAttribute('data-src');
                    
                    if (src) {
                        img.src = src;
                        img.removeAttribute('data-src');
                    }
                    
                    observer.unobserve(img);
                }
            });
        });
        
        // Находим все изображения с data-src
        const lazyImages = document.querySelectorAll('img[data-src]');
        lazyImages.forEach(img => imageObserver.observe(img));
    }
    
    // === ОБРАБОТКА ОШИБОК ЗАГРУЗКИ ИЗОБРАЖЕНИЙ ===
    const allImages = document.querySelectorAll('img');
    allImages.forEach(img => {
        img.addEventListener('error', function() {
            // Если изображение не загрузилось, показываем заглушку
            if (!this.src.includes('data:image/svg+xml')) {
                this.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MCIgaGVpZ2h0PSI4MCIgdmlld0JveD0iMCAwIDgwIDgwIj48cmVjdCB3aWR0aD0iODAiIGhlaWdodD0iODAiIGZpbGw9IiNlMTFiMWIiLz48dGV4dCB4PSIxMCIgeT0iNDUiIGZpbGw9IiNGRkQ3MDAiIGZvbnQtc2l6ZT0iMjAiIGZvbnQtd2VpZ2h0PSJib2xkIj7QoNGD0YHRjDwvdGV4dD48L3N2Zz4=';
            }
        });
    });
    
    // === АКТИВНЫЙ ПУНКТ МЕНЮ ПРИ ПРОКРУТКЕ ===
    const sections = document.querySelectorAll('section[id], div[id]');
    const navItems = document.querySelectorAll('.nav-list a');
    
    function setActiveMenuItem() {
        let current = '';
        const scrollPosition = window.scrollY + 100;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                current = sectionId;
            }
        });
        
        navItems.forEach(item => {
            item.classList.remove('active');
            const href = item.getAttribute('href');
            if (href === `#${current}`) {
                item.classList.add('active');
            }
        });
    }
    
    // Добавляем стиль для активного пункта меню
    const style = document.createElement('style');
    style.textContent = `
        .nav-list a.active {
            color: #FFD700 !important;
            background: rgba(255, 255, 255, 0.15) !important;
        }
        .nav-list a.active::before {
            width: 80% !important;
        }
    `;
    document.head.appendChild(style);
    
    // Следим за прокруткой
    window.addEventListener('scroll', function() {
        requestAnimationFrame(setActiveMenuItem);
    });
    
    // Вызываем один раз при загрузке
    setActiveMenuItem();
    
    // === ОПТИМИЗИРОВАННАЯ ЗАГРУЗКА ФОНА ШАПКИ ===
    if (window.innerWidth > 768) {
        // Проверяем, поддерживает ли браузер WebP
        const header = document.querySelector('.header');
        if (header) {
            const canvas = document.createElement('canvas');
            if (canvas.toDataURL('image/webp').indexOf('image/webp') === 5) {
                // Браузер поддерживает WebP, оставляем как есть
            } else {
                // Браузер не поддерживает WebP, меняем на JPEG
                header.style.backgroundImage = "url('/images/football-stadium.jpg')";
            }
        }
    }
    
    // === ПРОГРЕСС-БАР ПРОКРУТКИ (ОПЦИОНАЛЬНО) ===
    function createScrollProgressBar() {
        const progressBar = document.createElement('div');
        progressBar.className = 'scroll-progress';
        progressBar.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 0%;
            height: 3px;
            background: linear-gradient(90deg, #FFD700, #e11b1b);
            z-index: 1001;
            transition: width 0.1s ease;
        `;
        document.body.appendChild(progressBar);
        
        window.addEventListener('scroll', function() {
            const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
            const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = (winScroll / height) * 100;
            progressBar.style.width = scrolled + '%';
        });
    }
    
    // Раскомментируйте, если нужен прогресс-бар
    // createScrollProgressBar();
});

// === ДОПОЛНИТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ ПРОИЗВОДИТЕЛЬНОСТИ ===

// Функция debounce для оптимизации событий
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Оптимизированный обработчик ресайза
window.addEventListener('resize', debounce(function() {
    // Обновляем состояние при изменении размера окна
    if (window.innerWidth > 768) {
        const navList = document.getElementById('navList');
        if (navList && navList.classList.contains('active')) {
            navList.classList.remove('active');
            document.body.style.overflow = '';
        }
    }
}, 150));

// Кэширование DOM-элементов для производительности
const domCache = {
    header: null,
    navList: null,
    mobileMenuBtn: null
};

function getCachedElement(selector, key) {
    if (!domCache[key]) {
        domCache[key] = document.querySelector(selector);
    }
    return domCache[key];
}

// Использование:
// const header = getCachedElement('.header', 'header');

// === НОВАЯ ЛОГИКА ДЛЯ ШАПКИ: скрытие при скролле вниз, появление при скролле вверх ===
let lastScrollTop = 0;
const header = document.querySelector('.header');
let scrollTimeout;

window.addEventListener('scroll', function() {
    let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    // Добавляем/убираем эффект тени
    if (scrollTop > 50) {
        header.classList.add('header-scrolled');
    } else {
        header.classList.remove('header-scrolled');
    }
    
    // Определяем направление скролла
    if (scrollTop > lastScrollTop && scrollTop > 100) {
        // Скролл вниз - прячем шапку
        header.classList.add('header-hidden');
    } else if (scrollTop < lastScrollTop) {
        // Скролл вверх - показываем шапку
        header.classList.remove('header-hidden');
    }
    
    // Если мы в самом верху страницы, всегда показываем шапку
    if (scrollTop <= 10) {
        header.classList.remove('header-hidden');
    }
    
    lastScrollTop = scrollTop;
    
    // Очищаем предыдущий таймаут
    clearTimeout(scrollTimeout);
    
    // Если скролл остановился и мы не вверху страницы, показываем шапку через небольшую задержку
    scrollTimeout = setTimeout(function() {
        if (scrollTop > 100) {
            header.classList.remove('header-hidden');
        }
    }, 150);
});

// Улучшенная работа стрелок навигации
document.addEventListener('DOMContentLoaded', function() {
    const scrollUpBtn = document.querySelector('.scroll-up');
    const scrollDownBtn = document.querySelector('.scroll-down');
    
    // Плавная прокрутка для стрелок
    if (scrollUpBtn) {
        scrollUpBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
    
    if (scrollDownBtn) {
        scrollDownBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const footer = document.querySelector('#footer-bottom');
            if (footer) {
                footer.scrollIntoView({
                    behavior: 'smooth',
                    block: 'end'
                });
            }
        });
    }
    
    // Показываем/скрываем стрелки в зависимости от положения прокрутки
    window.addEventListener('scroll', function() {
        const scrollPosition = window.scrollY;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        
        // Показываем стрелку вверх, если не в самом верху
        if (scrollPosition > 300) {
            scrollUpBtn.style.opacity = '0.9';
            scrollUpBtn.style.pointerEvents = 'auto';
        } else {
            scrollUpBtn.style.opacity = '0.9'; // Всегда видима
            scrollUpBtn.style.pointerEvents = 'auto';
        }
        
        // Показываем стрелку вниз, если не в самом низу
        if (scrollPosition < documentHeight - windowHeight - 100) {
            scrollDownBtn.style.opacity = '0.9';
            scrollDownBtn.style.pointerEvents = 'auto';
        } else {
            scrollDownBtn.style.opacity = '0.9'; // Всегда видима
            scrollDownBtn.style.pointerEvents = 'auto';
        }
    });
    
    // Принудительно показываем кнопки при загрузке
    scrollUpBtn.style.opacity = '0.9';
    scrollDownBtn.style.opacity = '0.9';
});