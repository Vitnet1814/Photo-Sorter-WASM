/**
 * Main Application
 * Головний файл додатку для сортування фото
 */

class PhotoSorterApp {
    constructor() {
        this.wasmLoader = window.wasmLoader;
        this.fileHandler = window.fileHandler;
        this.swManager = null;
        this.isInitialized = false;
        this.currentSettings = {
            language: 'uk',
            folderFormat: 'monthNames',
            maxFileSize: 100,
            processingMode: 'copy',
            createSubfolders: false,
            handleDuplicates: false,
            theme: 'light'
        };
        this.isProcessing = false;
        this.progressInterval = null;
    }

    /**
     * Детектує інформацію про середовище (ОС та браузер)
     * @returns {Object} Інформація про середовище
     */
    getEnvironmentInfo() {
        const userAgent = navigator.userAgent;
        const platform = navigator.platform;
        
        // Детекція операційної системи
        let os = 'Unknown';
        if (userAgent.includes('Windows NT 10.0')) os = 'Windows 11';
        else if (userAgent.includes('Windows NT 6.3')) os = 'Windows 8.1';
        else if (userAgent.includes('Windows NT 6.2')) os = 'Windows 8';
        else if (userAgent.includes('Windows NT 6.1')) os = 'Windows 7';
        else if (userAgent.includes('Windows')) os = 'Windows';
        else if (userAgent.includes('Mac OS X')) {
            const match = userAgent.match(/Mac OS X (\d+)_(\d+)/);
            if (match) {
                const major = parseInt(match[1]);
                const minor = parseInt(match[2]);
                if (major >= 12) os = 'macOS 12+';
                else if (major === 11) os = 'macOS 11 (Big Sur)';
                else if (major === 10 && minor >= 15) os = 'macOS 10.15+ (Catalina)';
                else os = `macOS ${major}.${minor}`;
            } else os = 'macOS';
        }
        else if (userAgent.includes('iPhone')) os = 'iOS iPhone';
        else if (userAgent.includes('iPad')) os = 'iOS iPad';
        else if (userAgent.includes('Android')) os = 'Android';
        else if (platform.includes('Linux')) os = 'Linux';
        
        // Детекція браузера
        let browser = 'Unknown';
        let version = '';
        if (userAgent.includes('Edg/')) {
            browser = 'Edge';
            const match = userAgent.match(/Edg\/(\d+\.\d+)/);
            version = match ? match[1] : '';
        }
        else if (userAgent.includes('Chrome/') && !userAgent.includes('Edg')) {
            browser = 'Chrome';
            const match = userAgent.match(/Chrome\/(\d+\.\d+)/);
            version = match ? match[1] : '';
        }
        else if (userAgent.includes('Firefox/')) {
            browser = 'Firefox';
            const match = userAgent.match(/Firefox\/(\d+\.\d+)/);
            version = match ? match[1] : '';
        }
        else if (userAgent.includes('Safari/') && !userAgent.includes('Chrome')) {
            browser = 'Safari';
            const match = userAgent.match(/Version\/(\d+\.\d+)/);
            version = match ? match[1] : '';
        }
        else if (userAgent.includes('Opera/')) {
            browser = 'Opera';
            const match = userAgent.match(/Opera\/(\d+\.\d+)/);
            version = match ? match[1] : '';
        }
        
        return {
            os: os,
            browser: browser,
            version: version,
            fullBrowser: version ? `${browser} ${version}` : browser,
            isMobile: /Android|iPhone|iPad|BlackBerry|Windows Phone/i.test(userAgent),
            isSupported: this.isDeviceSupported(os, browser, userAgent)
        };
    }

    /**
     * Перевіряє чи підтримується комбінація OS + браузер
     * @param {string} os - Операційна система
     * @param {string} browser - Браузер
     * @param {string} userAgent - User Agent
     * @returns {boolean} Чи підтримується
     */
    isDeviceSupported(os, browser, userAgent) {
        // Мобільні пристрої поки що не підтримуються
        const isMobile = /Android|iPhone|iPad|BlackBerry|Windows Phone/i.test(userAgent);
        if (isMobile) {
            return false;
        }
        
        // Перевіряємо підтримку File System Access API
        const hasFileSystemAccess = 'showOpenFilePicker' in window && 'showDirectoryPicker' in window;
        
        // Safari не підтримує File System Access API
        if (browser === 'Safari' || !hasFileSystemAccess) {
            return false;
        }
        
        // Desktop версії з підтримкою File System Access API
        return true;
    }

    /**
     * Оновлює інформацію про середовище в UI
     */
    updateEnvironmentDisplay() {
        const envInfo = this.getEnvironmentInfo();
        
        // Оновлюємо тексти в хедері (якщо елементи існують)
        const osElement = document.querySelector('.env-os');
        const browserElement = document.querySelector('.env-browser');
        
        if (osElement) {
            osElement.textContent = window.i18n.t('environment.os', { os: envInfo.os });
        }
        if (browserElement) {
            browserElement.textContent = window.i18n.t('environment.browser', { browser: envInfo.fullBrowser });
        }
        
        // Якщо пристрій не підтримується - додавайте червоний стиль
        if (!envInfo.isSupported) {
            if (osElement) {
                osElement.style.color = '#dc3545'; // Червоний колір
                osElement.style.fontWeight = 'bold';
            }
            if (browserElement) {
                browserElement.style.color = '#dc3545';
                browserElement.style.fontWeight = 'bold';
            }
            
            // Показуємо блокувальний повідомлення
            this.showUnsupportedDeviceMessage();
            
            // Блокуємо функціональність
            this.blockUIForUnsupportedDevice();
        }
        
        // Додаємо CSS класи для стилізації
        const envInfoElement = document.querySelector('.env-info');
        if (envInfoElement) {
            envInfoElement.classList.add('ready');
        }
        
        
    }

    /**
     * Оновлює підказки після зміни мови
     */
    updateTooltips() {
        // Підказка для перемикача теми
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            const tooltip = window.i18n ? window.i18n.t('buttons.toggleTheme') : 'Перемкнути тему';
            themeToggle.title = tooltip;
        }

        // Підказка для чекбокса "Створювати підпапки за днями"
        const createSubfoldersCheckbox = document.getElementById('createSubfolders');
        if (createSubfoldersCheckbox) {
            const createSubfoldersLabel = createSubfoldersCheckbox.closest('.checkbox-label');
            if (createSubfoldersLabel) {
                const isChecked = createSubfoldersCheckbox.checked;
                const tooltipKey = isChecked 
                    ? 'tooltips.createSubfoldersActive' 
                    : 'tooltips.createSubfoldersInactive';
                const tooltip = window.i18n ? window.i18n.t(tooltipKey) : 
                    (isChecked ? "Структура папок: Рік/Місяць/День" : "Структура папок: Рік/Місяць");
                createSubfoldersLabel.title = tooltip;
            }
        }

        // Підказка для чекбокса "Обробляти дублікати"
        const handleDuplicatesCheckbox = document.getElementById('handleDuplicates');
        if (handleDuplicatesCheckbox) {
            const handleDuplicatesLabel = handleDuplicatesCheckbox.closest('.checkbox-label');
            if (handleDuplicatesLabel) {
                const tooltip = window.i18n ? window.i18n.t('tooltips.handleDuplicates') : 
                    "Автоматично виявляє та пропускає дублікати фото за розміром файлу та датою створення";
                handleDuplicatesLabel.title = tooltip;
            }
        }

        // Підказка для селекта формату папок
        const folderFormatSelect = document.getElementById('folderFormatSelect');
        if (folderFormatSelect) {
            const folderFormatLabel = folderFormatSelect.closest('.setting-group').querySelector('label');
            if (folderFormatLabel) {
                const selectedValue = folderFormatSelect.value;
                const tooltipKey = selectedValue === 'numbers' 
                    ? 'tooltips.folderFormatNumbers' 
                    : 'tooltips.folderFormatMonthNames';
                const tooltip = window.i18n ? window.i18n.t(tooltipKey) : 
                    (selectedValue === 'numbers' ? "YYYY/MM/DD → 2025/05/31" : "YYYY/MM/DD → 2025/05_may/31");
                folderFormatLabel.title = tooltip;
            }
        }

        // Підказка для поля "Максимальний розмір файлу"
        const maxFileSizeInput = document.getElementById('maxFileSize');
        if (maxFileSizeInput) {
            const maxFileSizeLabel = maxFileSizeInput.closest('.setting-group').querySelector('label');
            if (maxFileSizeLabel) {
                const tooltip = window.i18n ? window.i18n.t('tooltips.maxFileSize') : 
                    "Максимальний розмір файлу для обробки. Файли більше цього розміру будуть пропущені (за замовчуванням: 100MB)";
                maxFileSizeLabel.title = tooltip;
            }
        }

        // Підказки для радіо-кнопок режимів обробки
        const copyRadio = document.querySelector('input[name="processingMode"][value="copy"]');
        if (copyRadio) {
            const copyLabel = copyRadio.closest('.radio-label');
            if (copyLabel) {
                const tooltip = window.i18n ? window.i18n.t('tooltips.copyMode') : 
                    "Створює копії фото в новій структурі папок. Оригінали залишаються на місці";
                copyLabel.title = tooltip;
            }
        }

        const moveRadio = document.querySelector('input[name="processingMode"][value="move"]');
        if (moveRadio) {
            const moveLabel = moveRadio.closest('.radio-label');
            if (moveLabel) {
                const tooltip = window.i18n ? window.i18n.t('tooltips.moveMode') : 
                    "Переносить оригінальні файли в нову структуру. Економить місце на диску";
                moveLabel.title = tooltip;
            }
        }
    }

    /**
     * Показує повідомлення про непідтримуваний пристрій
     */
    showUnsupportedDeviceMessage() {
        const envInfo = this.getEnvironmentInfo();
        const isMobile = /Android|iPhone|iPad|BlackBerry|Windows Phone/i.test(navigator.userAgent);
        const isSafari = envInfo.browser === 'Safari';
        
        // Створюємо повідомлення поверх всього контенту
        const warningBlock = document.createElement('div');
        warningBlock.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            background: linear-gradient(135deg, #dc3545, #c82333);
            color: white;
            padding: 1rem;
            text-align: center;
            z-index: 9999;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        `;
        
        let title, message;
        
        if (isMobile) {
            title = '📱 ' + window.i18n.t('messages.mobileNotSupported');
            message = window.i18n.t('messages.mobileNotSupported') + '. ' + window.i18n.t('messages.useDesktopBrowser');
        } else if (isSafari) {
            title = '🍎 ' + window.i18n.t('messages.safariNotSupported');
            message = window.i18n.t('messages.safariNotSupported') + '. ' + window.i18n.t('messages.useChromeEdgeFirefox');
        } else {
            title = '⚠️ ' + window.i18n.t('messages.browserNotSupported');
            message = window.i18n.t('messages.browserNotSupported') + '. ' + window.i18n.t('messages.useChromeEdgeFirefox');
        }
        
        warningBlock.innerHTML = `
            <div style="max-width: 800px; margin: 0 auto;">
                <h3 style="margin: 0 0 0.5rem 0; font-size: 1.2rem;">
                    ${title}
                </h3>
                <p style="margin: 0; opacity: 0.9;">
                    ${message}
                </p>
            </div>
        `;
        
        document.body.appendChild(warningBlock);
        
        // Додаємо відступ для контенту під повідомленням
        document.body.style.paddingTop = warningBlock.offsetHeight + 'px';
    }

    /**
     * Блокує UI для непідтримуваних пристроїв
     */
    blockUIForUnsupportedDevice() {
        // Блокуємо кнопки вибору папок
        const selectInputBtn = document.getElementById('selectInputBtn');
        const clearInputBtn = document.getElementById('clearInputBtn');
        const selectOutputBtn = document.getElementById('selectOutputBtn');
        const startBtn = document.getElementById('startBtn');
        
        if (selectInputBtn) {
            selectInputBtn.disabled = true;
            selectInputBtn.style.opacity = '0.5';
        }
        if (clearInputBtn) {
            clearInputBtn.disabled = true;
            clearInputBtn.style.opacity = '0.5';
        }
        if (selectOutputBtn) {
            selectOutputBtn.disabled = true;
            selectOutputBtn.style.opacity = '0.5';
        }
        if (startBtn) {
            startBtn.disabled = true;
            startBtn.style.opacity = '0.5';
        }
    }

    /**
     * Ініціалізує додаток
     */
    async init() {
        try {
            // Перевіряємо чи це мобільний пристрій
            this.isAndroidDevice = /Android/i.test(navigator.userAgent);
            
            // Показуємо loading overlay
            this.showLoadingOverlay();
            
            // Ініціалізуємо Service Worker
            await this.initializeServiceWorker();
            
            // Ініціалізуємо локалізацію
            await window.i18n.init();
            
            // Завантажуємо WASM модуль
            await this.wasmLoader.load();
            
            // Відображуємо інформацію про середовище
            this.updateEnvironmentDisplay();
            
            // Ініціалізуємо UI
            this.initializeUI();
            
            // Завантажуємо налаштування
            this.loadSettings();
            
            // Оновлюємо підказки після повної ініціалізації
            this.updateTooltips();
            
            // Приховуємо loading overlay
            this.hideLoadingOverlay();
            
            this.isInitialized = true;
            
        } catch (error) {
            this.hideLoadingOverlay();
            this.showError(window.i18n.t('errors.initializationError', { error: error.message }));
        }
    }

    /**
     * Ініціалізує UI елементи
     */
    initializeUI() {
        // Кнопки вибору папок
        const selectInputBtn = document.getElementById('selectInputBtn');
        const clearInputBtn = document.getElementById('clearInputBtn');
        const selectOutputBtn = document.getElementById('selectOutputBtn');
        const startBtn = document.getElementById('startBtn');
        const cancelBtn = document.getElementById('cancelBtn');
        const settingsBtn = document.getElementById('settingsBtn');
        const closeSettingsBtn = document.getElementById('closeSettingsBtn');
        const saveSettingsBtn = document.getElementById('saveSettingsBtn');
        const themeToggle = document.getElementById('themeToggle');
        
        if (selectInputBtn) {
            selectInputBtn.addEventListener('click', () => this.selectInputFolder());
        }
        if (clearInputBtn) {
            clearInputBtn.addEventListener('click', () => this.clearInputFolders());
        }
        if (selectOutputBtn) {
            selectOutputBtn.addEventListener('click', () => this.selectOutputFolder());
        }
        if (startBtn) {
            startBtn.addEventListener('click', () => this.startProcessing());
        }
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.cancelProcessing());
        }
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.showSettingsModal());
        }
        if (closeSettingsBtn) {
            closeSettingsBtn.addEventListener('click', () => this.hideSettingsModal());
        }
        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', () => this.saveSettings());
        }
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }
        
        // Обробник зміни мови
        const languageSelect = document.getElementById('languageSelect');
        if (languageSelect) {
            languageSelect.addEventListener('change', async (e) => {
                await window.i18n.setLanguage(e.target.value);
                // Оновлюємо інформацію про середовище після зміни мови
                this.updateEnvironmentDisplay();
                // Оновлюємо підказки після зміни мови
                this.updateTooltips();
            });
        }
        
        // Зміна опцій обробки
        document.querySelectorAll('input[name="processingMode"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.currentSettings.processingMode = e.target.value;
                this.updateStartButton();
            });
        });
        
        // Зміна критерію сортування
        
        // Зміна чекбоксів
        const createSubfoldersCheckbox = document.getElementById('createSubfolders');
        const handleDuplicatesCheckbox = document.getElementById('handleDuplicates');
        
        if (createSubfoldersCheckbox) {
            // Знаходимо label елемент
            const createSubfoldersLabel = createSubfoldersCheckbox.closest('.checkbox-label');
            
            // Функція для оновлення підказки
            const updateTooltip = () => {
                const isChecked = createSubfoldersCheckbox.checked;
                const tooltipKey = isChecked 
                    ? 'tooltips.createSubfoldersActive' 
                    : 'tooltips.createSubfoldersInactive';
                const tooltip = window.i18n ? window.i18n.t(tooltipKey) : 
                    (isChecked ? "Структура папок: Рік/Місяць/День" : "Структура папок: Рік/Місяць");
                if (createSubfoldersLabel) {
                    createSubfoldersLabel.title = tooltip;
                }
            };
            
            // Встановлюємо початкову підказку
            updateTooltip();
            
            createSubfoldersCheckbox.addEventListener('change', (e) => {
                this.currentSettings.createSubfolders = e.target.checked;
                updateTooltip();
            });
        }
        
        if (handleDuplicatesCheckbox) {
            handleDuplicatesCheckbox.addEventListener('change', (e) => {
                this.currentSettings.handleDuplicates = e.target.checked;
            });
        }
        
        // Обробник зміни формату папок
        const folderFormatSelect = document.getElementById('folderFormatSelect');
        if (folderFormatSelect) {
            // Знаходимо label елемент
            const folderFormatLabel = folderFormatSelect.closest('.setting-group').querySelector('label');
            
            // Функція для оновлення підказки
            const updateFolderFormatTooltip = () => {
                const selectedValue = folderFormatSelect.value;
                const tooltipKey = selectedValue === 'numbers' 
                    ? 'tooltips.folderFormatNumbers' 
                    : 'tooltips.folderFormatMonthNames';
                const tooltip = window.i18n ? window.i18n.t(tooltipKey) : 
                    (selectedValue === 'numbers' ? "YYYY/MM/DD → 2025/05/31" : "YYYY/MM/DD → 2025/05_may/31");
                if (folderFormatLabel) {
                    folderFormatLabel.title = tooltip;
                }
            };
            
            // Встановлюємо початкову підказку
            updateFolderFormatTooltip();
            
            folderFormatSelect.addEventListener('change', (e) => {
                this.currentSettings.folderFormat = e.target.value;
                updateFolderFormatTooltip();
            });
        }
        
        // Закриття модальних вікон по кліку поза ними
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });
        
    }

    /**
     * Показує loading overlay
     */
    showLoadingOverlay() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
        }
    }

    /**
     * Ініціалізує Service Worker
     */
    async initializeServiceWorker() {
        try {
            // Перевіряємо підтримку Service Worker
            if (!('serviceWorker' in navigator)) {
                console.log('[App] Service Worker не підтримується');
                return;
            }

            // Перевіряємо чи доступний ServiceWorkerManager
            if (typeof ServiceWorkerManager === 'undefined') {
                console.log('[App] ServiceWorkerManager не завантажений');
                return;
            }

            // Ініціалізуємо менеджер Service Worker
            this.swManager = new ServiceWorkerManager();
            
            // Реєструємо Service Worker
            const registered = await this.swManager.register();
            
            if (registered) {
                console.log('[App] Service Worker успішно ініціалізований');
                
                // Отримуємо статистику кешу
                const cacheStats = await this.swManager.getCacheStats();
                console.log('[App] Статистика кешу:', cacheStats);
                
                // Додаємо інформацію про кеш в інтерфейс
                this.updateCacheInfo(cacheStats);
            } else {
                console.log('[App] Не вдалося ініціалізувати Service Worker');
            }
        } catch (error) {
            console.error('[App] Помилка ініціалізації Service Worker:', error);
            // Не блокуємо роботу додатку при помилці SW
        }
    }

    /**
     * Оновлює інформацію про кеш в інтерфейсі
     */
    updateCacheInfo(cacheStats) {
        // Логуємо інформацію про кеш в консоль для розробників
        if (cacheStats.status === 'available') {
            console.log(`[App] Розмір кешу: ${cacheStats.sizeFormatted}`);
        }
    }

    /**
     * Приховує loading overlay
     */
    hideLoadingOverlay() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
    }

    /**
     * Показує повідомлення про помилку
     * @param {string} message - Повідомлення
     */
    showError(message) {
        // Створюємо toast для помилки
        const toast = document.createElement('div');
        toast.className = 'toast toast-error';
        toast.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(toast);
        
        // Автоматично видаляємо через 5 секунд
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 5000);
    }

    /**
     * Показує повідомлення про успіх
     * @param {string} message - Повідомлення
     */
    showSuccess(message) {
        const toast = document.createElement('div');
        toast.className = 'toast toast-success';
        toast.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 3000);
    }

    /**
     * Вибір вхідної папки (додає до списку)
     */
    async selectInputFolder() {
        try {
            const folderData = await this.fileHandler.selectInputFolder();
            if (folderData) {
                const folderInfo = await this.fileHandler.getFolderInfo(folderData.handle);
                this.addInputFolderToList(folderData, folderInfo);
                this.updateStartButton();
            }
        } catch (error) {
            if (error.message.includes('вже додана')) {
                this.showError(window.i18n.t('messages.folderAlreadyAdded'));
            } else {
                this.showError(window.i18n.t('errors.inputFolderError', { error: error.message }));
            }
        }
    }

    /**
     * Додає папку до списку вхідних папок
     * @param {Object} folderData - Дані папки (handle, name, path)
     * @param {Object} folderInfo - Інформація про папку
     */
    addInputFolderToList(folderData, folderInfo) {
        const folderList = document.getElementById('inputFolderList');
        const folderItems = document.getElementById('inputFolderItems');
        const folderCount = document.getElementById('inputFolderCount');
        const clearBtn = document.getElementById('clearInputBtn');
        const folderInfoDiv = document.getElementById('inputFolderInfo');
        const folderStats = document.getElementById('inputFolderStats');

        // Показуємо список папок
        folderList.style.display = 'block';
        clearBtn.style.display = 'block';

        // Створюємо елемент папки
        const folderItem = document.createElement('div');
        folderItem.className = 'folder-item';
        folderItem.innerHTML = `
            <div class="folder-item-info">
                <i class="fas fa-folder folder-item-icon"></i>
                <div class="folder-item-details">
                    <div class="folder-item-name">${folderData.path}</div>
                    <div class="folder-item-stats">${folderInfo.fileCount} файлів, ${folderInfo.formattedSize}</div>
                </div>
            </div>
            <button class="folder-item-remove" onclick="photoSorterApp.removeInputFolder('${folderData.name}')">
                <i class="fas fa-times"></i>
            </button>
        `;

        folderItems.appendChild(folderItem);

        // Оновлюємо лічильник
        const currentCount = this.fileHandler.getInputFolders().length;
        folderCount.textContent = currentCount;

        // Оновлюємо загальну статистику
        this.updateInputFoldersStats();

        // Показуємо загальну інформацію
        folderInfoDiv.style.display = 'block';
    }

    /**
     * Видаляє папку зі списку вхідних папок
     * @param {string} folderName - Назва папки для видалення
     */
    removeInputFolder(folderName) {
        this.fileHandler.removeInputFolder(folderName);
        
        // Видаляємо елемент з UI
        const folderItems = document.getElementById('inputFolderItems');
        const items = folderItems.querySelectorAll('.folder-item');
        
        for (const item of items) {
            const nameElement = item.querySelector('.folder-item-name');
            if (nameElement && nameElement.textContent === folderName) {
                item.remove();
                break;
            }
        }

        // Оновлюємо лічильник
        const folderCount = document.getElementById('inputFolderCount');
        const currentCount = this.fileHandler.getInputFolders().length;
        folderCount.textContent = currentCount;

        // Якщо папок не залишилося, приховуємо список
        if (currentCount === 0) {
            const folderList = document.getElementById('inputFolderList');
            const clearBtn = document.getElementById('clearInputBtn');
            const folderInfoDiv = document.getElementById('inputFolderInfo');
            
            folderList.style.display = 'none';
            clearBtn.style.display = 'none';
            folderInfoDiv.style.display = 'none';
        } else {
            // Оновлюємо статистику
            this.updateInputFoldersStats();
        }

        this.updateStartButton();
    }

    /**
     * Очищає всі вхідні папки
     */
    clearInputFolders() {
        this.fileHandler.clearInputFolders();
        
        // Очищаємо UI
        const folderList = document.getElementById('inputFolderList');
        const folderItems = document.getElementById('inputFolderItems');
        const clearBtn = document.getElementById('clearInputBtn');
        const folderInfoDiv = document.getElementById('inputFolderInfo');
        
        folderItems.innerHTML = '';
        folderList.style.display = 'none';
        clearBtn.style.display = 'none';
        folderInfoDiv.style.display = 'none';
        
        this.updateStartButton();
    }

    /**
     * Оновлює загальну статистику вхідних папок
     */
    async updateInputFoldersStats() {
        const folders = this.fileHandler.getInputFolders();
        if (folders.length === 0) return;

        let totalFiles = 0;
        let totalSize = 0;

        for (const folderData of folders) {
            const folderInfo = await this.fileHandler.getFolderInfo(folderData.handle);
            totalFiles += folderInfo.fileCount;
            totalSize += folderInfo.totalSize;
        }

        const folderStats = document.getElementById('inputFolderStats');
        folderStats.textContent = window.i18n.t('folders.totalFiles', { 
            count: totalFiles, 
            size: this.formatFileSize(totalSize) 
        });
    }

    /**
     * Вибір вихідної папки
     */
    async selectOutputFolder() {
        try {
            const folderHandle = await this.fileHandler.selectOutputFolder();
            if (folderHandle) {
                const folderInfo = await this.fileHandler.getFolderInfo(folderHandle);
                this.updateOutputFolderInfo(folderInfo);
                this.updateStartButton();
            }
        } catch (error) {
            this.showError(window.i18n.t('errors.outputFolderError', { error: error.message }));
        }
    }


    /**
     * Оновлює інформацію про вихідну папку
     * @param {Object} folderInfo - Інформація про папку
     */
    updateOutputFolderInfo(folderInfo) {
        const card = document.getElementById('outputFolderCard');
        const info = document.getElementById('outputFolderInfo');
        const path = document.getElementById('outputFolderPath');
        const stats = document.getElementById('outputFolderStats');
        
        card.classList.add('selected');
        info.style.display = 'block';
        path.textContent = folderInfo.name;
        stats.textContent = window.i18n.t('folders.totalFiles', { 
            count: folderInfo.fileCount, 
            size: folderInfo.formattedSize 
        });
    }

    /**
     * Оновлює стан кнопки "Почати сортування"
     */
    updateStartButton() {
        const startBtn = document.getElementById('startBtn');
        if (!startBtn) return;
        
        const hasInputFolders = this.fileHandler.getInputFolders().length > 0;
        const hasOutputFolder = this.fileHandler.outputFolderHandle !== null;
        
        startBtn.disabled = !hasInputFolders || !hasOutputFolder || this.isProcessing;
    }

    /**
     * Починає обробку файлів
     */
    async startProcessing() {
        if (this.isProcessing) {
            return;
        }

        try {
            this.isProcessing = true;
            this.updateStartButton();
            
            // Показуємо секцію прогресу
            document.getElementById('progressSection').style.display = 'block';
            
            // Очищаємо попередні дані
            this.fileHandler.clear();
            this.clearProgressLog();
            
            // Починаємо обробку
            const result = await this.fileHandler.processAllFiles(
                this.currentSettings,
                (progress) => this.updateProgress(progress)
            );
            
            this.showSuccess(window.i18n.t('messages.processingComplete', { 
                processed: result.processed, 
                errors: result.errors 
            }));
            
        } catch (error) {
            this.showError(window.i18n.t('errors.processingError', { error: error.message }));
        } finally {
            this.isProcessing = false;
            this.updateStartButton();
        }
    }

    /**
     * Скасовує обробку
     */
    cancelProcessing() {
        this.fileHandler.cancelProcessing();
        this.isProcessing = false;
        this.updateStartButton();
        this.showSuccess(window.i18n.t('messages.processingCancelled'));
    }

    /**
     * Оновлює прогрес обробки
     * @param {Object} progress - Дані прогресу
     */
    updateProgress(progress) {
        // Оновлюємо прогрес-бар
        const progressFill = document.getElementById('progressFill');
        const percentage = Math.round((progress.current / progress.total) * 100);
        progressFill.style.width = percentage + '%';
        
        // Оновлюємо статистику
        document.getElementById('processedCount').textContent = progress.processed;
        document.getElementById('errorCount').textContent = progress.errors;
        document.getElementById('skippedCount').textContent = progress.skipped;
        
        // Додаємо детальний запис в лог з розміром файлу та датними параметрами
        let logMessage = `${progress.currentFile}`;
        if (progress.result.success && progress.result.size) {
            logMessage += ` (${this.formatFileSize(progress.result.size)})`;
        }
        
        // Додаємо датну інформацію якщо є
        if (progress.result.success && progress.result.dateInfo) {
            logMessage += ` - ${progress.result.dateInfo}`;
        }
        
        logMessage += `: ${progress.result.success ? 'успішно' : progress.result.error}`;
        
        this.addLogEntry(progress.result.success ? 'success' : 'error', logMessage);
        
    }

    /**
     * Додає запис в лог
     * @param {string} type - Тип запису
     * @param {string} message - Повідомлення
     */
    addLogEntry(type, message) {
        const logContent = document.getElementById('logContent');
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        
        logContent.appendChild(entry);
        logContent.scrollTop = logContent.scrollHeight;
    }

    /**
     * Очищає лог прогресу
     */
    clearProgressLog() {
        document.getElementById('logContent').innerHTML = '';
    }


    /**
     * Показує модальне вікно налаштувань
     */
    showSettingsModal() {
        document.getElementById('settingsModal').classList.add('active');
        // Оновлюємо підказки при відкритті модального вікна з невеликою затримкою
        setTimeout(() => {
            this.updateTooltips();
        }, 100);
    }

    /**
     * Приховує модальне вікно налаштувань
     */
    hideSettingsModal() {
        document.getElementById('settingsModal').classList.remove('active');
    }


    /**
     * Зберігає налаштування
     */
    saveSettings() {
        this.currentSettings.language = window.i18n.getCurrentLanguage();
        this.currentSettings.folderFormat = document.getElementById('folderFormatSelect').value;
        this.currentSettings.maxFileSize = parseInt(document.getElementById('maxFileSize').value);
        
        this.fileHandler.setMaxFileSize(this.currentSettings.maxFileSize);
        
        // Зберігаємо в localStorage
        localStorage.setItem('photoSorterSettings', JSON.stringify(this.currentSettings));
        
        this.hideSettingsModal();
        this.showSuccess(window.i18n.t('messages.settingsSaved'));
    }

    /**
     * Завантажує налаштування
     */
    loadSettings() {
        try {
            const saved = localStorage.getItem('photoSorterSettings');
            if (saved) {
                this.currentSettings = { ...this.currentSettings, ...JSON.parse(saved) };
            }
            
            // Оновлюємо UI
            document.getElementById('languageSelect').value = window.i18n.getCurrentLanguage();
            document.getElementById('folderFormatSelect').value = this.currentSettings.folderFormat;
            document.getElementById('maxFileSize').value = this.currentSettings.maxFileSize;
            
            this.fileHandler.setMaxFileSize(this.currentSettings.maxFileSize);
            
            // Застосовуємо тему
            this.applyTheme(this.currentSettings.theme || 'light');
            
        } catch (error) {
        }
    }

    /**
     * Застосовує тему до сторінки
     * @param {string} theme - Назва теми ('light' або 'dark')
     */
    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.setAttribute('data-theme', theme);
        }
        this.currentSettings.theme = theme;
    }

    /**
     * Перемикає тему
     */
    toggleTheme() {
        const currentTheme = this.currentSettings.theme || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
        this.saveSettings();
    }

    /**
     * Форматує розмір файлу
     * @param {number} bytes - Розмір в байтах
     * @returns {string} Відформатований розмір
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Отримує поточні налаштування
     * @returns {Object} Налаштування
     */
    getSettings() {
        return { ...this.currentSettings };
    }

    /**
     * Встановлює налаштування
     * @param {Object} settings - Нові налаштування
     */
    setSettings(settings) {
        this.currentSettings = { ...this.currentSettings, ...settings };
        this.loadSettings();
    }

    /**
     * Оновлює налаштування
     * @param {Object} settings - Нові налаштування
     */
    updateSettings(settings) {
        this.currentSettings = { ...this.currentSettings, ...settings };
    }

    /**
     * Скидає налаштування до за замовчуванням
     */
    resetSettings() {
        this.currentSettings = {
            language: 'uk',
            folderFormat: 'monthNames',
            maxFileSize: 100,
            processingMode: 'copy',
            createSubfolders: false,
            handleDuplicates: false,
            theme: 'light'
        };
    }

    /**
     * Оновлює прогрес обробки
     * @param {number} current - Поточний прогрес
     * @param {number} total - Загальна кількість
     */
    updateProgress(current, total) {
        this.currentProgress = current;
        this.totalItems = total;
    }

    /**
     * Отримує відсоток прогресу
     * @returns {number} Відсоток прогресу
     */
    getProgressPercentage() {
        if (this.totalItems === 0) return 0;
        return Math.round((this.currentProgress / this.totalItems) * 100);
    }

    /**
     * Додає до статистики
     * @param {string} type - Тип статистики
     * @param {number} count - Кількість
     */
    addToStats(type, count = 1) {
        if (!this.stats) this.stats = { processed: 0, errors: 0, skipped: 0 };
        this.stats[type] = (this.stats[type] || 0) + count;
    }

    /**
     * Отримує статистику
     * @returns {Object} Статистика
     */
    getStats() {
        return this.stats || { processed: 0, errors: 0, skipped: 0 };
    }

    /**
     * Скидає статистику
     */
    resetStats() {
        this.stats = { processed: 0, errors: 0, skipped: 0 };
    }

    /**
     * Встановлює мову
     * @param {string} language - Код мови
     */
    setLanguage(language) {
        const supportedLanguages = ['uk', 'en', 'ru', 'de', 'fr', 'es', 'it', 'pt', 'pl', 'nl', 'sv', 'ko', 'ja', 'zh', 'hi', 'ar'];
        if (supportedLanguages.includes(language)) {
            this.currentSettings.language = language;
        }
    }

    /**
     * Завантажує локалізацію
     * @param {string} language - Код мови
     * @returns {Promise<Object>} Локалізація
     */
    async loadLocalization(language) {
        const response = await fetch(`/js/locales/${language}.json`);
        return response.json();
    }

    /**
     * Валідує вхідні дані
     * @param {*} input - Вхідні дані
     * @returns {boolean} Чи валідні дані
     */
    validateInput(input) {
        return input !== null && input !== undefined && input !== '';
    }

    /**
     * Санітизує вхідні дані
     * @param {string} input - Вхідні дані
     * @returns {string} Санітизовані дані
     */
    sanitizeInput(input) {
        if (typeof input !== 'string') return '';
        return input
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '');
    }

    /**
     * Перевіряє чи розмір файлу валідний
     * @param {Object} file - Файл для перевірки
     * @returns {boolean} Чи валідний розмір
     */
    isFileSizeValid(file) {
        const maxSize = this.currentSettings.maxFileSize * 1024 * 1024;
        return file.size <= maxSize;
    }

    /**
     * Логує помилку
     * @param {string} message - Повідомлення про помилку
     */
    logError(message) {
        console.error(message);
    }

    /**
     * Обробляє помилку
     * @param {string} message - Повідомлення про помилку
     * @param {Error} error - Об'єкт помилки
     */
    handleError(message, error) {
        if (this.onError) {
            this.onError(message, error);
        }
    }

    /**
     * Ініціалізує додаток
     * @returns {Promise<void>}
     */
    async initialize() {
        if (this.wasmLoader && this.wasmLoader.load) {
            await this.wasmLoader.load();
            this.isInitialized = true;
        }
    }
}

// Ініціалізація додатку при завантаженні сторінки
document.addEventListener('DOMContentLoaded', async () => {
    const app = new PhotoSorterApp();
    await app.init();
    
    // Додаємо глобальний доступ до додатку
    window.photoSorterApp = app;
    
});


// Додаємо стилі для toast повідомлень
const toastStyles = document.createElement('style');
toastStyles.textContent = `
    .toast {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        color: white;
        font-weight: 500;
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
        animation: slideIn 0.3s ease-out;
    }
    
    .toast-success {
        background: #10b981;
    }
    
    .toast-error {
        background: #ef4444;
    }
    
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(toastStyles);
