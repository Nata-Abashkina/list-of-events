# Архитектура проекта `list-of-events`

> **SPA-планировщик с бесконечной лентой месяцев и таймлайном мероприятий**
> Автор: Nata-Abashkina
> Стек: TypeScript (strict) · React 19 (render-only) · Vite 8 / Rolldown · SCSS

---

## Философия: Core Engine + UI Shell

Проект построен на жёстком разделении ответственности между **чистой бизнес-логикой** и **слоем отображения**. Это не «React-приложение с утилитами», а **TS-ядро с React в роли тонкой рендер-обёртки**.

```
┌─────────────────────────────────────────────────────────┐
│                      UI SHELL (React)                   │
│  Header · Footer · Calendar · MonthGrid · EventList     │
│  EventForm · DatePicker · TimePicker · Undo             │
│                                                         │
│  Состояние: version, selectedDate, isModalOpen,         │
│             editingId, pendingDelete, theme             │
└────────────────────────┬────────────────────────────────┘
                         │ подписка на version
                         ▼
┌─────────────────────────────────────────────────────────┐
│                   CORE ENGINE (чистый TS)               │
│  types.ts · dateUtils.ts · eventStore.ts                │
│  validation.ts · theme.ts                               │
│                                                         │
│  НОЛЬ импортов из React. Доменные данные — только тут.  │
└────────────────────────┬────────────────────────────────┘
                         │ JSON
                         ▼
                  localStorage (list-of-events:events)
```

### Ключевые принципы

| Принцип | Реализация |
|---|---|
| React не знает, как считаются даты | Вся календарная арифметика — `core/dateUtils.ts`, чистые функции |
| Доменные данные не живут в `useState` | События хранятся в `eventStore`, React читает по требованию |
| Перерисовка через счётчик | UI-инкремент `version` триггерит ре-рендер вместо копии массива |
| Инициализация до `createRoot` | `loadEvents()` → `applyTheme()` → рендер, чтобы не было вспышки темы |

---

## Ядро (`core/`)

### `types.ts` — модель данных

```ts
interface Event {
  id: string;
  title: string;
  date: string;        // YYYY-MM-DD
  time?: string;       // HH:mm; undefined = событие на весь день
}
```

**Соглашение по времени:**
- `time === undefined` — пользователь **явно** поставил чекбокс «Весь день»
- `time === 'HH:mm'` — время указано
- Пустое время без чекбокса **не сохраняется** — валидация отклоняет

### `dateUtils.ts` — календарное ядро

Чистые функции, ноль зависимостей. Месяц **0-based**, `firstWeekdayOfMonth` возвращает `0 = Пн … 6 = Вс`.

```ts
toISODate(d: Date): string
fromISODate(s: string): Date
isLeapYear(y: number): boolean
daysInMonth(y, m): number
firstWeekdayOfMonth(y, m): number
buildMonthMatrix(y, m): CalendarCell[]
buildMonthConfig(y, m): MonthConfig
buildMonthsRange(centerY, centerM, back, forward): MonthConfig[]
timeToMinutes(t: string): number
todayISO(): string
compareISO(a, b): number          // лексикографическое сравнение ISO-строк
isWeekendDate(d: Date): boolean
```

`CalendarCell` — discriminated-union ячейки матрицы 7×N:

```ts
interface CalendarCell {
  date: string | null;
  day: number | null;
  month: number | null;
  year: number | null;
  isToday: boolean;
  isWeekend: boolean;
  isOutside: boolean;
  isEmpty: boolean;
  isFirstOfMonth: boolean;
}
```

### `eventStore.ts` — хранилище

- **localStorage**, ключ `list-of-events:events`
- Версионированный объект `{ version: 1, events: Event[] }`
- Запись при любом изменении, чтение на старте (`loadEvents()`), фолбэк на `[]` при ошибке парсинга

**Сортировка:**
1. `date` по возрастанию
2. `time` по возрастанию
3. Пустое время = `"00:00"` → событие на весь день идёт в начало дня
4. При равенстве — стабильно, по порядку добавления

### `validation.ts` — частные валидаторы

`ValidationResult` — discriminated union. Без агрегатора — `EventForm` вызывает частные валидаторы последовательно.

```ts
validateDate(raw: string): ValidationResult
validateTime(raw: string, allDay: boolean, date: string): ValidationResult
validateTitle(raw: string): ValidationResult
parseTimeInput(raw: string): string | null   // «9:5» → «09:05», «25:00» → null
isRealDate(iso: string): boolean             // fromISODate + toISODate round-trip
isRealTime(t: string): boolean
```

**Запрет прошлого — на двух уровнях:**
- `validateDate` возвращает ошибку, если `compareISO(date, todayISO()) < 0`
- `validateTime` — если дата сегодня и `timeToMinutes(time) < nowMinutes`
- UI-дубль: `disabled` на кнопке `edit` в `EventList` для прошлых событий

Свершившееся событие нельзя редактировать, но можно удалить.

### `theme.ts`

```ts
getSystemTheme(): 'light' | 'dark'
getStoredTheme(): 'light' | 'dark' | null
resolveInitialTheme(): 'light' | 'dark'
saveTheme(t): void
applyTheme(root: HTMLElement, t): void
```

Ключ `list-of-events:theme`, значения `'light' | 'dark'`. Переключение через `data-theme` на `<html>`. Палитра — 5 базовых токенов, оверлей модалки всегда `rgba(0, 0, 0, 0.6)`.

---

## UI Shell

### Состояние в React (минимум)

| Что | Где | Почему там |
|---|---|---|
| `version` | App | триггер ре-рендера после операций с ядром |
| `selectedDate` | App | UI-выбор дня |
| `isModalOpen`, `editingId` | App | модалка add/edit |
| `pendingDelete` | App | механика Undo |
| `theme` | App | ленивая инициализация `resolveInitialTheme()` |
| `isCalendarOpen`, `dateWrapRef` | EventForm | только для DatePicker |
| `isOpen`, `viewYear/Month`, `mode` | DatePicker / TimePicker | локально |

Доменные данные (события) — **никогда** не в `useState`. React читает их через `getEventsByDate(selectedDate)`.

### Карта компонентов

```
App.tsx
├── Header.tsx            (logo · h1 · Add · ThemeToggle)
├── main.main
│   ├── Calendar.tsx      (бесконечная лента месяцев)
│   │   └── MonthGrid.tsx (тупой, переиспользуемый)
│   └── EventList.tsx     (список на selectedDate)
│       └── Undo.tsx      (createPortal в body, always-rendered)
└── Footer.tsx

EventForm.tsx (dialog.add.modal)
├── DatePicker.tsx        (days / months / years)
└── TimePicker.tsx        (тройной список со scroll-snap)
```

### `Calendar.tsx` — бесконечная лента

- Сентинелы **в потоке** (`.calendar__sentinel`), не `position: absolute`
- `IntersectionObserver` с `root: container`, `rootMargin: '300px 0px'`
- `loadBack` / `loadForward` — чистые updater-ы, проверка на дубликаты через `prev.some(...)`, никаких мутаций ref внутри updater-а
- Якорное восстановление скролла: `captureAnchor()` + `useLayoutEffect`
- `data-month={year}-{month}` на `.calendar__month` (паддинг месяца до двух цифр)
- `isCurrentMonth` фиксируется **на момент монтирования** через `useState(() => new Date())`

**Константы:**
```ts
INITIAL_BACK = 6;
INITIAL_FORWARD = 6;
LOAD_BACK = 3;
LOAD_FORWARD = 3;
ROOT_MARGIN = '300px 0px';
```

**Известное ограничение:** при листании до 2050+ DOM разрастается — окно месяцев (выгрузка дальних) в бэклоге.

### `EventList.tsx`

- Пропсы: `selectedDate, version, pendingDelete, onDelete, onEdit`
- Событие с `id === pendingDelete` → `return null` внутри `map` (скрытие через рендер, не CSS-класс)
- `formatDisplayDate(iso)` — локально в компоненте: `iso.split('-').reverse().join('.')`
- Кнопка `edit` — `disabled={compareISO(event.date, todayISO()) < 0}`
- Кнопка `delete` — работает всегда
- Отступы между `<time>`, `<time>` и названием — в SCSS, в JSX `{' '}` не используется

### `Undo.tsx` — почему рендерится всегда

Эталонная разметка: `<div class="undo" hidden>`. Плашка живёт в DOM постоянно, видимость — через `hidden`.

Раньше рендерился условно (`{pendingDelete && <Undo/>}`) → монтировался заново → некорректный запуск CSS-анимации полоски. Теперь:

- `createPortal` в `document.body`, `position: fixed`
- `hidden={!pendingDelete}`, `pendingId={pendingDelete}`
- Таймер — `window.setTimeout(duration)` в `useEffect` с зависимостями `[hidden, pendingId, onExpire, duration]`
- Второе удаление перекрывает первое: эффект перезапускается при смене `pendingId`
- Полоска: анимация `undo-countdown`, длительность в CSS (5s) соответствует `duration = 5000`, инлайн-стиль убран
- Отдельная переменная `--timer-bar-color`: фон дорожки и фон полоски различаются, иначе сужение не видно

### `EventForm.tsx` — тупой компонент с двумя режимами

```ts
interface EventFormProps {
  editingEvent: Event | null;   // null = add, Event = edit
  initialDate: string;          // для add = selectedDate
  onSubmit: (data: { title, date, time? }) => void;
  onCancel: () => void;
}
```

- `<dialog>` + `showModal()` в `useEffect`, Escape — нативно через `onCancel`
- Дата в поле — display-строка `ДД.ММ.ГГГГ`, конвертация в ISO на сабмите
- Все поля редактируемые, включая дату в edit
- Чекбокс «Весь день»: add — никогда; edit и `time === undefined` — нажат; edit и `time` есть — не нажат
- Кнопка «Сохранить» → `validateDate` → `validateTime` (с `allDay`) → `validateTitle`, ошибка в соответствующий `p.modal__error`
- `isCalendarOpen` + `dateWrapRef` — в EventForm, потому что `<input class="add__date">` тоже там. Клик мимо ловит EventForm через `mousedown` на `document` + `dateWrapRef.contains`

### `DatePicker.tsx` — три режима

- Пропсы: `value, onChange, onPick, min?`
- Три режима: `'days' | 'months' | 'years'`
- Режим days: `MonthGrid` + `.modal__navigation` (prev / title / next)
- Клик по title: days → months → years
- Режим months: сетка 3×4, 12 месяцев
- Режим years: 12 лет, окно `viewYear - 6 … viewYear + 5`. Prev/next сдвигает окно на 12 лет
- `min` по умолчанию `todayISO()`, прошлые даты — класс `is-disabled`
- Синхронизация с внешним `value` через useEffect: при полностью введённой дате в `add__date` календарь прыгает на её месяц
- Класс `open` на `.modal__calendar` — есть всегда, потому что компонент монтируется при открытии (`{isCalendarOpen && <DatePicker/>}` в EventForm)
- Разметка — копия большого календаря по классам, переиспользует `MonthGrid` и стили

### `TimePicker.tsx` — тройной список со scroll-snap

```ts
interface TimePickerProps {
  value: string;        // 'HH:mm' или ''
  onChange: (v: string) => void;
  disabled?: boolean;
}
```

- `<input class="add__time">` — ручной ввод, `type="text"`, `inputMode="numeric"`, плейсхолдер `ЧЧ:ММ`
- `.add__time-list` — выпадашка, класс `open`
- Тройной список: часы ×3 (72 кнопки), минуты ×3 (180 кнопок), класс `add__time-item`
- Начальный `scrollTop` — на средней копии, на текущем значении, через `useLayoutEffect`
- `onScroll` — прыжок через границу средней копии
- `onMouseDown` + `preventDefault` на кнопках часов/минут — чтобы `onBlur` не срабатывал раньше клика

**Поведение кликов:**

| Действие | Результат |
|---|---|
| Клик по `add__time` | toggle, `value` не меняется |
| Клик по часу | `onChange(HH:MM)`, выпадашка остаётся |
| Клик по минутам | `onChange(HH:MM)`, выпадашка закрывается |
| Клик мимо | закрывается |
| Enter | `parseTimeInput` → `onChange` или откат → закрывается |
| `onBlur` | `parseTimeInput(inputText)` → `onChange(parsed)` или откат к `value` |
| `disabled` (allDay) | выпадашка не открывается |

### Тема

- App хранит `theme` в UI-состоянии, инициализируется лениво через `resolveInitialTheme()`
- `handleThemeToggle`: вычисляет `next` (light ↔ dark), вызывает `saveTheme(next)`, `applyTheme(document.documentElement, next)`, `setTheme(next)`
- Побочные эффекты — вне updater-а `setTheme`, чисто и идемпотентно
- Header получает проп `theme` и показывает иконку: `/svg/light.svg` при light, `/svg/dark.svg` при dark
- `main.tsx` применяет тему до `createRoot`, чтобы не было вспышки

### Механика удаления с Undo

1. Клик «Удалить» → `App.handleDelete(id)`
2. Если уже есть `pendingDelete` с другим id — старое событие удаляется из ядра немедленно, затем `setPendingDelete(newId)`
3. Пока pending — событие в ядре и localStorage, но `EventList` его не рендерит
4. `Undo` — `createPortal` в `document.body`, `position: fixed`, плашка всегда в DOM
5. «Отмена» → `setPendingDelete(null)`, событие возвращается
6. Через 5 секунд → `removeEvent(id)` + `setPendingDelete(null)` + `refresh()`
7. Таймер перезапускается при смене `pendingId`

---

## Структура

```
src/
├── core/
│   ├── types.ts
│   ├── dateUtils.ts
│   ├── eventStore.ts
│   ├── validation.ts
│   └── theme.ts
├── components/
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── Calendar.tsx
│   ├── MonthGrid.tsx
│   ├── EventList.tsx
│   ├── Undo.tsx
│   ├── EventForm.tsx
│   ├── DatePicker.tsx
│   └── TimePicker.tsx
├── styles/
│   ├── style.scss
│   ├── _variables.scss
│   ├── _fonts.scss
│   ├── _header.scss
│   ├── _footer.scss
│   ├── _main.scss
│   ├── _modal.scss
│   ├── _normalize.scss
│   ├── _theme-dark.scss
│   └── _undo.scss
├── App.tsx
└── main.tsx
```

**Правила по SCSS:**
- В `style.scss` — только `@use` партиалов
- Партиалы с `_` в начале
- После нового партиала — перезапуск dev-сервера
- Импорт в `main.tsx`: `import './styles/style.scss'`
- `<link>` на SCSS в `index.html` не используется

---

## Design Decisions

### Бесконечная лента: почему именно так

- Сентинелы в потоке, не absolute — иначе `IntersectionObserver` цепляется за позиционированный родитель
- `root: container`, не viewport — скроллится колонка календаря, а не окно
- Updater чистый, без мутаций ref — React 19 в StrictMode дважды вызывает reducer-ы, мутация внутри сломала бы state
- Якорное восстановление скролла: `captureAnchor()` + `useLayoutEffect`, `anchorRef.current = null` всегда в конце
- `data-month` на `.calendar__month` для дебага и якоря

### EventList + Undo: почему именно так

- `pendingDelete` — пропс `EventList`, не внутренний стейт: удаление инициируется из App, там же и таймер
- Скрытие через `return null`, не CSS-класс: pending-событие не должно занимать место в списке
- Удаление из ядра только в момент expire (или перекрытия) — до этого событие можно вернуть
- Таймер — `setTimeout`, не `onAnimationEnd`: анимация может быть прервана, логика не должна зависеть от CSS
- `formatDisplayDate` — локально в `EventList`, не в ядре: формат отображения — UI-ответственность

### EventForm: почему именно так

- `EventForm` — тупой компонент. Вся логика формы внутри, наружу только `onSubmit` и `onCancel`
- App владеет состоянием модалки (`isModalOpen`, `editingId`), EventForm — нет
- `editingEvent: Event | null` в пропсах: один компонент на два режима
- Дата в поле — display-строка `ДД.ММ.ГГГГ`, конвертация в ISO на сабмите: пользователь видит привычный формат, ядро работает с ISO
- Все поля редактируемые, включая дату в edit
- Чекбокс «Весь день» ставится автоматически только в edit, если событие изначально на весь день. В add — никогда
- Пустое время без чекбокса — ошибка. `validateTime` принимает `allDay` третьим аргументом
- Валидация даты проверяет существование: `isRealDate` через `fromISODate` + `toISODate`

### Кастомные пикеры: почему

- На раннем этапе в модалке были текстовые поля-заглушки — так проще отладить валидацию и submit
- Потом: `DatePicker` (сетка 3×4 месяцев + годы, переиспользует `MonthGrid`) и `TimePicker` (тройной список со scroll-snap)
- `<input class="add__date">` не удалён. DatePicker дополняет, а не заменяет. Ручной ввод даты работает как раньше
- DatePicker — тупой: наружу `onChange` + `onPick`. Состояние `viewYear / viewMonth / mode` — внутри
- `isCalendarOpen` — в EventForm, потому что `<input class="add__date">` тоже там
- Клик мимо ловит EventForm через `mousedown` на document + `dateWrapRef.contains`
- TimePicker — самодостаточный: `<input class="add__time">` внутри компонента, `isOpen` — тоже
- Класс `open` на `.modal__calendar` и `.add__time-list` — компонент монтируется при открытии, `open` стоит всегда, это эквивалент «видим»
- `onMouseDown` + `preventDefault` на кнопках часов/минут — чтобы `onBlur` не срабатывал раньше клика
- Тройной список со scroll-snap — часы и минуты
- `parseTimeInput` — в `core/validation.ts`, не в компоненте
- Клик по часу не закрывает выпадашку. Клик по минутам закрывает. Клик мимо закрывает всегда

### Тема: почему именно так

- Состояние `theme` — в App, ленивая инициализация `resolveInitialTheme()`
- `main.tsx` применяет тему до `createRoot`, чтобы не было вспышки
- `handleThemeToggle`: `saveTheme` + `applyTheme(document.documentElement)` + `setTheme`. Побочные эффекты вне updater-а — чисто, идемпотентно
- Иконка кнопки — по теме: `light.svg` / `dark.svg`.
- Ключ `list-of-events:theme`. Значения `'light' | 'dark'`

### Undo: почему рендерится всегда

- Эталонная разметка — `<div class="undo" hidden>`. Плашка живёт в DOM постоянно, видимость — через `hidden`
- Раньше Undo рендерился условно — монтировался заново, CSS-анимация полоски запускалась некорректно
- Теперь: `hidden={!pendingDelete}`, `pendingId={pendingDelete}`. Таймер в `useEffect` зависит от `[hidden, pendingId]`, перезапускается при смене `pendingId`
- Полоска: фон дорожки (`.undo__timer`) и фон полоски (`.undo__timer-bar`)

### React Hooks: под правила `eslint-plugin-react-hooks@7`

- `initialNowRef` в `Calendar.tsx` заменён на `useState(() => new Date())`. Семантика та же, чтение при рендере теперь законно
- В `DatePicker.tsx` и `TimePicker.tsx` синхронизация внешнего `value` переведена с `useEffect + setState` на паттерн «adjusting state during render» через `lastValue` (официальная рекомендация React). Правило `react-hooks/set-state-in-effect` больше не срабатывает

### Что можно улучшить

- Окно месяцев (выгрузка дальних) — при листании до 2050+ DOM разрастается
- Автоматические тесты — не входят в скоуп
- Подмена favicon по темам — не входит

---

## Зависимости

**Runtime (`dependencies`):**
- `react`, `react-dom` — исключительно как слой отображения (UI Shell). Core Engine от React не зависит.

**Dev (`devDependencies`):**
- Сборка: `vite`, `@vitejs/plugin-react`
- Типизация: `typescript`, `typescript-eslint`, `@types/*`
- Линтинг: `eslint`, `@eslint/js`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `globals`
- Стили: `sass`

Сторонних UI-библиотек, иконочных наборов и state-менеджеров нет.

---

## Что не входит

- Автоматические тесты
- Бэкенд, авторизация, синхронизация
- Сторонние UI-библиотеки, иконочные наборы
- Подмена favicon по темам

---

## Отклонения от исходного ТЗ

1. **SCSS + дополнительные модули** вместо минимальной стилизации
2. **Доменные данные в ядре** (`core/eventStore.ts`), React только рендерит. В React — UI-состояние (`version`, `selectedDate`, `isModalOpen`, `editingId`, `pendingDelete`, `theme`)
3. **SCSS только через `import './styles/style.scss'` в `main.tsx`**
4. **Запрет прошлого** — на двух уровнях: `disabled` на кнопке edit + проверка в валидаторах
5. **Все поля редактируемые в edit**, включая дату
6. **Чекбокс «Весь день»** ставится автоматически только в edit, если событие изначально на весь день

---