const axios = require('axios');

class GoldService {
    static async getGoldPrices() {
        try {
            const response = await axios.get('http://giavang.doji.vn/api/giavang/?api_key=258fbd2a72ce8481089d88c678e9fe4f');
            return this.formatGoldData(response.data);
        } catch (error) {
            throw new Error('Không thể lấy dữ liệu giá vàng');
        }
    }

    static formatGoldData(data) {
        // Xử lý và format dữ liệu từ API
        return {
            dojiPrices: data.GoldList.DGPlist.Row,
            jewelryPrices: data.GoldList.JewelryList.Row,
            usdRate: data.GoldList.IGPList.Row,
            lastUpdate: data.GoldList.DGPlist.DateTime
        };
    }
}

module.exports = GoldService; 