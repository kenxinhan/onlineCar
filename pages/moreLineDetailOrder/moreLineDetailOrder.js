// pages/moreLineDetailOrder/moreLineDetailOrder.js
const app = getApp();


Page({
  data: {
    isOriginDriverInfoShow:false,
    isStartDriverInfoShow:false,
    isEndDriverInfoShow:false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    if(options.mixinAddress){
      this.setData({
        mixinAddress:JSON.parse(options.mixinAddress)
      })
    }else{
      console.log('传参失败')
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
})