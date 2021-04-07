import http from '../../utils/http.js';
import qqmapsdk from '../../libs/qqMap';

let SCREEN_WIDTH = 750;
let RATE = wx.getSystemInfoSync().screenHeight / wx.getSystemInfoSync().screenWidth;
const app = getApp();
let callCarTimer = null;

Page({
  data: {
    ScreenTotalW: SCREEN_WIDTH,
    ScreenTotalH: SCREEN_WIDTH * RATE - 550,
    longitude: '',
    latitude: '',
    markers: [],
    points: [],
    modalHidden: true,
    walkingDis: 0,
    strAddress: '', //起点
    endAddress: '', //终点
    currentTab: 0,
    totalPrice: null,
    preferentialPrice: null,
    areaCode: null,
    taxi: false,
    fromFriendUseCart: false,
    driverFriend: null,
    showCoupon: false,
    isFromIcon: true,
    curCouponData: null,
    hasChooseId: null,
    exchangeItem: null,
    isBack:false,
    showMovable:true,
  },

  onLoad: function (opt) {
    console.log('opt:', opt)
    let _this = this;
    this.mapCtx = wx.createMapContext("myMap");
    if (opt.from && opt.from === 'taxi') {
      this.setData({
        taxi: true,
        showMovable:false
      })
    }
    if (app.globalData.friendDriver) {
      this.setData({
        fromFriendUseCart: true,
        driverFriend: app.globalData.friendDriver,
        showMovable:false
      })
    }

    let startDate = wx.getStorageSync('startDate');
    if (startDate) {
      this.setData({
        isAppointment: true,
        startDate
      })
    }

    _this.setData({
      strAddress: app.globalData.strAddress,
      endAddress: app.globalData.destination,
      markers: [{
          id: 0,
          latitude: app.globalData.strLatitude,
          longitude: app.globalData.strLongitude,
          iconPath: 'http://scapp.xysc16.com/upload/wmp/imgs/mapicon_navi_s.png',
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
          iconPath: 'http://scapp.xysc16.com/upload/wmp/imgs/mapicon_navi_e.png',
          width: 30,
          height: 30,
        },
      ]
    })

    this.driving(app.globalData.strLatitude, app.globalData.strLongitude, app.globalData.endLatitude, app.globalData.endLongitude);

    if (!this.data.taxi) this.getPrice();
  },

  onShow(){
    this.checkIntegral();
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
            iconPath: "http://scapp.xysc16.com/upload/wmp/imgs/mapicon_navi_s.png",
            id: 0,
            latitude: str1,
            longitude: str2,
            width: 30,
            height: 30,
          }, {
            iconPath: "http://scapp.xysc16.com/upload/wmp/imgs/mapicon_navi_e.png",
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
    // let token = wx.getStorageSync('token') || '';
    let reqData = {
      'userLongitude': this.data.markers[0].longitude,
      'userLatitude': this.data.markers[0].latitude,
      'destinationLongitude': this.data.markers[1].longitude,
      'destinationLatitude': this.data.markers[1].latitude,
      'businessType': 1
    }

    console.log(this.data.markers[0].longitude);
    http.postRequest('/v1/carOrder/passenger/lineValuation', reqData, wx.getStorageSync('header'), res => {
      if (res.content.length > 0) {
        this.setData({
          totalPrice: res.content[0].totalPrice,
          areaCode: res.content[0].areaCode,
        })
        if (res.content[0].preferentialPrice) {
          this.setData({
            preferentialPrice: res.content[0].preferentialPrice
          })
        }
        if (res.content[0].couponId && res.content[0].couponDescribe) {
          this.setData({
            curCouponData: {
              couponId: res.content[0].couponId,
              couponDescribe: res.content[0].couponDescribe
            }
          })
        }
      } else {
        this.setData({
          lineValErrMsg: '请重新估价'
        })
      }
    }, err => {
      console.log(err)
      if (err.data.message === '当前城市未开通服务,敬请期待') {
        this.setData({
          lineValErrMsg: err.data.message
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
    let state, businessType;
    if (this.data.taxi) {
      state = 'taxi';
      businessType = app.globalData.friendDriver ? 5 : 10;
    } else {
      state = 'call';
      businessType = app.globalData.friendDriver ? 5 : 1;
    }

    let reqData = {
      plan: 1, //用户选择乘车方式(1-网约车, 4-城际联乘)
      businessType, //用户选择乘车方式(1-网约车,2-顺风车, 5-好友司机)
      startAddress: this.data.strAddress,
      endAddress: this.data.endAddress,
      rideNumber: 1, //乘车人数(网约车传1,联乘传具体人数)
      driverId: app.globalData.friendDriver ? app.globalData.friendDriver.cart_id : null, //  好友司机Id,好友司机模式下一定要传
      appointmentTimeAndRealTime: app.globalData.nowOrFutureId, //好友司机模式下需要传,实时或预约(1-实时, 2-预约)
      appointmentTime: app.globalData.friendStartDate, //当好友司机模式下的appointmentTimeAndRealTime=1时需要传预约时间
      remoteStartLng: app.globalData.strLongitude,
      remoteStartLat: app.globalData.strLatitude,
      remoteEndLng: app.globalData.endLongitude,
      remoteEndLat: app.globalData.endLatitude,
      couponId:(this.data.curCouponData && this.data.curCouponData.couponId) || 0
    }

    if (callCarTimer) clearTimeout(callCarTimer);
    callCarTimer = setTimeout(() => {
      if (this.data.lineValErrMsg) {
        wx.showModal({
          showCancel: false,
          content: this.data.lineValErrMsg
        })
      } else {
        http.postRequest('/v1/carOrder/passenger/getRentCar', reqData, wx.getStorageSync('header'), (res) => {
          if (res.code === '1') {
            if (res.content.canPlaceOrder) {
              if (this.data.isAppointment) {
                wx.reLaunch({
                  url: '/pages/index/index?hasYuYue=1&friendBusinessType=' + businessType,
                })
              } else {
                wx.reLaunch({
                  url: '/driving_status/pages/orderService/orderService?from=' + state + '&callDriverInfo=' + JSON.stringify(res.content),
                })
              }
            } else {
              wx.showModal({
                content: "您有一个尚未完成的订单，是否进入该订单",
                success(res) {
                  if (res.confirm) {
                    wx.reLaunch({
                      url: '/driving_status/pages/orderService/orderService?from=hasNoOrder',
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
    }, 500);
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
      url: '/driving_status/pages/orderService/orderService?from=call',
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

    let replaceList;
    if(this.data.curCouponData && this.data.curCouponData.costList){
      replaceList = JSON.stringify(this.data.curCouponData.costList);
    }else{
      replaceList = '';
    }

    wx.navigateTo({
      url: '/user_center/pages/budgetPrice/budgetPrice?valuationData=' + JSON.stringify(data)+'&replaceList='+replaceList,
    })
  },

  //选择乘车方式
  tripType(e) {
    let _this = this
    var cur = e.currentTarget.dataset.current;
    _this.setData({
      currentTab: cur
    })

  },

  //定位当前位置
  getMyLocation() {
    var _self = this
    wx.getLocation({
      type: "wgs84",
      success(res) {
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

  showSlideCoupon() {
    let businessType;
    if (this.data.taxi) {
      businessType = app.globalData.friendDriver ? 5 : 10;
    } else {
      businessType = app.globalData.friendDriver ? 5 : 1;
    }
    let slideCouponParams = {
      businessType,
      cityCode: app.globalData.startCityAdcode
    }
    let data = {
      businessType:1,
      cityCode:app.globalData.startCityAdcode.substr(0,6),
      pageSize:20,
      currentPage:1,
    }
    http.postRequest("/v2/passenger/integral/verifyChangeCoupon",data,wx.getStorageSync('header'),res=>{
      if(res.content.change){
        this.setData({
          showCoupon: true,
          isFromIcon: true,
          slideCouponParams
        })
      }else{
        this.setData({
          showIntegralExchangeModal:true,
          abnormalData:res.content.describe
        })
      }
    })
  },

  couponStateHandle(e) {
    this.setData({
      showCoupon: e.detail
    })
  },

  onHasChooseCouponData(e) {
    this.setData({
      curCouponData: e.detail.data,
      totalPrice: e.detail.data.singlePrice,
    })
  },

  chooseCoupon() {
    if (this.data.curCouponData) {
      this.setData({
        hasChooseId: this.data.curCouponData.couponId
      })
    }
    let businessType;
    if (this.data.taxi) {
      businessType = app.globalData.friendDriver ? 5 : 10;
    } else {
      businessType = app.globalData.friendDriver ? 5 : 1;
    }
    let slideCouponParams = {
      businessType,
      cityCode:app.globalData.startCityAdcode
    }
    this.setData({
      showCoupon: true,
      isFromIcon: false,
      slideCouponParams
    })
  },

  onExchangeItem(e){
    console.log(e.detail)
    this.setData({
      exchangeItem:e.detail,
      showIntegralExchangeModal:true
    })
  },

  CoverState(e){
    this.setData({
      showIntegralExchangeModal:e.detail
    })
  },

  checkIntegral(){
    http.postRequest("/v2/passenger/integral/verifyIntegralOrder","",wx.getStorageSync('header'),res=>{
      if(res.content.showDialog == 1){
        this.setData({
          showIntegralExchangeModal:true,
          isBack:true,
          abnormalData:res.content.describe
        })
      }
    })
  },

})