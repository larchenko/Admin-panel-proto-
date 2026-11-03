# Розгортання на безкоштовному хостингу

**Hugging Face Spaces**, безкоштовне залізо «CPU basic»: 2 vCPU, 16 ГБ RAM, Docker.
Інші безкоштовні варіанти (Render, Koyeb, Fly) дають 512 МБ RAM, а моделям потрібно
близько 2 ГБ.

Код у Space потрапляє автоматично з GitHub: `.github/workflows/wheel-swap-space.yml`
копіює папку `wheel-swap/` у Space, а Space сам збирає Docker-образ (`Dockerfile`).
З хмарної сесії Claude сайт huggingface.co недоступний, тому розгортає GitHub Actions.

## Один раз

1. **GitHub-доступ для Claude**: встановити Claude GitHub App на репозиторій
   (https://github.com/apps/claude/installations/select_target) або перепідключити
   GitHub у налаштуваннях claude.ai — інакше код не потрапить на GitHub.
2. **Акаунт на https://huggingface.co** (безкоштовно).
3. **Новий Space**: New → Space → назва `wheel-swap`, SDK **Docker** (Blank),
   залізо **CPU basic · Free**, Public.
4. **Токен**: Settings → Access Tokens → New token, тип **Write**. Скопіювати.
5. **GitHub → репозиторій → Settings → Secrets and variables → Actions**:
   - вкладка Secrets → New repository secret: `HF_TOKEN` = токен з кроку 4;
   - вкладка Variables → New repository variable: `HF_SPACE` = `ваш-логін/wheel-swap`.

## Кожного разу

- Злиття змін у `main` (якщо змінено щось у `wheel-swap/`) — розгортання само.
- Або вручну: GitHub → Actions → «Wheel Swap → Hugging Face Space» → Run workflow
  (можна обрати будь-яку гілку).

Збірка образу на стороні Hugging Face — близько 10 хвилин (torch, ваги моделей
~400 МБ вшиваються в образ). Адреса: `https://huggingface.co/spaces/ваш-логін/wheel-swap`.

## Що знати

- Безкоштовний Space засинає після 48 годин без відвідувачів; перший запит після сну
  чекає, поки контейнер прокинеться (близько хвилини).
- Обробка одного фото на 2 vCPU — орієнтовно 4–8 с (у сесії розробки на 4 ядрах ~2 с).
- Ultralytics YOLO має ліцензію AGPL-3.0: для публічного вебсервісу код має бути
  відкритим. Публічний Space з кодом цю умову виконує.
- Docker-образ у сесії розробки не збирався (сервер PyTorch звідти недоступний);
  перша збірка на Hugging Face — і є перевірка. Лог збірки — вкладка Logs у Space.
