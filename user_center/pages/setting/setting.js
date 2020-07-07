// pages/setting/setting.js
Page({

  /**
   * 页面的初始数据
   */
  data: {

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
  },

  // location(){
  //   wx.navigateTo({
  //     url: '/user_center/pages/usedLocation/usedLocation',
  //   })
  // },
  
  about(){
    wx.navigateTo({
      url: "/user_center/pages/about/about",
    })
  },

  loginOut() {
    wx.showModal({
      title:'提示',
      content:'确定要退出登录吗？',
      success(res){
        if (res.confirm) {
          console.log('用户点击确定')
          wx.removeStorage({
            key: 'phoneNumber',
            success (res) {
              console.log("已退出登录");
              wx.removeStorageSync('token')
              wx.login({
                success(res) {
                  wx.setStorageSync('code', res.code);
                } 
              })
              wx.reLaunch({
                url: '/pages/index/index',
              })
            },
            error(err) {
              console.log(err);
            }
          })
        } else if (res.cancel) {
          console.log('用户点击取消')
        }
      }
    })
  },
})