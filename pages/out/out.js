// pages/out/out.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    src:'',
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log(options.href)
    if(options.href){
      this.setData({
        src:options.href
      })
    }else{
      console.log(options.href)
    }
  },
})