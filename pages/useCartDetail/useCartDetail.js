// pages/useCartDetail/useCartDetail.js
Page({
  data: {
    isStartShow:true,
    isEndShow:true,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let address = JSON.parse(options.address);
    this.setData({
      address,
    })
    if(address.id  == 1){
      this.setData({
        isStartShow:true,
        isEndShow:true,
      })
      wx.setNavigationBarTitle({
        title: '联乘用车详情',
      })
    }else if(address.id  == 2){
      this.setData({
        isStartShow:false,
        isEndShow:false,
      })
      wx.setNavigationBarTitle({
        title: '城际用车详情',
      })
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})