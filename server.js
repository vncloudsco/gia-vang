const express = require('express');
const axios = require('axios');
const xml2js = require('xml2js');
const app = express();
const port = process.env.PORT || 3000;
const moment = require('moment');
const GoldService = require('./services/goldService');

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

// Hàm lấy tỷ giá VCB
async function getVCBRate() {
    try {
        const response = await axios.get('https://portal.vietcombank.com.vn/Usercontrols/TVPortal.TyGia/pXML.aspx');
        const xmlData = response.data;
        
        // Chuyển đổi XML sang JSON
        const result = await parseXMLData(xmlData);
        
        // Kiểm tra và log dữ liệu để debug
        console.log('VCB API Response:', result);
        
        if (!result || !result.ExrateList || !result.ExrateList.Exrate) {
            throw new Error('Invalid VCB rate data structure');
        }

        // Tìm tỷ giá USD
        const usdRate = result.ExrateList.Exrate.find(rate => 
            rate.CurrencyCode === 'USD'
        );

        if (!usdRate) {
            throw new Error('USD rate not found');
        }

        // Log để kiểm tra giá trị trước khi xử lý
        console.log('USD Rate from API:', usdRate);

        // Chuyển đổi giá trị string sang số và loại bỏ tất cả dấu phẩy
        const rates = {
            buy: parseFloat(usdRate.Buy.replace(/,/g, '')),
            transfer: parseFloat(usdRate.Transfer.replace(/,/g, '')),
            sell: parseFloat(usdRate.Sell.replace(/,/g, ''))
        };

        // Log kết quả cuối cùng
        console.log('Processed rates:', rates);

        return rates;
    } catch (error) {
        console.error('Error fetching VCB rate:', error.message);
        console.error('Error details:', error);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
        return {
            buy: 25220,
            transfer: 25250,
            sell: 25550
        };
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

// Hàm lấy dữ liệu chính
async function fetchData() {
    try {
        const goldData = await getGoldPrice();
        const vcbRate = await getVCBRate();

        return {
            goldData,
            vcbRate
        };
    } catch (error) {
        console.error('Error fetching data:', error.message);
        // Trả về dữ liệu mặc định khi có lỗi
        return {
            goldData: {
                GoldList: {
                    DGPlist: {
                        Row: [{
                            Buy: "0",
                            Sell: "0",
                            Name: "N/A"
                        }],
                        DateTime: new Date().toISOString()
                    },
                    IGPList: {
                        Row: {
                            Buy: "23000",
                            Sell: "23200"
                        }
                    }
                }
            },
            vcbRate: {
                buy: 23000,
                transfer: 23100,
                sell: 23200
            }
        };
    }
}

// Routes
app.get('/', async (req, res) => {
    try {
        const data = await fetchData();
        res.render('index', data);
    } catch (error) {
        res.render('error', { 
            message: 'Không thể tải dữ liệu. Vui lòng thử lại sau.' 
        });
    }
});

app.get('/api/refresh-rate', async (req, res) => {
    try {
        const vcbRate = await getVCBRate();
        res.json(vcbRate);
    } catch (error) {
        res.status(500).json({ 
            error: 'Không thể cập nhật tỷ giá',
            message: error.message 
        });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
}); 