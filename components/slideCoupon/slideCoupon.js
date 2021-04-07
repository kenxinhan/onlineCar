// components/slideCoupon/slideCoupon.js
import http from '../../utils/http.js';
let clickTimer = null;
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    params: {
      type: Object,
      value: {
        businessType: 0,
        lineId: 0,
        lineType: 0,
        rideNumber: 0,
        cityCode: ""
      }
    },
    showCoupon: {
      type: Boolean,
      value: true
    },
    fromIcon: {
      type: Boolean,
      value: true
    },
    hasChooseId: Number,
  },

  /**
   * 组件的初始数据
   */
  data: {
    listData: null,
    curItemId: null,
    pageNo: 1,
    loadingFailed: false,
    loading: false,
    noMore: false,
    hasCoupon: true,
  },

  lifetimes: {
    attached() {
      if (this.data.fromIcon) {
        this.reqExchangeListData(false);
      } else {
        this.reqChooseListData();
      }
      if (this.data.hasChooseId) {
        this.setData({
          curItemId: this.data.hasChooseId
        })
      }
    },
  },


  methods: {
    //到达底部
    scrollToLower: function (e) {
      if (!this.data.loading && !this.data.noMore) {
        this.setData({
          loading: true,
          pageNo: this.data.pageNo + 1
        });
        this.reqExchangeListData(true);
      }
    },

    tapUseBtn(e) {
      let item = e.currentTarget.dataset.item;
      if (item.couponId !== this.data.curItemId) {
        this.setData({
          curItemId: item.couponId
        })
      } else {
        this.setData({
          curItemId: null
        })
      }
    },

    close() {
      this.setData({
        showCoupon: false
      })
      this.triggerEvent("CouponState", false);
      if (this.data.fromIcon) {

      } else {
        this.chooseCoupon();
      }
    },

    reqChooseListData() {
      let params = this.data.params;
      if (params) {
        params.lineId = params.lineId || 0;
        params.lineType = params.lineType || 0;
        params.rideNumber = params.rideNumber || 0;
        params.cityCode = params.cityCode || "";
        http.postRequest("/v2/passenger/integral/getIntegralList", params, wx.getStorageSync('header'), res => {
          if (res.content.length > 0) {
            if (this.data.hasChooseId) {
              let listData = res.content;
              let curItem = listData.filter((item, index) => {
                if (item.couponId == this.data.hasChooseId) {
                  listData.splice(index, 1);
                  return item;
                }
              })
              listData.unshift(curItem[0]);
              console.log(this.data.hasChooseId, listData)

              this.setData({
                listData
              })
            } else {
              this.setData({
                listData: res.content
              })
            }
          } else {
            this.setData({
              hasCoupon: false
            })
          }
        }, err => {
          console.log(err)
        })
      }
    },

    reqExchangeListData(isPage) {
      let data = {
        businessType: this.data.params.businessType,
        cityCode: this.data.params.cityCode,
        pageSize: 10,
        currentPage: this.data.pageNo
      }
      http.postRequest("/v2/passenger/integral/getMyIntegralInfoAndCouponList", data, wx.getStorageSync('header'), res => {
        this.setData({
          loading: false
        })
        if (res.code === '1') {
          let listData = res.content.couponInfoList;
          if (isPage) {
            this.setData({
              listData: this.data.listData.concat(listData)
            })
            if (listData.length === 0) {
              this.setData({
                noMore: true
              })
            }
          } else {
            if (res.content.couponInfoList.length != 0) {
              this.setData({
                listData,
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

    chooseCoupon() {
      let params = this.data.params;
      let id = this.data.curItemId || 0;
      let data = {
        couponId: id,
        businessType: params.businessType || 0,
        lineId: params.lineId || 0,
        lineType: params.lineType || 0,
        rideNumber: params.rideNumber || 0,
      }
      http.postRequest("/v2/passenger/integral/selectCoupon", data, wx.getStorageSync('header'), res => {
        if (this.data.curItemId) {
          this.triggerEvent("HasChooseCouponData", {
            data: res.content,
            isChoose: true
          });
        } else {
          this.triggerEvent("HasChooseCouponData", {
            data: res.content,
            isChoose: false
          });
        }
      }, err => {
        console.log(err)
      })
    },

    exchange(e) {
      let item = e.currentTarget.dataset.item;
      if (clickTimer) clearTimeout(clickTimer);
      clickTimer = setTimeout(() => {
        this.exchangeReq(item);
      }, 500);
    },

    exchangeReq(item) {
      // http.postRequest("/v2/passenger/integral/exchangeCoupon?couponId=" + item.couponId, "", wx.getStorageSync('header'), res => {
      //   if (res.code === '1') {
      this.triggerEvent("ExchangeItem", item);
      this.triggerEvent("CouponState", false);
      this.setData({
        showCoupon: false
      })
      //   }
      // }, err => {
      //   console.log(err)
      // })
    }
  }
})