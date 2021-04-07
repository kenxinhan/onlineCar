// user_center/pages/integral/integral.js
import http from '../../../utils/http';
Page({

  /**
   * 页面的初始数据
   */
  data: {
    loadingFailed: false,
    loading: false,
    noMore: false,
    pageNo: 1,
    number:0,
    listData: null,
    isVip:false,
    curModalData: null,
    showCover:false,
    hasOrder:true,
  },

  onShow: function () {
    this.setData({
      pageNo:1
    })
    this.reqData(false);
  },

  reqData(isPage) {
    let data = {
      businessType:0,
      cityCode:"",
      pageSize:10,
      currentPage:this.data.pageNo
    }
    http.postRequest("/v2/passenger/integral/getMyIntegralInfoAndCouponList", data, wx.getStorageSync('header'), res => {
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
        let listData = res.content.couponInfoList;
        if (isPage) {
          this.setData({
            listData: this.data.listData.concat(listData)
          })
          if (res.content.couponInfoList.length === 0) {
            this.setData({
              noMore: true
            })
          }
        } else {
          this.setData({
            listData
          })
          if (res.content.couponInfoList.length === 0) {
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

  toIntegralDetail(){
    wx.navigateTo({
      url: '/user_center/pages/integralDetail/integralDetail',
    })
  },

  toMyOrder(){
    wx.navigateTo({
      url: '/user_center/pages/integralOrderList/integralOrderList',
    })
  },

  toGoodsDetail(e){
    wx.navigateTo({
      url: '/user_center/pages/integralGoodsDetail/integralGoodsDetail?item='+JSON.stringify(e.currentTarget.dataset.item),
    })
  },

  exchange(e){
    let item = e.currentTarget.dataset.item;
    if(item.isExchange != 0){
      this.setData({
        curModalData:item,
        showCover:true,
      })
    }
  },

  coverStateHandle(e){
    this.setData({
      showCover:e.detail
    })
    this.reqData(false);
  }
})