// pages/payDetail/payDetail.js
import http from '../../../utils/http';
Page({

  data: {
    isClosed: false,
    startAddress: '',
    endAddress: '',
    isFriendDriver: null,
    driverInfo: {},
    costList: [],
    hasAdd: false,
    areaCode:null,
    detailData:null,
    callCar:false,
    fixedLine:false,
    BDFixedLine:false,
    priceTitle:'车费详情',
    exclusiveCar:false, // 包车
    taxi:false, 
    fromOrderList:false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let driver = JSON.parse(options.driver);
    console.log('opt:',driver)
    // this.setData({
    //   opt : driver
    // })
    if(options.from && options.from === 'orderList'){
      wx.setNavigationBarTitle({
        title: '订单详情',
      })
      this.setData({
        fromOrderList:true
      })
    }
    if(driver){
      if(driver.businessType == 1){
       this.setData({
         callCar:true,
         priceTitle:'车费详情',
       })
     }else if(driver.businessType == 6 || driver.businessType == 7){ 
       this.setData({
         fixedLine:true,
         BDFixedLine:true,
         priceTitle:'远程车费详情',
       })
     }else if(driver.businessType == 9){
       this.setData({
         exclusiveCar:true,
         priceTitle:'包车车费详情',
       })
     }else if(driver.businessType == 10 || driver.driverType == 6){
       this.setData({
         taxi:true
       })
     }
    }
    if (driver.orderNo) {
      http.getRequest('/v1/passenger/center/orderDetail?orderNo='+driver.orderNo+'&businessType='+driver.businessType, '', wx.getStorageSync('header'), res => {
        console.log('订单详情：', res)
        if (res.code === '1') {
          this.setData({
            opt : res.content,
            detailData:res.content
          })
          if (driver.orderStateName === '已完成') {
            this.setData({
              isClosed: false,
            })
          } else if(driver.orderStateName === '已关闭') {
            this.setData({
              isClosed: true,
            })
          }
        }
      }, err => {
        console.log(err)
      })
    }

  },

  makePhoneCall() {
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
  },

  accountRule() {
    wx.navigateTo({
      url: '/pages/priceRules/priceRules?code='+this.data.detailData.areaCode+'&driver='+JSON.stringify(this.data.opt)+'&from=payDetail',
    })
  },

  addFriend() {
    if (!this.data.hasAdd) {
      http.postRequest("/v1/passenger/friendDriver/attentionOrCancel?driverNo="+this.data.detailData.driverCarInfo.driverNo, '', wx.getStorageSync('header'), res => {
        if (res.code === '1') {
          wx.showToast({
            title: '添加成功',
          })
          this.setData({
            hasAdd: true
          })
        }
      }, err => {
        console.log(err)
      })
    }
  },

  recall(){
    wx.reLaunch({
      url: '/pages/index/index',
    })
  },

  callBDDriverPhone(e){
    let phone = e.currentTarget.dataset.phone;
    wx.makePhoneCall({
      phoneNumber: phone,
      success: function () {
        console.log('拨打成功')
      },
      fail: function () {
        console.log('拨打失败')
      }
    })
  },


})