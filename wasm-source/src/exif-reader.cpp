#include <emscripten.h>
#include <emscripten/bind.h>
#include <iostream>
#include <string>
#include <vector>
#include <cstring>

// Простий парсер EXIF для основних тегів
class ExifReader {
private:
    std::vector<uint8_t> data;
    
    // Читання 16-бітного значення в big-endian
    uint16_t readUint16BE(size_t offset) {
        if (offset + 1 >= data.size()) return 0;
        return (data[offset] << 8) | data[offset + 1];
    }
    
    // Читання 32-бітного значення в big-endian
    uint32_t readUint32BE(size_t offset) {
        if (offset + 3 >= data.size()) return 0;
        return (data[offset] << 24) | (data[offset + 1] << 16) | 
               (data[offset + 2] << 8) | data[offset + 3];
    }
    
    // Пошук маркера JPEG
    size_t findJpegMarker(uint16_t marker) {
        for (size_t i = 0; i < data.size() - 1; i++) {
            if (data[i] == 0xFF && data[i + 1] == marker) {
                return i;
            }
        }
        return 0;
    }
    
    // Читання ASCII рядка з EXIF
    std::string readAsciiString(size_t offset, size_t length) {
        if (offset + length > data.size()) return "";
        
        std::string result;
        for (size_t i = 0; i < length; i++) {
            char c = data[offset + i];
            if (c == 0) break; // NULL terminator
            result += c;
        }
        return result;
    }
    
    // Читання значення з урахуванням byte order
    uint16_t readUint16(size_t offset, bool is_big_endian) {
        if (offset + 1 >= data.size()) return 0;
        if (is_big_endian) {
            return readUint16BE(offset);
        } else {
            return data[offset] | (data[offset + 1] << 8);
        }
    }
    
    uint32_t readUint32(size_t offset, bool is_big_endian) {
        if (offset + 3 >= data.size()) return 0;
        if (is_big_endian) {
            return readUint32BE(offset);
        } else {
            return data[offset] | (data[offset + 1] << 8) | 
                   (data[offset + 2] << 16) | (data[offset + 3] << 24);
        }
    }
    
    // Форматування дати з EXIF
    std::string formatExifDate(const std::string& date_str) {
        if (date_str.length() >= 19) {
            // Формат: "YYYY:MM:DD HH:MM:SS" -> "YYYY-MM-DD"
            return date_str.substr(0, 4) + "-" + 
                   date_str.substr(5, 2) + "-" + 
                   date_str.substr(8, 2);
        }
        return "";
    }
    
    // Очищення рядка від зайвих символів
    std::string cleanString(const std::string& str) {
        std::string result = str;
        // Видаляємо NULL символи та зайві пробіли
        result.erase(std::remove(result.begin(), result.end(), '\0'), result.end());
        // Обрізаємо пробіли на початку та в кінці
        size_t start = result.find_first_not_of(" \t\r\n");
        if (start != std::string::npos) {
            size_t end = result.find_last_not_of(" \t\r\n");
            result = result.substr(start, end - start + 1);
        }
        return result;
    }

public:
    ExifReader(const uint8_t* file_data, size_t data_size) {
        data.assign(file_data, file_data + data_size);
    }
    
    // Читання основних EXIF даних
    struct ExifData {
        std::string date_taken;           // DateTimeOriginal - оригінальна дата/час знімка
        std::string date_time;            // DateTime - дата та час створення фото
        std::string date_digitized;       // DateTimeDigitized - дата/час оцифрування
        std::string gps_date_stamp;       // GPSDateStamp - дата GPS координат
        std::string gps_time_stamp;       // GPSTimeStamp - час GPS координат
        std::string camera_make;
        std::string camera_model;
        std::string location;
        int width;
        int height;
        bool has_exif;
    };
    
    ExifData readExifData() {
        ExifData result;
        result.has_exif = false;
        
        // Перевіряємо чи це JPEG файл
        if (data.size() < 4 || data[0] != 0xFF || data[1] != 0xD8) {
            // DEBUG: Не JPEG файл
            return result;
        }
        
        // Шукаємо APP1 маркер (EXIF)
        size_t app1_offset = findJpegMarker(0xE1);
        if (app1_offset == 0) {
            return result;
        }
        
        // Читаємо довжину APP1 сегмента
        uint16_t app1_length = readUint16BE(app1_offset + 2);
        if (app1_offset + app1_length > data.size()) {
            return result;
        }
        
        // Перевіряємо EXIF заголовок
        size_t exif_start = app1_offset + 4;
        if (exif_start + 6 > data.size()) {
            return result;
        }
        
        std::string exif_header(reinterpret_cast<const char*>(&data[exif_start]), 6);
        if (exif_header != "Exif\0\0") {
            return result;
        }
        
        result.has_exif = true;
        
        // Читаємо TIFF заголовок
        size_t tiff_start = exif_start + 6;
        if (tiff_start + 8 > data.size()) {
            return result;
        }
        
        // Перевіряємо byte order
        bool is_big_endian = (data[tiff_start] == 0x4D && data[tiff_start + 1] == 0x4D);
        bool is_little_endian = (data[tiff_start] == 0x49 && data[tiff_start + 1] == 0x49);
        
        if (!is_big_endian && !is_little_endian) {
            return result; // Невідомий byte order
        }
        
        // Читаємо IFD offset
        uint32_t ifd_offset = readUint32(tiff_start + 4, is_big_endian);
        
        // Парсимо основні теги
        result = parseBasicTags(tiff_start, ifd_offset, is_big_endian);
        
        return result;
    }
    
private:
    ExifData parseBasicTags(size_t tiff_start, uint32_t ifd_offset, bool is_big_endian) {
        ExifData result;
        result.has_exif = true;
        
        // Ініціалізуємо порожніми значеннями
        result.date_taken = "";
        result.date_time = "";
        result.date_digitized = "";
        result.gps_date_stamp = "";
        result.gps_time_stamp = "";
        result.camera_make = "";
        result.camera_model = "";
        result.location = "";
        result.width = 0;
        result.height = 0;
        
        // Парсимо основні IFD теги
        parseIFD(tiff_start, ifd_offset, is_big_endian, result);
        
        return result;
    }
    
    // Парсинг IFD (Image File Directory)
    void parseIFD(size_t tiff_start, uint32_t ifd_offset, bool is_big_endian, ExifData& result) {
        size_t ifd_start = tiff_start + ifd_offset;
        
        // Читаємо кількість записів в IFD
        uint16_t entry_count = readUint16(ifd_start, is_big_endian);
        if (ifd_start + 2 + entry_count * 12 > data.size()) {
            return; // Недостатньо даних
        }
        
        // Парсимо кожен запис в IFD
        for (uint16_t i = 0; i < entry_count; i++) {
            size_t entry_offset = ifd_start + 2 + i * 12;
            parseIFDEntry(entry_offset, tiff_start, is_big_endian, result);
        }
        
        // Читаємо наступний IFD offset (якщо є)
        size_t next_ifd_offset = ifd_start + 2 + entry_count * 12;
        if (next_ifd_offset + 4 <= data.size()) {
            uint32_t next_offset = readUint32(next_ifd_offset, is_big_endian);
            if (next_offset != 0) {
                parseIFD(tiff_start, next_offset, is_big_endian, result);
            }
        }
    }
    
    // Парсинг одного запису IFD
    void parseIFDEntry(size_t entry_offset, size_t tiff_start, bool is_big_endian, ExifData& result) {
        if (entry_offset + 12 > data.size()) return;
        
        uint16_t tag = readUint16(entry_offset, is_big_endian);
        uint16_t type = readUint16(entry_offset + 2, is_big_endian);
        uint32_t count = readUint32(entry_offset + 4, is_big_endian);
        uint32_t value_offset = readUint32(entry_offset + 8, is_big_endian);
        
        // Обробляємо тільки цікаві нам теги
        switch (tag) {
            case 0x0132: // DateTime
                if (type == 2 && count > 0) { // ASCII string
                    result.date_time = cleanString(readAsciiString(tiff_start + value_offset, count));
                }
                break;
                
            case 0x9003: // DateTimeOriginal
                if (type == 2 && count > 0) {
                    std::string raw_date = cleanString(readAsciiString(tiff_start + value_offset, count));
                    result.date_taken = formatExifDate(raw_date);
                }
                break;
                
            case 0x9004: // DateTimeDigitized
                if (type == 2 && count > 0) {
                    result.date_digitized = cleanString(readAsciiString(tiff_start + value_offset, count));
                }
                break;
                
            case 0x010F: // Make
                if (type == 2 && count > 0) {
                    result.camera_make = cleanString(readAsciiString(tiff_start + value_offset, count));
                }
                break;
                
            case 0x0110: // Model
                if (type == 2 && count > 0) {
                    result.camera_model = cleanString(readAsciiString(tiff_start + value_offset, count));
                }
                break;
                
            case 0x0100: // ImageWidth
                if (type == 3 && count == 1) { // SHORT
                    result.width = readUint16(entry_offset + 8, is_big_endian);
                } else if (type == 4 && count == 1) { // LONG
                    result.width = readUint32(entry_offset + 8, is_big_endian);
                }
                break;
                
            case 0x0101: // ImageLength
                if (type == 3 && count == 1) { // SHORT
                    result.height = readUint16(entry_offset + 8, is_big_endian);
                } else if (type == 4 && count == 1) { // LONG
                    result.height = readUint32(entry_offset + 8, is_big_endian);
                }
                break;
                
            case 0x8825: // GPS IFD
                // Парсимо GPS IFD якщо є
                parseGPSIFD(tiff_start, value_offset, is_big_endian, result);
                break;
        }
    }
    
    // Парсинг GPS IFD
    void parseGPSIFD(size_t tiff_start, uint32_t gps_offset, bool is_big_endian, ExifData& result) {
        size_t gps_ifd_start = tiff_start + gps_offset;
        
        if (gps_ifd_start + 2 > data.size()) return;
        
        uint16_t entry_count = readUint16(gps_ifd_start, is_big_endian);
        if (gps_ifd_start + 2 + entry_count * 12 > data.size()) {
            return;
        }
        
        for (uint16_t i = 0; i < entry_count; i++) {
            size_t entry_offset = gps_ifd_start + 2 + i * 12;
            
            uint16_t tag = readUint16(entry_offset, is_big_endian);
            uint16_t type = readUint16(entry_offset + 2, is_big_endian);
            uint32_t count = readUint32(entry_offset + 4, is_big_endian);
            uint32_t value_offset = readUint32(entry_offset + 8, is_big_endian);
            
            switch (tag) {
                case 0x001D: // GPSDateStamp
                    if (type == 2 && count > 0) {
                        result.gps_date_stamp = cleanString(readAsciiString(tiff_start + value_offset, count));
                    }
                    break;
                    
                case 0x0007: // GPSTimeStamp
                    if (type == 5 && count == 3) { // RATIONAL array
                        // Читаємо години, хвилини, секунди як раціональні числа
                        std::string time_str = "";
                        for (uint32_t j = 0; j < 3; j++) {
                            size_t rational_offset = tiff_start + value_offset + j * 8;
                            uint32_t numerator = readUint32(rational_offset, is_big_endian);
                            uint32_t denominator = readUint32(rational_offset + 4, is_big_endian);
                            
                            if (denominator != 0) {
                                uint32_t value = numerator / denominator;
                                if (j > 0) time_str += ":";
                                if (value < 10) time_str += "0";
                                time_str += std::to_string(value);
                            }
                        }
                        result.gps_time_stamp = time_str;
                    }
                    break;
            }
        }
    }
};

// C-стильні функції для експорту в JavaScript
extern "C" {
    EMSCRIPTEN_KEEPALIVE
    void* createExifReader(const uint8_t* file_data, int data_size) {
        return new ExifReader(file_data, data_size);
    }
    
    EMSCRIPTEN_KEEPALIVE
    void destroyExifReader(void* reader) {
        delete static_cast<ExifReader*>(reader);
    }
    
    EMSCRIPTEN_KEEPALIVE
    const char* readExifDate(void* reader) {
        static std::string result;
        ExifReader* exif_reader = static_cast<ExifReader*>(reader);
        if (exif_reader) {
            ExifReader::ExifData data = exif_reader->readExifData();
            result = data.date_taken;
        } else {
            result = "";
        }
        return result.c_str();
    }
    
    EMSCRIPTEN_KEEPALIVE
    const char* readCameraMake(void* reader) {
        static std::string result;
        ExifReader* exif_reader = static_cast<ExifReader*>(reader);
        if (exif_reader) {
            ExifReader::ExifData data = exif_reader->readExifData();
            result = data.camera_make;
        } else {
            result = "";
        }
        return result.c_str();
    }
    
    EMSCRIPTEN_KEEPALIVE
    const char* readCameraModel(void* reader) {
        static std::string result;
        ExifReader* exif_reader = static_cast<ExifReader*>(reader);
        if (exif_reader) {
            ExifReader::ExifData data = exif_reader->readExifData();
            result = data.camera_model;
        } else {
            result = "";
        }
        return result.c_str();
    }
    
    EMSCRIPTEN_KEEPALIVE
    int readImageWidth(void* reader) {
        ExifReader* exif_reader = static_cast<ExifReader*>(reader);
        if (exif_reader) {
            ExifReader::ExifData data = exif_reader->readExifData();
            return data.width;
        }
        return 0;
    }
    
    EMSCRIPTEN_KEEPALIVE
    int readImageHeight(void* reader) {
        ExifReader* exif_reader = static_cast<ExifReader*>(reader);
        if (exif_reader) {
            ExifReader::ExifData data = exif_reader->readExifData();
            return data.height;
        }
        return 0;
    }
    
    EMSCRIPTEN_KEEPALIVE
    bool hasExifData(void* reader) {
        ExifReader* exif_reader = static_cast<ExifReader*>(reader);
        if (exif_reader) {
            ExifReader::ExifData data = exif_reader->readExifData();
            return data.has_exif;
        }
        return false;
    }
    
    EMSCRIPTEN_KEEPALIVE
    const char* readExifDateTime(void* reader) {
        static std::string result;
        ExifReader* exif_reader = static_cast<ExifReader*>(reader);
        if (exif_reader) {
            ExifReader::ExifData data = exif_reader->readExifData();
            result = data.date_time;
        } else {
            result = "";
        }
        return result.c_str();
    }
    
    EMSCRIPTEN_KEEPALIVE
    const char* readExifDateTimeDigitized(void* reader) {
        static std::string result;
        ExifReader* exif_reader = static_cast<ExifReader*>(reader);
        if (exif_reader) {
            ExifReader::ExifData data = exif_reader->readExifData();
            result = data.date_digitized;
        } else {
            result = "";
        }
        return result.c_str();
    }
    
    EMSCRIPTEN_KEEPALIVE
    const char* readExifGpsDateStamp(void* reader) {
        static std::string result;
        ExifReader* exif_reader = static_cast<ExifReader*>(reader);
        if (exif_reader) {
            ExifReader::ExifData data = exif_reader->readExifData();
            result = data.gps_date_stamp;
        } else {
            result = "";
        }
        return result.c_str();
    }
    
    EMSCRIPTEN_KEEPALIVE
    const char* readExifGpsTimeStamp(void* reader) {
        static std::string result;
        ExifReader* exif_reader = static_cast<ExifReader*>(reader);
        if (exif_reader) {
            ExifReader::ExifData data = exif_reader->readExifData();
            result = data.gps_time_stamp;
        } else {
            result = "";
        }
        return result.c_str();
    }
}
