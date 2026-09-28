# Графика, музыка и звук

**LOW WATER / Низкая вода** — самостоятельная история и реализация. Название This Is the Police используется только для обозначения источника вдохновения механиками.

## Оригинальные материалы

Сюжет, персонажи, английские реплики, русский перевод, 14 SVG-иллюстраций и игровой интерфейс созданы для этого проекта. Исходник рисунков: `scripts/draw_art.py`. Сирена `siren.wav` синтезирована этим проектом.

## Музыка

- **Night Watch** — 114,886 секунды, оригинальная инструментальная композиция, созданная через Polza AI моделью `google/lyria-3-pro-preview`.
- **Low Tide** — 121,130 секунды, та же модель.

Промпты сохранены в `scripts/generate_audio.py`. В ролике музыкальное сопровождение обработано эквалайзером и автоматикой громкости для разборчивости речи.

## Голоса

17 английских реплик: **Google Gemini 3.8 Flash TTS** через Polza AI (`google/gemini-3.8-flash-tts`). Тексты, выбранные голоса и русские субтитры — `public/assets/dialogue.json`. Файлы перекодированы в MP3. Игра не использует браузерный синтез речи.

## Звуковые эффекты из GitHub

[UI SFX — romainsimon/uisfx](https://github.com/romainsimon/uisfx), снимок `9950fe66f993a6660dab9c2651dcbcd899ffd83b`. Звуковые файлы опубликованы авторами под **CC0 1.0**. Текст лицензии включён: `public/assets/audio/LICENSE-UISFX.txt`.

| Файл в игре | Оригинал в `packages/uisfx/sounds/` |
| --- | --- |
| `click.mp3` | `mechanical/select.mp3` |
| `radio.mp3` | `cinematic/notification.mp3` |
| `success.mp3` | `mechanical/success.mp3` |
| `warning.mp3` | `cinematic/warning.mp3` |
| `paper.mp3` | `mechanical/open.mp3` |

## Шрифт

Oswald, [Google Fonts](https://github.com/google/fonts/tree/main/ofl/oswald), **SIL Open Font License 1.1**. Файл шрифта и лицензия включены в `public/assets/fonts/`.

## Инструменты

Vite — сборка игры. Playwright — браузерная проверка. GSAP и HyperFrames — вступительный ролик. FFmpeg — подготовка аудио и проверка видео.
