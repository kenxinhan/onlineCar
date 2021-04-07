import qqmapsdk from '../../../libs/qqMap';
import http from '../../../utils/http';
import {
  Base64
} from 'js-base64';
const app = getApp();
let client = null;
let mqtt = require('../../../utils/mqtt.js');
let mqtt1005timer = null;
let curPageOnShow = false;

Page({
  data: {
    driverImg: 'http://scapp.xysc16.com/upload/wmp/imgs/driver.png',
    driverInfo: null,
  },

  onLoad: function (opt) {
    if (opt.driverInfo) {
      this.setData({
        driverInfo: JSON.parse(opt.driverInfo)
      })
    }
    console.log('taxiopt:', opt)
  },
  onShow(opt) {
    console.log('onshow',opt)
    this.mqttClient();
    curPageOnShow = true;
  },

  onHide() {
    curPageOnShow = false;
    app.globalData.clientDriving._events.message=app.globalData.clientDriving._events.message['0']
  },
  
  onUnload(){
    curPageOnShow = false;
    app.globalData.clientDriving._events.message=app.globalData.clientDriving._events.message['0']
  },

  mqttClient() {
    app.globalData.clientDriving.on('message', (topic, message, packet) => {
      let msg = JSON.parse(Base64.decode(message.toString()));
      if(!curPageOnShow){
        console.log("收到mqtt in taxi：return");
        return;
      }
      console.log("taxi收到mqtt：", msg);
      if(msg && JSON.stringify(msg.data) !== '{}'){
        console.log("mqtt33333");
        if (msg.code == '1009') { // 乘客远程订单数据被后台主动修改，乘客端重新调用订单恢复接口
          this.orderRecover(msg.data);
        } else if (msg.code == '1005') {
          if (mqtt1005timer) clearTimeout(mqtt1005timer);
          mqtt1005timer = setTimeout(() => {
            wx.redirectTo({
              url: '/driving_status/pages/travalEnd/travalEnd?resData=' + JSON.stringify(msg.data) + '&from=taxi',
            })
            app.globalData.isToTaxiDriving = true;
          }, 500);
        }
      }
    })
  },

  // 订单恢复
  orderRecover(order) {
    http.postRequest("/v1/carOrder/passenger/recoverOrder?orderNo=" + order, '', wx.getStorageSync('header'), res => {
      if (res.success) {
        console.log('recoverOrder');
      }
    }, err => {
      console.log(err)
    })
  },

  toLocalMap() {
    let _this = this;
    wx.openLocation({
      latitude: _this.data.driverInfo.desLat,
      longitude: _this.data.driverInfo.desLng,
      name: _this.data.driverInfo.desName,
      address: _this.data.driverInfo.desName,
      success(r) {
        console.log('打开内置地图：', r)
      }
    })
  },

  toService() {
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
  },

  callDriver(e) {
    console.log('电话号码：', e.currentTarget.dataset)
    wx.makePhoneCall({
      phoneNumber: e.currentTarget.dataset.phone,
      success() {
        console.log('拨打成功')
      }
    })
  },

  adLoad() {
    console.log('广告加载成功')
  },

  adError() {
    console.log('广告加载失败')
  },
})