import http from '../../../utils/http'
const app = getApp();

Page({
  data: {
    listData: null,
  },

  onLoad: function (options) {
    let data = {
      pageSize:10,
      currentPage:1
    }
    http.getRequest("/passenger/center/availableCouponList",data,wx.getStorageSync('header'),res=>{
      console.log('优惠券：',res)
      if(res.code === '1'){
        let data = res.content;
        this.setData({
          listData:data
        })
      }
    },err=>{
      console.log(err)
    })
  },


})