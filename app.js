// Plants vs Zombies Crypto Edition - Main Game Logic

// Game constants
const COLS = 9;
const ROWS = 5;
const CELL_SIZE = 100; // px
const CURRENCY_GENERATION_INTERVAL = 10000; // 10 seconds
const ZOMBIE_SPAWN_INTERVAL = 10000; // 10 seconds
const INITIAL_CURRENCY = 500;
const BULLET_SPEED = 5; // pixels per move
const BULLET_MOVE_INTERVAL = 30; // milliseconds

// Game state
let currency = INITIAL_CURRENCY;
let selectedUnit = null;
let gameActive = false;
let gamePaused = false;
let gameTime = 0;
let zombieCount = 0;
let shovelSelected = false;
let bulletCount = 0;
let zombiePassiveDamageInterval = null; // Интервал для регулярного нанесения урона зомби

// Unit definitions
const UNITS = [
    { 
        name: 'LABUBU', 
        cost: 50, // Цена в соответствии с параметрами
        available: true, 
        cooldown: 7500, // 7.5 seconds
        health: 10,
        damage: 15,
        range: 3,
        sprite: 'plants/ASSDAQ.png'
    },
    { 
        name: 'ALON', 
        cost: 100, // Цена в соответствии с параметрами
        available: true, 
        cooldown: 15000, // 15 seconds
        health: 30,
        damage: 10,
        range: 2,
        sprite: 'plants/Chill_House.png'
    },
    { 
        name: 'HOUSE', 
        cost: 50, // Увеличенная цена из-за высокого HP
        available: true, 
        cooldown: 15000, // 15 seconds - увеличенное время перезарядки
        health: 100, // Высокое здоровье для роли защитника
        damage: 0, // Не наносит урон (не стреляет)
        range: 0, // Нет дальности атаки
        sprite: 'plants/Donald_Glonk.PNG',
        role: 'defender' // Специальная роль
    },
    { 
        name: 'TROLL', 
        cost: 25, // Цена в соответствии с параметрами
        available: true, 
        cooldown: 5000, // 5 seconds
        health: 10,
        damage: 5,
        range: 1,
        sprite: 'plants/pig.PNG'
    },
    // Locked units placeholders
    { name: 'LOCKED1', cost: 0, available: false },
    { name: 'LOCKED2', cost: 0, available: false },
    { name: 'LOCKED3', cost: 0, available: false },
];

// Zombie types
const ZOMBIE_TYPES = [
    {
        name: 'Zombie 1',
        health: 50,
        damage: 5,
        speed: 0.002, // Самый медленный (0.2 / 100)
        sprite: 'zombies/zombie_1.png',
        spawnChance: 0.6, // 60% шанс появления (самый частый)
        maxCount: 12 // Максимум 12 за игру
    },
    {
        name: 'Zombie 2',
        health: 60,
        damage: 7,
        speed: 0.004, // Самый быстрый (0.4 / 100)
        sprite: 'zombies/zombie_2.png',
        spawnChance: 0.3, // 30% шанс появления
        maxCount: 6 // Максимум 6 за игру
    },
    {
        name: 'Zombie 3',
        health: 100,
        damage: 10,
        speed: 0.0025, // Чуть быстрее первого (0.25 / 100)
        sprite: 'zombies/zombie_3.png',
        spawnChance: 0.1, // 10% шанс появления (самый редкий)
        maxCount: 4 // Максимум 4 за игру
    }
];

// Счетчики для отслеживания количества спавна каждого типа зомби
let zombieSpawnCounts = {
    'Zombie 1': 0,
    'Zombie 2': 0,
    'Zombie 3': 0
};

// DOM elements
const currencyDisplay = document.getElementById('currency');
const timerDisplay = document.getElementById('timer');
const losePopup = document.getElementById('lose-popup');
const zombiesContainer = document.getElementById('zombies-container');
const currencyDrops = document.getElementById('currency-drops');
const playButton = document.getElementById('play-btn');
const pauseButton = document.getElementById('pause-btn');
const bulletsContainer = document.getElementById('bullets-container'); // Контейнер для пуль
// Теперь используем body как игровое поле

// Аудио элементы
const backgroundMusic = document.getElementById('background-music');
const startGameAudio = document.getElementById('start-game-audio');
const zombieAudio = document.getElementById('zombie-audio');
const zombieEatAudio = document.getElementById('zombie-eat-audio');

// Переменные для управления звуками
let zombieSoundInterval = null;
let activeZombieEatSounds = {}; // Храним идентификаторы звуков поедания

// Game grid setup - функция модифицирована для работы без grid
function setupGrid() {
    // Создаем виртуальную сетку без отображения
    console.log('Grid setup skipped - grid removed from design');
}

// Unit selection panel setup - функция удалена
function setupUnitPanel() {
    console.log('Unit panel setup skipped - panel removed from design');
}

// Unit selection handler - восстановлена
function onUnitSelect(unitName) {
    if (!gameActive) {
        alert('Игра не запущена. Нажмите Play для начала.');
        return;
    }
    
    if (gamePaused) {
        alert('Игра на паузе. Нажмите Pause для продолжения.');
        return;
    }
    
    // Находим определение юнита по имени
    const unit = UNITS.find(u => u.name === unitName);
    
    if (!unit) {
        console.error('Юнит не найден:', unitName);
        return;
    }
    
    if (!unit.available) {
        alert('Этот юнит недоступен.');
        return;
    }
    
    if (currency < unit.cost) {
        alert('Недостаточно валюты. Нужно: ' + unit.cost);
        return;
    }
    
    // Устанавливаем выбранный юнит (сохраняем только имя юнита)
    selectedUnit = unit.name;
    
    // Добавляем индикатор выбранного юнита
    document.querySelectorAll('.section-unit-image, .section-unit2-image, .section-unit3-image, .section-unit4-image').forEach(img => {
        img.classList.remove('selected');
    });
    
    const sectionImage = document.querySelector(`.section-unit${unitName === 'LABUBU' ? '' : unitName === 'ALON' ? '2' : unitName === 'TROLL' ? '3' : '4'}-image`);
    if (sectionImage) {
        sectionImage.classList.add('selected');
    }
    
    // Обновляем курсор, чтобы показать, что можно размещать юниты
    document.body.style.cursor = 'pointer';
    
    console.log('Выбран юнит:', unit.name);
}

// Shovel tool selection - функция удалена
function onShovelSelect() {
    console.log('Shovel tool selection skipped - tool removed from design');
}

// Обработчик клика по игровому полю для размещения юнитов
function onGameFieldClick(e) {
    // Если игра неактивна или на паузе, игнорируем клик
    if (!gameActive || gamePaused) return;
    
    // Если не выбран юнит, игнорируем
    if (!selectedUnit) return;
    
    // Проверяем, если клик был на квадрате
    const target = e.target;
    
    // Если клик не на квадрате, игнорируем
    if (!target.classList.contains('game-square')) {
        return;
    }
    
    // Получаем индексы строки и колонки из атрибутов квадрата
    const rowIndex = parseInt(target.dataset.row);
    const colIndex = parseInt(target.dataset.col);
    
    // Позиции линий в процентах от высоты экрана
    const lanePositions = [40, 50, 60];
    
    // Проверяем, что строка в допустимом диапазоне
    if (rowIndex < 0 || rowIndex >= lanePositions.length) {
        console.error('Недопустимый индекс строки:', rowIndex);
        return;
    }
    
    // Проверяем, есть ли уже юнит в этом квадрате
    const tokens = document.querySelectorAll('.token');
    for (const token of tokens) {
        const tokenRow = parseInt(token.dataset.row);
        const tokenCol = parseInt(token.dataset.col);
        
        if (tokenRow === rowIndex && tokenCol === colIndex) {
            alert('Здесь уже есть юнит.');
            return;
        }
    }
    
    // Получаем данные выбранного юнита
    const unitData = UNITS.find(unit => unit.name === selectedUnit);
    if (!unitData) {
        console.error(`Неизвестный тип юнита: ${selectedUnit}`);
        return;
    }
    
    // Проверяем, что у нас достаточно валюты
    if (currency < unitData.cost) {
        alert(`Недостаточно валюты! Требуется: ${unitData.cost}`);
        return;
    }
    
    // Вычисляем позицию для размещения юнита
    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;
    const squareSize = 100;
    const leftMargin = 150;
    const availableWidth = windowWidth - leftMargin - 150; // 150 - отступ справа
    const squareSpacing = availableWidth / 9; // 9 квадратов в строке
    
    // Координаты центра квадрата
    const targetX = leftMargin + colIndex * squareSpacing + squareSize / 2;
    const targetY = (lanePositions[rowIndex] / 100) * windowHeight;
    
    // Списываем стоимость юнита
    const oldCurrency = currency;
    currency -= unitData.cost;
    updateCurrency();
    animateCurrencyChange(oldCurrency, currency);
    
    // Размещаем юнит
    const token = placeTokenAtPosition(unitData, targetX, targetY, rowIndex, colIndex);
    
    // Сбрасываем выбранный юнит
    selectedUnit = null;
    document.body.style.cursor = 'default';
    document.querySelectorAll('.section-unit-image').forEach(img => {
        img.classList.remove('selected');
    });
    
    // Делаем квадрат некликабельным
    target.style.pointerEvents = 'none';
}

// Проверка наличия токена в указанной позиции
function checkTokenAtPosition(x, y) {
    // Получаем все токены
    const tokens = document.querySelectorAll('.token');
    
    // Определяем позицию квадрата и линии
    const squareSize = 100;
    const minLeftPosition = 50; // Синхронизируем со значением в других функциях
    
    // Находим ближайшую линию
    const plantRows = window.gameLanes || [25, 35, 45, 55, 65];
    const windowHeight = window.innerHeight;
    
    let closestRow = -1;
    let minDistance = Infinity;
    
    for (let i = 0; i < plantRows.length; i++) {
        const rowPosition = plantRows[i] / 100 * windowHeight;
        const distance = Math.abs(y - rowPosition);
        
        if (distance < minDistance) {
            minDistance = distance;
            closestRow = i;
        }
    }
    
    // Находим индекс квадрата
    const relativeX = x - minLeftPosition;
    const squareIndex = Math.floor(relativeX / squareSize);
    
    // Проверяем, есть ли уже токен в этом квадрате и на этой линии
    for (const token of tokens) {
        // Проверяем по атрибутам токена
        const tokenRow = parseInt(token.dataset.row);
        const tokenSquare = parseInt(token.dataset.col) || parseInt(token.dataset.squareIndex);
        
        if (tokenRow === closestRow && tokenSquare === squareIndex) {
            return token;
        }
    }
    
    return null;
}

// Размещение юнита в указанной позиции
function placeTokenAtPosition(unit, x, y, rowIndex, squareIndex) {
    // Создаем элемент токена
    const token = document.createElement('div');
    token.className = 'token';
    token.dataset.type = unit.name;
    token.dataset.health = unit.health;
    token.dataset.maxHealth = unit.health;
    token.dataset.damage = unit.damage;
    token.dataset.range = unit.range;
    token.dataset.row = rowIndex; // Сохраняем номер линии
    token.dataset.squareIndex = squareIndex; // Сохраняем номер квадрата
    token.dataset.col = squareIndex; // Дублируем для совместимости
    token.id = `token-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Создаем изображение токена
    const tokenImg = document.createElement('img');
    switch(unit.name) {
        case 'LABUBU':
            tokenImg.src = 'assets/plants/ASSDAQ.png';
            break;
        case 'ALON':
            tokenImg.src = 'assets/plants/Chill_House.png';
            break;
        case 'TROLL':
            tokenImg.src = 'assets/plants/pig.PNG';
            break;
        case 'HOUSE':
            tokenImg.src = 'assets/plants/Donald_Glonk.PNG';
            break;
        default:
            tokenImg.src = `assets/${unit.sprite}`;
    }
    tokenImg.alt = unit.name;
    tokenImg.width = 100;
    token.appendChild(tokenImg);
    
    // Индикатор здоровья
    const healthBar = document.createElement('div');
    healthBar.className = 'token-health';
    healthBar.innerHTML = `<div class="health-bar" style="width: 100%"></div>`;
    token.appendChild(healthBar);
    
    // Позиционируем токен
    token.style.position = 'absolute';
    token.style.left = `${x - 50}px`; // Центрируем по горизонтали
    token.style.top = `${y - 50}px`; // Центрируем по вертикали
    token.style.zIndex = '40';
    
    // Добавляем анимацию появления
    token.classList.add('placing');
    setTimeout(() => token.classList.remove('placing'), 500);
    
    // Добавляем токен на игровое поле
    document.body.appendChild(token);
    
    // Добавляем периодическую анимацию для токена
    setInterval(() => {
        if (token.parentNode && gameActive && !gamePaused) {
            // Случайная небольшая анимация
            if (Math.random() > 0.7) {
                token.classList.add('token-action');
                setTimeout(() => token.classList.remove('token-action'), 300);
            }
        }
    }, 2000 + Math.random() * 3000); // Случайный интервал для разнообразия
    
    return token;
}

// Анимация изменения валюты
function animateCurrencyChange(oldValue, newValue) {
    const difference = newValue - oldValue;
    const indicator = document.createElement('div');
    indicator.className = 'currency-change';
    indicator.textContent = difference > 0 ? `+${difference}` : `${difference}`;
    indicator.style.color = difference > 0 ? '#4CAF50' : '#FF5252';
    
    // Добавляем рядом с индикатором валюты
    currencyDisplay.parentNode.appendChild(indicator);
    
    // Анимация и удаление
    setTimeout(() => {
        if (indicator.parentNode) {
            indicator.parentNode.removeChild(indicator);
        }
    }, 1000);
}

// Place a token on the game field (now the background)
function placeToken(unit, position) {
    // Создаем элемент токена
    const token = document.createElement('div');
    token.className = 'token';
    token.dataset.type = unit.name;
    token.dataset.health = unit.health;
    token.dataset.damage = unit.damage;
    token.dataset.range = unit.range;
    
    // Добавляем внутренние элементы
    
    // Изображение токена
    const tokenImage = document.createElement('div');
    tokenImage.className = 'token-image';
    
    // Используем спрайт, если доступен
    if (unit.sprite) {
        tokenImage.style.backgroundImage = `url('assets/${unit.sprite}')`;
    } else {
        tokenImage.textContent = unit.name.charAt(0);
    }
    token.appendChild(tokenImage);
    
    // Индикатор здоровья (опционально)
    const healthBar = document.createElement('div');
    healthBar.className = 'token-health';
    healthBar.innerHTML = `<div class="health-bar" style="width: 100%"></div>`;
    token.appendChild(healthBar);
    
    // Добавляем анимацию появления
    token.classList.add('placing');
    setTimeout(() => token.classList.remove('placing'), 500);
    
    // Добавляем токен на игровое поле (теперь это body)
    document.body.appendChild(token);
    
    // Добавляем периодическую анимацию для токена
    setInterval(() => {
        if (token.parentNode && gameActive) {
            // Случайная небольшая анимация
            if (Math.random() > 0.7) {
                token.classList.add('token-action');
                setTimeout(() => token.classList.remove('token-action'), 300);
            }
        }
    }, 2000 + Math.random() * 3000); // Случайный интервал для разнообразия
    
    return token;
}

// Spawn a zombie
function spawnZombie() {
    if (!gameActive) return;
    
    // Выбираем зомби с учетом шанса появления и ограничений по количеству
    let zombieType = null;
    let attempts = 0;
    const maxAttempts = 10; // Предотвращаем бесконечный цикл
    
    while (!zombieType && attempts < maxAttempts) {
        // Выбираем случайный тип зомби на основе шанса появления
        const random = Math.random();
        let cumulativeChance = 0;
        
        for (const type of ZOMBIE_TYPES) {
            cumulativeChance += type.spawnChance;
            
            // Проверяем, не превышен ли лимит для этого типа зомби
            if (random <= cumulativeChance && zombieSpawnCounts[type.name] < type.maxCount) {
                zombieType = type;
                zombieSpawnCounts[type.name]++;
                break;
            }
        }
        
        attempts++; // Увеличиваем счетчик попыток
    }
    
    // Если все типы зомби достигли своего лимита, выбираем случайный
    if (!zombieType) {
        const availableTypes = ZOMBIE_TYPES.filter(type => zombieSpawnCounts[type.name] < type.maxCount);
        if (availableTypes.length > 0) {
            zombieType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
        } else {
            return; // Все зомби достигли своего лимита, не спавним новых
        }
    }
    
    // Увеличиваем счетчик этого типа зомби
    zombieSpawnCounts[zombieType.name]++;
    
    // Создаем 3 фиксированные линии для движения зомби
    // Линии расположены ближе к центру экрана
    const zombieRows = [
        40, // Первая линия - верхняя дорожка (ближе к центру)
        50, // Вторая линия - средняя дорожка (центр)
        60  // Третья линия - нижняя дорожка (ближе к центру)
    ];
    
    // Выбираем случайную линию для спавна зомби
    const randomRowIndex = Math.floor(Math.random() * zombieRows.length);
    const verticalPosition = zombieRows[randomRowIndex];
    
    // Сохраняем номер линии (0-4) для использования в дальнейшем
    const rowIndex = randomRowIndex;
    
    // Создаем элемент зомби
    const zombie = document.createElement('div');
    zombie.className = 'zombie';
    zombie.dataset.type = zombieType.name;
    zombie.dataset.health = zombieType.health;
    zombie.dataset.damage = zombieType.damage;
    zombie.dataset.speed = zombieType.speed;
    zombie.dataset.verticalPosition = verticalPosition;
    zombie.dataset.rowIndex = rowIndex; // Сохраняем индекс линии (0, 1, 2)
    zombie.id = `zombie-${Date.now()}-${Math.floor(Math.random() * 1000)}`; // Уникальный ID
    
    // Создаем изображение зомби
    const zombieImg = document.createElement('img');
    zombieImg.src = `assets/zombies/zombie_${zombieType.name.split(' ')[1]}.png`; // Используем реальные файлы
    zombieImg.alt = zombieType.name;
    zombieImg.width = 120;
    zombie.appendChild(zombieImg);
    
    // Позиционируем зомби за правым краем экрана на соответствующей высоте
    zombie.style.position = 'absolute';
    
    // Рассчитываем точную вертикальную позицию для центрирования по линии
    const windowHeight = window.innerHeight;
    const lanePosition = (verticalPosition / 100) * windowHeight;
    const squareSize = 100;
    
    // Центрируем зомби по вертикали на линии
    zombie.style.top = `${lanePosition - squareSize/2}px`; // Центрируем по вертикали
    zombie.style.right = '0%'; // Начинаем с правого края
    zombie.style.zIndex = '50';
    zombie.dataset.rightPosition = '0'; // Начальная позиция
    zombie.classList.add('zombie-appearing');
    setTimeout(() => zombie.classList.remove('zombie-appearing'), 500);
    
    // Добавляем в контейнер зомби
    zombiesContainer.appendChild(zombie);
    
    // Добавляем индикатор здоровья
    const healthBar = document.createElement('div');
    healthBar.className = 'zombie-health';
    healthBar.innerHTML = `<div class="health-bar" style="width: 100%"></div>`;
    zombie.appendChild(healthBar);
    
    // Запускаем движение зомби
    moveZombie(zombie);
    
    // Логируем текущее состояние спавна зомби
    console.log('Zombie spawn counts:', zombieSpawnCounts);
}

// Move a zombie across the grid
function moveZombie(zombie) {
    if (!gameActive || gamePaused) return;
    
    // Проверяем, атакует ли зомби в данный момент
    if (zombie.dataset.attacking === 'true') {
        // Если зомби атакует, продолжаем атаку
        const attackTarget = document.getElementById(zombie.dataset.attackTarget);
        if (attackTarget && attackTarget.parentNode) {
            // Продолжаем атаку
            attackToken(zombie, attackTarget);
        } else {
            // Цель атаки уничтожена, продолжаем движение
            zombie.dataset.attacking = 'false';
            delete zombie.dataset.attackTarget;
            zombie.classList.remove('attacking');
            zombie.classList.add('walking');
            
            // Проигрываем звук зомби
            playZombieSound();
            
            // Останавливаем звук поедания
            stopZombieEatSound(zombie.id);
            
            // Продолжаем движение в следующем кадре
            requestAnimationFrame(() => moveZombie(zombie));
        }
        return;
    }

    // Получаем текущую позицию и скорость
    const speed = parseFloat(zombie.dataset.speed) * 10; // Замедляем в 10 раз по сравнению с предыдущей скоростью
    
    // Проверяем, что зомби находится на правильной линии
    const rowIndex = parseInt(zombie.dataset.rowIndex);
    const zombieRows = [
        40, // Первая линия - верхняя дорожка
        50, // Вторая линия - средняя дорожка
        60  // Третья линия - нижняя дорожка
    ];
    
    // Вычисляем точную позицию по вертикали
    const windowHeight = window.innerHeight;
    const verticalPosition = zombieRows[rowIndex];
    const lanePosition = (verticalPosition / 100) * windowHeight;
    const squareSize = 100;
    
    // Обновляем вертикальную позицию, чтобы зомби точно шел по линии
    zombie.style.top = `${lanePosition - squareSize/2}px`;
    
    // Если не задана позиция по горизонтали, устанавливаем начальную позицию
    if (!zombie.dataset.rightPosition) {
        zombie.dataset.rightPosition = '0'; // Начинаем с правого края
    }
    
    // Проверяем столкновения с юнитами
    if (checkCollisions(zombie)) {
        // Если есть столкновение, прекращаем движение
        return;
    }
    
    // Движение справа налево - правильное направление
    let rightPosition = parseFloat(zombie.dataset.rightPosition);
    rightPosition += speed; // Увеличиваем позицию (движемся справа налево)
    zombie.dataset.rightPosition = rightPosition;
    
    // Обновляем визуальную позицию в CSS
    // Используем right для движения справа налево
    zombie.style.right = `${rightPosition}%`;
    
    // Проверяем, достиг ли зомби левого края (конец игры)
    if (rightPosition >= 100) {
        gameOver();
        return;
    }
    
    // Продолжаем движение
    requestAnimationFrame(() => moveZombie(zombie));
}

// Функция для проверки столкновений
function checkCollisions(zombie) {
    // Получаем данные зомби
    const zombieRow = parseInt(zombie.dataset.rowIndex);
    const zombiePosition = parseFloat(zombie.dataset.rightPosition);
    
    // Получаем все юниты на игровом поле
    const tokens = document.querySelectorAll('.token');
    
    // Проверяем каждый юнит
    for (const token of tokens) {
        // Проверяем, что юнит находится на той же линии, что и зомби
        const tokenRow = parseInt(token.dataset.row);
        const tokenCol = parseInt(token.dataset.col);
        
        // Проверяем, что зомби и юнит находятся на одной линии
        if (zombieRow === tokenRow) {
            // Рассчитываем позицию юнита в процентах от правого края
            // Меньший номер колонки означает большую правую позицию
            const tokenPosition = 100 - ((tokenCol + 1) * (100 / 9));
            
            // Проверяем, соприкасаются ли зомби и юнит
            const zombieSize = 10; // Размер зомби в процентах от ширины экрана
            const tokenSize = 100 / 9; // Ширина колонки
            
            console.log(`Зомби: позиция ${zombiePosition}, Юнит: позиция ${tokenPosition}, колонка ${tokenCol}`);
            
            if (Math.abs(zombiePosition - tokenPosition) < (zombieSize + tokenSize) / 2) {
                // Столкновение произошло!
                startAttack(zombie, token);
                return true;
            }
        }
    }
    
    return false;
}

// Функция начала атаки зомби на токен
function startAttack(zombie, token) {
    // Проверяем, что зомби ещё не атакует
    if (zombie.dataset.attacking === 'true') return;
    
    console.log('Зомби начал атаку на юнит:', token.dataset.type);
    
    // Получаем id токена
    const tokenId = token.id;
    
    // Помечаем зомби как атакующего
    zombie.dataset.attacking = 'true';
    zombie.dataset.attackTarget = tokenId;
    
    // Удаляем класс движения и добавляем анимацию атаки
    zombie.classList.remove('walking');
    zombie.classList.add('attacking');
    
    // Воспроизводим звук поедания растения
    playZombieEatSound(zombie.id);
    
    // Начинаем атаку с небольшой задержкой
    setTimeout(() => {
        attackToken(zombie, token);
    }, 500); // Задержка для визуального эффекта
}

// Функция атаки зомби на токен
function attackToken(zombie, token) {
    // Проверяем, что игра активна и токен существует
    if (!gameActive || gamePaused || !zombie || !token || !token.parentNode) {
        // Если токена больше нет, зомби продолжает движение
        if (zombie && zombie.parentNode) {
            zombie.dataset.attacking = 'false';
            delete zombie.dataset.attackTarget;
            zombie.classList.remove('attacking');
            zombie.classList.add('walking');
            
            // Продолжаем движение
            requestAnimationFrame(() => moveZombie(zombie));
        }
        return;
    }
    
    // Получаем текущее здоровье токена
    let tokenHealth = parseInt(token.dataset.health) || 0;
    const maxHealth = parseInt(token.dataset.maxHealth) || tokenHealth;
    const zombieDamage = parseInt(zombie.dataset.damage) || 0;
    
    // Наносим урон
    tokenHealth -= zombieDamage;
    token.dataset.health = tokenHealth;
    
    console.log(`Зомби наносит ${zombieDamage} урона юниту ${token.dataset.type}. Осталось здоровья: ${tokenHealth}/${maxHealth}`);
    
    // Обновляем индикатор здоровья
    const healthBar = token.querySelector('.health-bar');
    if (healthBar) {
        const healthPercent = Math.max(0, (tokenHealth / maxHealth) * 100);
        healthBar.style.width = `${healthPercent}%`;
        
        // Добавляем визуальный эффект получения урона
        token.classList.add('taking-damage');
        setTimeout(() => token.classList.remove('taking-damage'), 200);
    }
    
    // Проверяем, уничтожен ли токен
    if (tokenHealth <= 0) {
        // Добавляем анимацию уничтожения
        token.classList.add('destroyed');
        
        console.log(`Юнит ${token.dataset.type} уничтожен!`);
        
        // Удаляем токен после анимации
        setTimeout(() => {
            if (token.parentNode) {
                token.parentNode.removeChild(token);
            }
            
            // Продолжаем движение зомби
            zombie.dataset.attacking = 'false';
            delete zombie.dataset.attackTarget;
            zombie.classList.remove('attacking');
            zombie.classList.add('walking');
            
            // Останавливаем звук поедания
            stopZombieEatSound(zombie.id);
            
            // Продолжаем движение в следующем кадре
            requestAnimationFrame(() => moveZombie(zombie));
        }, 500);
    } else {
        // Продолжаем атаку через некоторое время
        // Используем скорость атаки зомби из данных
        // Случайное время между атаками (1-2 секунды)
        const attackDelay = 1000 + Math.random() * 1000; // От 1 до 2 секунд
        setTimeout(() => {
            // Проверяем, что токен и зомби все еще существуют
            if (token && token.parentNode && zombie && zombie.parentNode) {
                attackToken(zombie, token); // Рекурсивно продолжаем атаку
            }
        }, attackDelay);
    }
}

// Функция для автоматического нанесения урона всем зомби
function applyPassiveDamageToZombies() {
    if (!gameActive || gamePaused) return;
    
    // Получаем всех зомби
    const zombies = document.querySelectorAll('.zombie');
    
    // Если зомби нет, выходим из функции
    if (zombies.length === 0) return;
    
    // Применяем урон к каждому зомби
    zombies.forEach(zombie => {
        if (!zombie || !zombie.parentNode) return;
        
        // Получаем текущее здоровье зомби
        let zombieHP = parseInt(zombie.dataset.hp || zombie.dataset.health || 50);
        
        // Получаем максимальное здоровье
        const zombieType = zombie.dataset.type;
        const maxHealth = parseInt(zombie.dataset.maxHealth || getZombieTypeHealth(zombieType) || 50);
        
        // Уменьшаем HP на 33% от максимального здоровья
        const damageAmount = Math.ceil(maxHealth * 0.33); // 33% от максимального здоровья
        zombieHP -= damageAmount;
        
        // Сохраняем новое значение HP
        zombie.dataset.hp = String(zombieHP);
        
        // Обновляем полоску здоровья
        const healthBar = zombie.querySelector('.health-bar');
        if (healthBar) {
            const zombieType = zombie.dataset.type;
            const maxHealth = getZombieTypeHealth(zombieType);
            const healthPercent = Math.max(0, (zombieHP / maxHealth) * 100);
            healthBar.style.width = healthPercent + '%';
        }
        
        // Если HP зомби <= 0, удаляем его
        if (zombieHP <= 0 && zombie.parentNode) {
            zombie.parentNode.removeChild(zombie);
        }
    });
    
    // После применения урона, останавливаем текущий интервал и создаем новый со случайной задержкой 3-4 секунды
    clearInterval(zombiePassiveDamageInterval);
    const newInterval = Math.floor(Math.random() * (4000 - 3000) + 3000);
    zombiePassiveDamageInterval = setInterval(applyPassiveDamageToZombies, newInterval);
}

// Generate currency over time (like sun in PvZ)
function generateCurrency() {
    if (!gameActive || gamePaused) return;
    
    // Создаем падающую монетку
    const drop = document.createElement('div');
    drop.className = 'currency-drop';
    
    // Случайная позиция на экране
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // Случайная позиция по горизонтали (10-90% ширины экрана)
    const leftPosition = Math.floor(windowWidth * 0.1 + Math.random() * (windowWidth * 0.8));
    
    // Начальная позиция сверху экрана
    const startTop = -80;
    
    // Конечная позиция (20-70% высоты экрана)
    const finalTop = Math.floor(windowHeight * 0.2 + Math.random() * (windowHeight * 0.5));
    
    // Устанавливаем начальную позицию
    drop.style.top = `${startTop}px`;
    drop.style.left = `${leftPosition}px`;
    
    // Добавляем монетку в контейнер
    currencyDrops.appendChild(drop);
    
    // Анимация падения
    setTimeout(() => {
        drop.style.transition = 'top 3s ease-in';
        drop.style.top = `${finalTop}px`;
    }, 50);
    
    // Добавляем обработчик клика для сбора монет
    drop.addEventListener('click', function(event) {
        // Предотвращаем всплытие события
        event.stopPropagation();
        
        // Добавляем ровно $20 валюты при сборе
        const oldCurrency = currency;
        currency += 20;
        updateCurrency();
        animateCurrencyChange(oldCurrency, currency);
        
        // Показываем индикатор +$20 в месте клика
        const indicator = document.createElement('div');
        indicator.className = 'coin-indicator';
        indicator.textContent = '+$20';
        indicator.style.position = 'absolute';
        indicator.style.left = `${event.clientX}px`;
        indicator.style.top = `${event.clientY - 20}px`;
        indicator.style.color = '#FFD700';
        indicator.style.fontWeight = 'bold';
        indicator.style.fontSize = '20px';
        indicator.style.textShadow = '2px 2px 2px rgba(0, 0, 0, 0.7)';
        indicator.style.zIndex = '1000';
        indicator.style.pointerEvents = 'none';
        indicator.style.animation = 'float-up 1s forwards';
        document.body.appendChild(indicator);
        
        // Удаляем индикатор после анимации
        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.parentNode.removeChild(indicator);
            }
        }, 1000);
        
        // Добавляем анимацию сбора монеты
        this.classList.add('collecting');
        
        // Удаляем монету после анимации
        setTimeout(() => {
            if (this.parentNode) {
                this.parentNode.removeChild(this);
            }
        }, 300);
    });
    
    // Добавляем анимацию всплывания +$20
    if (!document.getElementById('coin-animation-style')) {
        const style = document.createElement('style');
        style.id = 'coin-animation-style';
        style.textContent = `
            @keyframes float-up {
                0% { transform: translateY(0); opacity: 1; }
                100% { transform: translateY(-30px); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Автоматическое удаление через 12 секунд, если не собрана
    setTimeout(() => {
        if (drop.parentNode) {
            drop.classList.add('disappearing');
            setTimeout(() => {
                if (drop.parentNode) {
                    drop.parentNode.removeChild(drop);
                }
            }, 500);
        }
    }, 12000);
}

// Update currency display
function updateCurrency() {
    currencyDisplay.textContent = `💰 ${currency}`;
}

// Start game timer
function startTimer() {
    gameTime = 0;
    const timerInterval = setInterval(() => {
        if (!gameActive) {
            clearInterval(timerInterval);
            return;
        }
        
        gameTime++;
        const mins = String(Math.floor(gameTime / 60)).padStart(2, '0');
        const secs = String(gameTime % 60).padStart(2, '0');
        timerDisplay.textContent = `${mins}:${secs}`;
    }, 1000);
}

// Функция воспроизведения звука зомби
function playZombieSound() {
    if (!gameActive || gamePaused) return;
    
    // Воспроизводим звук зомби
    zombieAudio.currentTime = 0;
    zombieAudio.play().catch(error => console.log('Error playing zombie sound:', error));
}

// Функция воспроизведения звука поедания растения
function playZombieEatSound(zombieId) {
    if (!gameActive || gamePaused) return;
    
    // Создаем клон аудио элемента для одновременного воспроизведения
    const eatSound = zombieEatAudio.cloneNode(true);
    eatSound.loop = true; // Зацикливаем звук
    eatSound.volume = 0.7; // Устанавливаем громкость
    
    // Сохраняем ссылку на звук для возможности остановки
    activeZombieEatSounds[zombieId] = eatSound;
    
    // Воспроизводим звук
    eatSound.play().catch(error => console.log('Error playing zombie eat sound:', error));
}

// Функция остановки звука поедания
function stopZombieEatSound(zombieId) {
    if (activeZombieEatSounds[zombieId]) {
        activeZombieEatSounds[zombieId].pause();
        activeZombieEatSounds[zombieId].currentTime = 0;
        delete activeZombieEatSounds[zombieId];
    }
}

// Start the game
function startGame() {
    // Сброс счетчиков зомби при перезапуске
    zombieSpawnCounts = {
        'Zombie 1': 0,
        'Zombie 2': 0,
        'Zombie 3': 0
    };
    
    // Удаляем всех существующих зомби
    document.querySelectorAll('.zombie').forEach(zombie => {
        if (zombie.parentNode) {
            zombie.parentNode.removeChild(zombie);
        }
    });
    
    // Удаляем все существующие пули
    document.querySelectorAll('.bullet').forEach(bullet => {
        if (bullet.parentNode) {
            bullet.parentNode.removeChild(bullet);
        }
    });
    
    // Останавливаем все звуки поедания
    for (const zombieId in activeZombieEatSounds) {
        stopZombieEatSound(zombieId);
    }
    
    // Очищаем интервал звука зомби
    if (zombieSoundInterval) {
        clearInterval(zombieSoundInterval);
    }
    
    gameActive = true;
    gamePaused = false;
    currency = INITIAL_CURRENCY;
    updateCurrency();
    startTimer();
    
    // Воспроизводим звук начала игры
    startGameAudio.currentTime = 0;
    startGameAudio.play().catch(error => console.log('Error playing start game sound:', error));
    
    // Запускаем фоновую музыку
    backgroundMusic.volume = 0.5; // Устанавливаем громкость на 50%
    backgroundMusic.play().catch(error => console.log('Error playing background music:', error));
    
    // Запуск генерации валюты
    const currencyInterval = setInterval(generateCurrency, CURRENCY_GENERATION_INTERVAL);
    
    // Немедленный спаун первого зомби
    spawnZombie();
    
    // Регулярный спаун зомби
    const zombieInterval = setInterval(spawnZombie, ZOMBIE_SPAWN_INTERVAL);
    
    // Запуск механизма стрельбы юнитов
    const shootingInterval = setInterval(tokensShoot, 3000); // Стрельба каждые 3 секунды
    
    // Запуск звука зомби каждые 3 секунды
    zombieSoundInterval = setInterval(playZombieSound, 3000);
    
    // Запуск интервала пассивного урона для зомби
    const initialInterval = Math.floor(Math.random() * (4000 - 3000) + 3000);
    zombiePassiveDamageInterval = setInterval(applyPassiveDamageToZombies, initialInterval);
    
    // Сохраняем интервалы для возможности остановки при завершении игры
    window.gameIntervals = {
        currency: currencyInterval,
        zombie: zombieInterval,
        shooting: shootingInterval,
        zombieSound: zombieSoundInterval
    };
}

// Game over
function gameOver() {
    gameActive = false;
    losePopup.classList.remove('hidden');
    
    // Stop all zombies
    document.querySelectorAll('.zombie').forEach(zombie => {
        zombie.style.animationPlayState = 'paused';
    });
    
    // Stop all intervals
    if (window.gameIntervals) {
        clearInterval(window.gameIntervals.currency);
        clearInterval(window.gameIntervals.zombie);
        clearInterval(window.gameIntervals.shooting);
        clearInterval(window.gameIntervals.zombieSound); // Add this line
    }
    
    // Очистить интервал пассивного урона
    if (zombiePassiveDamageInterval) {
        clearInterval(zombiePassiveDamageInterval);
        zombiePassiveDamageInterval = null;
    }
}

function tokensShoot() {
    if (!gameActive || gamePaused) return;

    const tokens = document.querySelectorAll('.token');
    tokens.forEach(token => {
        const unitData = UNITS.find(u => u.name === token.dataset.type);
        if (!unitData || unitData.damage === 0) { // Skip if no unit data or unit cannot attack (e.g., HOUSE)
            return;
        }

        const lastShot = parseInt(token.dataset.lastShot) || 0;
        const now = Date.now();
        
        let shootInterval = parseInt(token.dataset.shootInterval);
        if (isNaN(shootInterval)) { // If no interval stored, generate one
            shootInterval = 2000 + Math.random() * 1000; // 2-3 seconds
            token.dataset.shootInterval = shootInterval.toString();
        }

        if (now - lastShot >= shootInterval) {
            token.dataset.lastShot = now.toString();
            // Generate a new random interval for the next shot
            token.dataset.shootInterval = (2000 + Math.random() * 1000).toString();
            createBullet(token, unitData.damage);
        }
    });
}

function createBullet(token, damage) {
    const bullet = document.createElement('img');
    bullet.src = 'assets/bullet.PNG';
    bullet.className = 'bullet'; // CSS handles position:absolute and size:20x20
    bullet.dataset.damage = String(damage); // Store damage as string, parse when using

    const tokenRect = token.getBoundingClientRect();
    // Position bullet at the center-right of the token
    bullet.style.top = (tokenRect.top + (tokenRect.height / 2) - 10) + 'px'; // 10 is half of bullet height 20px
    bullet.style.left = tokenRect.right + 'px'; // Start at the right edge of the plant

    // Plants are expected to have 'data-row' set when placed.
    if (token.dataset.row === undefined) {
        console.error("Plant shooting bullet does not have a data-row attribute!", token);
        // Attempt to assign a fallback row or log error, collisions might fail
        // For now, we assume token.dataset.row will be present from plant placement logic
    }
    bullet.dataset.row = token.dataset.row;

    document.body.appendChild(bullet);
    moveBullet(bullet); // Pass only the bullet element
}

function moveBullet(bullet) {
    if (!gameActive || gamePaused || !bullet || !bullet.parentNode) {
        if (bullet && bullet.parentNode) { // Ensure bullet is removed if game becomes inactive/paused during its flight
            bullet.parentNode.removeChild(bullet);
        }
        return;
    }

    const bulletRect = bullet.getBoundingClientRect();

    // 1. Check if bullet is off-screen
    if (bulletRect.right > window.innerWidth) {
        bullet.parentNode.removeChild(bullet);
        return;
    }

    // 2. Check for collision with zombies
    const zombies = document.querySelectorAll('.zombie');
    const bulletDamage = parseInt(bullet.dataset.damage);
    const bulletRow = bullet.dataset.row; // Row is stored as string, comparison should be fine

    for (let i = 0; i < zombies.length; i++) {
        const zombie = zombies[i];
        const zombieRect = zombie.getBoundingClientRect();
        const zombieRow = zombie.dataset.row;

        // Check collision only if on the same row and rectangles overlap
        if (bulletRow === zombieRow &&
            bulletRect.left < zombieRect.right &&
            bulletRect.right > zombieRect.left &&
            bulletRect.top < zombieRect.bottom &&
            bulletRect.bottom > zombieRect.top) {

            // Collision detected
            let zombieHP = parseInt(zombie.dataset.hp);
            zombieHP -= bulletDamage;
            zombie.dataset.hp = String(zombieHP);

            // Update health bar (visual feedback)
            const healthBar = zombie.querySelector('.health-bar'); 
            if (healthBar) {
                const maxHP = parseInt(zombie.dataset.maxHealth || getZombieTypeHealth(zombie.dataset.type)); 
                const healthPercent = Math.max(0, (zombieHP / maxHP) * 100);
                healthBar.style.width = healthPercent + '%';
            }

            if (zombieHP <= 0) {
                if (zombie.parentNode) {
                    zombie.parentNode.removeChild(zombie);
                }
            }

            if (bullet.parentNode) {
                bullet.parentNode.removeChild(bullet); // Remove bullet after collision
            }
            return; // Stop this bullet's movement
        }
    }

    // 3. Move bullet to the right
    const currentLeft = parseFloat(bullet.style.left);
    bullet.style.left = (currentLeft + BULLET_SPEED) + 'px';

    // 4. Continue movement
    setTimeout(() => moveBullet(bullet), BULLET_MOVE_INTERVAL);
}

// Функция для получения здоровья зомби по его типу
function getZombieTypeHealth(zombieType) {
    const zombie = ZOMBIE_TYPES.find(z => z.name === zombieType);
    return zombie ? zombie.health : 50; // По умолчанию 50 здоровья
}

// Функция паузы игры
function togglePause() {
    // Если игра не активна, нельзя поставить на паузу
    if (!gameActive) {
        pauseButton.classList.remove('active');
        return;
    }
    
    // Переключаем состояние паузы
    gamePaused = !gamePaused;
    
    if (gamePaused) {
        // Ставим игру на паузу
        pauseButton.classList.add('active');
        // Сохраняем первоначальный вид кнопки (не меняем текст)
        
        // Останавливаем всех зомби
        document.querySelectorAll('.zombie').forEach(zombie => {
            zombie.style.animationPlayState = 'paused';
            zombie.style.transition = 'none';
        });
        
        // Останавливаем анимацию дыхания юнитов
        document.querySelectorAll('.token').forEach(token => {
            token.style.animationPlayState = 'paused';
        });
        
        // Останавливаем все пули
        document.querySelectorAll('.bullet').forEach(bullet => {
            bullet.style.animationPlayState = 'paused';
            bullet.style.transition = 'none';
        });
        
        // Останавливаем все монетки
        document.querySelectorAll('.currency-drop').forEach(drop => {
            drop.style.animationPlayState = 'paused';
            drop.style.transition = 'none';
            drop.style.pointerEvents = 'none'; // Отключаем возможность клика
        });
        
        // Приостанавливаем все звуки
        zombieAudio.pause();
        
        // Приостанавливаем все звуки поедания
        for (const zombieId in activeZombieEatSounds) {
            if (activeZombieEatSounds[zombieId]) {
                activeZombieEatSounds[zombieId].pause();
            }
        }
        
        // Отключаем возможность выбора юнитов
        unitPanel.style.pointerEvents = 'none';
        grid.style.pointerEvents = 'none';
        
        // Показываем сообщение о паузе
        const pauseMessage = document.createElement('div');
        pauseMessage.id = 'pause-message';
        pauseMessage.textContent = 'GAME PAUSED';
        pauseMessage.style.position = 'fixed';
        pauseMessage.style.top = '50%';
        pauseMessage.style.left = '50%';
        pauseMessage.style.transform = 'translate(-50%, -50%)';
        pauseMessage.style.fontSize = '3rem';
        pauseMessage.style.fontWeight = 'bold';
        pauseMessage.style.color = 'white';
        pauseMessage.style.textShadow = '2px 2px 4px black';
        pauseMessage.style.zIndex = '1000';
        document.body.appendChild(pauseMessage);
    } else {
        // Возобновляем игру
        pauseButton.classList.remove('active');
        // Сохраняем первоначальный вид кнопки (не меняем текст)
        
        // Возобновляем всех зомби
        document.querySelectorAll('.zombie').forEach(zombie => {
            zombie.style.animationPlayState = 'running';
            zombie.style.transition = '';
        });
        
        // Возобновляем анимацию дыхания юнитов
        document.querySelectorAll('.token').forEach(token => {
            token.style.animationPlayState = 'running';
        });
        
        // Возобновляем все пули
        document.querySelectorAll('.bullet').forEach(bullet => {
            bullet.style.animationPlayState = 'running';
            bullet.style.transition = '';
        });
        
        // Возобновляем все монетки
        document.querySelectorAll('.currency-drop').forEach(drop => {
            drop.style.animationPlayState = 'running';
            drop.style.transition = '';
            drop.style.pointerEvents = 'all'; // Включаем возможность клика
        });
        
        // Удаляем сообщение о паузе
        const pauseMessage = document.getElementById('pause-message');
        if (pauseMessage) {
            pauseMessage.parentNode.removeChild(pauseMessage);
        }
    }
}

// Функция создания и движения пули
function shootBullet(token, targetZombie, damage) {
    // Проверяем, существует ли контейнер для пуль
    if (!bulletsContainer) {
        console.log('Контейнер для пуль не найден, создаем новый');
        // Создаем контейнер, если он не существует
        const newBulletsContainer = document.createElement('div');
        newBulletsContainer.id = 'bullets-container';
        newBulletsContainer.style.position = 'absolute';
        newBulletsContainer.style.top = '0';
        newBulletsContainer.style.left = '0';
        newBulletsContainer.style.width = '100%';
        newBulletsContainer.style.height = '100%';
        newBulletsContainer.style.zIndex = '50';
        document.getElementById('game-area').appendChild(newBulletsContainer);
        bulletsContainer = newBulletsContainer;
    }
    
    console.log('Создаем пулю с уроном:', damage);
    // Создаем элемент пули
    const bullet = document.createElement('div');
    bullet.className = 'bullet';
    bullet.id = `bullet-${bulletCount++}`;
    bullet.dataset.damage = damage;
    
    // Выбираем случайную пулю из доступных вариантов
    const bulletTypes = ['bullet.PNG', 'bullet_2.png', 'bullet_3.png'];
    const randomBullet = bulletTypes[Math.floor(Math.random() * bulletTypes.length)];
    bullet.style.backgroundImage = `url('assets/bullets/${randomBullet}')`;
    console.log('Загружаем пулю:', `assets/bullets/${randomBullet}`);
    
    // Позиционируем пулю у токена
    const tokenRect = token.getBoundingClientRect();
    const zombieRect = targetZombie.getBoundingClientRect();
    
    // Начальная позиция (у токена)
    const startTop = tokenRect.top + tokenRect.height / 2 - 15; // Центрируем по вертикали
    const startLeft = tokenRect.left + tokenRect.width - 10; // Немного смещаем вправо
    
    bullet.style.top = `${startTop - window.scrollY}px`;
    bullet.style.left = `${startLeft - window.scrollX}px`;
    
    // Добавляем пулю в контейнер
    bulletsContainer.appendChild(bullet);
    
    // Конечная позиция (у зомби)
    const endLeft = zombieRect.left - window.scrollX;
    
    // Добавляем текстовый индикатор урона для лучшей видимости
    const damageIndicator = document.createElement('div');
    damageIndicator.className = 'bullet-damage';
    damageIndicator.textContent = damage;
    bullet.appendChild(damageIndicator);
    
    // Движение пули - увеличенная задержка для лучшей видимости
    setTimeout(() => {
        bullet.style.left = `${endLeft}px`;
    }, 100); // Увеличенная задержка для анимации
    
    // Попадание пули - увеличенное время полета до 2 секунд
    setTimeout(() => {
        // Проверяем, что цель еще существует
        if (targetZombie.parentNode && bullet.parentNode) {
            // Останавливаем вращение пули
            bullet.style.animation = 'none';
            
            // Добавляем анимацию попадания
            bullet.classList.add('bullet-hit');
            
            // Наносим урон зомби
            const zombieHealth = parseInt(targetZombie.dataset.health) || 0;
            const newHealth = zombieHealth - damage;
            targetZombie.dataset.health = newHealth;
            
            // Обновляем индикатор здоровья зомби
            const healthBar = targetZombie.querySelector('.zombie-health .health-bar');
            if (healthBar) {
                const maxHealth = parseInt(targetZombie.dataset.originalHealth) || 
                                 parseInt(targetZombie.dataset.maxHealth) || 
                                 getZombieTypeHealth(targetZombie.dataset.type);
                const healthPercent = Math.max(0, (newHealth / maxHealth) * 100);
                healthBar.style.width = `${healthPercent}%`;
            }
            
            // Добавляем визуальный эффект получения урона
            targetZombie.classList.add('taking-damage');
            setTimeout(() => targetZombie.classList.remove('taking-damage'), 200);
            
            // Проверяем, уничтожен ли зомби
            if (newHealth <= 0) {
                // Добавляем анимацию уничтожения
                targetZombie.classList.add('destroyed');
                
                // Удаляем зомби после анимации
                setTimeout(() => {
                    if (targetZombie.parentNode) {
                        targetZombie.parentNode.removeChild(targetZombie);
                    }
                }, 500);
            }
            
            // Удаляем пулю после анимации попадания
            setTimeout(() => {
                if (bullet.parentNode) {
                    bullet.parentNode.removeChild(bullet);
                }
            }, 500); // Увеличенное время анимации попадания
        } else {
            // Если цель уже уничтожена, просто удаляем пулю
            if (bullet.parentNode) {
                bullet.parentNode.removeChild(bullet);
            }
        }
    }, 3000); // Увеличенное время полета пули до 3 секунд
}

// Функция для получения здоровья зомби по его типу
function getZombieTypeHealth(zombieType) {
    const zombie = ZOMBIE_TYPES.find(z => z.name === zombieType);
    return zombie ? zombie.health : 50; // По умолчанию 50 здоровья
}

// Функция паузы игры
function togglePause() {
    // Если игра не активна, нельзя поставить на паузу
    if (!gameActive) {
        pauseButton.classList.remove('active');
        return;
    }
    
    // Переключаем состояние паузы
    gamePaused = !gamePaused;
    
    if (gamePaused) {
        // Ставим игру на паузу
        pauseButton.classList.add('active');
        // Сохраняем первоначальный вид кнопки (не меняем текст)
        
        // Останавливаем всех зомби
        document.querySelectorAll('.zombie').forEach(zombie => {
            zombie.style.animationPlayState = 'paused';
            zombie.style.transition = 'none';
        });
        
        // Останавливаем анимацию дыхания юнитов
        document.querySelectorAll('.token').forEach(token => {
            token.style.animationPlayState = 'paused';
        });
        
        // Останавливаем все пули
        document.querySelectorAll('.bullet').forEach(bullet => {
            bullet.style.animationPlayState = 'paused';
            bullet.style.transition = 'none';
        });
        
        // Останавливаем все монетки
        document.querySelectorAll('.currency-drop').forEach(drop => {
            drop.style.animationPlayState = 'paused';
            drop.style.transition = 'none';
            drop.style.pointerEvents = 'none'; // Отключаем возможность клика
        });
        
        // Приостанавливаем все звуки
        zombieAudio.pause();
        
        // Приостанавливаем все звуки поедания
        for (const zombieId in activeZombieEatSounds) {
            if (activeZombieEatSounds[zombieId]) {
                activeZombieEatSounds[zombieId].pause();
            }
        }
        
        // Отключаем возможность выбора юнитов
        unitPanel.style.pointerEvents = 'none';
        grid.style.pointerEvents = 'none';
        
        // Показываем сообщение о паузе
        const pauseMessage = document.createElement('div');
        pauseMessage.id = 'pause-message';
        pauseMessage.textContent = 'GAME PAUSED';
        pauseMessage.style.position = 'fixed';
        pauseMessage.style.top = '50%';
        pauseMessage.style.left = '50%';
        pauseMessage.style.transform = 'translate(-50%, -50%)';
        pauseMessage.style.fontSize = '3rem';
        pauseMessage.style.fontWeight = 'bold';
        pauseMessage.style.color = 'white';
        pauseMessage.style.textShadow = '2px 2px 4px black';
        pauseMessage.style.zIndex = '1000';
        document.body.appendChild(pauseMessage);
    } else {
        // Возобновляем игру
        pauseButton.classList.remove('active');
        // Сохраняем первоначальный вид кнопки (не меняем текст)
        
        // Возобновляем всех зомби
        document.querySelectorAll('.zombie').forEach(zombie => {
            zombie.style.animationPlayState = 'running';
            zombie.style.transition = '';
        });
        
        // Возобновляем анимацию дыхания юнитов
        document.querySelectorAll('.token').forEach(token => {
            token.style.animationPlayState = 'running';
        });
        
        // Возобновляем все пули
        document.querySelectorAll('.bullet').forEach(bullet => {
            bullet.style.animationPlayState = 'running';
            bullet.style.transition = '';
        });
        
        // Возобновляем все монетки
        document.querySelectorAll('.currency-drop').forEach(drop => {
            drop.style.animationPlayState = 'running';
            drop.style.transition = '';
            drop.style.pointerEvents = 'all'; // Включаем возможность клика
        });
        
        // Возобновляем все звуки поедания
        for (const zombieId in activeZombieEatSounds) {
            if (activeZombieEatSounds[zombieId]) {
                activeZombieEatSounds[zombieId].play().catch(error => console.log('Error resuming zombie eat sound:', error));
            }
        }
        
        // Включаем возможность выбора юнитов
        unitPanel.style.pointerEvents = 'all';
        grid.style.pointerEvents = 'all';
        
        // Удаляем сообщение о паузе
        const pauseMessage = document.getElementById('pause-message');
        if (pauseMessage && pauseMessage.parentNode) {
            pauseMessage.parentNode.removeChild(pauseMessage);
        }
    }
}

// Setup event listeners
function setupEventListeners() {
    playButton.addEventListener('click', startGame);
    pauseButton.addEventListener('click', togglePause);
    
    // Добавляем обработчики для section_unit изображений
    document.querySelector('.section-unit-image').addEventListener('click', () => onUnitSelect('LABUBU'));
    document.querySelector('.section-unit2-image').addEventListener('click', () => onUnitSelect('ALON'));
    document.querySelector('.section-unit3-image').addEventListener('click', () => onUnitSelect('TROLL'));
    document.querySelector('.section-unit4-image').addEventListener('click', () => onUnitSelect('HOUSE'));
    
    // Добавляем обработчик клика по игровому полю
    document.body.addEventListener('click', onGameFieldClick);
    
    // Close lose popup when clicked
    losePopup.addEventListener('click', () => {
        losePopup.classList.add('hidden');
    });
}

// Функция для создания и отображения 5 дорог на игровом поле
function setupLanes() {
    // Создаем контейнер для дорог, если его еще нет
    let lanesContainer = document.getElementById('lanes-container');
    if (!lanesContainer) {
        lanesContainer = document.createElement('div');
        lanesContainer.id = 'lanes-container';
        lanesContainer.style.position = 'absolute';
        lanesContainer.style.top = '0';
        lanesContainer.style.left = '0';
        lanesContainer.style.width = '100%';
        lanesContainer.style.height = '100%';
        lanesContainer.style.zIndex = '5'; // Под зомби и юнитами, но над фоном
        lanesContainer.style.pointerEvents = 'auto'; // Разрешаем клики на контейнере
        document.body.appendChild(lanesContainer);
    } else {
        // Очищаем существующий контейнер
        lanesContainer.innerHTML = '';
    }
    
    // Определяем 3 линии для движения зомби и размещения юнитов
    const lanes = [
        40, // Первая линия - верхняя дорожка (ближе к центру)
        48, // Вторая линия - средняя дорожка (центр) - подкорректирована
        56  // Третья линия - нижняя дорожка - подкорректирована
    ];
    
    // Высота и ширина окна
    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;
    
    // Минимальная позиция слева (домик)
    const minLeftPosition = 50; // Уменьшаем значение, чтобы квадраты создавались ближе к левому краю
    
    // Размер квадратика (увеличен для уменьшения их количества)
    const squareSize = 100;
    
    // Создаем визуализацию дорог с квадратиками
    lanes.forEach((lane, laneIndex) => {
        // Рассчитываем вертикальную позицию линии
        const lanePosition = (lane / 100) * windowHeight;
        
        // Создаем квадратики на линии, равномерно распределяя их по всей ширине
        // Оставляем место для домика слева и место для появления зомби справа
        const leftMargin = 150; // Место для домика
        const rightMargin = 150; // Место для появления зомби
        
        const availableWidth = windowWidth - leftMargin - rightMargin;
        const squaresPerRow = 9; // Фиксированное количество квадратов, как в оригинальном PvZ
        const squareSpacing = availableWidth / squaresPerRow; // Равномерное расстояние между квадратами
        
        for (let i = 0; i < squaresPerRow; i++) {
            // Создаем квадрат
            const square = document.createElement('div');
            square.className = 'game-square';
            square.dataset.row = laneIndex; // Используем одинаковые атрибуты во всем коде
            square.dataset.col = i; // Используем одинаковые атрибуты во всем коде
            square.dataset.laneIndex = laneIndex; // Сохраняем и старые атрибуты для совместимости
            square.dataset.squareIndex = i; // Сохраняем и старые атрибуты для совместимости
            
            // Стилизуем квадрат
            square.style.position = 'absolute';
            square.style.top = `${lanePosition - squareSize/2}px`; // Центрируем по вертикали
            
            // Располагаем квадраты равномерно по всей ширине
            square.style.left = `${leftMargin + i * squareSpacing}px`;
            square.style.width = `${squareSize}px`;
            square.style.height = `${squareSize}px`;
            square.style.boxSizing = 'border-box';
            square.style.border = '0'; // Убираем границы, чтобы сделать сетку невидимой
            square.style.cursor = 'pointer'; // Показываем, что квадрат кликабельный
            
            // Добавляем обработчик клика на каждый квадрат
            square.addEventListener('click', (e) => {
                // Вызываем onGameFieldClick напрямую с этим квадратом как целью
                if (selectedUnit) {
                    e.stopPropagation(); // Предотвращаем всплытие события
                    onGameFieldClick(e);
                }
            });
            
            // Добавляем данные для определения позиции квадрата
            square.dataset.row = laneIndex;
            square.dataset.col = i;
            
            // Делаем квадраты полностью прозрачными
            square.style.backgroundColor = 'transparent';
            
            // Добавляем квадрат в контейнер
            lanesContainer.appendChild(square);
        }
    });
    
    // Сохраняем линии как глобальную переменную для использования в других функциях
    window.gameLanes = lanes;
}

// Initialize game
function setupGame() {
    setupGrid();
    setupUnitPanel();
    setupLanes(); // Добавляем создание дорог
    setupEventListeners();
    updateCurrency();
}

// Start everything when page loads
window.addEventListener('load', setupGame);
