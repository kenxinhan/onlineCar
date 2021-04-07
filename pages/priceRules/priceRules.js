// pages/priceRules/priceRules.js
import http from '../../utils/http';
Page({

  /**
   * 页面的初始数据
   */
  data: {
    list: [],
    driver: null,
    fromLine: false,
    exclusiveCar: false,
    EXC_time: false,
    taxi: false,
    bannerImg: 'http://scapp.xysc16.com/upload/wmp/imgs/price-rules.png',
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let url, driver, orderNo;
    if (options.from === 'callCar') {
      url = "/v1/carOrder/chargeRules/getChargeRules?businessType=1&areaCode=" + options.code;
    } else if (options.from === 'payDetail') {
      driver = JSON.parse(options.driver);
      console.log('rulesOpt:',driver)
      orderNo = driver.orderNo;
      this.setData({
        driver,
      })
      console.log(driver)
      if (driver.businessType == 6 || driver.businessType == 7) {
        this.setData({
          fromLine: true
        })
      } else if (driver.businessType == 9) {
        this.setData({
          exclusiveCar: true
        })
      } else if (driver.businessType == 10 || driver.driverType == 6) {
        this.setData({
          taxi: true
        })
      }
      url = "/v1/carOrder/chargeRules/getChargeRules?businessType=" + driver.businessType + "&areaCode=" + options.code + "&orderNo=" + orderNo;

      // banner图动态改变
      if (driver.businessType == 6 || driver.businessType == 7) {
        this.setData({
          bannerImg: 'http://scapp.xysc16.com/upload/wmp/imgs/line-rules.png'
        })
      } else if (driver.businessType == 9) {
        if (driver.lineType == 5 || driver.lineType == 6) {
          this.setData({
            bannerImg: 'http://scapp.xysc16.com/upload/wmp/imgs/EXC-line-rules.png'
          })
        } else if (driver.lineType == 7) {
          this.setData({
            bannerImg: 'http://scapp.xysc16.com/upload/wmp/imgs/EXC-time-rules.png'
          })
        }
      } else if(driver.businessType == 10 || driver.driverType == 6){
        this.setData({
          bannerImg:'http://scapp.xysc16.com/upload/wmp/imgs/taxi-rules.png'
        })
      }
    }
    
    if(options.from === 'callCar' || driver.businessType != 10)  this.rulesReq(url);

  },

  rulesReq(url) {
    http.postRequest(url, '', wx.getStorageSync('header'), res => {
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
})