document.addEventListener('DOMContentLoaded', function() {
    const amountInput = document.getElementById('amount');
    const resultInput = document.getElementById('result');
    const fromCurrencySelect = document.getElementById('fromCurrency');
    const toCurrencySelect = document.getElementById('toCurrency');
    const convertBtn = document.getElementById('convertBtn');

    // Lấy tỷ giá từ dữ liệu hiển thị
    function getExchangeRate() {
        try {
            // Lấy text từ các phần tử hiển thị tỷ giá
            const buyText = document.querySelector('.exchange-rate-buy').textContent;
            const sellText = document.querySelector('.exchange-rate-sell').textContent;
            
            // Xử lý chuỗi để lấy số
            const buyRate = parseFloat(buyText.replace(/[,\.]/g, ''));
            const sellRate = parseFloat(sellText.replace(/[,\.]/g, ''));

            if (isNaN(buyRate) || isNaN(sellRate)) {
                throw new Error('Invalid exchange rate');
            }

            console.log('Tỷ giá mua:', buyRate); // Debug
            console.log('Tỷ giá bán:', sellRate); // Debug

            return {
                buyRate: buyRate,  // Tỷ giá mua USD (22517)
                sellRate: sellRate // Tỷ giá bán USD (22611)
            };
        } catch (error) {
            console.error('Error getting exchange rate:', error);
            return {
                buyRate: 22517,
                sellRate: 22611
            };
        }
    }

    // Format số tiền
    function formatMoney(amount, currency) {
        if (currency === 'VND') {
            return new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND'
            }).format(amount);
        } else {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
            }).format(amount);
        }
    }

    // Xử lý sự kiện đổi tiền
    convertBtn.addEventListener('click', function() {
        const amount = parseFloat(amountInput.value);
        if (isNaN(amount)) {
            alert('Vui lòng nhập số tiền hợp lệ');
            return;
        }

        const rates = getExchangeRate();
        const fromCurrency = fromCurrencySelect.value;
        const toCurrency = toCurrencySelect.value;
        let result;

        if (fromCurrency === 'USD' && toCurrency === 'VND') {
            // Bán USD lấy VND -> dùng tỷ giá bán
            result = amount * rates.sellRate;
        } else if (fromCurrency === 'VND' && toCurrency === 'USD') {
            // Mua USD bằng VND -> dùng tỷ giá mua
            result = amount / rates.buyRate;
        } else {
            result = amount;
        }

        resultInput.value = formatMoney(result, toCurrency);
    });

    // Tự động đổi vị trí tiền tệ khi chọn
    fromCurrencySelect.addEventListener('change', function() {
        toCurrencySelect.value = this.value === 'USD' ? 'VND' : 'USD';
    });

    toCurrencySelect.addEventListener('change', function() {
        fromCurrencySelect.value = this.value === 'USD' ? 'VND' : 'USD';
    });
}); 