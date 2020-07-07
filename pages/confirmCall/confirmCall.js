import http from '../../utils/http.js';
var QQMapWX = require('../../libs/qqmap-wx-jssdk.js');
var qqmapsdk;
qqmapsdk = new QQMapWX({
  key: 'ACZBZ-XOJRU-AKQVD-BDUEX-2WJSZ-Y4BNN'
});

let SCREEN_WIDTH = 750
let RATE = wx.getSystemInfoSync().screenHeight / wx.getSystemInfoSync().screenWidth
const app = getApp()

Page({
  data: {
    ScreenTotalW: SCREEN_WIDTH,
    ScreenTotalH: SCREEN_WIDTH * RATE - 550,
    longitude: '',
    latitude: '',
    controls: [],
    markers: [],
    points: [],
    modalHidden: true,
    walkingDis: 0,
    strAddress: '', //起点
    endAddress: '', //终点
    longModal: false, //是否跨市
    currentTab: 0,
    totalPrice: null,
    preferentialPrice: null,
    areaCode: null,
  },

  onLoad: function (options) {
    this.mapCtx = wx.createMapContext("myMap");

    let _this = this
    //判断是否跨市
    // let strCity = app.globalData.startCity
    // let endCity = app.globalData.destinationCity

    // if (strCity != endCity) {
    //   console.log('起点：', strCity, '终点', endCity)
    //   console.log("起点目的地不在一个城市");
    //   _this.setData({
    //     longModal: true
    //   })
    // }

    let startDate = wx.getStorageSync('startDate');
    if (startDate) {
      this.setData({
        isAppointment: true,
        startDate
      })
    }

    // let _points = [{
    //   latitude: app.globalData.strLatitude,
    //   longitude: app.globalData.strLongitude
    // }, {
    //   latitude: app.globalData.endLatitude,
    //   longitude: app.globalData.endLongitude
    // }]

    _this.setData({
      // tabName: app.globalData.tabName,
      strAddress: app.globalData.strAddress,
      endAddress: app.globalData.destination,
      // points: _points,
      markers: [{
          id: 0,
          latitude: app.globalData.strLatitude,
          longitude: app.globalData.strLongitude,
          iconPath: '../../assets/images/mapicon_navi_s.png',
          width: 30,
          height: 30,
          callout: {
            content: "从这里出发", //文本
            bgColor: "#fff", //背景色
            padding: "10px 30px", //文本边缘留白
            borderRadius: "15px", //边框圆角
            borderWidth: "1px", //边框宽度
            borderColor: "#ccc", //边框颜色
            color: '#000', //文字颜色
            textAlign: 'center', //对其方式,
            display: 'ALWAYS', //常显  BYCLICK点击显示
          }
        },
        {
          id: 1,
          latitude: app.globalData.endLatitude,
          longitude: app.globalData.endLongitude,
          iconPath: '../../assets/images/mapicon_navi_e.png',
          width: 30,
          height: 30,
        },
      ]
    })

    this.driving(app.globalData.strLatitude, app.globalData.strLongitude, app.globalData.endLatitude, app.globalData.endLongitude);

    this.getPrice();

  },
  
  // 驾车路线
  driving(str1, str2, end1, end2) {
    var _this = this;
    //调用距离计算接口
    qqmapsdk.direction({
      mode: 'driving', //可选值：'driving'（驾车）、'walking'（步行）、'bicycling'（骑行），不填默认：'driving',可不填
      //from参数不填默认当前地址
      from: {
        'latitude': str1,
        'longitude': str2
      },
      to: {
        'latitude': end1,
        'longitude': end2
      },
      success: function (res) {
        console.log(res);
        var ret = res;
        var coors = ret.result.routes[0].polyline,
          pl = [];
        //坐标解压（返回的点串坐标，通过前向差分进行压缩）
        var kr = 1000000;
        for (var i = 2; i < coors.length; i++) {
          coors[i] = Number(coors[i - 2]) + Number(coors[i]) / kr;
        }
        //将解压后的坐标放入点串数组pl中
        for (var i = 0; i < coors.length; i += 2) {
          pl.push({
            latitude: coors[i],
            longitude: coors[i + 1]
          })
        }
        let _points = [{
          latitude: parseFloat(str1),
          longitude: parseFloat(str2)
        }, {
          latitude: parseFloat(end1),
          longitude: parseFloat(end2)
        }]

        _this.setData({
          polyline: [{
            points: pl,
            color: '#3091e0DD',
            width: 4,
            arrowLine: true
          }],
          markers: [{
            iconPath: "../../assets/images/mapicon_navi_s.png",
            id: 0,
            latitude: str1,
            longitude: str2,
            width: 30,
            height: 30,
          }, {
            iconPath: "../../assets/images/mapicon_navi_e.png",
            id: 1,
            latitude: end1,
            longitude: end2,
            width: 30,
            height: 30
          }],
        })

        _this.mapCtx.includePoints({
          padding: [120],
          points: _points,
        })
      },
      fail: function (error) {
        console.error(error);
      }
    });
  },

  // 估价
  getPrice() {
    let token = wx.getStorageSync('token') || '';
    let reqData = {
      'userLongitude': this.data.markers[0].longitude,
      'userLatitude': this.data.markers[0].latitude,
      'destinationLongitude': this.data.markers[1].longitude,
      'destinationLatitude': this.data.markers[1].latitude,
      'businessType': 1 // 业务类型 1-网约车 2-顺风车
    }

    http.postRequest('/carOrder/passenger/lineValuation', reqData, {
      'channel': 2, //请求来源 2-小程序
      'appChannel': wx.getStorageSync('systemInfo').model, //systemInfo.brand, //app渠道
      'platformType': 3, //systemInfo.platform,  //系统类型
      'sysVersion': wx.getStorageSync('systemInfo').system, //操作系统版本
      'token': token
    }, res => {
      console.log('估价数据：', res)
      if (res.code === '1' && res.content.length > 0) {
        this.setData({
          totalPrice: res.content[0].totalPrice,
          areaCode: res.content[0].areaCode,
        })
        if (res.content[0].preferentialPrice) {
          this.setData({
            preferentialPrice: res.content[0].preferentialPrice
          })
        }
      }
    }, err => {
      console.log(err)
      if(err.data.message === '当前城市未开通服务,敬请期待'){
        this.setData({
          lineValErrMsg:err.data.message
        })
      }
    })
  },

  // 重新估价
  reGetPrice() {
    this.getPrice();
  },

  // 叫车
  callCar() {
    var phoneNumber = wx.getStorageSync('phoneNumber')
    if (!phoneNumber) {
      wx.navigateTo({
        url: '/user_center/pages/login/login',
      })
      return false
    }
    if (app.globalData.walkDistance > 1000) {
      this.setData({
        modalHidden: false
      })
      return false
    }

    let reqData = {
      plan: 1, //用户选择乘车方式(1-网约车, 4-城际联乘)
      businessType: app.globalData.friendDriverId ? 5 : 1, //用户选择乘车方式(1-网约车,2-顺风车, 5-好友司机)
      startAddress: this.data.strAddress,
      endAddress: this.data.endAddress,
      rideNumber: 1, //乘车人数(网约车传1,联乘传具体人数)
      driverId: app.globalData.friendDriverId, //  好友司机Id,好友司机模式下一定要传
      appointmentTimeAndRealTime: app.globalData.nowOrFutureId, //好友司机模式下需要传,实时或预约(1-实时, 2-预约)
      appointmentTime: app.globalData.friendStartDate //当好友司机模式下的appointmentTimeAndRealTime=1时需要传预约时间
    }

    if(this.data.lineValErrMsg){
      wx.showModal({
        showCancel:false,
        content:this.data.lineValErrMsg
      })
    }else{
      http.postRequest('/carOrder/passenger/getRentCar', reqData, wx.getStorageSync('header'), (res) => {
        if (res.code === '1') {
          if (res.content.canPlaceOrder) {
            console.log('呼叫成功：', res)
            console.log(this.data.isAppointment)
            wx.setStorageSync('orderNo', res.content.nodeOrderNos[0]); // 后续移除订单号
            app.globalData.friendDriverId = null;
            if (this.data.isAppointment) {
              wx.reLaunch({
                url: '/pages/index/index?hasYuYue=1',
              })
            } else {
              wx.redirectTo({
                url: '/pages/orderService/orderService?from=call',
              })
            }
          } else {
            wx.showModal({
              content: "您有一个尚未完成的订单，是否进入该订单",
              success(res) {
                if (res.confirm) {
                  wx.redirectTo({
                    url: '/pages/orderService/orderService?from=hasNoOrder',
                  })
                }
              }
            })
          }
        }
      }, (err) => {
        console.log(err)
      })
    }


  },

  //重新修改
  modalCancel: function () {
    console.log("modalCancel")
    this.setData({
      modalHidden: true
    })
  },

  //继续叫车
  modalConfirm: function () {
    console.log("modalConfirm")
    this.setData({
      modalHidden: true
    })

    wx.redirectTo({
      url: '/pages/orderService/orderService?from=call',
    })
  },


  //查看估价
  bindPriceDetail() {

    let data = {
      strLat: app.globalData.strLatitude,
      strLng: app.globalData.strLongitude,
      endLat: app.globalData.endLatitude,
      endLng: app.globalData.endLongitude,
    }

    wx.navigateTo({
      url: '/user_center/pages/budgetPrice/budgetPrice?valuationData=' + JSON.stringify(data),
    })
  },

  //选择乘车方式
  tripType(e) {
    let _this = this
    var cur = e.currentTarget.dataset.current;
    _this.setData({
      currentTab: cur
    })

    //dosomething
  },

  //定位当前位置
  getMyLocation() {
    var _self = this
    wx.getLocation({
      type: "wgs84",
      success(res) {
        console.log(res);
        _self.setData({
          latitude: res.latitude,
          longitude: res.longitude
        })
      },
      fail(err) {
        console.log(err);
      }
    })
  },


  // linkDetail(e) {
  //   let item = e.currentTarget.dataset.item;
  //   //联乘
  //   if (item.id === 1) {
  //     let address = {
  //       id: item.id,
  //       strAddress: this.data.strAddress,
  //       endAddress: this.data.endAddress,
  //       busStrAddress: '后台返回起点',
  //       busEndAddress: '后台返回起点',
  //       time: '后台返回时间'
  //     }
  //     wx.navigateTo({
  //       url: '/pages/useCartDetail/useCartDetail?address=' + JSON.stringify(address),
  //     })
  //     //城际  
  //   } else if (item.id === 2) {
  //     let address = {
  //       id: item.id,
  //       busStrAddress: '后台返回起点',
  //       busEndAddress: '后台返回终点',
  //       time: '后台返回时间'
  //     }
  //     wx.navigateTo({
  //       url: '/pages/useCartDetail/useCartDetail?address=' + JSON.stringify(address),
  //     })
  //   }
  // },


})