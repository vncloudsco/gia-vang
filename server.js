const express = require('express');
const axios = require('axios');
const xml2js = require('xml2js');
const app = express();
const port = process.env.PORT || 3000;
const moment = require('moment');

// Middleware
app.use(express.static('public'));
app.set('view engine', 'ejs');

// Hàm chuyển đổi XML sang JSON
const parseXMLData = (xmlData) => {
    return new Promise((resolve, reject) => {
        xml2js.parseString(xmlData, { explicitArray: false, mergeAttrs: true }, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
};

// Hàm lấy tỷ giá từ Vietcombank
async function getVCBRate() {
    try {
        const today = moment().format('YYYY-DD-MM');
        const response = await axios.get(`https://www.vietcombank.com.vn/api/exchangerates?date=${today}`);
        const usdRate = response.data.Data.find(rate => rate.currencyCode === 'USD');
        return {
            buy: parseFloat(usdRate.transfer),    // Tỷ giá mua chuyển khoản
            sell: parseFloat(usdRate.sell)        // Tỷ giá bán
        };
    } catch (error) {
        console.error('Error fetching VCB rate:', error);
        throw error; // Ném lỗi để xử lý ở route handler
    }
}

// Hàm lấy giá vàng từ DOJI
async function getGoldPrice() {
    try {
        const response = await axios.get('http://giavang.doji.vn/api/giavang/?api_key=258fbd2a72ce8481089d88c678e9fe4f');
        const jsonData = await parseXMLData(response.data);
        return jsonData;
    } catch (error) {
        console.error('Error fetching DOJI gold price:', error);
        throw error; // Ném lỗi để xử lý ở route handler
    }
}

// Routes
app.get('/', async (req, res) => {
    try {
        // Gọi song song cả 2 API
        const [goldData, vcbRate] = await Promise.all([
            getGoldPrice(),
            getVCBRate()
        ]);
        
        // Format dữ liệu cho view
        const viewData = {
            GoldList: {
                DGPlist: {
                    Row: Array.isArray(goldData.GoldList.DGPlist.Row) 
                        ? goldData.GoldList.DGPlist.Row 
                        : [goldData.GoldList.DGPlist.Row],
                    DateTime: goldData.GoldList.DGPlist.DateTime
                },
                IGPList: {
                    Row: {
                        Name: "USD/VND (VCB)",
                        Buy: vcbRate.buy,
                        Sell: vcbRate.sell
                    },
                    DateTime: moment().format('HH:mm DD/MM/YYYY')
                }
            }
        };

        res.render('index', { goldData: viewData });
    } catch (error) {
        console.error('Error fetching data:', error);
        // Nếu có lỗi, trả về trang lỗi
        res.status(500).render('error', { 
            message: 'Không thể lấy dữ liệu. Vui lòng thử lại sau.'
        });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
}); 