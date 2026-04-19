# RomanEstate — маркетплейс недвижимости

`back` — основная рабочая часть проекта. Здесь находятся backend на Spring Boot, публичный клиентский фронт для покупателей/арендаторов и внутренний кабинет для сотрудников.

## Состав проекта

- `src` — Spring Boot backend + бизнес-логика + REST API
- `public-frontend` — публичный интерфейс маркетплейса
- `internal-frontend` — внутренний кабинет для `ROLE_ADMIN`, `ROLE_REALTOR`, `ROLE_BANK_EMPLOYEE`
- `e2e` — browser smoke / end-to-end тесты на Playwright
- `docker-compose.yml` — локальный PostgreSQL
- `uploads` — файловое хранилище локальных изображений

## Локальные адреса

- Backend: `http://127.0.0.1:8080`
- Swagger UI: `http://127.0.0.1:8080/swagger-ui/index.html`
- OpenAPI JSON: `http://127.0.0.1:8080/v3/api-docs`
- Healthcheck: `http://127.0.0.1:8080/actuator/health`
- Public frontend: `http://127.0.0.1:5173`
- Internal frontend: `http://127.0.0.1:5174`
- PostgreSQL в Docker: `127.0.0.1:5433`

## Тестовые пользователи

Если включён `app.demo-users.enabled=true`, backend автоматически поднимает демо-аккаунты.

| Роль | Логин | Email | Пароль |
| --- | --- | --- | --- |
| Публичный пользователь | `marketuser` | `marketuser@example.com` | `Password123!` |
| Администратор | `admin` | `admin@example.com` | `Password123!` |
| Риелтор | `realtor` | `realtor@example.com` | `Password123!` |
| Банковский сотрудник | `banker` | `bank@example.com` | `Password123!` |

Важно:

- публичный вход выполняется только через `public-frontend`
- внутренний вход выполняется только через `internal-frontend`
- публичная форма логина использует поле `Username`
- внутренняя форма логина принимает и `email`, и `username`

## Публичный фронт: что реализовано

### Главный пользовательский сценарий

- поиск объявлений по городу, цене, типу сделки, типу объекта и числу спален
- двуязычный интерфейс `RU / EN` с переключателем языка
- карточки объектов, детальная страница, сохранение избранного и возврат к ранее просмотренным объявлениям
- регистрация, логин, логаут, хранение пользовательской сессии
- профиль с вкладками: свои объявления, избранное, активные сделки
- floating support chat с очередью поддержки для риелтора

### Discovery и поиск

- sticky фильтры и быстрая смена сценариев поиска
- сохранённые поиски и быстрый повторный запуск search preset’ов
- advanced filters:
  - район
  - транспорт / transit profile
  - тип здания
  - уровень отделки
  - amenities
  - только новостройки
  - сигнал снижения цены
- split `list + map` выдача
- синхронизация карточек и карты по hover / selection
- `draw area` / `search in this area` на карте
- helper-search / фасадный AI-поиск на естественном языке, который преобразует запрос в фильтры
- onboarding quiz для стартового подбора параметров поиска
- city landing pages, например `/city/mumbai`
- отдельный new-build hub: `/new-builds`

### Карточки и листинг-лента

- enriched property cards с бейджами качества и статусов
- shortlist compare до нескольких объектов
- shared shortlist link
- personal notes внутри compare-mode
- recently viewed rail
- price-drop сигналы для saved и recently viewed объектов
- recommendation blocks и saved-search digests на главной

### Создание и редактирование объявлений

- создание и редактирование собственных объектов из публичного кабинета
- обязательные категории фото перед публикацией:
  - фасад / exterior
  - интерьер / interior
  - планировка / floor plan
- в каждой категории можно хранить несколько фото
- категория каждого изображения сохраняется вместе с объектом
- публикация блокируется, если не заполнены обязательные категории медиа

### Detail page / страница объекта

- gallery polish:
  - cover ranking
  - группировка по категориям фото
  - fullscreen gallery
  - room-by-room sequencing
- sticky CTA rail:
  - сохранить
  - связаться
  - запланировать показ
  - поделиться ссылкой
  - начать сделку
- quick facts:
  - город
  - район
  - тип объекта
  - тип здания
  - отделка
  - ownership / publisher type
  - developer context
  - цена за площадь
- price history и price-reduced state
- valuation / estimated market range
- mortgage / affordability блок
- partner mortgage programs в карточках сравнения ставок
- neighborhood insights:
  - школы
  - транспорт
  - парки
  - клиники
  - рестораны
  - commute estimate
- trust & verification:
  - статус фото
  - ownership / publisher check
  - moderation check
  - document / launch-pack check
- anti-fraud microcopy рядом с чувствительными действиями
- viewing scheduler с датой, временем, размером группы и комментарием
- placeholders под premium-media сценарии: video / 3D-tour
- быстрый переход к similar homes

### Профиль пользователя

- список собственных объявлений
- избранное
- price watch summary по сохранённым объектам
- mute / unmute price alerts
- сделки пользователя
- просмотр и хранение viewing requests
- обновление профиля: username, email, телефон, пароль, avatar

## Внутренний кабинет: что реализовано

### Роли

- `ROLE_ADMIN`
- `ROLE_REALTOR`
- `ROLE_BANK_EMPLOYEE`

### Основные экраны

- `/login` — логин сотрудников
- `/clients` — клиентский pipeline, marketplace leads, support inbox
- `/deals` — сделки и их стадии
- `/contracts` — договоры
- `/properties` — управление внутренним реестром объектов
- `/credits` — кредитные заявки
- `/payments` — платежи
- `/analytics` — аналитика и dashboard’ы
- `/users` — управление сотрудниками
- `/organizations` — управление организациями
- `/register` — регистрация сотрудников

### Возможности кабинета

- role-aware навигация
- live counters в навигации
- org-scoped доступ для риелторов и банковских сотрудников
- marketplace deal requests и support inbox для риелторов
- credit queue и payments journal для банковского контура
- organization analytics + export CSV
- административное управление пользователями и организациями

## Backend и API

### Публичная часть

- public auth: `/auth/**`
- публичные посты: `/posts/**`
- профиль и saved-state: `/users/**`, `/api/favorites/**`
- сделки маркетплейса: `/api/marketplace-deals/**`
- support chat: `/api/support-chat/**`

### Внутренняя часть

- internal auth: `/api/auth/**`
- internal marketplace/deal/support API: `/api/internal/**`
- properties / deals / contracts / credits / payments / analytics / organizations API

### Инфраструктурно

- PostgreSQL как основная БД
- Swagger / OpenAPI для ручной инспекции API
- Actuator health endpoints
- demo-users seed для локальной разработки
- при старте backend автоматически доводит legacy-схему для старых колонок маркетплейса, чтобы локальная БД не падала на новых полях (`property_photos.category`, `favorites.saved_price`, `favorites.price_alert_enabled`)

## Публичные маршруты

- `/`
- `/list`
- `/nearby`
- `/login`
- `/register`
- `/profile`
- `/profile/update`
- `/add`
- `/edit/:id`
- `/city/:city`
- `/new-builds`
- `/:id` — детальная страница объекта

## Внутренние маршруты

- `/login`
- `/clients`
- `/deals`
- `/contracts`
- `/properties`
- `/credits`
- `/payments`
- `/analytics`
- `/users`
- `/organizations`
- `/register`

## Быстрый локальный запуск

### 1. Поднять PostgreSQL

Из папки `back`:

```powershell
docker compose up -d
```

Параметры локальной БД:

- database: `realestate`
- username: `postgres`
- password: `postgres`
- port: `5433`

### 2. Запустить backend

```powershell
cd back
mvn spring-boot:run
```

### 3. Запустить публичный фронт

```powershell
cd back/public-frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

### 4. Запустить внутренний фронт

```powershell
cd back/internal-frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5174
```

## Production / build

### Backend

```powershell
cd back
mvn clean package -DskipTests
```

Готовый jar:

- `back/target/realestate-backend-0.0.1-SNAPSHOT.jar`

Пример запуска:

```powershell
$env:SPRING_DATASOURCE_URL="jdbc:postgresql://<host>:5432/<db>"
$env:SPRING_DATASOURCE_USERNAME="<user>"
$env:SPRING_DATASOURCE_PASSWORD="<password>"
$env:APP_JWT_SECRET="<strong-secret>"
$env:APP_DEMO_USERS_ENABLED="false"
java -jar .\target\realestate-backend-0.0.1-SNAPSHOT.jar
```

### Фронты

```powershell
cd back/public-frontend
npm ci
npm run build

cd ..\internal-frontend
npm ci
npm run build
```

Далее `dist`-артефакты фронтов можно отдавать через nginx / reverse proxy / статический web server.

## Переменные окружения

Шаблоны:

- backend: `back/.env.example`
- public frontend: `back/public-frontend/.env.example`
- internal frontend: `back/internal-frontend/.env.example`

Проект поднимается и на локальных дефолтах, но для staging / production лучше явно фиксировать значения через `.env` или переменные окружения.

## Проверка и тесты

Актуальная проверка: `2026-03-19`

### Backend

```powershell
cd back
mvn test
```

### Public static smoke

```powershell
cd back/public-frontend
npm run smoke
```

Проверяются маршруты:

- `/`
- `/list`
- `/login`
- `/register`
- `/1`
- `/new-builds`
- `/city/mumbai`

### Internal static smoke

```powershell
cd back/internal-frontend
npm run smoke
```

### Browser end-to-end smoke

```powershell
cd back/e2e
npm install
npm run test
```

Сценарии покрывают:

- public marketplace user: логин, профиль, вкладка сделок, support chat
- public discovery flow: helper search, city hub, new-build hub, detail page, viewing request
- internal admin: deals, analytics, users, organizations, register
- internal realtor: clients, marketplace requests, support inbox
- internal bank employee: credits, payments

## Что важно знать перед ручным полишем

- фиолетовая палитра сохранена как основа визуальной системы
- новые product-surface’ы уже доведены до рабочего состояния, дальше имеет смысл делать именно ручной UI/UX полиш: spacing, visual rhythm, copy, состояния ошибок и пустых экранов
- backend и фронты уже синхронизированы по новым пользовательским сценариям, поэтому следующий этап — это не функциональный backlog, а quality / visual polish