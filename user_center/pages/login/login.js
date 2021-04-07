const BASE_URL = require("../../../utils/BASE_URL");
var http = require('../../../utils/httpLogin.js');
const app = getApp()
Page({
  data: {
    hiddenLoading: false,
  },

  onShow() {
    this.setData({
      hiddenLoading: true
    })
  },

  //获取手机号
  getPhoneNumber(e) {
    wx.showLoading({
      title: '加载中...',
    })
    wx.getSystemInfo({
      success: (res1) => {
        console.log('设备信息：', res1)
        wx.setStorageSync('systemInfo', res1)
        if (e.detail.errMsg == "getPhoneNumber:ok") { //授权
          let code;
          wx.login({
            success(res) {
              // wx.setStorageSync('code', res.code)
              code = res.code;
              let iv = e.detail.iv;
              let encryptedData = e.detail.encryptedData;
              let params = {
                encryptedData,
                iv,
                code: code,
                areaCode: wx.getStorageSync('areaCodeIndex')
              }
              wx.request({
                url: BASE_URL.BASE_URL + '/v1/passenger/user/miniProgramMobileLogin',
                data: params,
                header: {
                  'channel': 2, //请求来源 2-小程序
                  'appChannel': res1.model, //systemInfo.brand, //app渠道
                  'platformType': 3, //systemInfo.platform,  //系统类型
                  'sysVersion': res1.system, //操作系统版本
                },
                method: 'POST',
                success(res3) {
                  console.log('获取手机号：', res3.data);
                  if (res3.data.success) {
                    if (res3.data.code == '1') {
                      //请求头
                      const header = {
                        'channel': 2, //请求来源 2-小程序
                        'appVersion': 8,
                        'appChannel': res1.model, //systemInfo.brand, //app渠道
                        'platformType': 3, //systemInfo.platform,  //系统类型
                        'sysVersion': res1.system, //操作系统版本
                        'token': res3.data.content.token,
                        'appkey': res3.data.content.appkey,
                        // 'Authorization': "Bearer " + wx.getStorageSync("token"),//null
                        // 'version': '1.0.0',
                      };
                      wx.setStorageSync('openid', res3.data.content.openid)
                      wx.setStorageSync('session_key', res3.data.content.session_key)
                      wx.setStorageSync('appkey', res3.data.content.appkey)
                      wx.setStorageSync('token', res3.data.content.token)
                      wx.setStorageSync('uuid', res3.data.content.uuid)
                      wx.setStorageSync('header', header)
                      wx.setStorageSync('servicePhone', res3.data.content.servicePhone) //客服电话

                      // app.globalData.uuid = res3.data.content.uuid;
                      // app.globalData.token = res3.data.content.token;
                      app.mqttConfig();
                      let phoneNumber = res3.data.content.phoneNumber;
                      let couponList = res3.data.content.couponList;
                      wx.setStorageSync('phoneNumber', phoneNumber);
                      if (couponList.length > 0) wx.setStorageSync('couponList', couponList);
                      wx.navigateBack({
                        delta: 1,
                        fail() {
                          wx.reLaunch({
                            url: '/pages/index/index',
                          })
                        }
                      })
                    } else {
                      wx.showToast({
                        title: res3.data.message,
                        icon: 'none'
                      })
                      onFailed(res)
                    }
                  } else {
                    wx.showToast({
                      title: res3.data.message,
                      icon: 'none'
                    })
                  }

                },
                fail(err) {
                  console.log(err)
                },
                complete() {
                  setTimeout(() => {
                    wx.hideLoading()
                  }, 100);
                }
              })
            }
          })

        } else { //用户点击拒绝
          wx.hideLoading()
          console.log('用户拒绝手机号授权')
        }


      },
      fail(err) {
        console.log(err)
      }
    })

  },

})