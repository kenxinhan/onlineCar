// user_center/pages/integralDetail/integralDetail.js
import http from '../../../utils/http';
Page({
  data: {
    loadingFailed: false,
    loading: false,
    noMore: false,
    pageNo: 1,
    number:0,
    listData: null,
    isVip:false,
    hasOrder:true,
  },

  onLoad: function (options) {

  },

  onShow: function () {
    this.setData({
      pageNo:1
    })
    this.reqData(false);
  },

  reqData(isPage) {
    let url = "/v2/passenger/integral/getIntegralDetail?pageSize=20&currentPage=" + this.data.pageNo;
    http.postRequest(url, '', wx.getStorageSync('header'), res => {
      this.setData({
        loading: false
      })
      if (res.code === '1') {
        this.setData({
          number:res.content.usableIntegral
        })
        if(res.content.vipLevel == 1){
          this.setData({
            isVip:true
          })
        }
        let listData = res.content.integralDetailInfoList;
        if (isPage) {
          this.setData({
            listData: this.data.listData.concat(listData)
          })
          if (res.content.integralDetailInfoList.length === 0) {
            this.setData({
              noMore: true
            })
          }
        } else {
          if (res.content.integralDetailInfoList.length === 0) {
            this.setData({
              hasOrder: false
            })
          }else{
            this.setData({
              listData,
              hasOrder:true
            })
          }
        }
      } else {
        this.setData({
          loadingFailed: true
        })
      }
    }, err => {
      console.log(err)
    })
  },

  //到达底部
  scrollToLower: function (e) {
    if (!this.data.loading && !this.data.noMore) {
      this.setData({
        loading: true,
        pageNo: this.data.pageNo + 1
      });
      this.reqData(true);
    }
  },

  toIntegral(){
    wx.navigateBack({
      delta: 1,
    })
  },

  toOrder(){
    wx.navigateTo({
      url: '/user_center/pages/integralOrderList/integralOrderList',
    })
  },
})