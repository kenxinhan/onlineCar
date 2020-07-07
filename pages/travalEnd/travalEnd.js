var QQMapWX = require('../../libs/qqmap-wx-jssdk.js');
var qqmapsdk;
qqmapsdk = new QQMapWX({
  key: 'DHNBZ-2ZLKK-T7IJJ-AXSQW-WX5L6-A6FJZ'
});
import http from '../../utils/http';

let SCREEN_WIDTH = 750;
let RATE = wx.getSystemInfoSync().screenHeight / wx.getSystemInfoSync().screenWidth

const app = getApp();
Page({
  data: {
    ScreenTotalW: SCREEN_WIDTH,
    ScreenTotalH: SCREEN_WIDTH * RATE - 590,
    hiddenLoading: true,
    controls: [],
    markers: [],
    points: [],
    driver: {},
    modalHidden: true,
    showPayBox: false,
    payTypeData: [{
      id: 1,
      name: '微信支付',
      img: '../../assets/images/weixinzhifu.png'
    }, ],
    hasPay: false,
    isFriend: false,
  },

  onLoad: function (opt) {
    this.mapCtx = wx.createMapContext("map");
    if (opt.resData) {
      let data = JSON.parse(opt.resData)
      console.log(data);
      this.setData({
        driver: data
      })
      let _points = [{
        latitude: data.srcLat,
        longitude: data.srcLng
      }, {
        latitude: data.desLat,
        longitude: data.desLng
      }]
      this.setData({
        markers: [{
          iconPath: "../../assets/images/mapicon_navi_s.png",
          id: 0,
          latitude: data.srcLat,
          longitude: data.srcLng,
          width: 30,
          height: 30
        }, {
          iconPath: "../../assets/images/mapicon_navi_e.png",
          id: 1,
          latitude: data.desLat,
          longitude: data.desLng,
          width: 30,
          height: 30
        }],
      });
      this.mapCtx.includePoints({
        padding: [120],
        points: _points,
      })
      app.globalData.strLongitude = '';
      app.globalData.strLatitude = '';
      app.globalData.strAddress = '';
    }

  },

  onShow(){
    http.getRequest('/passenger/friendDriver/searchDriver?driverNo='+this.data.driver.idNo, '', wx.getStorageSync('header'), res => {
      if(res.code == '1' && res.content.isFriendDriver == 1){
        this.setData({
          isFriend:true
        })
      }
    }, err => {
      console.log(err)
    })
  },

  //唤起支付
  toPay() {
    // this.setData({
    //   showPayBox: true
    // });
    let _this = this;
    http.postRequest('/wx/applet/order/pay?orderNo=' + this.data.driver.orderNo, '', wx.getStorageSync('header'), res => {
      console.log(res)
      if (res.code === '1') {
        wx.requestPayment({
          nonceStr: res.content.nonceStr,
          package: res.content.package,
          paySign: res.content.paySign,
          timeStamp: res.content.timeStamp,
          signType: res.content.signType,
          success(res) {
            console.log('调用支付成功：', res)
            wx.removeStorageSync('startDate')
            wx.showToast({
              title: '支付成功',
              duration: 2000,
              success() {
                _this.setData({
                  hasPay: true
                })
              }
            })
          },
          fail(err) {
            console.log(err)
          }
        })
      }

    }, err => {
      console.log(err)
    })
  },

  closePay: function () {
    this.setData({
      showPayBox: false,
    });
  },
  radioChange(e) {
    console.log(e.detail.value);
    return false
  },

  preventSomthing() {
    console.log("阻止事件冒泡");
  },

  //确认支付 调起微信支付
  confirmPay() {
    console.log("调起微信支付");

  },

  toDetail() {
    wx.navigateTo({
      url: '/user_center/pages/payDetail/payDetail?orderNo=' + this.data.driver.orderNo,
    })
  },

  addFriend() {
    let _this = this;
    if (!this.data.isFriend) {
      http.postRequest('/passenger/friendDriver/attentionOrCancel?driverNo='+this.data.driver.idNo, '', wx.getStorageSync('header'), res => {
        console.log('好友司机操作成功：', res)
        wx.showModal({
          content: '添加好友成功！',
          showCancel: false,
          success() {
            _this.setData({
              isFriend: true
            })
          }
        })
      }, err => {
        console.log(err)
      })
    } else {
      wx.showModal({
        content: '您已添加该司机为好友！',
        showCancel: false
      })
    }

  },

  closeToHome() {
    wx.reLaunch({
      url: '/pages/index/index',
    })
  },


  toService() {
    //登录返回客服电话
    let servicePhone = wx.getStorageSync('servicePhone')
    wx.makePhoneCall({
      phoneNumber: servicePhone,
      success: function () {
        console.log('拨打成功')
      },
      fail: function () {
        console.log('拨打失败')
      }
    })
    // wx.showToast({
    //   title: '该功能即将上线，敬请期待',
    //   icon: 'none'
    // })
  },



})