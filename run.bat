@echo off
chcp 65001 >nul
title WikiVision v1.0-beta - AI Smart Wikipedia Reader

echo ============================================================
echo      WikiVision v1.0-beta — Книжный ридер Википедии с ИИ
echo ============================================================
echo.

set CONFIG_FILE=%~dp0config.env
set WEB_CONFIG=%~dp0web-reader\config.local.json
set GROQ_KEY=
set BOTHUB_KEY=
set BOTHUB_MODEL=gpt-4o
set DEEPSEEK_KEY=
set OPENAI_KEY=
set OPENROUTER_KEY=
set GEMINI_KEY=
set AI_PROVIDER=groq

if exist "%CONFIG_FILE%" (
    for /f "usebackq tokens=1,* delims==" %%A in ("%CONFIG_FILE%") do (
        if "%%A"=="GROQ_API_KEY" set GROQ_KEY=%%B
        if "%%A"=="BOTHUB_API_KEY" set BOTHUB_KEY=%%B
        if "%%A"=="BOTHUB_MODEL" set BOTHUB_MODEL=%%B
        if "%%A"=="DEEPSEEK_API_KEY" set DEEPSEEK_KEY=%%B
        if "%%A"=="OPENAI_API_KEY" set OPENAI_KEY=%%B
        if "%%A"=="OPENROUTER_API_KEY" set OPENROUTER_KEY=%%B
        if "%%A"=="GEMINI_API_KEY" set GEMINI_KEY=%%B
        if "%%A"=="AI_PROVIDER" set AI_PROVIDER=%%B
    )
)

:check_keys
if "%GROQ_KEY%"=="" if "%BOTHUB_KEY%"=="" if "%DEEPSEEK_KEY%"=="" if "%OPENAI_KEY%"=="" if "%OPENROUTER_KEY%"=="" if "%GEMINI_KEY%"=="" (
    echo [WikiVision] API ключ для ИИ-пояснений не найден.
    echo ИИ нужен для генерации аналогий "на пальцах" при клике на термины.
    echo.
    echo Выберите предпочтительного провайдера:
    echo   [1] Groq (Рекомендуется: БЕСПЛАТНО НАВСЕГДА, мгновенные ответы, без карты)
    echo   [2] BotHub (Рекомендуется для РФ: без VPN, оплата картами МИР/СБП)
    echo   [3] DeepSeek (Ультра-дешевый и умный, официальный API)
    echo   [4] OpenAI Official (GPT-4o mini, требуется иностранная карта и VPN)
    echo   [5] OpenRouter (200+ моделей в одном ключе)
    echo   [6] Google Gemini (Бесплатный ключ, ТРЕБУЕТСЯ VPN в РФ)
    echo   [7] Пропустить настройку ключа (ввести позже в интерфейсе)
    echo.
    set /p PCHOICE="Ваш выбор [1-7] (по умолчанию 1): "
    if "%PCHOICE%"=="" set PCHOICE=1

    if "%PCHOICE%"=="1" (
        set AI_PROVIDER=groq
        echo.
        echo Получить бесплатный Groq ключ: https://console.groq.com/keys
        set /p GROQ_KEY=">>> Вставьте Groq API Key (gsk_...): "
    )
    if "%PCHOICE%"=="2" (
        set AI_PROVIDER=bothub
        echo.
        echo Получить BotHub ключ: https://bothub.chat
        set /p BOTHUB_KEY=">>> Вставьте BotHub API Key: "
        set BOTHUB_MODEL=gpt-4o
    )
    if "%PCHOICE%"=="3" (
        set AI_PROVIDER=deepseek
        echo.
        echo Получить DeepSeek ключ: https://platform.deepseek.com/api_keys
        set /p DEEPSEEK_KEY=">>> Вставьте DeepSeek API Key (sk-...): "
    )
    if "%PCHOICE%"=="4" (
        set AI_PROVIDER=openai
        echo.
        echo Получить OpenAI ключ: https://platform.openai.com/api-keys
        set /p OPENAI_KEY=">>> Вставьте OpenAI API Key (sk-...): "
    )
    if "%PCHOICE%"=="5" (
        set AI_PROVIDER=openrouter
        echo.
        echo Получить OpenRouter ключ: https://openrouter.ai/keys
        set /p OPENROUTER_KEY=">>> Вставьте OpenRouter API Key (sk-or-...): "
    )
    if "%PCHOICE%"=="6" (
        set AI_PROVIDER=gemini
        echo.
        echo Получить Gemini ключ: https://aistudio.google.com/app/apikey
        set /p GEMINI_KEY=">>> Вставьте Google Gemini Key (AIzaSy...): "
    )
    
    (
        echo AI_PROVIDER=%AI_PROVIDER%
        if not "%GROQ_KEY%"=="" echo GROQ_API_KEY=%GROQ_KEY%
        if not "%BOTHUB_KEY%"=="" echo BOTHUB_API_KEY=%BOTHUB_KEY%
        if not "%BOTHUB_KEY%"=="" echo BOTHUB_MODEL=%BOTHUB_MODEL%
        if not "%DEEPSEEK_KEY%"=="" echo DEEPSEEK_API_KEY=%DEEPSEEK_KEY%
        if not "%OPENAI_KEY%"=="" echo OPENAI_API_KEY=%OPENAI_KEY%
        if not "%OPENROUTER_KEY%"=="" echo OPENROUTER_API_KEY=%OPENROUTER_KEY%
        if not "%GEMINI_KEY%"=="" echo GEMINI_API_KEY=%GEMINI_KEY%
    ) > "%CONFIG_FILE%"
    echo [Notify] Настройки успешно сохранены в config.env!
    echo.
)

(
    echo {
    echo   "AI_PROVIDER": "%AI_PROVIDER%",
    echo   "GROQ_API_KEY": "%GROQ_KEY%",
    echo   "BOTHUB_API_KEY": "%BOTHUB_KEY%",
    echo   "BOTHUB_MODEL": "%BOTHUB_MODEL%",
    echo   "DEEPSEEK_API_KEY": "%DEEPSEEK_KEY%",
    echo   "OPENAI_API_KEY": "%OPENAI_KEY%",
    echo   "OPENROUTER_API_KEY": "%OPENROUTER_KEY%",
    echo   "GEMINI_API_KEY": "%GEMINI_KEY%"
    echo }
) > "%WEB_CONFIG%"

if not "%GROQ_KEY%"=="" echo [Notify] Groq API Key активен (Llama 3.3, бесплатно, сверхбыстро)
if not "%BOTHUB_KEY%"=="" echo [Notify] BotHub API Key активен (Модель: %BOTHUB_MODEL%, без VPN)
if not "%DEEPSEEK_KEY%"=="" echo [Notify] DeepSeek API Key активен (deepseek-chat)
if not "%OPENAI_KEY%"=="" echo [Notify] OpenAI API Key активен (GPT-4o mini)
if not "%OPENROUTER_KEY%"=="" echo [Notify] OpenRouter API Key активен
if not "%GEMINI_KEY%"=="" echo [Notify] Google Gemini API Key активен (требуется VPN)
echo [Notify] Активный провайдер: %AI_PROVIDER%
echo.
echo [Notify] Система WikiVision v1.0-beta готова к работе!
echo.
echo Выберите режим запуска:
echo   [1] Запустить Web Reader (Книжный ридер на http://localhost:8080)
echo   [2] Настроить / Сменить API ключи
echo   [3] Выход
echo.

set /p CHOICE="Выберите пункт [1-3] (по умолчанию 1): "
if "%CHOICE%"=="" set CHOICE=1

if "%CHOICE%"=="1" goto launch_web_reader
if "%CHOICE%"=="2" goto reconfigure_keys
if "%CHOICE%"=="3" goto exit_app

:reconfigure_keys
set GROQ_KEY=
set BOTHUB_KEY=
set DEEPSEEK_KEY=
set OPENAI_KEY=
set OPENROUTER_KEY=
set GEMINI_KEY=
goto check_keys

:launch_web_reader
echo.
echo [Запуск] Поднимаем локальный веб-сервер WikiVision...
start /b python "%~dp0web-reader\server.py" >nul 2>&1
timeout /t 2 >nul
echo [Запуск] Открываем WikiVision Web Reader в браузере...
start http://localhost:8080
echo.
echo ============================================================
echo WikiVision v1.0-beta запущен на http://localhost:8080
echo Для завершения работы просто закройте это окно.
echo ============================================================
pause >nul
goto exit_app

:exit_app
exit

