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
            sortCriteria: 0,
            createSubfolders: true,
            handleDuplicates: true,
            preserveStructure: false
        };
        this.isProcessing = false;
        this.progressInterval = null;
    }

    /**
     * Ініціалізує додаток
     */
    async init() {
        try {
            console.log('🚀 Ініціалізація Photo Sorter WASM...');
            
            // Показуємо loading overlay
            this.showLoadingOverlay();
            
            // Завантажуємо WASM модуль
            await this.wasmLoader.load();
            
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
        document.getElementById('premiumBtn').addEventListener('click', () => this.showPremiumModal());
        
        // Закриття модальних вікон
        document.getElementById('closeSettingsBtn').addEventListener('click', () => this.hideSettingsModal());
        document.getElementById('closePremiumBtn').addEventListener('click', () => this.hidePremiumModal());
        
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
        document.getElementById('sortCriteria').addEventListener('change', (e) => {
            this.currentSettings.sortCriteria = parseInt(e.target.value);
        });
        
        // Зміна чекбоксів
        document.getElementById('createSubfolders').addEventListener('change', (e) => {
            this.currentSettings.createSubfolders = e.target.checked;
        });
        
        document.getElementById('handleDuplicates').addEventListener('change', (e) => {
            this.currentSettings.handleDuplicates = e.target.checked;
        });
        
        document.getElementById('preserveStructure').addEventListener('change', (e) => {
            this.currentSettings.preserveStructure = e.target.checked;
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
            document.getElementById('statisticsSection').style.display = 'none';
            
            // Очищаємо попередні дані
            this.fileHandler.clear();
            this.clearProgressLog();
            
            // Починаємо обробку
            const result = await this.fileHandler.processAllFiles(
                this.currentSettings,
                (progress) => this.updateProgress(progress)
            );
            
            // Показуємо статистику
            this.showStatistics(result);
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
        
        // Додаємо запис в лог
        this.addLogEntry(progress.result.success ? 'success' : 'error', 
            `${progress.currentFile}: ${progress.result.success ? 'успішно' : progress.result.error}`);
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
     * Показує статистику обробки
     * @param {Object} result - Результат обробки
     */
    showStatistics(result) {
        const stats = this.fileHandler.getStatistics();
        
        document.getElementById('totalPhotos').textContent = stats.total_photos;
        document.getElementById('validPhotos').textContent = stats.valid_photos;
        document.getElementById('withExif').textContent = stats.with_exif;
        document.getElementById('totalSize').textContent = this.fileHandler.formatFileSize(stats.total_size);
        
        document.getElementById('statisticsSection').style.display = 'block';
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
     * Показує модальне вікно преміум
     */
    showPremiumModal() {
        document.getElementById('premiumModal').classList.add('active');
    }

    /**
     * Приховує модальне вікно преміум
     */
    hidePremiumModal() {
        document.getElementById('premiumModal').classList.remove('active');
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
