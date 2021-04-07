import http from '../../../utils/http';
const app = getApp();
Page({
  data: {
    loadingFailed: false,
    loading: false,
    noMore: false,
    pageNo: 1,
    listData: null
  },

  onLoad: function (options) {
    this.getOrderList(false);
  },
  onShow(){
    // app.globalData.client = null;
    //  app.mqttConfig(0)
  },
  onUnload(){
    // app.globalData.client = null;
  },

  //到达底部
  scrollToLower: function (e) {
    if (!this.data.loading && !this.data.noMore) {
      this.setData({
        loading: true,
        pageNo: this.data.pageNo + 1
      });
      this.getOrderList(true);
    }
  },

  // 查询订单
  getOrderList(isPage) {
    const _this = this;
    let reqData = {
      pageSize: 30,
      currentPage: this.data.pageNo,
    }
    http.getRequest("/v1/passenger/center/itineraryOrder", reqData, wx.getStorageSync('header'), res => {
      this.setData({
        loading: false
      })
      if (res.code === '1') {
        let listData = [];
        res.content.forEach(val => {
          let date = new Date(parseInt(val.appointmentTime));
          let y = date.getFullYear();
          let M = date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1;
          let d = date.getDate() < 10 ? '0' + date.getDate() : date.getDate();
          let h = date.getHours() < 10 ? '0' + date.getHours() : date.getHours();
          let m = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes();
          let resTime = y + '年' + M + '月' + d + '日' + ' ' + h + ':' + m;
          val.time = resTime;
          listData.push(val)
        })
        if (isPage) {
          _this.setData({
            listData: this.data.listData.concat(listData)
          })
          if (res.content.length === 0) {
            _this.setData({
              noMore: true
            })
          }
        } else {
          _this.setData({
            listData
          })
          if (res.content.length === 0) {
            _this.setData({
              noOrder: true
            })
          }
        }
      }else{
        _this.setData({
          loadingFailed: true
        })
      }
    }, err => {
      console.log(err)
      this.setData({
        loadingFailed: true
      })
      return false;
    })
  },

  //查看订单详情
  orderDetail(e) {
    if (e.currentTarget.dataset.status) {
      if (e.currentTarget.dataset.status === '已完成' || e.currentTarget.dataset.status === '已关闭') {
        wx.navigateTo({
          url: '/user_center/pages/payDetail/payDetail?from=orderList&driver=' + JSON.stringify(e.currentTarget.dataset.item),
        })
      } else {
        wx.navigateTo({
          url: '/driving_status/pages/orderService/orderService?driver=' + JSON.stringify(e.currentTarget.dataset.item) + '&status=' + e.currentTarget.dataset.status + '&from=orderList',
        })
      }
    }

  },

})