/**
 * Main Application
 * Головний файл додатку для сортування фото
 */

class PhotoSorterApp {
    constructor() {
        this.wasmLoader = window.wasmLoader;
        this.fileHandler = window.fileHandler;
        this.isInitialized = false;
        this.currentSettings = {
            language: 'uk',
            folderFormat: 'monthNames',
            maxFileSize: 100,
            processingMode: 'copy',
            createSubfolders: true,
            handleDuplicates: true
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
        
        console.log('🌍 Середовище:', envInfo);
        console.log(`📱 Підтримується: ${envInfo.isSupported}`);
        console.log(`🔍 File System Access API: ${'showOpenFilePicker' in window && 'showDirectoryPicker' in window}`);
        console.log(`🍎 Safari: ${envInfo.browser === 'Safari'}`);
        
        // Додаємо функції тестування в глобальну область
        window.testBrowserSupport = () => {
            const testEnv = this.getEnvironmentInfo();
            console.log('🧪 Тест підтримки браузера:');
            console.log('OS:', testEnv.os);
            console.log('Browser:', testEnv.browser);
            console.log('File System Access API:', 'showOpenFilePicker' in window && 'showDirectoryPicker' in window);
            console.log('Підтримується:', testEnv.isSupported);
            return testEnv;
        };
        
        // Функція для симуляції Safari (для тестування)
        window.simulateSafari = () => {
            console.log('🍎 Симуляція Safari...');
            Object.defineProperty(navigator, 'userAgent', {
                writable: true,
                value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15'
            });
            // Перезавантажуємо сторінку для застосування змін
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        };
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
            console.log('🚀 Ініціалізація Photo Sorter WASM...');
            
            // Перевіряємо чи це мобільний пристрій
            this.isAndroidDevice = /Android/i.test(navigator.userAgent);
            if (this.isAndroidDevice) {
                console.log('📱 Виявлено Android пристрій');
            }
            
            // Показуємо loading overlay
            this.showLoadingOverlay();
            
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
            
            // Приховуємо loading overlay
            this.hideLoadingOverlay();
            
            this.isInitialized = true;
            console.log('✅ Додаток ініціалізовано успішно');
            
        } catch (error) {
            console.error('❌ Помилка ініціалізації:', error);
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
        
        // Обробник зміни мови
        const languageSelect = document.getElementById('languageSelect');
        if (languageSelect) {
            languageSelect.addEventListener('change', async (e) => {
                await window.i18n.setLanguage(e.target.value);
                // Оновлюємо інформацію про середовище після зміни мови
                this.updateEnvironmentDisplay();
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
            createSubfoldersCheckbox.addEventListener('change', (e) => {
                this.currentSettings.createSubfolders = e.target.checked;
            });
        }
        
        if (handleDuplicatesCheckbox) {
            handleDuplicatesCheckbox.addEventListener('change', (e) => {
                this.currentSettings.handleDuplicates = e.target.checked;
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
        
        console.log('🎨 UI ініціалізовано');
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
            console.error('Помилка обробки:', error);
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
        
        // Додаткова діагностика для мобільних пристроїв
        if (/Android|iPhone|iPad|BlackBerry|Windows Phone/.test(navigator.userAgent)) {
            console.log(`📱 Мобільний пристрій: оброблено ${progress.current} з ${progress.total}`);
        }
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
            
        } catch (error) {
            console.error('Помилка завантаження налаштувань:', error);
        }
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
}

// Ініціалізація додатку при завантаженні сторінки
document.addEventListener('DOMContentLoaded', async () => {
    const app = new PhotoSorterApp();
    await app.init();
    
    // Додаємо глобальний доступ до додатку
    window.photoSorterApp = app;
    
    console.log('🎉 Photo Sorter WASM готовий до роботи!');
});

// Обробка помилок
window.addEventListener('error', (event) => {
    console.error('Глобальна помилка:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Необроблена помилка Promise:', event.reason);
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
