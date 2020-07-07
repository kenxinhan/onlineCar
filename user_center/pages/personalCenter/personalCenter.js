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
    wx.showToast({
      title: '该功能即将上线，敬请期待',
      icon:'none'
    })
  }
})