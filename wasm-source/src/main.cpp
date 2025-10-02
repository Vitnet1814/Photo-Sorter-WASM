#include <emscripten.h>
#include <emscripten/bind.h>
#include <iostream>
#include <string>
#include <vector>
#include <map>
#include <ctime>
#include <sstream>
#include <iomanip>
#include <algorithm>
#include <cstring>

// Структура для зберігання метаданих фото
struct PhotoMetadata {
    std::string filename;
    std::string date_taken;
    std::string date_modified;
    std::string camera_make;
    std::string camera_model;
    std::string location;
    long file_size;
    int width;
    int height;
    std::string format;
    bool has_exif;
    bool is_valid;
};

// Глобальний вектор для зберігання метаданих
std::vector<PhotoMetadata> photo_metadata;

// Функція для парсингу дати з EXIF
std::string parseExifDate(const std::string& exif_date) {
    if (exif_date.empty()) return "";
    
    // Формат: "YYYY:MM:DD HH:MM:SS"
    if (exif_date.length() >= 19) {
        return exif_date.substr(0, 10); // Повертаємо тільки дату
    }
    return "";
}

// Функція для визначення типу файлу
std::string getFileFormat(const std::string& filename) {
    size_t dot_pos = filename.find_last_of('.');
    if (dot_pos != std::string::npos) {
        std::string ext = filename.substr(dot_pos + 1);
        std::transform(ext.begin(), ext.end(), ext.begin(), ::tolower);
        return ext;
    }
    return "";
}

// Функція для перевірки чи є файл зображенням
bool isImageFile(const std::string& filename) {
    std::string format = getFileFormat(filename);
    std::vector<std::string> image_formats = {
        "jpg", "jpeg", "png", "tiff", "tif", "heic", "webp", 
        "bmp", "gif", "cr2", "nef", "arw", "dng"
    };
    
    return std::find(image_formats.begin(), image_formats.end(), format) != image_formats.end();
}

// Функція для створення структури папок
std::string createFolderStructure(const std::string& date_str, const std::string& base_path) {
    if (date_str.empty()) {
        return base_path + "/Без дати";
    }
    
    // Парсимо дату: YYYY-MM-DD
    if (date_str.length() >= 10) {
        std::string year = date_str.substr(0, 4);
        std::string month = date_str.substr(5, 2);
        std::string day = date_str.substr(8, 2);
        
        // Мапи місяців українською
        std::map<std::string, std::string> month_names = {
            {"01", "01_січень"}, {"02", "02_лютий"}, {"03", "03_березень"},
            {"04", "04_квітень"}, {"05", "05_травень"}, {"06", "06_червень"},
            {"07", "07_липень"}, {"08", "08_серпень"}, {"09", "09_вересень"},
            {"10", "10_жовтень"}, {"11", "11_листопад"}, {"12", "12_грудень"}
        };
        
        std::string month_name = month_names[month];
        if (month_name.empty()) month_name = month;
        
        return base_path + "/" + year + "/" + month_name + "/" + day;
    }
    
    return base_path + "/Без дати";
}

// Функція для обробки одного фото
extern "C" {
    EMSCRIPTEN_KEEPALIVE
    void processPhoto(const char* filename, const char* file_data, int data_size, 
                     const char* date_taken, const char* date_modified, 
                     const char* camera_make, const char* camera_model,
                     const char* location, long file_size, int width, int height) {
        
        PhotoMetadata metadata;
        metadata.filename = std::string(filename);
        metadata.date_taken = parseExifDate(std::string(date_taken));
        metadata.date_modified = std::string(date_modified);
        metadata.camera_make = std::string(camera_make);
        metadata.camera_model = std::string(camera_model);
        metadata.location = std::string(location);
        metadata.file_size = file_size;
        metadata.width = width;
        metadata.height = height;
        metadata.format = getFileFormat(metadata.filename);
        metadata.has_exif = !metadata.date_taken.empty() || !metadata.camera_make.empty();
        metadata.is_valid = isImageFile(metadata.filename) && data_size > 0;
        
        photo_metadata.push_back(metadata);
    }
    
    // Функція для отримання кількості оброблених фото
    EMSCRIPTEN_KEEPALIVE
    int getProcessedCount() {
        return photo_metadata.size();
    }
    
    // Функція для отримання метаданих фото за індексом
    EMSCRIPTEN_KEEPALIVE
    const char* getPhotoMetadata(int index) {
        if (index < 0 || index >= photo_metadata.size()) {
            return "";
        }
        
        static std::string result;
        PhotoMetadata& meta = photo_metadata[index];
        
        result = "{\n";
        result += "  \"filename\": \"" + meta.filename + "\",\n";
        result += "  \"date_taken\": \"" + meta.date_taken + "\",\n";
        result += "  \"date_modified\": \"" + meta.date_modified + "\",\n";
        result += "  \"camera_make\": \"" + meta.camera_make + "\",\n";
        result += "  \"camera_model\": \"" + meta.camera_model + "\",\n";
        result += "  \"location\": \"" + meta.location + "\",\n";
        result += "  \"file_size\": " + std::to_string(meta.file_size) + ",\n";
        result += "  \"width\": " + std::to_string(meta.width) + ",\n";
        result += "  \"height\": " + std::to_string(meta.height) + ",\n";
        result += "  \"format\": \"" + meta.format + "\",\n";
        result += "  \"has_exif\": " + (meta.has_exif ? "true" : "false") + ",\n";
        result += "  \"is_valid\": " + (meta.is_valid ? "true" : "false") + "\n";
        result += "}";
        
        return result.c_str();
    }
    
    // Функція для створення структури папок для фото
    EMSCRIPTEN_KEEPALIVE
    const char* getFolderStructure(int index, const char* base_path) {
        if (index < 0 || index >= photo_metadata.size()) {
            return "";
        }
        
        static std::string result;
        PhotoMetadata& meta = photo_metadata[index];
        
        std::string folder_path = createFolderStructure(meta.date_taken, std::string(base_path));
        
        // Додаємо підпапки для великих файлів та помилок
        if (meta.file_size > 100 * 1024 * 1024) { // > 100MB
            folder_path += "/Великі файли";
        } else if (!meta.is_valid) {
            folder_path += "/Помилки";
        }
        
        result = folder_path;
        return result.c_str();
    }
    
    // Функція для очищення метаданих
    EMSCRIPTEN_KEEPALIVE
    void clearMetadata() {
        photo_metadata.clear();
    }
    
    // Функція для отримання статистики
    EMSCRIPTEN_KEEPALIVE
    const char* getStatistics() {
        static std::string result;
        
        int total = photo_metadata.size();
        int valid = 0;
        int with_exif = 0;
        int large_files = 0;
        long total_size = 0;
        
        for (const auto& meta : photo_metadata) {
            if (meta.is_valid) valid++;
            if (meta.has_exif) with_exif++;
            if (meta.file_size > 100 * 1024 * 1024) large_files++;
            total_size += meta.file_size;
        }
        
        result = "{\n";
        result += "  \"total_photos\": " + std::to_string(total) + ",\n";
        result += "  \"valid_photos\": " + std::to_string(valid) + ",\n";
        result += "  \"with_exif\": " + std::to_string(with_exif) + ",\n";
        result += "  \"large_files\": " + std::to_string(large_files) + ",\n";
        result += "  \"total_size\": " + std::to_string(total_size) + ",\n";
        result += "  \"errors\": " + std::to_string(total - valid) + "\n";
        result += "}";
        
        return result.c_str();
    }
}

// Функція для сортування фото за різними критеріями
extern "C" {
    EMSCRIPTEN_KEEPALIVE
    void sortPhotos(int criteria) {
        switch (criteria) {
            case 0: // За датою зйомки
                std::sort(photo_metadata.begin(), photo_metadata.end(),
                    [](const PhotoMetadata& a, const PhotoMetadata& b) {
                        return a.date_taken < b.date_taken;
                    });
                break;
            case 1: // За датою модифікації
                std::sort(photo_metadata.begin(), photo_metadata.end(),
                    [](const PhotoMetadata& a, const PhotoMetadata& b) {
                        return a.date_modified < b.date_modified;
                    });
                break;
            case 2: // За розміром файлу
                std::sort(photo_metadata.begin(), photo_metadata.end(),
                    [](const PhotoMetadata& a, const PhotoMetadata& b) {
                        return a.file_size > b.file_size;
                    });
                break;
            case 3: // За типом камери
                std::sort(photo_metadata.begin(), photo_metadata.end(),
                    [](const PhotoMetadata& a, const PhotoMetadata& b) {
                        return a.camera_make < b.camera_make;
                    });
                break;
        }
    }
}

// Функція для отримання версії модуля
extern "C" {
    EMSCRIPTEN_KEEPALIVE
    const char* getVersion() {
        return "1.0.0";
    }
}
