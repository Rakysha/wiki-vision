/**
 * WikiVision v1.0-beta — Core Application Engine
 * Synchronous word-by-word speech synthesis, contextual multi-provider AI mentor,
 * noise-free Wikipedia DOM parser, and multi-tier content gating.
 */

(() => {
  // --- СОСТОЯНИЕ ПРИЛОЖЕНИЯ ---
  const state = {
    aiProvider: localStorage.getItem('wv_ai_provider') || (localStorage.getItem('wv_groq_api_key') ? 'groq' : (localStorage.getItem('wv_bothub_api_key') ? 'bothub' : (localStorage.getItem('wv_deepseek_api_key') ? 'deepseek' : 'groq'))),
    openaiApiKey: localStorage.getItem('wv_openai_api_key') || '',
    geminiApiKey: localStorage.getItem('wv_gemini_api_key') || '',
    claudeApiKey: localStorage.getItem('wv_claude_api_key') || '',
    groqApiKey: localStorage.getItem('wv_groq_api_key') || '',
    deepseekApiKey: localStorage.getItem('wv_deepseek_api_key') || '',
    openrouterApiKey: localStorage.getItem('wv_openrouter_api_key') || '',
    bothubApiKey: localStorage.getItem('wv_bothub_api_key') || '',
    apiKey: '', // обратная совместимость
    ageFilterEnabled: localStorage.getItem('wv_age_filter') !== 'false',
    lang: localStorage.getItem('wv_lang') || 'ru',
    theme: localStorage.getItem('wv_theme') || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),

    articleTitle: '',
    paragraphs: [],
    chapters: [],
    currentChapterIdx: 0,
    currentParagraphIdx: 0,
    currentWordIdx: 0,

    isPlaying: false,
    isPaused: false,
    isExplaining: false,
    is18Plus: false,
    userAccepted18Plus: false,

    speechRate: parseFloat(localStorage.getItem('wv_speech_rate') || '1.0'),
    selectedVoice: null,
    voices: [],
    activeUtterance: null,
    explanationUtterance: null,
    totalWordsCount: 0,
    wordsReadCount: 0
  };

  const PROVIDER_NAMES = {
    groq: 'Groq',
    bothub: 'BotHub',
    deepseek: 'DeepSeek',
    openai: 'OpenAI',
    openrouter: 'OpenRouter',
    claude: 'Anthropic Claude',
    gemini: 'Google Gemini'
  };

  function getActiveApiKey() {
    switch (state.aiProvider) {
      case 'openai': return state.openaiApiKey;
      case 'gemini': return state.geminiApiKey;
      case 'claude': return state.claudeApiKey;
      case 'groq': return state.groqApiKey;
      case 'deepseek': return state.deepseekApiKey;
      case 'openrouter': return state.openrouterApiKey;
      case 'bothub': return state.bothubApiKey;
      default: return '';
    }
  }

  // Синхронизация основного ключа
  state.apiKey = getActiveApiKey();

  // --- ЭЛЕМЕНТЫ DOM ---
  const el = {
    brandLogo: document.getElementById('brand-logo'),
    inputSearch: document.getElementById('input-wiki-search'),
    btnSearch: document.getElementById('btn-search-go'),
    searchSuggestions: document.getElementById('search-suggestions'),
    listDirectMatches: document.getElementById('list-direct-matches'),
    listRelatedTopics: document.getElementById('list-related-topics'),
    presetChips: document.querySelectorAll('.preset-chip'),
    btnQuickStart: document.getElementById('btn-quick-start'),

    headerAgeIndicator: document.getElementById('header-age-indicator'),
    btnInstallPwa: document.getElementById('btn-install-pwa'),
    btnOpenSettings: document.getElementById('btn-open-settings'),
    btnThemeToggle: document.getElementById('btn-theme-toggle'),

    viewWelcome: document.getElementById('welcome-view'),
    viewLoading: document.getElementById('loading-view'),
    viewArticle: document.getElementById('article-view'),
    loadingArticleName: document.getElementById('loading-article-name'),

    btnCloseArticle: document.getElementById('btn-close-article'),
    articleTitle: document.getElementById('article-title'),
    articleBody: document.getElementById('article-body'),
    articleLead: document.getElementById('article-lead'),
    metaWordCount: document.getElementById('meta-word-count'),
    metaParagraphCount: document.getElementById('meta-paragraph-count'),
    metaReadingTime: document.getElementById('meta-reading-time'),
    metaAgeBadge: document.getElementById('meta-age-badge'),

    btnToggleToc: document.getElementById('btn-toggle-toc'),
    tocDropdown: document.getElementById('toc-dropdown'),

    chapterTrackerCard: document.getElementById('chapter-tracker-card'),
    activeChapterName: document.getElementById('active-chapter-name'),
    chapterLineFill: document.getElementById('chapter-line-fill'),
    chapterCounter: document.getElementById('chapter-counter'),

    playerBar: document.getElementById('player-bar'),
    btnPlayPause: document.getElementById('btn-play-pause'),
    playIcon: document.getElementById('play-icon'),
    pauseIcon: document.getElementById('pause-icon'),
    playText: document.getElementById('play-text'),
    btnExplainCurrent: document.getElementById('btn-explain-current'),
    explainHintPopover: document.getElementById('explain-hint-popover'),
    playerTitleInfo: document.getElementById('player-title-info'),
    playerStatusText: document.getElementById('player-status-text'),
    progressTrack: document.getElementById('progress-track'),
    progressFill: document.getElementById('progress-fill'),
    selectRate: document.getElementById('select-rate'),
    selectVoice: document.getElementById('select-voice'),

    modal18plusOverlay: document.getElementById('modal-18plus-overlay'),
    warningArticleName: document.getElementById('warning-article-name'),
    btn18plusAccept: document.getElementById('btn-18plus-accept'),
    btn18plusDecline: document.getElementById('btn-18plus-decline'),

    modalAnalogyOverlay: document.getElementById('modal-analogy-overlay'),
    modalAiProviderBadge: document.getElementById('modal-ai-provider-badge'),
    modalTermName: document.getElementById('modal-term-name'),
    modalAnalogyBody: document.getElementById('modal-analogy-body'),
    btnCloseAnalogy: document.getElementById('btn-close-analogy'),
    btnReplayAnalogy: document.getElementById('btn-replay-analogy'),
    btnContinueReading: document.getElementById('btn-continue-reading'),

    modalSettingsOverlay: document.getElementById('modal-settings-overlay'),
    settingsProvider: document.getElementById('settings-provider'),
    settingsGroupOpenai: document.getElementById('settings-group-openai'),
    settingsGroupGemini: document.getElementById('settings-group-gemini'),
    settingsGroupClaude: document.getElementById('settings-group-claude'),
    settingsGroupGroq: document.getElementById('settings-group-groq'),
    settingsGroupDeepseek: document.getElementById('settings-group-deepseek'),
    settingsGroupOpenrouter: document.getElementById('settings-group-openrouter'),
    settingsGroupBothub: document.getElementById('settings-group-bothub'),

    settingsOpenaiKey: document.getElementById('settings-openai-key'),
    settingsGeminiKey: document.getElementById('settings-gemini-key'),
    settingsClaudeKey: document.getElementById('settings-claude-key'),
    settingsGroqKey: document.getElementById('settings-groq-key'),
    settingsDeepseekKey: document.getElementById('settings-deepseek-key'),
    settingsOpenrouterKey: document.getElementById('settings-openrouter-key'),
    settingsBothubKey: document.getElementById('settings-bothub-key'),

    toggleSettingsOpenai: document.getElementById('toggle-settings-openai'),
    toggleSettingsGemini: document.getElementById('toggle-settings-gemini'),
    toggleSettingsClaude: document.getElementById('toggle-settings-claude'),
    toggleSettingsGroq: document.getElementById('toggle-settings-groq'),
    toggleSettingsDeepseek: document.getElementById('toggle-settings-deepseek'),
    toggleSettingsOpenrouter: document.getElementById('toggle-settings-openrouter'),
    toggleSettingsBothub: document.getElementById('toggle-settings-bothub'),

    btnCloseSettings: document.getElementById('btn-close-settings'),
    btnSaveSettingsKey: document.getElementById('btn-save-settings-key'),
    btnTestSettingsKey: document.getElementById('btn-test-settings-key'),
    apiTestResult: document.getElementById('api-test-result')
  };

  // --- СЛОВАРЬ ПЕРЕВОДОВ (i18n: RU, EN, ZH) ---
  const TRANSLATIONS = {
    ru: {
      langName: 'Русский',
      searchPlaceholder: 'Что бы вы хотели узнать? (например, Википедия, квантовая механика...)',
      searchBtn: 'Загрузить',
      searchDirectTitle: '🔍 Статьи Википедии',
      searchRelatedTitle: '💡 Варианты для чтения (похожие темы)',
      searchGoTo: 'Перейти →',
      ageOn: '18+ Вкл',
      ageOff: '18+ Выкл',
      typewriterGreeting: 'Добро Пожаловать!',
      heroSub: 'WikiVision переводит статьи Википедии в живой формат —<br class="desktop-only"> с озвучкой, подсветкой слов и объяснениями от ИИ.',
      quickStartText: 'Читать прямо сейчас',
      popularLabel: 'Например:',
      presetChips: [
        { topic: 'Википедия', label: 'Википедия' },
        { topic: 'Квантовая механика', label: 'Квантовая механика' },
        { topic: 'Искусственный интеллект', label: 'ИИ' },
        { topic: 'Чёрная дыра', label: 'Чёрная дыра' }
      ],
      statArticlesNum: '6M+',
      statArticlesLabel: 'статей Википедии',
      statLanguagesNum: '50+',
      statLanguagesLabel: 'языков',
      statPriceNum: '0₽',
      statPriceLabel: 'без регистрации',
      featureLabel: 'Мы умеем:',
      card1Title: 'Фильтрация шума',
      card1Desc: 'Вырезаем сноски, ссылки и служебные блоки — остаётся только суть.',
      card1Step: '1 из 3',
      card2Title: 'Синхронная рамка',
      card2Desc: 'Слово за словом — читаешь и слушаешь одновременно, не теряя нить.',
      card2Step: '2 из 3',
      card3Title: 'ИИ-аналогии',
      card3Desc: 'Нажал на слово — ИИ объяснил его простыми словами и живым примером.',
      card3Step: '3 из 3',
      loadingLabel: 'АНАЛИЗИРУЕМ СТАТЬЮ',
      loadingDefaultName: '«Загрузка...»',
      loadingDesc: 'Очищаем текст, извлекаем структуру, списки и готовим голосовую дорожку',
      loadingStep1: 'Текст найден',
      loadingStep2: 'Структура',
      loadingStep3: 'Озвучка',
      articleToplineStatus: 'Статья готова к прослушиванию',
      closeArticle: 'Закрыть',
      eyebrow: 'ЭНЦИКЛОПЕДИЯ',
      wordsUnit: 'слов',
      paragraphsUnit: 'абзацев',
      readingTimeUnit: 'мин чтения',
      tocTitle: 'Содержание',
      chapterTrackerLabel: 'СЕЙЧАС ЧИТАЕМ',
      chapterIntro: 'Введение',
      chapterCounterFormat: (c, total) => `Глава ${c} из ${total}`,
      playText: 'Слушать',
      pauseText: 'Пауза',
      resumeText: 'Продолжить',
      explainBtn: 'Пояснить слово',
      explainTooltip: 'Объяснить выделенное/текущее слово через ИИ (Alt+E)',
      trackTooltip: 'Кликните для перемотки',
      explainHint: 'Кликните по любому слову в тексте — ИИ объяснит его «на пальцах» простыми словами.',
      playerStatusReady: 'Статья готова к озвучиванию',
      readingWord: (word, pct) => `Читаем: «${word}» (${pct}%)`,
      speedLabel: 'Скорость',
      voiceTooltip: 'Выбор голоса диктора',
      defaultVoice: 'Голос по умолчанию',
      warning18Title: 'Материал для взрослой аудитории',
      warning18Decline: 'Выбрать другую статью',
      warning18Accept: 'Подтверждаю, мне есть 18 лет',
      analogyBadge: (p) => `✨ ИИ-Пояснение (${p})`,
      analogyLoading: 'ИИ формулирует жизненную аналогию «на пальцах» и контекст термина...',
      replayAnalogy: 'Повторить озвучку',
      continueReading: 'Продолжить чтение ▶',
      analogySection1: '1. Аналогия',
      analogySection2: '2. Происхождение',
      analogySection3: '3. Контекст',
      keyPromptTitle: '🔑 Требуется API ключ',
      keyPromptDesc: 'Чтобы ИИ объяснял термины простыми словами, укажите API-ключ в настройках (рекомендуется <strong>Groq</strong>, <strong>BotHub</strong>, <strong>OpenAI</strong> или <strong>DeepSeek</strong>).',
      keyPromptBtn: 'Открыть настройки',
      errorFailedToGetResponse: 'Не удалось получить ответ:',
      errorCheckApiKey: 'Проверить API ключ',
      errorNoApiKey: (p) => `Не указан API-ключ для ${p}. Укажите его в настройках.`,
      errorBothubConnect: 'Не удалось связаться с BotHub API',
      errorGeminiConnect: 'Не удалось связаться с Gemini',
      errorUnknownProvider: 'Неизвестный провайдер или отсутствует API ключ.',
      defaultConceptTerm: 'это понятие',
      loadingRelated: 'Загружаются варианты...',
      errorLoadTitle: 'Ошибка загрузки',
      errorArticleTitle: 'Не удалось открыть статью',
      errorBackHome: 'Вернуться на главную',
      errorLoadMsg: (msg) => `Не удалось загрузить статью: ${msg}. Попробуйте уточнить название.`,
      errorEmptyText: 'В этой статье не найдено связного текста для чтения.',
      footerNote: 'Интерактивный компаньон нового поколения для чтения',
      footerLead: 'WikiVision создан исключительно в образовательных, информационных и познавательных целях.',
      footerSubtext: 'Wikipedia® и Wikimedia® являются зарегистрированными товарными знаками Wikimedia Foundation, Inc. WikiVision — независимое веб-приложение с открытым исходным кодом, не связанное с Wikimedia Foundation.',
      settingsTitle: 'API Ключи',
      settingsSubBadge: '⚙️ ИИ Провайдер',
      settingsProviderLabel: 'Провайдер',
      settingsTestBtn: 'Проверить подключение',
      settingsSaveBtn: 'Сохранить',
      togglePasswordTitle: 'Показать / скрыть ключ',
      closeModalTitle: 'Закрыть (Esc)',
      testEmpty: (p) => `Введите API-ключ для ${p}!`,
      testTesting: (p) => `Проверяем подключение к ${p}...`,
      testSuccess: (p) => `✅ ${p} успешно подключен!`,
      testError: (p, err) => `❌ Ошибка ${p}: ${err}`,
      getKeyText: 'Получить ключ:',
      apiKeySuffix: 'API Key',
      warning18Badge: '🔞 Предупреждение 18+',
      warning18Desc: (title) => `Статья <strong>${title}</strong> может содержать материалы или темы, предназначенные строго для пользователей старше 18 лет.`,
      warning18Subtext: 'Вы подтверждаете, что вам исполнилось 18 лет и вы хотите продолжить чтение?',
      footerAgeNotice: 'Учтите, что статьи Википедии могут содержать материалы 18+.',
      apiKeyTooltip: 'Настройки ИИ и API-ключи',
      androidBtnSub: 'Доступно для смартфона и авто',
      androidBtnMain: 'Скачать на Android',
      androidBtnTitle: 'Скачать приложение WikiVision на Android',
      themeToggleTooltip: 'Переключить тему (Светлая / Тёмная)',
      themeLight: 'Светлая',
      themeDark: 'Тёмная',
      brandTooltip: 'На главную страницу',
      searchAria: 'Поиск статьи Википедии',
      langSwitchAria: 'Выбор языка',
      ageToggleTooltip: 'Фильтр материалов 18+ (кликните для переключения)',
      closeArticleTitle: 'Закрыть статью и вернуться',
      installPwaTooltip: 'Установить приложение WikiVision'
    },
    en: {
      langName: 'English',
      searchPlaceholder: 'What would you like to learn? (e.g., Wikipedia, Quantum mechanics...)',
      searchBtn: 'Load',
      searchDirectTitle: '🔍 Wikipedia Articles',
      searchRelatedTitle: '💡 Related topics for reading',
      searchGoTo: 'Open →',
      ageOn: '18+ On',
      ageOff: '18+ Off',
      typewriterGreeting: 'Welcome!',
      heroSub: 'WikiVision brings Wikipedia articles to life —<br class="desktop-only"> with audio narration, synchronized word highlighting, and AI analogies.',
      quickStartText: 'Read right now',
      popularLabel: 'Examples:',
      presetChips: [
        { topic: 'Wikipedia', label: 'Wikipedia' },
        { topic: 'Quantum mechanics', label: 'Quantum mechanics' },
        { topic: 'Artificial intelligence', label: 'AI' },
        { topic: 'Black hole', label: 'Black hole' }
      ],
      statArticlesNum: '6.8M+',
      statArticlesLabel: 'Wikipedia articles',
      statLanguagesNum: '300+',
      statLanguagesLabel: 'languages',
      statPriceNum: '$0',
      statPriceLabel: 'no sign-up required',
      featureLabel: 'Key capabilities:',
      card1Title: 'Noise Filtering',
      card1Desc: 'Removing footnotes, citations, and cluttered blocks — leaving only the essence.',
      card1Step: '1 of 3',
      card2Title: 'Sync Reading Frame',
      card2Desc: 'Word by word — listen and read simultaneously without losing your place.',
      card2Step: '2 of 3',
      card3Title: 'AI Analogies',
      card3Desc: 'Click any word — AI explains it in plain language with real-world examples.',
      card3Step: '3 of 3',
      loadingLabel: 'ANALYZING ARTICLE',
      loadingDefaultName: '“Loading...”',
      loadingDesc: 'Cleaning text, extracting structure, headings, and preparing voice tracks',
      loadingStep1: 'Text found',
      loadingStep2: 'Structure',
      loadingStep3: 'Voice track',
      articleToplineStatus: 'Article is ready for listening',
      closeArticle: 'Close',
      eyebrow: 'ENCYCLOPEDIA',
      wordsUnit: 'words',
      paragraphsUnit: 'paragraphs',
      readingTimeUnit: 'min read',
      tocTitle: 'Contents',
      chapterTrackerLabel: 'CURRENT CHAPTER',
      chapterIntro: 'Introduction',
      chapterCounterFormat: (c, total) => `Chapter ${c} of ${total}`,
      playText: 'Listen',
      pauseText: 'Pause',
      resumeText: 'Resume',
      explainBtn: 'Explain word',
      explainTooltip: 'Explain selected/current word with AI (Alt+E)',
      trackTooltip: 'Click to seek',
      explainHint: 'Click any word in the text — AI will explain it in simple terms with everyday analogies.',
      playerStatusReady: 'Ready for voice narration',
      readingWord: (word, pct) => `Reading: “${word}” (${pct}%)`,
      speedLabel: 'Speed',
      voiceTooltip: 'Select narrator voice',
      defaultVoice: 'Default voice',
      warning18Title: 'Adult & Mature Content',
      warning18Decline: 'Choose another article',
      warning18Accept: 'I confirm, I am 18+ years old',
      analogyBadge: (p) => `✨ AI Explanation (${p})`,
      analogyLoading: 'AI is formulating an intuitive real-world analogy and term context...',
      replayAnalogy: 'Replay audio',
      continueReading: 'Continue reading ▶',
      analogySection1: '1. Analogy',
      analogySection2: '2. Origin',
      analogySection3: '3. Context',
      keyPromptTitle: '🔑 API Key Required',
      keyPromptDesc: 'To allow AI to generate intuitive analogies and explanations, please configure your API Key in settings (recommended: <strong>Groq</strong>, <strong>BotHub</strong>, <strong>OpenAI</strong> or <strong>DeepSeek</strong>).',
      keyPromptBtn: 'Open Settings',
      errorFailedToGetResponse: 'Failed to get response:',
      errorCheckApiKey: 'Check API Key',
      errorNoApiKey: (p) => `API key is not specified for ${p}. Please provide it in settings.`,
      errorBothubConnect: 'Failed to connect to BotHub API',
      errorGeminiConnect: 'Failed to connect to Gemini',
      errorUnknownProvider: 'Unknown provider or missing API key.',
      defaultConceptTerm: 'this concept',
      loadingRelated: 'Loading suggestions...',
      errorLoadTitle: 'Failed to load',
      errorArticleTitle: 'Unable to open article',
      errorBackHome: 'Return to Home',
      errorLoadMsg: (msg) => `Failed to load article: ${msg}. Try refining the title.`,
      errorEmptyText: 'No readable text content found in this article.',
      footerNote: 'Next-generation interactive reading companion',
      footerLead: 'WikiVision is designed solely for educational, informational, and entertainment purposes.',
      footerSubtext: 'Wikipedia® and Wikimedia® are registered trademarks of the Wikimedia Foundation, Inc. WikiVision is an independent open-source web application and is not affiliated with, endorsed by, or sponsored by the Wikimedia Foundation.',
      settingsTitle: 'API Keys',
      settingsSubBadge: '⚙️ AI Provider',
      settingsProviderLabel: 'Provider',
      settingsTestBtn: 'Test Connection',
      settingsSaveBtn: 'Save',
      togglePasswordTitle: 'Show / hide key',
      closeModalTitle: 'Close (Esc)',
      testEmpty: (p) => `Please enter an API key for ${p}!`,
      testTesting: (p) => `Testing connection to ${p}...`,
      testSuccess: (p) => `✅ ${p} connected successfully!`,
      testError: (p, err) => `❌ ${p} error: ${err}`,
      getKeyText: 'Get API key:',
      apiKeySuffix: 'API Key',
      warning18Badge: '🔞 18+ Warning',
      warning18Desc: (title) => `The article <strong>${title}</strong> may contain materials or themes intended strictly for users over 18 years old.`,
      warning18Subtext: 'Do you confirm that you are 18+ years old and wish to continue reading?',
      footerAgeNotice: 'Please note that Wikipedia articles may contain 18+ content.',
      apiKeyTooltip: 'AI Settings & API Keys',
      androidBtnSub: 'Available for phone & car',
      androidBtnMain: 'Download for Android',
      androidBtnTitle: 'Download WikiVision for Android',
      themeToggleTooltip: 'Toggle theme (Light / Dark)',
      themeLight: 'Light',
      themeDark: 'Dark',
      brandTooltip: 'To main page',
      searchAria: 'Search Wikipedia article',
      langSwitchAria: 'Language selection',
      ageToggleTooltip: '18+ Mature content filter (click to toggle)',
      closeArticleTitle: 'Close article and return',
      installPwaTooltip: 'Install WikiVision app'
    },
    zh: {
      langName: '中文',
      searchPlaceholder: '你想了解什么？（例如：维基百科、量子力学...）',
      searchBtn: '加载',
      searchDirectTitle: '🔍 维基百科条目',
      searchRelatedTitle: '💡 相关推荐主题',
      searchGoTo: '查看 →',
      ageOn: '18+ 开启',
      ageOff: '18+ 关闭',
      typewriterGreeting: '欢迎光临！',
      heroSub: 'WikiVision 将维基百科转化为生动格式 —<br class="desktop-only"> 配备语音朗读、逐字同步高亮和AI通俗讲解。',
      quickStartText: '立即阅读',
      popularLabel: '例如：',
      presetChips: [
        { topic: '维基百科', label: '维基百科' },
        { topic: '量子力学', label: '量子力学' },
        { topic: '人工智能', label: '人工智能' },
        { topic: '黑洞', label: '黑洞' }
      ],
      statArticlesNum: '140万+',
      statArticlesLabel: '中文维基条目',
      statLanguagesNum: '300+',
      statLanguagesLabel: '种语言版本',
      statPriceNum: '¥0',
      statPriceLabel: '完全免费免注册',
      featureLabel: '我们的特色：',
      card1Title: '过滤杂讯',
      card1Desc: '自动去除多余角标、无关链接与冗余信息，只保留最纯粹的核心知识。',
      card1Step: '第 1 / 3 项',
      card2Title: '逐字同步画框',
      card2Desc: '边听边读，语速与焦点同步推进，彻底告别走神与迷失段落。',
      card2Step: '第 2 / 3 项',
      card3Title: 'AI通俗比喻',
      card3Desc: '随时点击生僻词汇——AI立刻用生动的生活比喻与大白话为你解惑。',
      card3Step: '第 3 / 3 项',
      loadingLabel: '正在解析文章',
      loadingDefaultName: '《加载中...》',
      loadingDesc: '正在净化正文排版、提取目录层级并加载高品质语音',
      loadingStep1: '正文已就绪',
      loadingStep2: '章节结构',
      loadingStep3: '语音引擎',
      articleToplineStatus: '文章已准备就绪，可以朗读',
      closeArticle: '关闭',
      eyebrow: '百科全书',
      wordsUnit: '词',
      paragraphsUnit: '段落',
      readingTimeUnit: '分钟阅读',
      tocTitle: '目录',
      chapterTrackerLabel: '当前阅读章节',
      chapterIntro: '引言',
      chapterCounterFormat: (c, total) => `第 ${c} / ${total} 章`,
      playText: '朗读',
      pauseText: '暂停',
      resumeText: '继续',
      explainBtn: '解释词汇',
      explainTooltip: '通过 AI 解释当前/选中的词汇 (Alt+E)',
      trackTooltip: '点击以跳转进度',
      explainHint: '点击正文中的任意词汇——AI将用通俗生动的生活比喻为你解惑。',
      playerStatusReady: '准备就绪，随时可播放',
      readingWord: (word, pct) => `正在朗读：“${word}” (${pct}%)`,
      speedLabel: '语速',
      voiceTooltip: '选择朗读语音',
      defaultVoice: '默认语音',
      warning18Title: '成人敏感内容提示',
      warning18Decline: '选择其他条目',
      warning18Accept: '我已年满18周岁，继续阅读',
      analogyBadge: (p) => `✨ AI通俗解读 (${p})`,
      analogyLoading: 'AI正在提炼生动生活比喻与词汇背景...',
      replayAnalogy: '重新朗读',
      continueReading: '继续阅读 ▶',
      analogySection1: '1. 通俗比喻',
      analogySection2: '2. 词汇起源',
      analogySection3: '3. 语境作用',
      keyPromptTitle: '🔑 需要配置 API 密钥',
      keyPromptDesc: '为使 AI 能够生成通俗易懂的生活比喻与解析，请在设置中配置 API 密钥（推荐 <strong>Groq</strong>、<strong>BotHub</strong>、<strong>OpenAI</strong> 或 <strong>DeepSeek</strong>）。',
      keyPromptBtn: '打开设置',
      errorFailedToGetResponse: '获取回答失败：',
      errorCheckApiKey: '检查 API 密钥',
      errorNoApiKey: (p) => `未配置 ${p} 的 API 密钥。请在设置中添加。`,
      errorBothubConnect: '无法连接至 BotHub API',
      errorGeminiConnect: '无法连接至 Gemini',
      errorUnknownProvider: '未知提供商或缺少 API 密钥。',
      defaultConceptTerm: '该概念',
      loadingRelated: '正在加载推荐...',
      errorLoadTitle: '加载失败',
      errorArticleTitle: '无法打开该条目',
      errorBackHome: '返回主页',
      errorLoadMsg: (msg) => `加载条目失败：${msg}。请尝试调整标题。`,
      errorEmptyText: '此维基百科条目中未找到有效文本。',
      footerNote: '新一代交互式智能阅读伴侣',
      footerLead: 'WikiVision 仅用于教育、科普和知识获取目的。',
      footerSubtext: 'Wikipedia® 和 Wikimedia® 是维基媒体基金会的注册商标。WikiVision 是独立的开源 Web 应用，与维基媒体基金会无附属关系。',
      settingsTitle: 'API 密钥',
      settingsSubBadge: '⚙️ AI 提供商',
      settingsProviderLabel: '提供商',
      settingsTestBtn: '测试连接',
      settingsSaveBtn: '保存',
      togglePasswordTitle: '显示 / 隐藏密钥',
      closeModalTitle: '关闭 (Esc)',
      testEmpty: (p) => `请输入 ${p} 的 API 密钥！`,
      testTesting: (p) => `正在测试 ${p} 连接...`,
      testSuccess: (p) => `✅ ${p} 连接成功！`,
      testError: (p, err) => `❌ ${p} 错误：${err}`,
      getKeyText: '获取密钥：',
      apiKeySuffix: 'API Key',
      warning18Badge: '🔞 18+ 成人内容提示',
      warning18Desc: (title) => `条目 <strong>${title}</strong> 可能包含仅适合 18 岁以上读者的内容。`,
      warning18Subtext: '您是否确认已满 18 周岁并希望继续阅读？',
      footerAgeNotice: '请注意，维基百科条目可能包含18+成人内容。',
      apiKeyTooltip: 'AI 设置与 API 密钥',
      androidBtnSub: '支持手机与车载',
      androidBtnMain: '下载 Android 版',
      androidBtnTitle: '下载 WikiVision Android 版',
      themeToggleTooltip: '切换主题（明亮 / 暗黑）',
      themeLight: '浅色',
      themeDark: '深色',
      brandTooltip: '返回主页',
      searchAria: '搜索维基百科条目',
      langSwitchAria: '选择语言',
      ageToggleTooltip: '18+ 敏感内容过滤（点击切换）',
      closeArticleTitle: '关闭文章并返回',
      installPwaTooltip: '安装 WikiVision 应用'
    }
  };

  // Переключение языка интерфейса и инфраструктуры
  function setLanguage(lang) {
    if (!TRANSLATIONS[lang]) return;
    state.lang = lang;
    localStorage.setItem('wv_lang', lang);

    const t = TRANSLATIONS[lang];

    // 1. Активное состояние кнопок флагов
    document.querySelectorAll('#lang-switch .lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });

    if (el.brandLogo) el.brandLogo.title = t.brandTooltip || '';
    const sensor = document.getElementById('topbar-sensor');
    if (sensor) sensor.title = t.topbarSensorTooltip || '';
    const langSwitch = document.getElementById('lang-switch');
    if (langSwitch) langSwitch.setAttribute('aria-label', t.langSwitchAria || '');

    // 2. Поисковая строка
    if (el.inputSearch) {
      el.inputSearch.placeholder = t.searchPlaceholder;
      el.inputSearch.setAttribute('aria-label', t.searchAria || '');
    }
    if (el.btnSearch) {
      const svg = el.btnSearch.querySelector('svg');
      el.btnSearch.innerHTML = `${t.searchBtn} `;
      if (svg) el.btnSearch.appendChild(svg);
    }
    const searchDirectTitle = document.getElementById('search-title-direct');
    if (searchDirectTitle) searchDirectTitle.innerText = t.searchDirectTitle;
    const searchRelatedTitle = document.getElementById('search-title-related');
    if (searchRelatedTitle) searchRelatedTitle.innerText = t.searchRelatedTitle;

    // 3. Возрастной индикатор
    updateAgeIndicator();
    const ageToggle = document.getElementById('age-toggle');
    if (ageToggle) ageToggle.title = t.ageToggleTooltip || '';

    // 4. Welcome экран
    const heroSub = document.getElementById('hero-subtext');
    if (heroSub) heroSub.innerHTML = t.heroSub;
    const btnQuickStartText = document.getElementById('btn-quick-start-text');
    if (btnQuickStartText) btnQuickStartText.innerText = t.quickStartText;
    const popularLabel = document.getElementById('popular-topics-label');
    if (popularLabel) popularLabel.innerText = t.popularLabel;

    // Чипы тем
    const heroTopics = document.querySelector('.hero-topics');
    if (heroTopics) {
      heroTopics.innerHTML = `<span class="popular-label" id="popular-topics-label">${t.popularLabel}</span>`;
      t.presetChips.forEach(item => {
        const chip = document.createElement('button');
        chip.className = 'preset-chip';
        chip.dataset.topic = item.topic;
        chip.innerText = item.label;
        chip.addEventListener('click', () => {
          el.inputSearch.value = item.topic;
          loadWikipediaArticle(item.topic);
        });
        heroTopics.appendChild(chip);
      });
      el.presetChips = heroTopics.querySelectorAll('.preset-chip');
    }

    // 5. Статистика
    const sArtNum = document.getElementById('stat-articles-num');
    if (sArtNum) sArtNum.innerText = t.statArticlesNum;
    const sArtLbl = document.getElementById('stat-articles-label');
    if (sArtLbl) sArtLbl.innerText = t.statArticlesLabel;
    const sLangNum = document.getElementById('stat-languages-num');
    if (sLangNum) sLangNum.innerText = t.statLanguagesNum;
    const sLangLbl = document.getElementById('stat-languages-label');
    if (sLangLbl) sLangLbl.innerText = t.statLanguagesLabel;
    const sPrNum = document.getElementById('stat-price-num');
    if (sPrNum) sPrNum.innerText = t.statPriceNum;
    const sPrLbl = document.getElementById('stat-price-label');
    if (sPrLbl) sPrLbl.innerText = t.statPriceLabel;

    // 6. Карточки преимуществ
    const featLbl = document.getElementById('feature-section-label');
    if (featLbl) featLbl.innerText = t.featureLabel;
    const c1Title = document.getElementById('card-feature-1-title');
    if (c1Title) c1Title.innerText = t.card1Title;
    const c1Desc = document.getElementById('card-feature-1-desc');
    if (c1Desc) c1Desc.innerText = t.card1Desc;
    const c1Step = document.getElementById('card-feature-1-step');
    if (c1Step) c1Step.innerText = t.card1Step;

    const c2Title = document.getElementById('card-feature-2-title');
    if (c2Title) c2Title.innerText = t.card2Title;
    const c2Desc = document.getElementById('card-feature-2-desc');
    if (c2Desc) c2Desc.innerText = t.card2Desc;
    const c2Step = document.getElementById('card-feature-2-step');
    if (c2Step) c2Step.innerText = t.card2Step;

    const c3Title = document.getElementById('card-feature-3-title');
    if (c3Title) c3Title.innerText = t.card3Title;
    const c3Desc = document.getElementById('card-feature-3-desc');
    if (c3Desc) c3Desc.innerText = t.card3Desc;
    const c3Step = document.getElementById('card-feature-3-step');
    if (c3Step) c3Step.innerText = t.card3Step;

    // 7. Loading экран
    const loadLbl = document.getElementById('loading-screen-label');
    if (loadLbl) loadLbl.innerText = t.loadingLabel;
    const loadDesc = document.getElementById('loading-screen-desc');
    if (loadDesc) loadDesc.innerText = t.loadingDesc;
    const s1Text = document.getElementById('loading-step-1-text');
    if (s1Text) s1Text.innerText = t.loadingStep1;
    const s2Text = document.getElementById('loading-step-2-text');
    if (s2Text) s2Text.innerText = t.loadingStep2;
    const s3Text = document.getElementById('loading-step-3-text');
    if (s3Text) s3Text.innerText = t.loadingStep3;

    // 8. Article экран
    const artStatus = document.getElementById('article-topline-status');
    if (artStatus) artStatus.innerText = t.articleToplineStatus;
    const btnCloseText = document.getElementById('btn-close-article-text');
    if (btnCloseText) btnCloseText.innerText = t.closeArticle;
    if (el.btnCloseArticle) el.btnCloseArticle.title = t.closeArticleTitle || t.closeArticle;
    const eyebrowText = document.getElementById('article-eyebrow-text');
    if (eyebrowText) eyebrowText.innerText = t.eyebrow;
    const tocText = document.getElementById('btn-toggle-toc-text');
    if (tocText) tocText.innerText = t.tocTitle;
    const chapTrackLbl = document.getElementById('chapter-tracker-label');
    if (chapTrackLbl) chapTrackLbl.innerText = t.chapterTrackerLabel;

    document.documentElement.lang = lang;
    document.title = 'WikiVision';

    // 9. Плеер
    updatePlayerUI();
    const expText = document.getElementById('explain-btn-text');
    if (expText) expText.innerText = t.explainBtn;
    const btnExplain = document.getElementById('btn-explain-current');
    if (btnExplain) btnExplain.title = t.explainTooltip || '';
    const progTrack = document.getElementById('progress-track');
    if (progTrack) progTrack.title = t.trackTooltip || '';
    if (el.explainHintPopover) el.explainHintPopover.innerText = t.explainHint;

    if (state.paragraphs && state.paragraphs[state.currentParagraphIdx]) {
      const p = state.paragraphs[state.currentParagraphIdx];
      const w = p.words ? p.words[state.currentWordIdx] : null;
      if (w && el.playerStatusText && (state.isPlaying || state.isPaused)) {
        let passedWords = 0;
        for (let i = 0; i < state.currentParagraphIdx; i++) {
          passedWords += state.paragraphs[i].words.length;
        }
        passedWords += state.currentWordIdx;
        const progressPct = state.totalWordsCount > 0
          ? Math.min(100, Math.round((passedWords / state.totalWordsCount) * 100))
          : 0;
        const currentWordText = w.cleanWord || w.text;
        if (typeof t.readingWord === 'function') {
          el.playerStatusText.innerText = t.readingWord(currentWordText, progressPct);
        } else if (state.lang === 'en') {
          el.playerStatusText.innerText = `Reading: “${currentWordText}” (${progressPct}%)`;
        } else if (state.lang === 'zh') {
          el.playerStatusText.innerText = `正在朗读：“${currentWordText}” (${progressPct}%)`;
        } else {
          el.playerStatusText.innerText = `Читаем: «${currentWordText}» (${progressPct}%)`;
        }
      } else if (el.playerStatusText && !state.isPlaying) {
        el.playerStatusText.innerText = t.playerStatusReady;
      }
    } else if (el.playerStatusText && !state.isPlaying) {
      el.playerStatusText.innerText = t.playerStatusReady;
    }
    const spdLbl = document.getElementById('player-speed-label');
    if (spdLbl) spdLbl.innerText = t.speedLabel;
    if (el.selectVoice) {
      el.selectVoice.title = t.voiceTooltip || 'Выбор голоса диктора';
      el.selectVoice.setAttribute('aria-label', t.voiceTooltip || 'Выбор голоса диктора');
    }

    // 10. Модальное 18+
    const wBadge = document.getElementById('warning-18plus-badge');
    if (wBadge) wBadge.innerText = t.warning18Badge;
    const wTitle = document.getElementById('warning-18plus-title');
    if (wTitle) wTitle.innerText = t.warning18Title;
    const wSub = document.getElementById('warning-18plus-subtext');
    if (wSub) wSub.innerText = t.warning18Subtext;
    if (el.btn18plusDecline) el.btn18plusDecline.innerText = t.warning18Decline;
    if (el.btn18plusAccept) el.btn18plusAccept.innerText = t.warning18Accept;

    // 11. Модальное аналогии
    if (el.btnReplayAnalogy) {
      const svg = el.btnReplayAnalogy.querySelector('svg');
      el.btnReplayAnalogy.innerHTML = '';
      if (svg) el.btnReplayAnalogy.appendChild(svg);
      el.btnReplayAnalogy.append(` ${t.replayAnalogy}`);
    }
    if (el.btnContinueReading) el.btnContinueReading.innerText = t.continueReading;
    if (el.btnCloseAnalogy) {
      el.btnCloseAnalogy.title = t.closeModalTitle;
      el.btnCloseAnalogy.setAttribute('aria-label', t.closeModalTitle);
    }
    if (el.modalAiProviderBadge) {
      const providerName = PROVIDER_NAMES[state.aiProvider] || 'AI';
      el.modalAiProviderBadge.innerText = t.analogyBadge(providerName);
    }
    if (state.isExplaining && !getActiveApiKey()) {
      renderModalKeyPrompt();
    }

    // 12. Подвал и настройки
    const fNote = document.getElementById('footer-note-text');
    if (fNote) fNote.innerText = t.footerNote;
    const fLead = document.getElementById('footer-lead-text');
    if (fLead) fLead.innerText = t.footerLead;
    const fSub = document.getElementById('footer-subtext-text');
    if (fSub) fSub.innerText = t.footerSubtext;
    const fAgeNotice = document.getElementById('footer-age-notice-text');
    if (fAgeNotice) fAgeNotice.innerText = t.footerAgeNotice;
    if (el.btnInstallPwa) {
      el.btnInstallPwa.title = t.installPwaTooltip || 'Установить приложение';
      el.btnInstallPwa.setAttribute('aria-label', t.installPwaTooltip || 'Установить приложение');
    }
    if (el.btnOpenSettings) el.btnOpenSettings.title = t.apiKeyTooltip;
    if (el.btnThemeToggle) {
      const tooltip = t.themeToggleTooltip || 'Переключить тему';
      const currentName = state.theme === 'dark' ? (t.themeDark || 'Тёмная') : (t.themeLight || 'Светлая');
      el.btnThemeToggle.title = `${tooltip} (${currentName})`;
      el.btnThemeToggle.setAttribute('aria-label', `${tooltip}: ${currentName}`);
    }

    const fDownloadSub = document.getElementById('footer-download-sub');
    if (fDownloadSub && t.androidBtnSub) fDownloadSub.innerText = t.androidBtnSub;
    const fDownloadMain = document.getElementById('footer-download-main');
    if (fDownloadMain && t.androidBtnMain) fDownloadMain.innerText = t.androidBtnMain;
    const btnDownload = document.getElementById('btn-download-android');
    if (btnDownload && t.androidBtnTitle) btnDownload.title = t.androidBtnTitle;

    updateSettingsModalTranslations();

    // 13. Обновление метаданных открытой статьи, если она активна
    if (state.totalWordsCount > 0) {
      const localeMap = { ru: 'ru-RU', en: 'en-US', zh: 'zh-CN' };
      const curLoc = localeMap[state.lang] || 'ru-RU';
      if (el.metaWordCount) el.metaWordCount.innerText = `${state.totalWordsCount.toLocaleString(curLoc)} ${t.wordsUnit}`;
      if (el.metaParagraphCount) el.metaParagraphCount.innerText = `${state.paragraphs.length} ${t.paragraphsUnit}`;
      const readingTime = Math.max(1, Math.ceil(state.totalWordsCount / 160));
      if (el.metaReadingTime) el.metaReadingTime.innerText = `~${readingTime} ${t.readingTimeUnit}`;
    }

    // 14. Переинициализация синтезатора речи для языка
    initVoices();

    // 15. Перезапуск тайпрайтера, если мы на главном экране
    if (el.viewWelcome && el.viewWelcome.style.display !== 'none') {
      startTypewriter(t.typewriterGreeting);
    }
  }

  // Обновление всех переводов внутри модального окна настроек
  function updateSettingsModalTranslations() {
    const t = TRANSLATIONS[state.lang] || TRANSLATIONS.ru;

    // Remove subtitle badge if present
    const sSub = document.getElementById('settings-modal-sub');
    if (sSub) sSub.remove();

    const sTitle = document.getElementById('settings-modal-title');
    if (sTitle) sTitle.innerText = t.settingsTitle;
    const sPLabel = document.getElementById('settings-provider-label');
    if (sPLabel) sPLabel.innerText = t.settingsProviderLabel;

    if (el.settingsProvider) {
      Array.from(el.settingsProvider.options).forEach(opt => {
        if (PROVIDER_NAMES[opt.value]) {
          opt.text = PROVIDER_NAMES[opt.value];
        }
      });
    }

    const btnTestText = document.getElementById('btn-test-settings-text');
    if (btnTestText) {
      btnTestText.innerText = t.settingsTestBtn;
    } else if (el.btnTestSettingsKey) {
      const svg = el.btnTestSettingsKey.querySelector('svg');
      el.btnTestSettingsKey.innerHTML = '';
      if (svg) el.btnTestSettingsKey.appendChild(svg);
      el.btnTestSettingsKey.append(` ${t.settingsTestBtn}`);
    }

    if (el.btnSaveSettingsKey) el.btnSaveSettingsKey.innerText = t.settingsSaveBtn;
    if (el.btnCloseSettings) el.btnCloseSettings.title = t.closeModalTitle;

    const hintLinks = [
      { key: 'groq', id: 'settings-groq-hint', labelId: 'settings-groq-key-label', name: 'Groq', url: 'https://console.groq.com/keys', domain: 'console.groq.com' },
      { key: 'bothub', id: 'settings-bothub-hint', labelId: 'settings-bothub-key-label', name: 'BotHub', url: 'https://bothub.chat', domain: 'bothub.chat' },
      { key: 'deepseek', id: 'settings-deepseek-hint', labelId: 'settings-deepseek-key-label', name: 'DeepSeek', url: 'https://platform.deepseek.com/api_keys', domain: 'platform.deepseek.com' },
      { key: 'openai', id: 'settings-openai-hint', labelId: 'settings-openai-key-label', name: 'OpenAI', url: 'https://platform.openai.com/api-keys', domain: 'platform.openai.com' },
      { key: 'openrouter', id: 'settings-openrouter-hint', labelId: 'settings-openrouter-key-label', name: 'OpenRouter', url: 'https://openrouter.ai/keys', domain: 'openrouter.ai' },
      { key: 'claude', id: 'settings-claude-hint', labelId: 'settings-claude-key-label', name: 'Anthropic Claude', url: 'https://console.anthropic.com/settings/keys', domain: 'console.anthropic.com' },
      { key: 'gemini', id: 'settings-gemini-hint', labelId: 'settings-gemini-key-label', name: 'Google Gemini', url: 'https://aistudio.google.com/app/apikey', domain: 'aistudio.google.com' }
    ];

    hintLinks.forEach(item => {
      const hintEl = document.getElementById(item.id);
      if (hintEl) {
        hintEl.innerHTML = `${t.getKeyText} <a href="${item.url}" target="_blank" rel="noopener">${item.domain}</a>`;
      }
      // Clean label: just "API Key" in the current language (provider is shown in dropdown)
      const labelEl = document.getElementById(item.labelId);
      if (labelEl) {
        labelEl.innerText = t.apiKeySuffix || 'API Key';
      }
    });

    [
      el.toggleSettingsOpenai,
      el.toggleSettingsGemini,
      el.toggleSettingsClaude,
      el.toggleSettingsGroq,
      el.toggleSettingsDeepseek,
      el.toggleSettingsOpenrouter,
      el.toggleSettingsBothub
    ].forEach(toggle => {
      if (toggle) toggle.title = t.togglePasswordTitle;
    });
  }

  // --- 1. ИНИЦИАЛИЗАЦИЯ ГОЛОСОВ (TTS) С ПОДДЕРЖКОЙ МОБИЛЬНЫХ УСТРОЙСТВ ---
  function initVoices() {
    if (!window.speechSynthesis) return;

    function formatVoiceName(name, lang) {
      let clean = (name || '').replace(/(Microsoft|Google|Desktop|Natural|Online)\s*/gi, '').trim();
      clean = clean.replace(/\s*\([^)]*\)/g, '').trim();
      clean = clean.replace(/-\s*(Russian|English|Chinese|Русский|Россия|United States|UK)/gi, '').trim();
      if (!clean) clean = name || lang || 'Voice';
      return clean.length > 22 ? clean.substring(0, 21) + '…' : clean;
    }

    function load() {
      if (!window.speechSynthesis || !el.selectVoice) return;
      state.voices = window.speechSynthesis.getVoices() || [];
      const langPrefix = state.lang || 'ru';
      const langVoices = state.voices.filter(v => v.lang && v.lang.toLowerCase().startsWith(langPrefix));
      const list = langVoices.length > 0 ? langVoices : state.voices;

      el.selectVoice.innerHTML = '';

      if (list.length === 0) {
        const opt = document.createElement('option');
        opt.value = '';
        const t = TRANSLATIONS[state.lang] || TRANSLATIONS.ru;
        opt.innerText = t.defaultVoice || 'Голос по умолчанию';
        el.selectVoice.appendChild(opt);
        return;
      }

      list.forEach(v => {
        const opt = document.createElement('option');
        opt.value = v.voiceURI;
        opt.innerText = formatVoiceName(v.name, v.lang);
        el.selectVoice.appendChild(opt);
      });

      const savedVoiceUri = localStorage.getItem('wv_voice_' + langPrefix);
      let targetVoice = null;

      if (savedVoiceUri) {
        targetVoice = list.find(v => v.voiceURI === savedVoiceUri);
      }

      if (!targetVoice && langVoices.length > 0) {
        targetVoice = langVoices.find(v => 
          v.name.includes('Google') || 
          v.name.includes('Natural') || 
          v.name.includes('Online') || 
          v.name.includes('Milena') ||
          v.name.includes('Pavel') || 
          v.name.includes('Yuri') || 
          v.name.includes('Xiaoxiao') || 
          v.name.includes('Yunxi') || 
          v.name.includes('Jenny') || 
          v.name.includes('Guy')
        ) || langVoices[0];
      } else if (!targetVoice && state.voices.length > 0) {
        targetVoice = state.voices[0];
      }

      if (targetVoice) {
        state.selectedVoice = targetVoice;
        el.selectVoice.value = targetVoice.voiceURI;
      }
    }

    load();

    if (window.speechSynthesis) {
      if ('onvoiceschanged' in window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = load;
      }
      if (window.speechSynthesis.addEventListener) {
        window.speechSynthesis.addEventListener('voiceschanged', load);
      }
    }

    // Повторные асинхронные проверки для iOS Safari / WebKit & Android TTS
    [120, 350, 800, 2000].forEach(delay => {
      setTimeout(() => {
        if (!state.voices || state.voices.length === 0 || el.selectVoice.options.length <= 1) {
          load();
        }
      }, delay);
    });

    // Резервная инициализация при касании селектора на телефоне
    const refreshOnOpen = () => {
      if (!state.voices || state.voices.length === 0 || el.selectVoice.options.length <= 1) {
        load();
      }
    };
    el.selectVoice.addEventListener('pointerdown', refreshOnOpen);
    el.selectVoice.addEventListener('focus', refreshOnOpen);
  }

  // Обновление индикатора возрастного фильтра в шапке
  function updateAgeIndicator() {
    if (el.headerAgeIndicator) {
      const t = TRANSLATIONS[state.lang] || TRANSLATIONS.ru;
      el.headerAgeIndicator.innerText = state.ageFilterEnabled ? t.ageOn : t.ageOff;
      el.headerAgeIndicator.style.opacity = state.ageFilterEnabled ? '1' : '0.5';
    }
  }

  // --- 2. ЗАГРУЗКА И ДЕТЕКЦИЯ 18+ СТАТЬИ (КАТЕГОРИИ + EXTRACT + СЛОВАРЬ) ---
  async function check18PlusContent(title) {
    if (!state.ageFilterEnabled) return false;

    try {
      const wikiLang = state.lang || 'ru';
      // Запрашиваем категории, вводный текст статьи (extract) и описания
      const url = `https://${wikiLang}.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=categories|extracts|pageprops&cllimit=150&exintro=1&explaintext=1&format=json&origin=*`;
      const res = await fetch(url);
      const data = await res.json();
      const pages = data.query?.pages || {};
      const categories = [];
      let extractText = '';

      for (const p of Object.values(pages)) {
        if (p.categories) {
          p.categories.forEach(c => categories.push((c.title || '').toLowerCase()));
        }
        if (p.extract) {
          extractText += ' ' + p.extract.toLowerCase();
        }
        if (p.pageprops && p.pageprops['wikibase-shortdesc']) {
          extractText += ' ' + p.pageprops['wikibase-shortdesc'].toLowerCase();
        }
      }

      // Структурированный список регулярок для точного распознавания 18+ (RU / EN / ZH)
      const triggerPatterns = [
        // Сексуальный и взрослый контент
        /(?:^|[^а-яёa-z0-9])секс/i,
        /(?:^|[^а-яёa-z0-9])порно/i,
        /(?:^|[^а-яёa-z0-9])эротик/i,
        /18\+/i,
        /половой\s+акт/i,
        /половые\s+органы/i,
        /(?:^|[^а-яёa-z0-9])генитал/i,
        /(?:^|[^а-яёa-z0-9])эрекци/i,
        /(?:^|[^а-яёa-z0-9])мастурб/i,
        /(?:^|[^а-яёa-z0-9])проститу/i,
        /(?:^|[^а-яёa-z0-9])интимн/i,
        /(?:^|[^а-яёa-z0-9])фетиш/i,
        /(?:^|[^а-яёa-z0-9])бдсм/i,
        /садо-мазо/i,
        /(?:^|[^а-яёa-z0-9])стриптиз/i,
        /(?:^|[^а-яёa-z0-9])вагин/i,
        /(?:^|[^а-яёa-z0-9])пенис/i,
        /(?:^|[^а-яёa-z0-9])фаллос/i,
        /(?:^|[^а-яёa-z0-9])коитус/i,
        /(?:^|[^а-яёa-z0-9])зоофил/i,
        /(?:^|[^а-яёa-z0-9])педофил/i,
        /(?:^|[^а-яёa-z0-9])инцест/i,
        /(?:^|[^а-яёa-z0-9])некрофил/i,
        // English adult keywords
        /(?:^|[^a-z0-9])porn/i,
        /(?:^|[^a-z0-9])erotic/i,
        /(?:^|[^a-z0-9])sexual\s+(intercourse|organs)/i,
        /(?:^|[^a-z0-9])genital/i,
        /(?:^|[^a-z0-9])vagina/i,
        /(?:^|[^a-z0-9])penis/i,
        /(?:^|[^a-z0-9])prostitut/i,
        /(?:^|[^a-z0-9])incest/i,
        /(?:^|[^a-z0-9])suicide/i,
        // Chinese adult keywords
        /色情/,
        /成人内容/,
        /性交/,
        /生殖器/,
        /自杀/,
        /毒品/,
        // Экстремальное насилие, суицид, пытки
        /(?:^|[^а-яёa-z0-9])расчленен/i,
        /(?:^|[^а-яёa-z0-9])(?<!по)пытк/i,
        /(?:^|[^а-яёa-z0-9])казн/i,
        /(?:^|[^а-яёa-z0-9])самоубийств/i,
        /(?:^|[^а-яёa-z0-9])суицид/i,
        /(?:^|[^а-яёa-z0-9])убийств/i,
        /(?:^|[^а-яёa-z0-9])геноцид/i,
        /(?:^|[^а-яёa-z0-9])истязан/i,
        /(?:^|[^а-яёa-z0-9])каннибал/i,
        /(?:^|[^а-яёa-z0-9])маньяк-убийц/i,
        /серийный\s+убийца/i,
        /(?:^|[^а-яёa-z0-9])снафф/i,
        /насильственн[а-я]*\s+смерт/i,
        // Тяжелые наркотики
        /(?:^|[^а-яёa-z0-9])наркоти/i,
        /(?:^|[^а-яёa-z0-9])героин/i,
        /(?:^|[^а-яёa-z0-9])кокаин/i,
        /(?:^|[^а-яёa-z0-9])метамфетамин/i,
        /психоактивн[а-я]*\s+веществ/i,
        /(?:^|[^а-яёa-z0-9])опиоид/i
      ];

      const combinedText = `${title} ${categories.join(' ')} ${extractText}`;
      return triggerPatterns.some(pattern => pattern.test(combinedText));
    } catch (e) {
      console.warn('Ошибка проверки 18+ категории:', e);
      return false;
    }
  }

  async function loadWikipediaArticle(query) {
    if (!query || !query.trim()) return;
    let title = query.trim();

    // Парсинг прямой ссылки на wikipedia.org (с автоопределением языка)
    if (title.includes('wikipedia.org/wiki/')) {
      const match = title.match(/https?:\/\/([a-z0-9-]+)\.wikipedia\.org\/wiki\/([^#?]+)/i);
      if (match) {
        const urlLang = match[1].toLowerCase();
        if (['ru', 'en', 'zh'].includes(urlLang) && urlLang !== state.lang) {
          setLanguage(urlLang);
        }
        title = decodeURIComponent(match[2].replace(/_/g, ' '));
      } else {
        const parts = title.split('/wiki/');
        title = decodeURIComponent(parts[1].split('#')[0].replace(/_/g, ' '));
      }
    }

    showLoadingView(title);
    stopPlayback();
    state.userAccepted18Plus = false;
    state.is18Plus = false;

    try {
      const wikiLang = state.lang || 'ru';
      // 1. Проверка 18+ фильтра
      const is18 = await check18PlusContent(title);
      state.is18Plus = is18;

      // 2. Загрузка HTML через REST API
      const restUrl = `https://${wikiLang}.wikipedia.org/api/rest_v1/page/html/${encodeURIComponent(title)}`;
      let response = await fetch(restUrl);

      let htmlContent = '';
      let pageTitle = title;

      if (response.ok) {
        htmlContent = await response.text();
      } else {
        // Резерв: Action API parse
        const actionUrl = `https://${wikiLang}.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(title)}&prop=text|displaytitle&format=json&origin=*`;
        const actionRes = await fetch(actionUrl);
        const actionData = await actionRes.json();
        if (actionData.error) {
          throw new Error(actionData.error.info || (TRANSLATIONS[state.lang] || TRANSLATIONS.ru).errorEmptyText);
        }
        htmlContent = actionData.parse.text['*'];
        pageTitle = actionData.parse.title;
      }

      state.articleTitle = pageTitle;
      processArticleContent(pageTitle, htmlContent);

      // Если обнаружен 18+ контент и включен фильтр — показываем шторку
      if (state.is18Plus && state.ageFilterEnabled && !state.userAccepted18Plus) {
        show18PlusWarning(pageTitle);
      }
    } catch (err) {
      console.error('Ошибка загрузки статьи:', err);
      const t = TRANSLATIONS[state.lang] || TRANSLATIONS.ru;
      const msg = (typeof t.errorLoadMsg === 'function')
        ? t.errorLoadMsg(err.message)
        : `Не удалось загрузить статью: ${err.message}. Попробуйте уточнить название.`;
      showErrorView(msg);
    }
  }

  // Очистка текста абзаца от сносок ([1], [источник]), лишних пробелов
  function cleanParagraphText(rawText) {
    if (!rawText) return '';
    return rawText
      .replace(/\[\d+\]/g, '')
      .replace(/\[[a-zа-яё\s\d.:—-]+\]/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // --- 3. KNOWLEDGE EXTRACTOR & ПАРСЕР (ФИКС «СТРУКТУРА» И СПИСКОВ) ---
  function processArticleContent(title, rawHtml) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(rawHtml, 'text/html');

    // Удаление мусора и служебных элементов
    const noiseSelectors = [
      '.infobox', '.navbox', '.reflist', '.reference', '.mw-editsection',
      '.toc', '.ambox', '.thumbcaption', '.catlinks', '.hatnote',
      '.shortdescription', '.mw-empty-elt', '.sidebar', '.metadata',
      '.noprint', '.sisterproject', '.vertical-navbox', 'style', 'script',
      'table', '.thumb', '.gallery'
    ];
    noiseSelectors.forEach(sel => {
      doc.querySelectorAll(sel).forEach(n => n.remove());
    });

    const stopHeadings = ['Примечания', 'Литература', 'Ссылки', 'См. также', 'Источники', 'References', 'See also', 'External links', 'Further reading', 'Bibliography', '参考资料', '参考文献', '参见', '外部链接'];
    
    // ВАЖНЫЙ ФИКС: извлекаем не только h2, h3, p, но и списки (li), определения (dd), цитаты (blockquote)!
    const bodyElements = Array.from(doc.body.querySelectorAll('h2, h3, p, li, dd, blockquote'));

    const rawItems = [];
    let stop = false;

    for (const item of bodyElements) {
      if (stop) break;

      const tagName = item.tagName.toUpperCase();

      // Проверка окончания статьи
      if (tagName === 'H2' || tagName === 'H3') {
        const text = item.innerText.trim();
        if (stopHeadings.some(h => text.includes(h))) {
          stop = true;
          break;
        }
        rawItems.push({
          type: tagName.toLowerCase(),
          text: text
        });
        continue;
      }

      // Проверяем, не лежит ли li внутри родительского li
      if (tagName === 'LI' && item.parentElement && item.parentElement.closest('li')) {
        continue;
      }

      const text = cleanParagraphText(item.innerText);
      if (text.length > 2) {
        rawItems.push({
          type: tagName.toLowerCase(),
          text: text
        });
      }
    }

    // ВАЖНЫЙ ФИКС ОШИБКИ «СТРУКТУРА: и ниже просто следующий блок»:
    // Удаляем любые осиротевшие заголовки h2/h3, после которых сразу идет следующий заголовок или конец статьи!
    const cleanItems = [];
    for (let i = 0; i < rawItems.length; i++) {
      const current = rawItems[i];
      if (current.type === 'h2' || current.type === 'h3') {
        // Ищем, есть ли хоть один содержательный элемент (p, li) до следующего заголовка
        let hasContent = false;
        for (let j = i + 1; j < rawItems.length; j++) {
          const next = rawItems[j];
          if (next.type === 'h2' || next.type === 'h3') break;
          if (next.type === 'p' || next.type === 'li') {
            hasContent = true;
            break;
          }
        }
        if (hasContent) {
          cleanItems.push(current);
        }
      } else {
        cleanItems.push(current);
      }
    }

    if (cleanItems.length === 0) {
      const t = TRANSLATIONS[state.lang] || TRANSLATIONS.ru;
      showErrorView(t.errorEmptyText);
      return;
    }

    // РЕНДЕР И ТОКЕНИЗАЦИЯ В КНИЖНЫЙ ФОРМАТ
    renderArticleToDOM(title, cleanItems);
  }

  // --- 4. РЕНДЕР В КНИЖНЫЙ ИНТЕРФЕЙС И СОДЕРЖАНИЕ (TOC) ---
  function renderArticleToDOM(title, itemsList) {
    el.articleTitle.innerText = title;
    el.articleBody.innerHTML = '';
    el.tocDropdown.innerHTML = '';

    if (el.metaAgeBadge) {
      el.metaAgeBadge.style.display = state.is18Plus ? 'inline-block' : 'none';
    }

    const t = TRANSLATIONS[state.lang] || TRANSLATIONS.ru;
    let totalWords = 0;
    const meaningfulParagraphs = [];
    const chapters = [];
    let currentChapter = {
      title: t.chapterIntro,
      startParaIdx: 0,
      endParaIdx: 0
    };
    chapters.push(currentChapter);

    let firstParagraphFound = false;
    el.articleLead.style.display = 'none';
    el.articleLead.innerHTML = '';

    itemsList.forEach((item) => {
      // 1. Главы H2
      if (item.type === 'h2') {
        const h2 = document.createElement('h2');
        h2.innerText = item.text;
        h2.id = `chapter-sec-${chapters.length}`;
        el.articleBody.appendChild(h2);

        currentChapter = {
          title: item.text,
          startParaIdx: meaningfulParagraphs.length,
          endParaIdx: meaningfulParagraphs.length
        };
        chapters.push(currentChapter);
        return;
      }

      // 2. Подразделы H3
      if (item.type === 'h3') {
        const h3 = document.createElement('h3');
        h3.innerText = item.text;
        el.articleBody.appendChild(h3);
        return;
      }

      // 3. Лид-абзац (первый крупный абзац статьи в стиле книги)
      if (!firstParagraphFound && item.type === 'p' && item.text.length > 50) {
        firstParagraphFound = true;
        el.articleLead.innerText = item.text;
        el.articleLead.style.display = 'block';
        // Лид также входит в читаемый контент
      }

      // 4. Текстовые блоки (p, li)
      const isLi = item.type === 'li';
      const domElem = document.createElement(isLi ? 'li' : 'p');
      const currentParaIdx = meaningfulParagraphs.length;
      domElem.id = `para-${currentParaIdx}`;

      const words = [];
      const fragment = document.createDocumentFragment();

      // Токенизация слов с поддержкой китайского и европейских языков
      if (state.lang === 'zh' && typeof Intl !== 'undefined' && Intl.Segmenter) {
        const segmenter = new Intl.Segmenter('zh', { granularity: 'word' });
        for (const seg of segmenter.segment(item.text)) {
          const segText = seg.segment;
          if (!segText.trim()) {
            fragment.appendChild(document.createTextNode(segText));
            continue;
          }
          const cleanWord = segText.replace(/[^\wа-яА-ЯёЁ\u4e00-\u9fa5]/gi, '');
          const span = document.createElement('span');
          span.className = 'wikivision-word';
          span.innerText = segText;
          span.dataset.pIdx = currentParaIdx;
          span.dataset.wIdx = words.length;

          span.addEventListener('click', (e) => {
            e.stopPropagation();
            const p = parseInt(span.dataset.pIdx);
            const w = parseInt(span.dataset.wIdx);
            triggerAnalogy(p, w);
          });

          words.push({
            element: span,
            text: segText,
            cleanWord: cleanWord || segText,
            charOffset: seg.index
          });
          fragment.appendChild(span);
        }
      } else {
        const regex = /(\S+)(\s*)/g;
        let match;
        while ((match = regex.exec(item.text)) !== null) {
          const wordText = match[1];
          const trailingSpace = match[2];
          const cleanWord = wordText.replace(/[^\wа-яА-ЯёЁ\u4e00-\u9fa5]/gi, '');

          const span = document.createElement('span');
          span.className = 'wikivision-word';
          span.innerText = wordText;
          span.dataset.pIdx = currentParaIdx;
          span.dataset.wIdx = words.length;

          span.addEventListener('click', (e) => {
            e.stopPropagation();
            const p = parseInt(span.dataset.pIdx);
            const w = parseInt(span.dataset.wIdx);
            triggerAnalogy(p, w);
          });

          words.push({
            element: span,
            text: wordText,
            cleanWord: cleanWord || wordText,
            charOffset: match.index
          });

          fragment.appendChild(span);
          if (trailingSpace) {
            fragment.appendChild(document.createTextNode(trailingSpace));
          }
        }
      }

      domElem.appendChild(fragment);

      if (isLi) {
        // Если это первый li в серии — оборачиваем в ul
        let lastChild = el.articleBody.lastElementChild;
        if (!lastChild || lastChild.tagName !== 'UL') {
          lastChild = document.createElement('ul');
          el.articleBody.appendChild(lastChild);
        }
        lastChild.appendChild(domElem);
      } else {
        el.articleBody.appendChild(domElem);
      }

      meaningfulParagraphs.push({
        element: domElem,
        text: item.text,
        words: words
      });

      totalWords += words.length;
      currentChapter.endParaIdx = currentParaIdx;
    });

    state.paragraphs = meaningfulParagraphs;
    state.chapters = chapters;
    state.totalWordsCount = totalWords;
    state.currentParagraphIdx = 0;
    state.currentWordIdx = 0;
    state.wordsReadCount = 0;

    // Метаданные статьи
    const localeMap = { ru: 'ru-RU', en: 'en-US', zh: 'zh-CN' };
    const curLoc = localeMap[state.lang] || 'ru-RU';
    el.metaWordCount.innerText = `${totalWords.toLocaleString(curLoc)} ${t.wordsUnit}`;
    el.metaParagraphCount.innerText = `${meaningfulParagraphs.length} ${t.paragraphsUnit}`;
    const readingTime = Math.max(1, Math.ceil(totalWords / 160));
    el.metaReadingTime.innerText = `~${readingTime} ${t.readingTimeUnit}`;

    // Формирование выпадающего «Содержания»
    chapters.forEach((chap, idx) => {
      const item = document.createElement('div');
      item.className = 'toc-item';
      item.innerText = `${idx + 1}. ${chap.title}`;
      item.addEventListener('click', () => {
        el.tocDropdown.style.display = 'none';
        scrollToParagraph(chap.startParaIdx);
        setChapter(idx);
      });
      el.tocDropdown.appendChild(item);
    });

    // Инициализация боковой карточки главы
    updateChapterCard(0);

    showArticleView();
  }

  // Обновление карточки «СЕЙЧАС ЧИТАЕМ»
  function updateChapterCard(pIdx) {
    if (!state.chapters || state.chapters.length === 0) return;

    let foundChapIdx = 0;
    for (let i = 0; i < state.chapters.length; i++) {
      const c = state.chapters[i];
      if (pIdx >= c.startParaIdx && pIdx <= c.endParaIdx) {
        foundChapIdx = i;
        break;
      }
      if (pIdx > c.endParaIdx) {
        foundChapIdx = i;
      }
    }

    state.currentChapterIdx = foundChapIdx;
    const currentChap = state.chapters[foundChapIdx];
    if (currentChap) {
      const t = TRANSLATIONS[state.lang] || TRANSLATIONS.ru;
      el.activeChapterName.innerText = currentChap.title;
      el.chapterCounter.innerText = t.chapterCounterFormat(foundChapIdx + 1, state.chapters.length);

      const totalInChap = Math.max(1, (currentChap.endParaIdx - currentChap.startParaIdx + 1));
      const currentInChap = Math.max(1, (pIdx - currentChap.startParaIdx + 1));
      const pct = Math.min(100, Math.round((currentInChap / totalInChap) * 100));
      el.chapterLineFill.style.width = `${pct}%`;
    }
  }

  function setChapter(chapIdx) {
    const chap = state.chapters[chapIdx];
    if (!chap) return;
    state.currentParagraphIdx = chap.startParaIdx;
    state.currentWordIdx = 0;
    updateChapterCard(chap.startParaIdx);
    if (state.isPlaying) {
      speakParagraph(chap.startParaIdx, 0);
    }
  }

  // --- 5. ВОЗРАСТНОЕ ПРЕДУПРЕЖДЕНИЕ 18+ ---
  function show18PlusWarning(articleName) {
    const t = TRANSLATIONS[state.lang] || TRANSLATIONS.ru;
    const wBadge = document.getElementById('warning-18plus-badge');
    if (wBadge) wBadge.innerText = t.warning18Badge;
    const wTitle = document.getElementById('warning-18plus-title');
    if (wTitle) wTitle.innerText = t.warning18Title;
    const wDesc = document.getElementById('warning-18plus-desc');
    if (wDesc) wDesc.innerHTML = t.warning18Desc(`«${articleName}»`);
    const wSub = document.getElementById('warning-18plus-subtext');
    if (wSub) wSub.innerText = t.warning18Subtext;
    if (el.btn18plusDecline) el.btn18plusDecline.innerText = t.warning18Decline;
    if (el.btn18plusAccept) el.btn18plusAccept.innerText = t.warning18Accept;

    el.modal18plusOverlay.style.display = 'grid';
    el.viewArticle.style.filter = 'blur(10px)';
    el.viewArticle.style.pointerEvents = 'none';
  }

  function hide18PlusWarning() {
    el.modal18plusOverlay.style.display = 'none';
    el.viewArticle.style.filter = 'none';
    el.viewArticle.style.pointerEvents = 'auto';
  }

  el.btn18plusAccept.addEventListener('click', () => {
    state.userAccepted18Plus = true;
    hide18PlusWarning();
  });

  el.btn18plusDecline.addEventListener('click', () => {
    hide18PlusWarning();
    showWelcomeView();
  });

  // --- 6. УМНЫЙ ПОИСК «ЧТО БЫ ВЫ ХОТЕЛИ УЗНАТЬ?» С РЕКОМЕНДАЦИЯМИ ---
  let searchTimer = null;
  el.inputSearch.addEventListener('input', () => {
    clearTimeout(searchTimer);
    const q = el.inputSearch.value.trim();

    if (q.length < 2) {
      el.searchSuggestions.style.display = 'none';
      return;
    }

    searchTimer = setTimeout(async () => {
      try {
        const wikiLang = state.lang || 'ru';
        const tObj = TRANSLATIONS[state.lang] || TRANSLATIONS.ru;
        // 1. Прямые совпадения статей (Opensearch)
        const openUrl = `https://${wikiLang}.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(q)}&limit=5&namespace=0&format=json&origin=*`;
        const openRes = await fetch(openUrl);
        const openData = await openRes.json();
        const titles = openData[1] || [];

        // 2. Варианты для чтения (рекомендации тем через morelike)
        const moreUrl = `https://${wikiLang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=morelike:${encodeURIComponent(q)}&srlimit=6&format=json&origin=*`;
        const moreRes = await fetch(moreUrl);
        const moreData = await moreRes.json();
        const related = (moreData.query?.search || []).map(s => s.title).filter(t => !titles.includes(t));

        if (titles.length === 0 && related.length === 0) {
          el.searchSuggestions.style.display = 'none';
          return;
        }

        // Рендер прямых совпадений
        el.listDirectMatches.innerHTML = '';
        titles.forEach(t => {
          const item = document.createElement('div');
          item.className = 'suggestion-item';
          item.innerHTML = `<span>${t}</span><span style="font-size: 11px; color: #5c6f84;">${tObj.searchGoTo}</span>`;
          item.addEventListener('click', () => {
            el.inputSearch.value = t;
            el.searchSuggestions.style.display = 'none';
            loadWikipediaArticle(t);
          });
          el.listDirectMatches.appendChild(item);
        });

        // Рендер чипов рекомендаций («Варианты для чтения»)
        el.listRelatedTopics.innerHTML = '';
        if (related.length > 0) {
          related.slice(0, 5).forEach(r => {
            const chip = document.createElement('button');
            chip.className = 'related-chip';
            chip.innerText = `💡 ${r}`;
            chip.addEventListener('click', () => {
              el.inputSearch.value = r;
              el.searchSuggestions.style.display = 'none';
              loadWikipediaArticle(r);
            });
            el.listRelatedTopics.appendChild(chip);
          });
        } else {
          const t = TRANSLATIONS[state.lang] || TRANSLATIONS.ru;
          el.listRelatedTopics.innerHTML = `<span style="font-size: 12px; color: #5c6f84;">${t.loadingRelated || 'Загружаются варианты...'}</span>`;
        }

        el.searchSuggestions.style.display = 'block';
      } catch (e) {
        console.warn('Ошибка автодополнения:', e);
      }
    }, 280);
  });

  // Закрытие выпадающего поиска при клике вне
  document.addEventListener('click', (e) => {
    if (!el.inputSearch.contains(e.target) && !el.searchSuggestions.contains(e.target)) {
      el.searchSuggestions.style.display = 'none';
    }
    if (!el.btnToggleToc.contains(e.target) && !el.tocDropdown.contains(e.target)) {
      el.tocDropdown.style.display = 'none';
    }
  });

  el.btnSearch.addEventListener('click', () => {
    el.searchSuggestions.style.display = 'none';
    loadWikipediaArticle(el.inputSearch.value);
  });

  el.inputSearch.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      el.searchSuggestions.style.display = 'none';
      loadWikipediaArticle(el.inputSearch.value);
    }
  });

  el.btnToggleToc.addEventListener('click', (e) => {
    e.stopPropagation();
    const isVisible = el.tocDropdown.style.display === 'block';
    el.tocDropdown.style.display = isVisible ? 'none' : 'block';
  });

  // --- 7. СИНТЕЗ РЕЧИ (TTS) И СИНХРОННАЯ ПОДСВЕТКА СЛОВ ---
  function startPlayback(fromBeginning = false) {
    if (state.paragraphs.length === 0) return;
    if (fromBeginning) {
      state.currentParagraphIdx = 0;
      state.currentWordIdx = 0;
    }
    state.isPlaying = true;
    state.isPaused = false;
    updatePlayerUI();
    speakParagraph(state.currentParagraphIdx, state.currentWordIdx);
  }

  function pausePlayback() {
    state.isPlaying = false;
    state.isPaused = true;
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
    }
    updatePlayerUI();
  }

  function resumePlayback() {
    if (window.speechSynthesis.paused) {
      state.isPlaying = true;
      state.isPaused = false;
      window.speechSynthesis.resume();
      updatePlayerUI();
    } else {
      startPlayback(false);
    }
  }

  function stopPlayback() {
    state.isPlaying = false;
    state.isPaused = false;
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    clearAllHighlights();
    updatePlayerUI();
  }

  function speakParagraph(pIdx, startWordIdx = 0) {
    if (pIdx >= state.paragraphs.length) {
      stopPlayback();
      return;
    }

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    const para = state.paragraphs[pIdx];
    updateChapterCard(pIdx);

    // Склеиваем оставшиеся слова
    const wordsToSpeak = para.words.slice(startWordIdx);
    if (wordsToSpeak.length === 0) {
      state.currentParagraphIdx++;
      state.currentWordIdx = 0;
      speakParagraph(state.currentParagraphIdx, 0);
      return;
    }

    const textToSpeak = wordsToSpeak.map(w => w.text).join(' ');
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    state.activeUtterance = utterance;

    if (state.selectedVoice) {
      utterance.voice = state.selectedVoice;
    }
    utterance.rate = state.speechRate;

    // Синхронная подсветка слов через onboundary
    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        const charIndex = event.charIndex;
        let cumulative = 0;
        let currentW = 0;

        for (let i = 0; i < wordsToSpeak.length; i++) {
          if (charIndex >= cumulative && charIndex < cumulative + wordsToSpeak[i].text.length + 1) {
            currentW = i;
            break;
          }
          cumulative += wordsToSpeak[i].text.length + 1;
        }

        const actualWordIdx = startWordIdx + currentW;
        highlightWord(pIdx, actualWordIdx);
      }
    };

    utterance.onend = () => {
      if (state.isPlaying && !state.isPaused) {
        state.currentParagraphIdx++;
        state.currentWordIdx = 0;
        speakParagraph(state.currentParagraphIdx, 0);
      }
    };

    utterance.onerror = (e) => {
      if (e.error !== 'canceled' && e.error !== 'interrupted') {
        console.warn('Speech error:', e);
      }
    };

    window.speechSynthesis.speak(utterance);
  }

  function highlightWord(pIdx, wIdx) {
    clearAllHighlights();

    state.currentParagraphIdx = pIdx;
    state.currentWordIdx = wIdx;

    const para = state.paragraphs[pIdx];
    if (!para || !para.words[wIdx]) return;

    const wordObj = para.words[wIdx];
    wordObj.element.classList.add('active');

    // Плавный скролл при необходимости
    const rect = wordObj.element.getBoundingClientRect();
    if (rect.top < 120 || rect.bottom > window.innerHeight - 140) {
      wordObj.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Обновление прогресс-бара плеера
    let passedWords = 0;
    for (let i = 0; i < pIdx; i++) {
      passedWords += state.paragraphs[i].words.length;
    }
    passedWords += wIdx;

    const progressPct = state.totalWordsCount > 0
      ? Math.min(100, Math.round((passedWords / state.totalWordsCount) * 100))
      : 0;

    el.progressFill.style.width = `${progressPct}%`;
    const t = TRANSLATIONS[state.lang] || TRANSLATIONS.ru;
    const currentWordText = wordObj.cleanWord || wordObj.text;
    if (typeof t.readingWord === 'function') {
      el.playerStatusText.innerText = t.readingWord(currentWordText, progressPct);
    } else if (state.lang === 'en') {
      el.playerStatusText.innerText = `Reading: “${currentWordText}” (${progressPct}%)`;
    } else if (state.lang === 'zh') {
      el.playerStatusText.innerText = `正在朗读：“${currentWordText}” (${progressPct}%)`;
    } else {
      el.playerStatusText.innerText = `Читаем: «${currentWordText}» (${progressPct}%)`;
    }
  }

  function clearAllHighlights() {
    document.querySelectorAll('.wikivision-word.active').forEach(span => {
      span.classList.remove('active');
    });
  }

  function scrollToParagraph(pIdx) {
    const elem = document.getElementById(`para-${pIdx}`);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function updatePlayerUI() {
    const t = TRANSLATIONS[state.lang] || TRANSLATIONS.ru;
    if (state.isPlaying) {
      el.playIcon.style.display = 'none';
      el.pauseIcon.style.display = 'block';
      el.playText.innerText = t.pauseText || (state.lang === 'en' ? 'Pause' : state.lang === 'zh' ? '暂停' : 'Пауза');
    } else {
      el.playIcon.style.display = 'block';
      el.pauseIcon.style.display = 'none';
      if (state.isPaused) {
        el.playText.innerText = t.resumeText || (state.lang === 'en' ? 'Resume' : state.lang === 'zh' ? '继续' : 'Продолжить');
      } else {
        el.playText.innerText = t.playText || (state.lang === 'en' ? 'Listen' : state.lang === 'zh' ? '朗读' : 'Слушать');
      }
    }
  }

  // --- 8. ИИ-АНАЛОГИИ (OPENAI GPT-4O MINI / GEMINI) ---
  async function triggerAnalogy(pIdx, wIdx) {
    pausePlayback();
    state.isExplaining = true;

    const t = TRANSLATIONS[state.lang] || TRANSLATIONS.ru;
    const para = state.paragraphs[pIdx];
    const wordObj = para ? para.words[wIdx] : null;
    const term = wordObj ? (wordObj.cleanWord || wordObj.text) : (t.defaultConceptTerm || 'это понятие');
    const contextText = para ? para.text : '';

    const quote = (state.lang === 'en' || state.lang === 'zh') ? ['“', '”'] : ['«', '»'];
    el.modalTermName.innerText = `${quote[0]}${term}${quote[1]}`;
    const providerName = PROVIDER_NAMES[state.aiProvider] || 'AI';
    if (el.modalAiProviderBadge) {
      el.modalAiProviderBadge.innerText = t.analogyBadge(providerName);
    }
    el.modalAnalogyBody.innerHTML = `
      <div class="modal-loading">
        <div class="loading-orbit" style="width: 44px; height: 44px; margin: 0 auto 16px;"><span></span></div>
        <p>${t.analogyLoading}</p>
      </div>
    `;
    el.modalAnalogyOverlay.style.display = 'grid';

    const activeKey = getActiveApiKey();
    if (!activeKey) {
      renderModalKeyPrompt();
      return;
    }

    try {
      const explanation = await fetchAIExplanation(term, contextText, state.articleTitle);
      renderAnalogyContent(term, explanation);
      speakExplanation(explanation.speechSummary || explanation.analogy);
    } catch (err) {
      console.error('Ошибка ИИ:', err);
      el.modalAnalogyBody.innerHTML = `
        <div style="color: #f87171; padding: 14px; background: rgba(239, 68, 68, 0.1); border-radius: 10px;">
          <strong>${t.errorFailedToGetResponse || 'Не удалось получить ответ:'}</strong> ${err.message}.
          <div style="margin-top: 10px;">
            <button class="btn-secondary" id="btn-fix-key-modal" style="font-size: 12px;">${t.errorCheckApiKey || 'Проверить API ключ'}</button>
          </div>
        </div>
      `;
      document.getElementById('btn-fix-key-modal')?.addEventListener('click', () => {
        closeAnalogyModal();
        openSettingsModal();
      });
    }
  }

  async function callBotHubChat(apiKey, preferredModel, messages, maxTokens = 700) {
    const rawCandidates = [
      preferredModel,
      'gpt-4o',
      'gpt-3.5-turbo',
      'deepseek-chat',
      'claude-3-haiku'
    ].filter(Boolean);
    const candidateModels = Array.from(new Set(rawCandidates));

    const endpoints = [
      'https://bothub.chat/api/v2/openai/v1/chat/completions',
      'https://openai.bothub.chat/v1/chat/completions'
    ];

    let lastError = null;

    for (const model of candidateModels) {
      for (const endpoint of endpoints) {
        try {
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              model: model,
              messages: messages,
              temperature: 0.7,
              max_tokens: maxTokens
            })
          });

          const data = await res.json().catch(() => ({}));

          if (!res.ok) {
            const errMsg = data.error?.message || data.message || `HTTP ${res.status}`;
            const errLower = errMsg.toLowerCase();
            if (errLower.includes('disabled for api') || errLower.includes('model_not_found') || errLower.includes('not supported') || errLower.includes('is not available')) {
              console.warn(`[BotHub] Модель ${model} недоступна (${errMsg}), переключаемся на следующую...`);
              lastError = new Error(errMsg);
              break;
            }
            throw new Error(errMsg);
          }

          const content = data.choices?.[0]?.message?.content || '';
          return { content, usedModel: model };
        } catch (err) {
          lastError = err;
          if (err.message && (err.message.includes('disabled for API') || err.message.includes('HTTP 401') || err.message.includes('HTTP 403'))) {
            break;
          }
        }
      }
    }

    const t = TRANSLATIONS[state.lang] || TRANSLATIONS.ru;
    throw lastError || new Error(t.errorBothubConnect || 'Не удалось связаться с BotHub API');
  }

  async function fetchAIExplanation(term, paragraphContext, articleTitle) {
    let prompt = '';
    if (state.lang === 'en') {
      prompt = `
You are a brilliant science communicator, educator, and personal tutor.
The user is listening to the Wikipedia article: "${articleTitle}".
They stopped at an unfamiliar word/term: "${term}".
Context of the current paragraph:
"${paragraphContext}"

Formulate a crystal-clear explanation strictly in 3 sections:
### 1. Analogy
Explain the term through a simple everyday object, situation, or real-life process (2-3 concise sentences). E.g.: "Imagine that this is...".

### 2. Origin
In 1-2 sentences explain the origin of the term or the physical/logical reason for its emergence.

### 3. Context
In 1 sentence explain what role this concept plays in the current paragraph of the article.

Write in engaging, vivid English, ready for immediate speech narration.
`;
    } else if (state.lang === 'zh') {
      prompt = `
你是一位博学且生动的科普导师和个人学习助手。
用户正在阅读维基百科条目《${articleTitle}》，遇到不理解的术语：“${term}”。
当前段落语境：
“${paragraphContext}”

请用通俗生动的中文进行讲解，严格分为以下 3 个部分：
### 1. 通俗比喻
用日常生活中常见的事物、场景或例子来类比解释该词汇（2-3句话），让任何人都能秒懂。例如：“想象一下，这就像……”。

### 2. 词汇起源
用1-2句话解释该词汇的来源背景或物理/逻辑成因。

### 3. 语境作用
用1句话说明该词在当前段落中所起的核心作用。

语言生动自然，适合直接用于语音朗读。
`;
    } else {
      prompt = `
Ты — гениальный популяризатор науки, преподаватель и персональный тьютор.
Пользователь слушает статью Википедии: "${articleTitle}".
Он остановился на непонятном слове/термине: "${term}".
Контекст текущего абзаца:
"${paragraphContext}"

Сформулируй кристально понятное объяснение строго по 3 блокам:
### 1. Аналогия
Объясни термин через простой бытовой предмет, ситуацию или процесс из реальной жизни (2-3 емких предложения). Например: "Представь, что это...".

### 2. Происхождение
В 1-2 предложениях объясни первоисточник термина или физическую/логическую причину его появления.

### 3. Контекст
В 1 предложении объясни, какую роль это понятие играет в текущем абзаце статьи.

Пиши живым, увлекательным языком, готовым для немедленного озвучивания.
`;
    }

    const t = TRANSLATIONS[state.lang] || TRANSLATIONS.ru;
    const key = getActiveApiKey();
    if (!key) {
      const providerName = PROVIDER_NAMES[state.aiProvider] || state.aiProvider;
      throw new Error(typeof t.errorNoApiKey === 'function' ? t.errorNoApiKey(providerName) : `Не указан API-ключ для ${providerName}. Укажите его в настройках.`);
    }

    // 1. OpenAI
    if (state.aiProvider === 'openai') {
      return await callOpenAICompatibleChat('https://api.openai.com/v1/chat/completions', key, 'gpt-4o-mini', prompt, term);
    }

    // 2. Groq
    if (state.aiProvider === 'groq') {
      return await callOpenAICompatibleChat('https://api.groq.com/openai/v1/chat/completions', key, 'llama-3.3-70b-versatile', prompt, term);
    }

    // 3. DeepSeek
    if (state.aiProvider === 'deepseek') {
      return await callOpenAICompatibleChat('https://api.deepseek.com/chat/completions', key, 'deepseek-chat', prompt, term);
    }

    // 4. OpenRouter
    if (state.aiProvider === 'openrouter') {
      return await callOpenAICompatibleChat('https://openrouter.ai/api/v1/chat/completions', key, 'openai/gpt-4o-mini', prompt, term);
    }

    // 5. BotHub (OpenAI protocol)
    if (state.aiProvider === 'bothub') {
      const { content } = await callBotHubChat(
        key,
        'gpt-4o-mini',
        [{ role: 'user', content: prompt }],
        700
      );
      return parseAIResponse(content, term);
    }

    // 6. Anthropic Claude
    if (state.aiProvider === 'claude') {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 700,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error?.message || `Claude HTTP ${res.status}`);
      }

      const data = await res.json();
      const rawText = data.content?.[0]?.text || '';
      return parseAIResponse(rawText, term);
    }

    // 7. Google Gemini
    if (state.aiProvider === 'gemini') {
      const models = ['gemini-2.5-flash', 'gemini-1.5-flash'];
      let lastErr = null;

      for (const model of models) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.7, maxOutputTokens: 700 }
            })
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error?.message || `HTTP ${res.status}`);
          }

          const data = await res.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          return parseAIResponse(text, term);
        } catch (err) {
          lastErr = err;
        }
      }
      throw lastErr || new Error(t.errorGeminiConnect || 'Не удалось связаться с Gemini');
    }

    throw new Error(t.errorUnknownProvider || 'Неизвестный провайдер или отсутствует API ключ.');
  }

  async function callOpenAICompatibleChat(endpoint, apiKey, model, prompt, term) {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 700
      })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error?.message || `HTTP ${res.status}`);
    }

    const data = await res.json();
    const rawText = data.choices?.[0]?.message?.content || '';
    return parseAIResponse(rawText, term);
  }

  function parseAIResponse(rawText, term) {
    let analogy = '';
    let origin = '';
    let context = '';

    const parts = rawText.split(/###\s*\d*\.?\s*/i);
    for (const part of parts) {
      const pLower = part.toLowerCase();
      if (pLower.includes('аналоги') || pLower.includes('analogy') || pLower.includes('比喻')) {
        analogy = part.replace(/^.*(аналоги|analogy|比喻)[^\n]*\n+/i, '').trim();
      } else if (pLower.includes('происхожден') || pLower.includes('суть') || pLower.includes('origin') || pLower.includes('起源')) {
        origin = part.replace(/^.*(происхожден|суть|origin|起源)[^\n]*\n+/i, '').trim();
      } else if (pLower.includes('контекст') || pLower.includes('роль') || pLower.includes('context') || pLower.includes('作用') || pLower.includes('语境')) {
        context = part.replace(/^.*(контекст|роль|context|作用|语境)[^\n]*\n+/i, '').trim();
      }
    }

    if (!analogy) analogy = rawText.trim();

    const fallbackAnalogy = state.lang === 'en' ? 'A key concept connecting this section of the article.' : state.lang === 'zh' ? '连接文章本段的核心概念。' : 'Ключевое понятие, связывающее этот раздел статьи.';
    const fallbackOrigin = state.lang === 'en' ? 'The term emerged to precisely describe this phenomenon.' : state.lang === 'zh' ? '该术语用于准确描述该现象。' : 'Термин возник для точного описания явления.';
    const fallbackContext = state.lang === 'en' ? 'Helps clarify the main idea of the paragraph.' : state.lang === 'zh' ? '有助于阐明本段的核心要点。' : 'Помогает раскрыть главную мысль абзаца.';

    const speechPrefix = state.lang === 'en' ? `Term: "${term}". ` : state.lang === 'zh' ? `词汇：“${term}”。` : `Слово «${term}». `;
    const speechOrigin = origin ? (state.lang === 'en' ? `Origin: ${origin}` : state.lang === 'zh' ? `起源：${origin}` : `Суть: ${origin}`) : '';

    return {
      analogy: analogy || fallbackAnalogy,
      origin: origin || fallbackOrigin,
      context: context || fallbackContext,
      speechSummary: `${speechPrefix}${analogy} ${speechOrigin}`
    };
  }

  function renderAnalogyContent(term, data) {
    const t = TRANSLATIONS[state.lang] || TRANSLATIONS.ru;
    el.modalAnalogyBody.innerHTML = `
      <div class="insight-card insight-analogy">
        <div class="insight-card-title">🎯 ${t.analogySection1}</div>
        <p>${data.analogy}</p>
      </div>
      <div class="insight-card insight-origin">
        <div class="insight-card-title">📜 ${t.analogySection2}</div>
        <p>${data.origin}</p>
      </div>
      <div class="insight-card insight-context">
        <div class="insight-card-title">💡 ${t.analogySection3}</div>
        <p>${data.context}</p>
      </div>
    `;

    el.btnReplayAnalogy.onclick = () => {
      speakExplanation(data.speechSummary || data.analogy);
    };
  }

  function renderModalKeyPrompt() {
    const t = TRANSLATIONS[state.lang] || TRANSLATIONS.ru;
    el.modalAnalogyBody.innerHTML = `
      <div style="background: rgba(32, 201, 107, 0.08); border: 1px solid rgba(32, 201, 107, 0.3); padding: 16px; border-radius: 12px;">
        <h4 style="color: #20c96b; margin-bottom: 8px;">${t.keyPromptTitle || '🔑 Требуется API ключ'}</h4>
        <p style="color: #94a3b8; font-size: 13px; line-height: 1.5; margin-bottom: 12px;">
          ${t.keyPromptDesc || 'Чтобы ИИ генерировал понятные аналогии, укажите ваш <strong>OpenAI API Key</strong> или <strong>Google Gemini Key</strong>.'}
        </p>
        <button class="btn-primary" id="btn-open-settings-from-modal" style="font-size: 13px;">${t.keyPromptBtn || 'Открыть настройки'}</button>
      </div>
    `;

    document.getElementById('btn-open-settings-from-modal')?.addEventListener('click', () => {
      closeAnalogyModal();
      openSettingsModal();
    });
  }

  function speakExplanation(text) {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    const utterance = new SpeechSynthesisUtterance(text);
    state.explanationUtterance = utterance;
    if (state.selectedVoice) utterance.voice = state.selectedVoice;
    utterance.rate = state.speechRate;
    window.speechSynthesis.speak(utterance);
  }

  function closeAnalogyModal() {
    state.isExplaining = false;
    el.modalAnalogyOverlay.style.display = 'none';
    if (window.speechSynthesis.speaking && state.explanationUtterance) {
      window.speechSynthesis.cancel();
    }
  }

  el.btnCloseAnalogy.addEventListener('click', closeAnalogyModal);
  el.btnContinueReading.addEventListener('click', () => {
    closeAnalogyModal();
    resumePlayback();
  });

  // --- 9. НАСТРОЙКИ (BOTHUB, OPENAI, GEMINI, 18+ ФИЛЬТР) ---
  function openSettingsModal() {
    updateSettingsModalTranslations();
    if (el.settingsProvider) el.settingsProvider.value = state.aiProvider;
    if (el.settingsOpenaiKey) el.settingsOpenaiKey.value = state.openaiApiKey;
    if (el.settingsGeminiKey) el.settingsGeminiKey.value = state.geminiApiKey;
    if (el.settingsClaudeKey) el.settingsClaudeKey.value = state.claudeApiKey;
    if (el.settingsGroqKey) el.settingsGroqKey.value = state.groqApiKey;
    if (el.settingsDeepseekKey) el.settingsDeepseekKey.value = state.deepseekApiKey;
    if (el.settingsOpenrouterKey) el.settingsOpenrouterKey.value = state.openrouterApiKey;
    if (el.settingsBothubKey) el.settingsBothubKey.value = state.bothubApiKey;

    if (el.apiTestResult) el.apiTestResult.style.display = 'none';
    updateSettingsProviderDisplay();
    el.modalSettingsOverlay.style.display = 'grid';
  }

  function closeSettingsModal() {
    el.modalSettingsOverlay.style.display = 'none';
  }

  function updateSettingsProviderDisplay() {
    const p = el.settingsProvider ? el.settingsProvider.value : 'groq';
    if (el.settingsGroupGroq) el.settingsGroupGroq.style.display = p === 'groq' ? 'block' : 'none';
    if (el.settingsGroupBothub) el.settingsGroupBothub.style.display = p === 'bothub' ? 'block' : 'none';
    if (el.settingsGroupDeepseek) el.settingsGroupDeepseek.style.display = p === 'deepseek' ? 'block' : 'none';
    if (el.settingsGroupOpenai) el.settingsGroupOpenai.style.display = p === 'openai' ? 'block' : 'none';
    if (el.settingsGroupOpenrouter) el.settingsGroupOpenrouter.style.display = p === 'openrouter' ? 'block' : 'none';
    if (el.settingsGroupClaude) el.settingsGroupClaude.style.display = p === 'claude' ? 'block' : 'none';
    if (el.settingsGroupGemini) el.settingsGroupGemini.style.display = p === 'gemini' ? 'block' : 'none';
  }

  if (el.settingsProvider) {
    el.settingsProvider.addEventListener('change', updateSettingsProviderDisplay);
  }

  // Переключение видимости паролей для всех провайдеров
  const togglePairs = [
    { btn: el.toggleSettingsOpenai, input: el.settingsOpenaiKey },
    { btn: el.toggleSettingsGemini, input: el.settingsGeminiKey },
    { btn: el.toggleSettingsClaude, input: el.settingsClaudeKey },
    { btn: el.toggleSettingsGroq, input: el.settingsGroqKey },
    { btn: el.toggleSettingsDeepseek, input: el.settingsDeepseekKey },
    { btn: el.toggleSettingsOpenrouter, input: el.settingsOpenrouterKey },
    { btn: el.toggleSettingsBothub, input: el.settingsBothubKey }
  ];
  togglePairs.forEach(({ btn, input }) => {
    if (btn && input) {
      btn.addEventListener('click', () => {
        input.type = input.type === 'password' ? 'text' : 'password';
      });
    }
  });

  if (el.btnOpenSettings) el.btnOpenSettings.addEventListener('click', openSettingsModal);
  if (el.btnCloseSettings) el.btnCloseSettings.addEventListener('click', closeSettingsModal);

  if (el.btnSaveSettingsKey) {
    el.btnSaveSettingsKey.addEventListener('click', () => {
      state.aiProvider = el.settingsProvider ? el.settingsProvider.value : 'openai';
      state.openaiApiKey = el.settingsOpenaiKey ? el.settingsOpenaiKey.value.trim() : '';
      state.geminiApiKey = el.settingsGeminiKey ? el.settingsGeminiKey.value.trim() : '';
      state.claudeApiKey = el.settingsClaudeKey ? el.settingsClaudeKey.value.trim() : '';
      state.groqApiKey = el.settingsGroqKey ? el.settingsGroqKey.value.trim() : '';
      state.deepseekApiKey = el.settingsDeepseekKey ? el.settingsDeepseekKey.value.trim() : '';
      state.openrouterApiKey = el.settingsOpenrouterKey ? el.settingsOpenrouterKey.value.trim() : '';
      state.bothubApiKey = el.settingsBothubKey ? el.settingsBothubKey.value.trim() : '';
      state.apiKey = getActiveApiKey();

      localStorage.setItem('wv_ai_provider', state.aiProvider);
      localStorage.setItem('wv_openai_api_key', state.openaiApiKey);
      localStorage.setItem('wv_gemini_api_key', state.geminiApiKey);
      localStorage.setItem('wv_claude_api_key', state.claudeApiKey);
      localStorage.setItem('wv_groq_api_key', state.groqApiKey);
      localStorage.setItem('wv_deepseek_api_key', state.deepseekApiKey);
      localStorage.setItem('wv_openrouter_api_key', state.openrouterApiKey);
      localStorage.setItem('wv_bothub_api_key', state.bothubApiKey);

      closeSettingsModal();
    });
  }

  // Тестирование подключения к выбранному провайдеру
  async function testProviderConnection(provider, key) {
    if (provider === 'openai') {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
        body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: 'Ping' }], max_tokens: 5 })
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error?.message || `HTTP ${res.status}`);
      }
    } else if (provider === 'gemini') {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: 'Ping' }] }] })
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error?.message || `HTTP ${res.status}`);
      }
    } else if (provider === 'claude') {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Ping' }]
        })
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error?.message || `HTTP ${res.status}`);
      }
    } else if (provider === 'groq') {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
        body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: 'Ping' }], max_tokens: 5 })
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error?.message || `HTTP ${res.status}`);
      }
    } else if (provider === 'deepseek') {
      const res = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
        body: JSON.stringify({ model: 'deepseek-chat', messages: [{ role: 'user', content: 'Ping' }], max_tokens: 5 })
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error?.message || `HTTP ${res.status}`);
      }
    } else if (provider === 'openrouter') {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
        body: JSON.stringify({ model: 'openai/gpt-4o-mini', messages: [{ role: 'user', content: 'Ping' }], max_tokens: 5 })
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error?.message || `HTTP ${res.status}`);
      }
    } else if (provider === 'bothub') {
      await callBotHubChat(key, 'gpt-4o-mini', [{ role: 'user', content: 'Ping' }], 10);
    }
  }

  if (el.btnTestSettingsKey) {
    el.btnTestSettingsKey.addEventListener('click', async () => {
      const t = TRANSLATIONS[state.lang] || TRANSLATIONS.ru;
      const provider = el.settingsProvider ? el.settingsProvider.value : 'openai';
      const providerName = PROVIDER_NAMES[provider] || provider;
      el.apiTestResult.style.display = 'block';

      let key = '';
      if (provider === 'openai') key = el.settingsOpenaiKey ? el.settingsOpenaiKey.value.trim() : '';
      else if (provider === 'gemini') key = el.settingsGeminiKey ? el.settingsGeminiKey.value.trim() : '';
      else if (provider === 'claude') key = el.settingsClaudeKey ? el.settingsClaudeKey.value.trim() : '';
      else if (provider === 'groq') key = el.settingsGroqKey ? el.settingsGroqKey.value.trim() : '';
      else if (provider === 'deepseek') key = el.settingsDeepseekKey ? el.settingsDeepseekKey.value.trim() : '';
      else if (provider === 'openrouter') key = el.settingsOpenrouterKey ? el.settingsOpenrouterKey.value.trim() : '';
      else if (provider === 'bothub') key = el.settingsBothubKey ? el.settingsBothubKey.value.trim() : '';

      if (!key) {
        el.apiTestResult.innerHTML = `<span style="color: #dc2626; font-weight: 600;">${t.testEmpty(providerName)}</span>`;
        return;
      }

      el.apiTestResult.innerHTML = `<span style="color: #64748b;">${t.testTesting(providerName)}</span>`;

      try {
        await testProviderConnection(provider, key);
        el.apiTestResult.innerHTML = `<span style="color: #16a34a; font-weight: 600;">${t.testSuccess(providerName)}</span>`;
      } catch (err) {
        el.apiTestResult.innerHTML = `<span style="color: #dc2626; font-weight: 600;">${t.testError(providerName, err.message)}</span>`;
      }
    });
  }

  // --- 10. ПЕРЕКЛЮЧЕНИЕ ЭКРАНОВ (VIEWS) И СКРЫТИЕ ШАПКИ ---
  function setTopbarHidden(hidden) {
    const topbar = document.getElementById('topbar');
    const sensor = document.getElementById('topbar-sensor');
    if (hidden) {
      if (topbar) {
        topbar.classList.add('topbar-hidden');
        topbar.classList.remove('topbar-visible');
      }
      if (sensor) sensor.classList.add('topbar-hidden');
    } else {
      if (topbar) topbar.classList.remove('topbar-hidden');
      if (sensor) sensor.classList.remove('topbar-hidden');
    }
  }

  function showWelcomeView() {
    stopPlayback();
    setTopbarHidden(false);
    el.viewWelcome.style.display = 'flex';
    el.viewLoading.style.display = 'none';
    el.viewArticle.style.display = 'none';
    el.playerBar.style.display = 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function showLoadingView(title) {
    el.loadingArticleName.innerText = `«${title}»`;
    setTopbarHidden(true);
    el.viewWelcome.style.display = 'none';
    el.viewLoading.style.display = 'flex';
    el.viewArticle.style.display = 'none';
    el.playerBar.style.display = 'none';
  }

  function showArticleView() {
    setTopbarHidden(true);
    el.viewWelcome.style.display = 'none';
    el.viewLoading.style.display = 'none';
    el.viewArticle.style.display = 'block';
    el.playerBar.style.display = 'flex';
    if (el.chapterTrackerCard) el.chapterTrackerCard.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function showErrorView(message) {
    const t = TRANSLATIONS[state.lang] || TRANSLATIONS.ru;
    setTopbarHidden(true);
    el.viewWelcome.style.display = 'none';
    el.viewLoading.style.display = 'none';
    el.viewArticle.style.display = 'block';
    el.playerBar.style.display = 'none';
    el.articleLead.style.display = 'none';
    if (el.chapterTrackerCard) el.chapterTrackerCard.style.display = 'none';
    el.articleTitle.innerText = t.errorLoadTitle || 'Ошибка загрузки';
    el.articleBody.innerHTML = `
      <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); padding: 24px; border-radius: 16px; margin: 30px 0;">
        <h3 style="color: #f87171; margin-bottom: 10px;">${t.errorArticleTitle || 'Не удалось открыть статью'}</h3>
        <p style="color: #cbd5e1; font-size: 15px; margin-bottom: 16px;">${message}</p>
        <button class="btn-primary" id="btn-back-to-welcome">${t.errorBackHome || 'Вернуться на главную'}</button>
      </div>
    `;
    document.getElementById('btn-back-to-welcome')?.addEventListener('click', showWelcomeView);
  }

  el.brandLogo.addEventListener('click', (e) => {
    e.preventDefault();
    showWelcomeView();
  });

  el.btnCloseArticle.addEventListener('click', showWelcomeView);

  // --- 11. ЭЛЕМЕНТЫ УПРАВЛЕНИЯ ПЛЕЕРОМ ---
  el.btnPlayPause.addEventListener('click', () => {
    if (state.isPlaying) {
      pausePlayback();
    } else if (state.isPaused) {
      resumePlayback();
    } else {
      startPlayback(true);
    }
  });

  el.btnExplainCurrent.addEventListener('click', () => {
    triggerAnalogy(state.currentParagraphIdx, state.currentWordIdx);
  });

  // Клик по таймлайну прогресса для перемотки
  el.progressTrack.addEventListener('click', (e) => {
    if (state.totalWordsCount === 0) return;
    const rect = el.progressTrack.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const fraction = Math.max(0, Math.min(1, clickX / rect.width));
    const targetWordGlobal = Math.floor(fraction * state.totalWordsCount);

    let cumulative = 0;
    let targetP = 0;
    let targetW = 0;

    for (let p = 0; p < state.paragraphs.length; p++) {
      const count = state.paragraphs[p].words.length;
      if (cumulative + count >= targetWordGlobal) {
        targetP = p;
        targetW = Math.max(0, targetWordGlobal - cumulative);
        break;
      }
      cumulative += count;
    }

    state.currentParagraphIdx = targetP;
    state.currentWordIdx = targetW;
    highlightWord(targetP, targetW);

    if (state.isPlaying) {
      speakParagraph(targetP, targetW);
    }
  });

  // Скорость
  el.selectRate.addEventListener('change', (e) => {
    state.speechRate = parseFloat(e.target.value);
    localStorage.setItem('wv_speech_rate', state.speechRate);
    if (state.isPlaying) speakParagraph(state.currentParagraphIdx, state.currentWordIdx);
  });

  // Голос
  el.selectVoice.addEventListener('change', (e) => {
    const uri = e.target.value;
    state.selectedVoice = (state.voices || []).find(v => v.voiceURI === uri);
    if (state.selectedVoice) {
      localStorage.setItem('wv_voice_' + (state.lang || 'ru'), uri);
    }
    if (state.isPlaying) speakParagraph(state.currentParagraphIdx, state.currentWordIdx);
  });

  // Быстрые темы
  el.presetChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const topic = chip.dataset.topic;
      el.inputSearch.value = topic;
      loadWikipediaArticle(topic);
    });
  });

  el.btnQuickStart.addEventListener('click', () => {
    const startTopic = (TRANSLATIONS[state.lang] && TRANSLATIONS[state.lang].presetChips[0]) ? TRANSLATIONS[state.lang].presetChips[0].topic : 'Википедия';
    el.inputSearch.value = startTopic;
    loadWikipediaArticle(startTopic);
  });

  // Переключение языка (🇷🇺 RU, 🇺🇸 EN, 🇨🇳 ZH)
  document.querySelectorAll('#lang-switch .lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.dataset.lang;
      if (lang && lang !== state.lang) {
        setLanguage(lang);
      }
    });
  });

  // Горячие клавиши
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if (e.code === 'Space') {
      e.preventDefault();
      if (state.isPlaying) pausePlayback();
      else if (state.isPaused) resumePlayback();
      else startPlayback(true);
    }
    if (e.altKey && (e.code === 'KeyE' || e.code === 'KeyU')) {
      e.preventDefault();
      triggerAnalogy(state.currentParagraphIdx, state.currentWordIdx);
    }
    if (e.code === 'Escape') {
      if (state.isExplaining) closeAnalogyModal();
      if (el.modalSettingsOverlay.style.display === 'grid') closeSettingsModal();
      if (el.modal18plusOverlay.style.display === 'grid') hide18PlusWarning();
    }
  });



  async function loadConfigFromFile() {
    try {
      // 1. Сначала пробуем загрузить локальный файл с ключами (игнорируется в Git)
      let res = await fetch('config.local.json');
      if (!res.ok) {
        // 2. Если локальный отсутствует, читаем шаблонный config.json
        res = await fetch('config.json');
      }
      if (res.ok) {
        const cfg = await res.json();
        if (cfg.OPENAI_API_KEY && !state.openaiApiKey) {
          state.openaiApiKey = cfg.OPENAI_API_KEY;
          localStorage.setItem('wv_openai_api_key', cfg.OPENAI_API_KEY);
        }
        if (cfg.GEMINI_API_KEY && !state.geminiApiKey) {
          state.geminiApiKey = cfg.GEMINI_API_KEY;
          localStorage.setItem('wv_gemini_api_key', cfg.GEMINI_API_KEY);
        }
        if (cfg.CLAUDE_API_KEY && !state.claudeApiKey) {
          state.claudeApiKey = cfg.CLAUDE_API_KEY;
          localStorage.setItem('wv_claude_api_key', cfg.CLAUDE_API_KEY);
        }
        if (cfg.GROQ_API_KEY && !state.groqApiKey) {
          state.groqApiKey = cfg.GROQ_API_KEY;
          localStorage.setItem('wv_groq_api_key', cfg.GROQ_API_KEY);
        }
        if (cfg.DEEPSEEK_API_KEY && !state.deepseekApiKey) {
          state.deepseekApiKey = cfg.DEEPSEEK_API_KEY;
          localStorage.setItem('wv_deepseek_api_key', cfg.DEEPSEEK_API_KEY);
        }
        if (cfg.OPENROUTER_API_KEY && !state.openrouterApiKey) {
          state.openrouterApiKey = cfg.OPENROUTER_API_KEY;
          localStorage.setItem('wv_openrouter_api_key', cfg.OPENROUTER_API_KEY);
        }
        if (cfg.BOTHUB_API_KEY && !state.bothubApiKey) {
          state.bothubApiKey = cfg.BOTHUB_API_KEY;
          localStorage.setItem('wv_bothub_api_key', cfg.BOTHUB_API_KEY);
        }
        if (cfg.AI_PROVIDER && !localStorage.getItem('wv_ai_provider')) {
          state.aiProvider = cfg.AI_PROVIDER;
          localStorage.setItem('wv_ai_provider', cfg.AI_PROVIDER);
        }
        state.apiKey = getActiveApiKey();
      }
    } catch (e) {
      // Игнорируем, если конфигурационный файл отсутствует или недоступен
    }
  }

  // --- 13. УПРАВЛЕНИЕ ТЕМОЙ (СВЕТЛАЯ / ТЁМНАЯ) ---
  function applyTheme(theme, save = true) {
    state.theme = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', state.theme);
    if (save) {
      try {
        localStorage.setItem('wv_theme', state.theme);
      } catch (e) {}
    }
    if (el.btnThemeToggle) {
      const t = TRANSLATIONS[state.lang] || TRANSLATIONS.ru;
      const tooltip = t.themeToggleTooltip || 'Переключить тему';
      const currentName = state.theme === 'dark' ? (t.themeDark || 'Тёмная') : (t.themeLight || 'Светлая');
      el.btnThemeToggle.title = `${tooltip} (${currentName})`;
      el.btnThemeToggle.setAttribute('aria-label', `${tooltip}: ${currentName}`);
    }
  }

  function toggleTheme() {
    const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme, true);
  }

  function initTheme() {
    applyTheme(state.theme, false);

    if (el.btnThemeToggle) {
      el.btnThemeToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleTheme();
      });
    }

    // Системное предпочтение (если пользователь ещё не выбрал вручную)
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('wv_theme')) {
          applyTheme(e.matches ? 'dark' : 'light', false);
        }
      });
    }
  }

  // --- 14. ТАЙПРАЙТЕР ---
  let typewriterTimeout = null;
  function startTypewriter(text) {
    const elTypewriter = document.getElementById('typewriter-word');
    if (!elTypewriter) return;
    if (typewriterTimeout) clearTimeout(typewriterTimeout);

    const phrase = text || (TRANSLATIONS[state.lang] ? TRANSLATIONS[state.lang].typewriterGreeting : 'Добро Пожаловать!');
    const chars = Array.from(phrase);
    let charIdx = 0;
    elTypewriter.innerText = '';

    function typeLoop() {
      if (charIdx < chars.length) {
        charIdx++;
        elTypewriter.innerText = chars.slice(0, charIdx).join('');
        typewriterTimeout = setTimeout(typeLoop, 70 + Math.random() * 30);
      }
    }
    typewriterTimeout = setTimeout(typeLoop, 250);
  }

  // --- 14. АВТОМАТИЧЕСКОЕ ПЛАВНОЕ ОТКРЫТИЕ/СКРЫТИЕ ШАПКИ (AUTO-REVEAL) ---
  function initAutoRevealTopbar() {
    const topbar = document.getElementById('topbar');
    const sensor = document.getElementById('topbar-sensor');
    if (!topbar) return;

    let hideTimeout = null;

    function isWelcomeActive() {
      return el.viewWelcome && el.viewWelcome.style.display !== 'none' && !topbar.classList.contains('topbar-hidden');
    }

    function show() {
      // Шапка доступна ТОЛЬКО на приветственном экране (главное меню)
      if (!isWelcomeActive()) return;
      if (hideTimeout) {
        clearTimeout(hideTimeout);
        hideTimeout = null;
      }
      topbar.classList.add('topbar-visible');
    }

    function scheduleHide() {
      if (!isWelcomeActive()) return;
      if (hideTimeout) clearTimeout(hideTimeout);
      hideTimeout = setTimeout(() => {
        if (!isWelcomeActive()) return;
        // Не скрываем, если фокус в строке поиска или открыты подсказки
        if (el.inputSearch && document.activeElement === el.inputSearch) return;
        if (el.searchSuggestions && el.searchSuggestions.style.display !== 'none') return;
        if (topbar.matches(':hover') || (sensor && sensor.matches(':hover'))) return;
        topbar.classList.remove('topbar-visible');
      }, 350);
    }

    // Слушатели наведения на сенсор и шапку
    if (sensor) {
      sensor.addEventListener('mouseenter', show);
      sensor.addEventListener('mouseleave', scheduleHide);
    }
    topbar.addEventListener('mouseenter', show);
    topbar.addEventListener('mouseleave', scheduleHide);

    // Глобальное плавное отслеживание движения мыши к верху экрана
    window.addEventListener('mousemove', (e) => {
      if (!isWelcomeActive()) return;
      if (e.clientY <= 28) {
        show();
      } else if (e.clientY > 90) {
        scheduleHide();
      }
    });

    // Удержание шапки при фокусе в поиске
    if (el.inputSearch) {
      el.inputSearch.addEventListener('focus', show);
      el.inputSearch.addEventListener('blur', () => {
        scheduleHide();
      });
    }

    // Клик по настройкам
    if (el.btnOpenSettings) {
      el.btnOpenSettings.addEventListener('click', show);
    }
    if (el.btnThemeToggle) {
      el.btnThemeToggle.addEventListener('click', show);
    }
  }

  // --- 14. PWA SERVICE WORKER & УСТАНОВКА НА ГЛАВНЫЙ ЭКРАН ---
  function initPwa() {
    // 1. Регистрация Service Worker для оффлайн/быстрого запуска
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
          .then((reg) => {
            console.log('WikiVision PWA: Service Worker активен (scope:', reg.scope, ')');
          })
          .catch((err) => {
            console.warn('WikiVision PWA: Ошибка регистрации Service Worker:', err);
          });
      });
    }

    // 2. Обработка нативного промпта установки
    let deferredPrompt = null;
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      if (el.btnInstallPwa) {
        el.btnInstallPwa.style.display = 'inline-flex';
      }
    });

    if (el.btnInstallPwa) {
      el.btnInstallPwa.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        console.log('WikiVision PWA: Выбор установки:', choice.outcome);
        deferredPrompt = null;
        el.btnInstallPwa.style.display = 'none';
      });
    }

    window.addEventListener('appinstalled', () => {
      console.log('WikiVision PWA: Приложение успешно установлено на устройство!');
      if (el.btnInstallPwa) {
        el.btnInstallPwa.style.display = 'none';
      }
    });
  }

  // Запуск
  initTheme();
  loadConfigFromFile();
  setLanguage(state.lang);
  initAutoRevealTopbar();
  initPwa();

})();

