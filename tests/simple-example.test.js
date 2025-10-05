/**
 * Простий приклад unit тестів для демонстрації
 * Показуємо основні концепції тестування
 */

// Простий клас для демонстрації
class SimpleCalculator {
    add(a, b) {
        return a + b;
    }
    
    subtract(a, b) {
        return a - b;
    }
    
    multiply(a, b) {
        return a * b;
    }
    
    divide(a, b) {
        if (b === 0) {
            throw new Error('Ділення на нуль заборонено');
        }
        return a / b;
    }
    
    isEven(number) {
        return number % 2 === 0;
    }
    
    validateInput(input) {
        if (typeof input !== 'number') {
            throw new Error('Вхід має бути числом');
        }
        if (isNaN(input)) {
            throw new Error('Вхід не може бути NaN');
        }
        return true;
    }
}

describe('SimpleCalculator - Демонстрація Unit тестів', () => {
    let calculator;

    beforeEach(() => {
        calculator = new SimpleCalculator();
    });

    describe('Базові математичні операції', () => {
        test('має правильно додавати числа', () => {
            expect(calculator.add(2, 3)).toBe(5);
            expect(calculator.add(-1, 1)).toBe(0);
            expect(calculator.add(0, 0)).toBe(0);
        });

        test('має правильно віднімати числа', () => {
            expect(calculator.subtract(5, 3)).toBe(2);
            expect(calculator.subtract(1, 1)).toBe(0);
            expect(calculator.subtract(0, 5)).toBe(-5);
        });

        test('має правильно множити числа', () => {
            expect(calculator.multiply(2, 3)).toBe(6);
            expect(calculator.multiply(-2, 3)).toBe(-6);
            expect(calculator.multiply(0, 5)).toBe(0);
        });

        test('має правильно ділити числа', () => {
            expect(calculator.divide(6, 2)).toBe(3);
            expect(calculator.divide(5, 2)).toBe(2.5);
            expect(calculator.divide(-6, 2)).toBe(-3);
        });
    });

    describe('Обробка помилок', () => {
        test('має правильно обробляти ділення на нуль', () => {
            expect(() => calculator.divide(5, 0)).toThrow('Ділення на нуль заборонено');
        });

        test('має правильно валідувати вхідні дані', () => {
            expect(() => calculator.validateInput('не число')).toThrow('Вхід має бути числом');
            expect(() => calculator.validateInput(NaN)).toThrow('Вхід не може бути NaN');
            expect(calculator.validateInput(5)).toBe(true);
        });
    });

    describe('Логічні операції', () => {
        test('має правильно визначати парні числа', () => {
            expect(calculator.isEven(2)).toBe(true);
            expect(calculator.isEven(4)).toBe(true);
            expect(calculator.isEven(1)).toBe(false);
            expect(calculator.isEven(3)).toBe(false);
            expect(calculator.isEven(0)).toBe(true);
        });
    });

    describe('Граничні випадки', () => {
        test('має правильно обробляти великі числа', () => {
            expect(calculator.add(Number.MAX_SAFE_INTEGER, 1)).toBe(Number.MAX_SAFE_INTEGER + 1);
        });

        test('має правильно обробляти дрібні числа', () => {
            expect(calculator.add(0.1, 0.2)).toBeCloseTo(0.3);
        });
    });

    describe('Продуктивність', () => {
        test('має швидко обробляти багато операцій', () => {
            const startTime = Date.now();
            
            for (let i = 0; i < 1000; i++) {
                calculator.add(i, i + 1);
            }
            
            const endTime = Date.now();
            expect(endTime - startTime).toBeLessThan(100); // Менше 100мс
        });
    });
});

// Експортуємо для використання
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SimpleCalculator;
}
