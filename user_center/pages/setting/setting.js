const app = getApp();
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
              wx.removeStorageSync('header')
              app.globalData.clientDriving.end();
              app.globalData.clientDriving=null;
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