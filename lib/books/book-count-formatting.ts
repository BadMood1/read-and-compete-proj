const integerNumberFormatter = new Intl.NumberFormat("ru-RU");

// Подбирает правильное окончание: «1 книга», «2 книги», «5 книг».
export function formatBookCount(bookCount: number) {
    const lastTwoDigits = bookCount % 100;
    const lastDigit = bookCount % 10;
    let bookWord = "книг";

    // Числа от 11 до 14 всегда используют форму «книг».
    if (lastTwoDigits < 11 || lastTwoDigits > 14) {
        if (lastDigit === 1) {
            bookWord = "книга";
        } else if (lastDigit >= 2 && lastDigit <= 4) {
            bookWord = "книги";
        }
    }

    return `${integerNumberFormatter.format(bookCount)} ${bookWord}`;
}
