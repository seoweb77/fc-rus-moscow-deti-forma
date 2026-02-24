<?php
// send.php - Обработчик заявок с сохранением в БД и отправкой на почту

// =============================================
// НАСТРОЙКИ - ЗАМЕНИТЕ НА СВОИ!
// =============================================

// ----- Настройки базы данных (данные от хостинга) -----
define('DB_HOST', 'localhost');           // Обычно localhost
define('DB_NAME', 'your_database_name');  // Имя базы данных
define('DB_USER', 'your_database_user');  // Имя пользователя БД
define('DB_PASS', 'your_database_pass');  // Пароль от БД

// ----- Настройки почты (для отправки уведомлений) -----
define('MAIL_TO', 'your-email@yandex.ru');     // Кому отправлять заявки
define('MAIL_FROM', 'noreply@your-site.ru');   // От кого (ваш домен)

// ----- Настройки Telegram (замените ссылку) -----
define('TELEGRAM_LINK', 'https://t.me/fc_rus_moscow');

// ----- Режим отладки (включите если что-то не работает) -----
define('DEBUG_MODE', false);  // false для рабочего режима

// =============================================
// КОД ОБРАБОТЧИКА - НИЧЕГО НЕ МЕНЯЙТЕ!
// =============================================

// Включаем отчёт об ошибках только в режиме отладки
if (DEBUG_MODE) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}

// Функция для логирования ошибок
function logError($message) {
    $log_file = __DIR__ . '/logs/errors.log';
    $log_dir = dirname($log_file);
    
    if (!file_exists($log_dir)) {
        mkdir($log_dir, 0755, true);
    }
    
    $log_entry = date('Y-m-d H:i:s') . ' - ' . $message . PHP_EOL;
    file_put_contents($log_file, $log_entry, FILE_APPEND);
}

// Проверяем метод запроса
if ($_SERVER["REQUEST_METHOD"] != "POST") {
    die("Метод не поддерживается");
}

// Функция для очистки входных данных
function cleanInput($data) {
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data);
    return $data;
}

// Получаем и очищаем данные
$parentName = isset($_POST['parentName']) ? cleanInput($_POST['parentName']) : '';
$childName = isset($_POST['childName']) ? cleanInput($_POST['childName']) : '';
$childAge = isset($_POST['childAge']) ? (int)$_POST['childAge'] : 0;
$group = isset($_POST['group']) ? cleanInput($_POST['group']) : '';
$phone = isset($_POST['phone']) ? cleanInput($_POST['phone']) : '';
$email = isset($_POST['email']) ? filter_var(trim($_POST['email']), FILTER_SANITIZE_EMAIL) : '';
$comment = isset($_POST['comment']) ? cleanInput($_POST['comment']) : '';
$consent = isset($_POST['consent']) ? 1 : 0; // Если галочка есть, то 1

// Получаем техническую информацию
$ip_address = $_SERVER['REMOTE_ADDR'] ?? '';
$user_agent = $_SERVER['HTTP_USER_AGENT'] ?? '';

// Валидация
$errors = [];

if (empty($parentName)) $errors[] = 'Не указано имя родителя';
if (empty($childName)) $errors[] = 'Не указано имя ребенка';
if ($childAge < 5 || $childAge > 14) $errors[] = 'Некорректный возраст';
if (empty($group)) $errors[] = 'Не выбрана группа';
if (empty($phone)) $errors[] = 'Не указан телефон';
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) $errors[] = 'Некорректный email';
if (!$consent) $errors[] = 'Не получено согласие на обработку данных';

if (!empty($errors)) {
    $error_string = implode(', ', $errors);
    logError("Ошибка валидации: $error_string");
    
    if (DEBUG_MODE) {
        die("Ошибка: $error_string");
    } else {
        header("Location: index.html?error=validation");
        exit;
    }
}

// =============================================
// 1. СОХРАНЕНИЕ В БАЗУ ДАННЫХ
// =============================================

try {
    // Подключение к БД
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]
    );
    
    // Подготовка запроса
    $sql = "INSERT INTO applications (
        ip_address, user_agent, parent_name, child_name, child_age,
        preferred_group, phone, email, comment, consent_given
    ) VALUES (
        :ip_address, :user_agent, :parent_name, :child_name, :child_age,
        :preferred_group, :phone, :email, :comment, :consent_given
    )";
    
    $stmt = $pdo->prepare($sql);
    
    // Выполнение запроса
    $result = $stmt->execute([
        ':ip_address' => $ip_address,
        ':user_agent' => $user_agent,
        ':parent_name' => $parentName,
        ':child_name' => $childName,
        ':child_age' => $childAge,
        ':preferred_group' => $group,
        ':phone' => $phone,
        ':email' => $email,
        ':comment' => $comment,
        ':consent_given' => $consent
    ]);
    
    if (!$result) {
        throw new Exception("Ошибка при сохранении в БД");
    }
    
    $application_id = $pdo->lastInsertId();
    logError("Заявка #$application_id успешно сохранена в БД");
    
} catch (PDOException $e) {
    logError("Ошибка БД: " . $e->getMessage());
    
    if (DEBUG_MODE) {
        die("Ошибка базы данных: " . $e->getMessage());
    } else {
        header("Location: index.html?error=database");
        exit;
    }
} catch (Exception $e) {
    logError("Ошибка: " . $e->getMessage());
    header("Location: index.html?error=unknown");
    exit;
}

// =============================================
// 2. ОТПРАВКА НА ПОЧТУ
// =============================================

// Формируем письмо
$to = MAIL_TO;
$subject = "Новая заявка #$application_id с сайта ФК Русь";

$message = "
Новая заявка на тренировку!

ID заявки: $application_id
Дата: " . date('d.m.Y H:i:s') . "
IP адрес: $ip_address

Имя родителя: $parentName
Имя ребенка: $childName
Возраст ребенка: $childAge лет
Предпочтительная группа: $group
Телефон: $phone
Email: $email
Комментарий: $comment

Согласие на обработку данных: " . ($consent ? 'ДА' : 'НЕТ') . "

---
Отправлено с сайта ФК Русь
";

$headers = "From: " . MAIL_FROM . "\r\n";
$headers .= "Reply-To: $email\r\n";
$headers .= "X-Mailer: PHP/" . phpversion();

// Отправляем письмо
$mail_sent = mail($to, $subject, $message, $headers);

if ($mail_sent) {
    logError("Письмо для заявки #$application_id успешно отправлено");
} else {
    logError("Ошибка при отправке письма для заявки #$application_id");
}

// =============================================
// 3. ПЕРЕНАПРАВЛЕНИЕ НА СТРАНИЦУ УСПЕХА
// =============================================

header("Location: index.html?success=1&id=$application_id");
exit;