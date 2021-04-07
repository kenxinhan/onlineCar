const app = getApp()

Page({
  data: {
    avatar: '',
    nickName: '',
  },

  onLoad: function (options) {
    let phoneNumber = wx.getStorageSync('phoneNumber')
    if(phoneNumber){
      this.setData({
        nickName:phoneNumber
      })
    }
 
  },
  

  checkList() {
    wx.navigateTo({
      url: '/user_center/pages/travelList/travelList',
    })
  },

  checkWallet() {
    wx.navigateTo({
      url: '/user_center/pages/coupon/coupon',
    })
  },

  myIntegral() {
    wx.navigateTo({
      url: '/user_center/pages/integral/integral',
    })
  },
  // driverFriends(){
  //   wx.navigateTo({
  //     url: '/user_center/pages/driverFriends/driverFriends',
  //   })
  // },

  checkSetting() {
    wx.navigateTo({
      url: '/user_center/pages/setting/setting',
    })
  },

  toService(){
    let servicePhone = wx.getStorageSync('servicePhone')
    if(servicePhone){
      wx.makePhoneCall({
        phoneNumber: servicePhone,
        success() {
          console.log('拨打成功')
        },
        fail: function () {
          console.log('拨打失败')
        }
      })
    }else{
      wx.navigateTo({
        url: '/user_center/pages/login/login',
      })
    }
  }
})