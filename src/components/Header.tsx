interface HeaderProps {
  onAddClick: () => void;
  onThemeToggle: () => void;
}

export function Header({ onAddClick, onThemeToggle }: HeaderProps) {
  return (
    <header className="header">
      <img className="header__logo" src="/svg/logo.svg" alt="Логотип" />
      <h1 className="header__title">Список мероприятий</h1>
      <button className="header__button" type="button" onClick={onAddClick}>
        Добавить
      </button>
      <button className="header__button-theme" type="button" onClick={onThemeToggle}>
        <img className="header__theme" src="/svg/light.svg" alt="Переключить тему" />
      </button>
    </header>
  );
}