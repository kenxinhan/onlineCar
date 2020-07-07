import http from '../../../utils/http';
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
    http.getRequest("/passenger/center/itineraryOrder", reqData, wx.getStorageSync('header'), res => {
      console.log('订单查询成功：', res)
      this.setData({
        loading: false
      })
      if (res.code === '1') {
        let listData = [];
        res.content.forEach((val, index) => {
          let item = {};
          let date = new Date(val.appointmentTime * 1000);
          let y = date.getFullYear();
          let M = date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1;
          let d = date.getDate() < 10 ? '0' + date.getDate() : date.getDate();
          let h = date.getHours() < 10 ? '0' + date.getHours() : date.getHours();
          let m = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes();
          let s = date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds();
          let resTime = y + '年' + M + '月' + d + '日' + ' ' + h + ':' + m + ':' + s;
          item.orderNo = val.orderNo;
          item.nodeOrderNos = val.nodeOrderNos;
          item.typeTitle = val.businessName;
          item.status = val.orderStateName;
          item.time = resTime;
          item.startAddress = val.startAddress;
          item.endAddress = val.endAddress;
          listData.push(item)
        })
        if (isPage) {
          _this.setData({
            listData: this.data.listData.concat(listData)
          })
        } else {
          this.setData({
            listData
          })
        }
        if (res.content.length === 0) {
          _this.setData({
            noMore: true
          })
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
          url: '/user_center/pages/payDetail/payDetail?orderNo=' + e.currentTarget.dataset.order_no + '&status=' + e.currentTarget.dataset.status,
        })
      } else {
        wx.redirectTo({
          url: '/pages/orderService/orderService?orderNo=' + e.currentTarget.dataset.order_no + '&status=' + e.currentTarget.dataset.status + '&from=orderList',
        })
      }
    }

  },

})