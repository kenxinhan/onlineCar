// pages/priceRules/priceRules.js
import http from '../../utils/http';
Page({

  /**
   * 页面的初始数据
   */
  data: {
    list: [],
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log(options)
    if (options.code) {
      http.postRequest("/carOrder/chargeRules/getChargeRules?businessType=1&areaCode=" + options.code, {}, wx.getStorageSync('header'), res => {
        console.log(res)
        if (res.code === '1') {
          this.setData({
            list: res.content
          })
        }
      }, err => {
        console.log(err)
      })
    }
  },
})