import http from '../../../utils/http';
// pages/budgetPrice/budgetPrice.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    areaCode:null,
    costList:null,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (opt) {
    console.log(opt)
    let token = wx.getStorageSync('token') || '';
    if(opt.valuationData){
      let valuationData = JSON.parse(opt.valuationData);
      let reqData = {
        userLongitude:parseFloat(valuationData.strLng),
        userLatitude:parseFloat(valuationData.strLat),
        destinationLongitude:parseFloat(valuationData.endLng),
        destinationLatitude:parseFloat(valuationData.endLat),
        businessType:1
      }
      http.postRequest("/carOrder/passenger/lineValuation",reqData,{
        'channel': 2, //请求来源 2-小程序
        'appChannel': wx.getStorageSync('systemInfo').model, //systemInfo.brand, //app渠道
        'platformType': 3, //systemInfo.platform,  //系统类型
        'sysVersion': wx.getStorageSync('systemInfo').system, //操作系统版本
        'token':token
      },res=>{
        console.log(res)
        if(res.code === '1'){
          this.setData({
            areaCode:res.content[0].areaCode,
            costList:res.content[0].costList,
          })
        }
      },err=>{
        console.log(err)
      })
    }
  },

  toPriceRules() {
    wx.navigateTo({
      url: '/pages/priceRules/priceRules?code='+this.data.areaCode,
    })
  },
})