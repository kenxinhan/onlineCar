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
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    if (options.orderNo) {
      http.getRequest('/passenger/center/orderDetail?orderNo='+options.orderNo, '', wx.getStorageSync('header'), res => {
        console.log('订单详情：', res)
        if (res.code === '1') {
          this.setData({
            startAddress: res.content.startAddress,
            endAddress: res.content.endAddress,
            driverInfo: res.content.driverCarInfo,
            costList: res.content.costList,
            areaCode:res.content.areaCode
          })
          if (options.status === '已完成') {
            this.setData({
              isClosed: false,
            })
          } else if(options.status === '已关闭') {
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
      url: '/pages/priceRules/priceRules?code='+this.data.areaCode,
    })
  },

  callAgain() {
    wx.redirectTo({
      url: '/pages/index/index',
    })
  },

  addFriend() {
    if (!this.data.hasAdd) {
      http.postRequest("/passenger/friendDriver/attentionOrCancel?driverNo="+this.data.driverInfo.driverNo, '', wx.getStorageSync('header'), res => {
        console.log('添加好友：', res)
        if (res.code === '1') {
          console.log('添加成功')
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
    wx.redirectTo({
      url: '/pages/index/index',
    })
  }


})