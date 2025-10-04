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
            folderFormat: 'ukrainian',
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
        // Desktop версії завжди підтримувані
        const isDesktop = !/Android|iPhone|iPad|BlackBerry|Windows Phone/i.test(userAgent);
        
        if (isDesktop) {
            return true;
        }
        
        // Мобільні пристрої поки що не підтримуються
        return false;
    }

    /**
     * Оновлює інформацію про середовище в UI
     */
    updateEnvironmentDisplay() {
        const envInfo = this.getEnvironmentInfo();
        
        // Оновлюємо тексти в хедері
        const osElement = document.querySelector('.env-os');
        const browserElement = document.querySelector('.env-browser');
        
        osElement.textContent = `OS: ${envInfo.os}`;
        browserElement.textContent = `Browser: ${envInfo.fullBrowser}`;
        
        // Якщо пристрій не підтримується - додавайте червоний стиль
        if (!envInfo.isSupported) {
            osElement.style.color = '#dc3545'; // Червоний колір
            osElement.style.fontWeight = 'bold';
            browserElement.style.color = '#dc3545';
            browserElement.style.fontWeight = 'bold';
            
            // Показуємо блокувальний повідомлення
            this.showUnsupportedDeviceMessage();
            
            // Блокуємо функціональність
            this.blockUIForUnsupportedDevice();
        }
        
        // Додаємо CSS класи для стилізації
        document.querySelector('.env-info').classList.add('ready');
        
        console.log('🌍 Середовище:', envInfo);
        console.log(`📱 Підтримується: ${envInfo.isSupported}`);
    }

    /**
     * Показує повідомлення про непідтримуваний пристрій
     */
    showUnsupportedDeviceMessage() {
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
        
        warningBlock.innerHTML = `
            <div style="max-width: 800px; margin: 0 auto;">
                <h3 style="margin: 0 0 0.5rem 0; font-size: 1.2rem;">
                    📱 Мобільні пристрої поки що не підтримуються
                </h3>
                <p style="margin: 0; opacity: 0.9;">
                    На Android та iOS мають обмеження з доступом до файлів. 
                    Будь ласка, використовуйте <strong>Desktop браузер</strong> (Chrome, Edge або Firefox на Windows/Mac/Linux)
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
        const selectOutputBtn = document.getElementById('selectOutputBtn');
        const startBtn = document.getElementById('startBtn');
        
        if (selectInputBtn) {
            selectInputBtn.disabled = true;
            selectInputBtn.style.opacity = '0.5';
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
            this.showError('Помилка ініціалізації додатку: ' + error.message);
        }
    }

    /**
     * Ініціалізує UI елементи
     */
    initializeUI() {
        // Кнопки вибору папок
        document.getElementById('selectInputBtn').addEventListener('click', () => this.selectInputFolder());
        document.getElementById('selectOutputBtn').addEventListener('click', () => this.selectOutputFolder());
        
        // Кнопка початку обробки
        document.getElementById('startBtn').addEventListener('click', () => this.startProcessing());
        
        // Кнопка скасування
        document.getElementById('cancelBtn').addEventListener('click', () => this.cancelProcessing());
        
        // Модальні вікна
        document.getElementById('settingsBtn').addEventListener('click', () => this.showSettingsModal());
        
        // Закриття модальних вікон
        document.getElementById('closeSettingsBtn').addEventListener('click', () => this.hideSettingsModal());
        
        // Збереження налаштувань
        document.getElementById('saveSettingsBtn').addEventListener('click', () => this.saveSettings());
        
        // Зміна опцій обробки
        document.querySelectorAll('input[name="processingMode"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.currentSettings.processingMode = e.target.value;
                this.updateStartButton();
            });
        });
        
        // Зміна критерію сортування
        
        // Зміна чекбоксів
        document.getElementById('createSubfolders').addEventListener('change', (e) => {
            this.currentSettings.createSubfolders = e.target.checked;
        });
        
        document.getElementById('handleDuplicates').addEventListener('change', (e) => {
            this.currentSettings.handleDuplicates = e.target.checked;
        });
        
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
        document.getElementById('loadingOverlay').style.display = 'flex';
    }

    /**
     * Приховує loading overlay
     */
    hideLoadingOverlay() {
        document.getElementById('loadingOverlay').style.display = 'none';
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
     * Вибір вхідної папки
     */
    async selectInputFolder() {
        try {
            const folderHandle = await this.fileHandler.selectInputFolder();
            if (folderHandle) {
                const folderInfo = await this.fileHandler.getFolderInfo(folderHandle);
                this.updateInputFolderInfo(folderInfo);
                this.updateStartButton();
            }
        } catch (error) {
            this.showError('Помилка вибору вхідної папки: ' + error.message);
        }
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
            this.showError('Помилка вибору вихідної папки: ' + error.message);
        }
    }

    /**
     * Оновлює інформацію про вхідну папку
     * @param {Object} folderInfo - Інформація про папку
     */
    updateInputFolderInfo(folderInfo) {
        const card = document.getElementById('inputFolderCard');
        const info = document.getElementById('inputFolderInfo');
        const path = document.getElementById('inputFolderPath');
        const stats = document.getElementById('inputFolderStats');
        
        card.classList.add('selected');
        info.style.display = 'block';
        path.textContent = folderInfo.name;
        stats.textContent = `${folderInfo.fileCount} файлів, ${folderInfo.formattedSize}`;
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
        stats.textContent = `${folderInfo.fileCount} файлів, ${folderInfo.formattedSize}`;
    }

    /**
     * Оновлює стан кнопки "Почати сортування"
     */
    updateStartButton() {
        const startBtn = document.getElementById('startBtn');
        const hasInputFolder = this.fileHandler.inputFolderHandle !== null;
        const hasOutputFolder = this.fileHandler.outputFolderHandle !== null;
        
        startBtn.disabled = !hasInputFolder || !hasOutputFolder || this.isProcessing;
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
            
            this.showSuccess(`Обробку завершено! Оброблено: ${result.processed}, помилок: ${result.errors}`);
            
        } catch (error) {
            console.error('Помилка обробки:', error);
            this.showError('Помилка обробки файлів: ' + error.message);
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
        this.showSuccess('Обробку скасовано');
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
        this.currentSettings.language = document.getElementById('languageSelect').value;
        this.currentSettings.folderFormat = document.getElementById('folderFormatSelect').value;
        this.currentSettings.maxFileSize = parseInt(document.getElementById('maxFileSize').value);
        
        this.fileHandler.setMaxFileSize(this.currentSettings.maxFileSize);
        
        // Зберігаємо в localStorage
        localStorage.setItem('photoSorterSettings', JSON.stringify(this.currentSettings));
        
        this.hideSettingsModal();
        this.showSuccess('Налаштування збережено');
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
            document.getElementById('languageSelect').value = this.currentSettings.language;
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
