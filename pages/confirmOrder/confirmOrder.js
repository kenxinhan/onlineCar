// pages/confirmOrder/confirmOrder.js
const app = getApp();
Page({
  data: {
    entryType:'bus',
    // entryType: 'mixin',
    busId: null,
    busName: 999,
    startAddress: '',
    endAddress: '',
    totalNum: 1,
    singlePriceNum: 50,
    totalPriceNum: 50,
    contactNameCont: null,
    contactPhoneCont: null,
    isContactNameTrue: true,
    isContactPhoneTrue: true,
    // needChoosePeopleNum:true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let busInfo = JSON.parse(options.busInfo)
    this.setData({
      busId: busInfo.busId,
      startAddress: busInfo.startAddress,
      endAddress: busInfo.endAddress,
      time: busInfo.time
    })
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

  contactName(e) {
    let reg = /^[\u4E00-\u9FA5]{2,4}$/;
    let contactNameCont = e.detail.value;
    if (reg.test(contactNameCont)) {
      this.setData({
        contactNameCont,
        isContactNameTrue: true
      })
    } else {
      this.setData({
        isContactNameTrue: false
      })
    }
  },

  contactPhone(e) {
    let reg = /^[1][3,4,5,7,8,9][0-9]{9}$/;
    let contactPhoneCont = e.detail.value;
    if (reg.test(contactPhoneCont)) {
      this.setData({
        contactPhoneCont,
        isContactPhoneTrue: true
      })
    } else {
      this.setData({
        isContactPhoneTrue: false
      })
    }
  },

  descNum() {
    if (this.data.totalNum > 1) {
      let totalNum = this.data.totalNum - 1;
      let totalPriceNum = this.data.singlePriceNum * totalNum;
      this.setData({
        totalNum,
        totalPriceNum
      })
    } else {

    }
  },

  addNum() {
    if (this.data.totalNum >= 1 && this.data.totalNum < 4) {
      let totalNum = this.data.totalNum + 1;
      let totalPriceNum = this.data.singlePriceNum * totalNum;
      this.setData({
        totalNum,
        totalPriceNum
      })
    } else {
      wx.showModal({
        title: '提示',
        content: '已超过最大购买数量',
        showCancel: false
      })
    }
  },

  purchase() {
    if (this.data.isContactNameTrue && this.data.isContactPhoneTrue && this.data.contactNameCont && this.data.contactPhoneCont) {
      let { busName, startAddress,endAddress,contactNameCont,contactPhoneCont, totalNum,totalPriceNum,time} = this.data;
      let orderInfo = {busName,startAddress,endAddress,contactNameCont,contactPhoneCont,totalNum,totalPriceNum,time};
      let mixinAddress = {
        originAddress :app.globalData.originAddress,
        startAddress,
        endAddress,
        destination :app.globalData.destination,
      }
      if (this.data.entryType && this.data.entryType === 'bus') {
        wx.navigateTo({
          url: '/pages/detailOrder/detailOrder?orderInfo=' + JSON.stringify(orderInfo)
        })
      }else if(this.data.entryType && this.data.entryType === 'mixin'){
        wx.navigateTo({
          url: '/pages/moreLineDetailOrder/moreLineDetailOrder?mixinAddress=' + JSON.stringify(mixinAddress)
        })
      }
    } else {
      wx.showModal({
        title: '提示',
        content: '请填写正确的信息',
        showCancel: false
      })
    }
  }

})