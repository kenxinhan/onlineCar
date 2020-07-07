const app = getApp();
Page({
  data: {
    busId: null,
    startAddress:'深圳 宝安汽车站',
    endAddress:'佛山 山水汽车站',
    time:34
  },

  onLoad: function (options) {

  },

  onReady: function () {

  },

  onShow: function () {

  },


  buyTicket(e) {
    this.setData({
      busId: e.currentTarget.dataset.busId
    })
    let {busId,startAddress,endAddress,time} = this.data;
    let busInfo = {busId,startAddress,endAddress,time};
    if (this.data.busId) {
      wx.navigateTo({
        url: '/pages/confirmOrder/confirmOrder?busInfo=' + JSON.stringify(busInfo)
      })
    }

  }




})