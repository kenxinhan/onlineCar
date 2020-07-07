import http from '../../utils/http';
let d30 = new Date().getTime() + 1800000;
let d40 = new Date().getTime() + 2400000;
var date = new Date(d30);
var currentHours = date.getHours();
var currentMinute = date.getMinutes();
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
    fromScan: false,
    ScreenTotalW: SCREEN_WIDTH,
    ScreenTotalH: SCREEN_WIDTH * RATE - 440, //地图高度自适应 508 = 导航 + footer
    currentTab: 1,
    fixedLine: true,
    cart: '网约车',
    navScrollLeft: 0,
    isLoading: true,
    color: "#cccccc",
    callCart: true,
    destination: '',
    startAddress: '',
    index: '',
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    longitude: null,
    latitude: null,
    endLongitude: null,
    endLatitude: null,
    scale: 14,
    markers: [],
    footerTabData: [{
        id: 1,
        title: '现在'
      },
      {
        id: 2,
        title: '预约'
      },
    ],
    canChooseStatus: false,
    changeTab: 1,
    showCoupon: false,
    isDriverFriends: false,
    fromFriendUseCart: false,
    onlyNowTime: true,
    onlyAppointmentTime: false,
    canAppointment: false,
    startDate: "预约时间",
    multiArray: [
      ['今天', '明天'],
      [0, 1, 2, 3, 4, 5, 6],
      [0, 10, 20]
    ],
    multiIndex: [0, 0, 0],
    showNotice: false,
    noticeCont: null,
    showCoupon: false,
    driverImg: '../../assets/images/driver.png',
    reqRecoverOrder: 0,
    currentCity: null,
    lineCityCode: null,
    lineStartAddress: '起点起点',
    lineDestination: '',
    lineStartDate: '',
    lineCurPerNum:1,
  },

  onLoad: function (opt) {
    this.requestCart()
    this.checkMySession()
    console.log('indexLoad:', opt)
    if (opt.hasYuYue) {
      wx.showModal({
        content: '预约订单已提交，请等待司机确认',
        showCancel: false,
      })
    }
    this.setData({
      scanDriverId: app.globalData.scanDriverId
    })

    // 扫码进入
    if (opt.driver) {
      console.log('driver：', opt.driver)
      console.log('businesstype：', opt.businesstype)

      if (opt['amp;businesstype'] === '1' || opt.businesstype === '1') {
        console.log('b1')
        this.setData({
          fromScan: true,
        })
        app.globalData.scanDriverId = opt.driver
        this.setData({
          scanDriverId: opt.driver
        })
      } else if (opt['amp;businesstype'] === '2' || opt.businesstype === '2') {
        console.log('b2')
        wx.redirectTo({
          url: '/pages/addFriends/addFriends?scanId=' + opt.driver,
        })
      }

    }

    if (opt.des === 'scan') {
      this.setData({
        fromScan: true,
      })
    }

    if (this.data.fromScan) {
      this.setData({
        ScreenTotalH: SCREEN_WIDTH * RATE - 400,
        destination: app.globalData.destination,
        endLatitude: app.globalData.endLatitude,
        endLongitude: app.globalData.endLongitude,
      })
    } else {
      this.setData({
        ScreenTotalH: SCREEN_WIDTH * RATE - 440
      })
    }




    // 好友用车点进
    if (opt.driverFriend) {
      this.setData({
        fromFriendUseCart: true,
        driverFriend: JSON.parse(opt.driverFriend),
        canAppointment: true,
        canChooseStatus: true
      })
      app.globalData.friendDriverId = null;
      app.globalData.friendDriverId = parseInt(this.data.driverFriend.cart_id);
      if (this.data.driverFriend.fromOffline) {
        app.globalData.nowOrFutureId = 2;
        this.setData({
          onlyAppointmentTime: true,
          changeTab: 2,
          onlyNowTime: false
        })
      } else {
        this.setData({
          onlyAppointmentTime: false,
          changeTab: 1,
          onlyNowTime: true
        })
      }
    } else {
      this.setData({
        fromFriendUseCart: false,
        driverFriend: null,
        canAppointment: false,
        canChooseStatus: false
      })
    }

  },
  onShow() {
    // 是否有恢复订单
    // if(wx.getStorageSync('token')){
    //   this.reqHasOrder();
    // }
    let lineDate = new Date(d40);
    let h = lineDate.getHours() < 10 ? '0'+ lineDate.getHours() : lineDate.getHours();
    let m = lineDate.getMinutes() < 10 ? '0'+ lineDate.getMinutes() : lineDate.getMinutes();
    let lineStartDate = '今天 '+h+' : '+ m;
    this.getUserLocation()
    if (wx.getStorageSync('phoneNumber')) {
      this.reqHasOrder();
    }
    var _this = this;
    var add = ''
    if (app.globalData.strAddress) {
      add = app.globalData.strAddress
    } else {
      add = app.globalData.originAddress
    }
    _this.setData({
      startAddress: add,
      lineStartDate,
      currentCity:app.globalData.lineStartCity,
      lineCityCode:app.globalData.lineCityCode,
    })
    if (this.data.currentTab == 0 && !this.data.fromFriendUseCart) {
      app.globalData.nowOrFutureId = null;
      app.globalData.friendDriverId = null;
      app.globalData.friendStartDate = null;
    }
    if (app.globalData.nowOrFutureId === null) {
      wx.removeStorageSync('startDate')
    }
    wx.checkSession({
      success: (res) => {
        if (!_this.data.notLogin) {
          if (app.globalData.reqNotice && wx.getStorageSync('token')) {
            _this.getNotice();
          }
          if (app.globalData.originLongitude && wx.getStorageSync('token')) {
            _this.reqFriendsList()
          }
        }
      },
    })

    //每次返回主页清空目的地
    app.globalData.destinationProvince = ''
    app.globalData.destinationCity = ''
    app.globalData.destinationDistrict = ''
    app.globalData.destinationStreet = ''
    app.globalData.destination = ''
    app.globalData.endLatitude = ''
    app.globalData.endLongitude = ''

    // this.animationData1 = wx.createAnimation({
    //   duration: 250
    // })
    // this.animationData2 = wx.createAnimation({
    //   duration: 250
    // })
    // this.animationData3 = wx.createAnimation({
    //   duration: 250
    // })

    // 优惠券
    let couponList = wx.getStorageSync('couponList');
    let phoneNumber = wx.getStorageSync('phoneNumber');
    if (couponList && couponList.length > 0 && phoneNumber) {
      this.setData({
        couponList,
        showCoupon: true
      })
      wx.removeStorageSync('couponList')
    }



  },

  onReady: function () {
    this.mapCtx = wx.createMapContext("indexMap"); // 地图组件的id
    // this.setData({
    //   hiddenLoading:true
    // })

  },
  onHide() {
    app.globalData.strAddress = this.data.startAddress;
    app.globalData.strLatitude = this.data.latitude;
    app.globalData.strLongitude = this.data.longitude;
  },

  // 转发
  onShareAppMessage(e) {
    return {
      title: '峡市约车',
      imageUrl: "../../assets/images/share.jpg",
      path: "/pages/index/index",
      success: (res) => {
        console.log("转发成功", res);
      },
      fail: (res) => {
        console.log("转发失败", res);
      }
    }
  },

  checkMySession() {
    wx.getStorageSync({
      key: 'session_key',
      success(res) {
        //有session_key说明登陆过，判断session是否有效
        wx.checkSession({
          success(res) { //有效
          },
          fail(err) { //无效,重新登录
            // app.reqLogin();
            // _this.getUserInfo()
            wx.navigateTo({
              url: '/user_center/pages/login/login',
            })
          }
        })
      },
      //本地无法获取session, 重新登录
      fail(res) {
        console.log("获取失败session_key", res);
        // app.reqLogin();
        wx.navigateTo({
          url: '/user_center/pages/login/login',
        })
      }
    })
  },

  //存储字段  目前自定义
  requestCart(e) {
    const navData = [{
        "id": 0,
        "name": "网约车",
      },
      {
        "id": 1,
        "name": "远程",
      },
      // {
      //   "id": 2,
      //   "name": "城际",
      // },
      // {
      //   "id": 3,
      //   "name": "顺风车",
      // },
      {
        "id": 4,
        "name": "好友司机",
      }
    ];
    const imgUrls = [
      "../../assets/images/swiper-2.png",
      "../../assets/images/swiper-1.png",
      "../../assets/images/swiper-3.png"
    ];
    const cost = [{
        "id": "0",
        "name": "现在出发",
        "url": "../../assets/images/time.png"
      },
      {
        "id": "1",
        "name": "换乘车人",
        "url": "../../assets/images/driver.png"
      },
      {
        "id": "2",
        "name": "个人支付",
        "url": "../../assets/images/play.png"
      }
    ];

    this.setData({
      navData,
      imgUrls,
      cost
    })
  },

  // 点击选择终点
  toDestination(e) {
    console.log(app.globalData)
    if ((app.globalData.nowOrFutureId == 2 || app.globalData.nowOrFutureId === null) && this.data.fromFriendUseCart && app.globalData.friendStartDate == null) {
      wx.showModal({
        content: '请选择预约时间',
        showCancel: false
      })
    } else {
      if (e.currentTarget.dataset.from === 'scan') {
        wx.navigateTo({
          url: '/pages/destination/destination?from=scan',
        })
      } else {
        wx.navigateTo({
          url: '/pages/destination/destination',
        })
      }
    }
  },



  //切换导航 获取不同计价方式
  switchNav(event) {
    const cart = event.currentTarget.dataset.name
    var cur = event.currentTarget.dataset.current;

    // app.globalData.tabName = cart
    // app.globalData.tabId = cur
    this.setData({
      cart,
      isLoading: true,
    })

    this.setData({
      currentTab: cur,
    })

    if(cur === 0){
      this.setData({
        fixedLine: false
      })
    }else if (cur === 1) {
      this.setData({
        fixedLine: true,
      })
    }

    if (cur === 4) {
      this.setData({
        isDriverFriends: true
      })
      if (wx.getStorageSync('token')) this.reqFriendsList();
    } else {
      this.setData({
        isDriverFriends: false,
        canChooseStatus: false,
        fromFriendUseCart: false,
      })
      if (this.data.currentTab != 4 && !this.data.fromFriendUseCart) {
        app.globalData.nowOrFutureId = null;
        app.globalData.friendDriverId = null;
        app.globalData.friendStartDate = null;
      }
      if (app.globalData.nowOrFutureId === null) {
        wx.removeStorageSync('startDate')
      }
    }

    this.setData({
      fromFriendUseCart: false,
      driverFriend: null
    })
  },

  // 是否有未完成订单
  reqHasOrder() {
    http.postRequest("/carOrder/passenger/checkRecoverOrder", '', wx.getStorageSync('header'), res => {
      if (res.code === '1' && res.content.state === 1) {
        this.setData({
          reqRecoverOrder: this.data.reqRecoverOrder++
        })
        if (this.data.reqRecoverOrder <= 1) {
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
      } else if (res.code === '100' || res.code === '101') {
        this.setData({
          notLogin: true
        })
      }
    }, err => {
      console.log(err)
    })
  },

  // 请求好友司机列表
  reqFriendsList() {
    let data = {
      lng: app.globalData.originLongitude,
      lat: app.globalData.originLatitude,
      pageSize: 30,
      currentPage: 1,
    }
    http.getRequest("/passenger/friendDriver/list", data, wx.getStorageSync('header'), res => {
      console.log('好友：', res)
      if (res.code === '1' && res.content.length !== 0) {
        this.setData({
          noFriends: false,
          driver: res.content
        })
      } else {
        this.setData({
          noFriends: false
        })
      }
    }, err => {
      console.log(err)
    })
  },

  // 显示删除框
  delFriend(e) {
    this.setData({
      showDel: e.currentTarget.dataset.id
    })
  },

  // 确认删除
  confirmDel(e) {
    let driverNo = e.currentTarget.dataset.id;
    let _this = this;
    wx.showModal({
      content: "是否解除好友司机关系",
      confirmText: "解除",
      cancelText: "取消",
      success(res) {
        if (res.confirm) {
          _this.reqDelFriend(driverNo)
        } else {
          _this.setData({
            showDel: null,
          })
        }
      }
    })

  },

  // 删除好友司机
  reqDelFriend(driverNo) {
    let newDriver;
    http.postRequest("/passenger/friendDriver/attentionOrCancel?driverNo=" + driverNo, '', wx.getStorageSync('header'), res => {
      console.log('删除好友：', res)
      if (res.code === '1' && res.content.length !== 0) {
        this.setData({
          showDel: null,
        })
        newDriver = this.data.driver.filter(item => item.driverNo != driverNo);
        console.log(newDriver)
        this.setData({
          driver: newDriver
        })
        wx.showToast({
          title: '删除成功',
        })
        if (this.data.driver.length == 0) {
          this.setData({
            noFriends: true
          })
        }
      } else {
        this.setData({
          noFriends: true
        })
      }
    }, err => {
      console.log(err)
    })
  },

  // reqFriendsList() {
  //   let data = {
  //     lng: app.globalData.originLongitude,
  //     lat: app.globalData.originLatitude,
  //     pageSize: 30,
  //     currentPage: 1
  //   }
  //   http.getRequest("/passenger/friendDriver/list", data, wx.getStorageSync('header'), res => {
  //     if (res.code === '1' && res.content.length !== 0) {
  //       let list0 = res.content.filter(item => item.state === 0)
  //       let list1 = res.content.filter(item => item.state === 1)
  //       let list2 = res.content.filter(item => item.state === 2)
  //       this.setData({
  //         onlineDriverList: list0,
  //         workingDriverList: list1,
  //         offlineDriverList: list2
  //       })
  //     }
  //   }, err => {
  //     console.log(err)
  //   })
  // },


  //获取地理位置
  getUserLocation() {
    let _self = this

    //重新选择起点 需要重新定位
    if (app.globalData.strAddress) {
      qqmapsdk.reverseGeocoder({
        location: {
          latitude: app.globalData.strLatitude,
          longitude: app.globalData.strLongitude,
        },
        success(addressRes) {
          console.log('location1', addressRes)
          app.globalData.strLatitude = addressRes.result.location.lat;
          app.globalData.strLongitude = addressRes.result.location.lng;
          app.globalData.strAddress = addressRes.result.formatted_addresses.recommend;
          app.globalData.startCity = addressRes.result.address_component.city;
          app.globalData.lineStartCity = addressRes.result.address_component.city;
          wx.setStorageSync('areaCodeIndex', addressRes.result.ad_info.adcode)
          _self.setData({
            latitude: addressRes.result.location.lat,
            longitude: addressRes.result.location.lng,
            startAddress: addressRes.result.formatted_addresses.recommend,
            scale: 16,
          })
        },
        fail() {
          _self.setData({})
          console.log("获取位置失败");
        }
      })
    } else {
      wx.getLocation({
        type: 'gcj02',
        success(res) {
          console.log(res)
          let _latitude = res.latitude
          let _longitude = res.longitude

          _self.setData({
            latitude: _latitude,
            longitude: _longitude,
          })

          qqmapsdk.reverseGeocoder({
            location: {
              latitude: _latitude,
              longitude: _longitude
            },
            success(addressRes) {
              console.log('location2', addressRes)
              let obj = addressRes.result.address_component
              console.log(obj.city)

              app.globalData.originProvince = obj.province; //省
              app.globalData.originCity = obj.city; //市
              app.globalData.originDistrict = obj.district; //区县
              app.globalData.originStreet = obj.street; //街道
              app.globalData.originAddress = addressRes.result.formatted_addresses.recommend;
              app.globalData.originLongitude = _longitude;
              app.globalData.originLatitude = _latitude;
              app.globalData.strLongitude = _longitude;
              app.globalData.strLatitude = _latitude;
              app.globalData.startCity = obj.city;
              app.globalData.lineStartCity = obj.city;
              wx.setStorageSync('areaCodeIndex', addressRes.result.ad_info.adcode)
              if (wx.getStorageSync('token')) _self.reqFriendsList()

              _self.setData({
                latitude: addressRes.result.location.lat,
                longitude: addressRes.result.location.lng,
                startAddress: addressRes.result.formatted_addresses.recommend,
                currentCity:app.globalData.lineStartCity
              })
            },
            fail() {
              _self.setData({})
              console.log("获取位置失败");
            }
          })
        },
        fail() {
          wx.getSetting({
            success(res) {
              if (!res.authSetting["scope.userLocation"]) { //用户未授权获取地理位置
                wx.showModal({
                  title: '提醒',
                  content: '您拒绝了位置授权，将无法使用大部分功能，点击确定重新获取授权',
                  success(res) {
                    //如果点击确定
                    if (res.confirm) {
                      wx.openSetting({ //打开设置页
                        success(res) { //成功，返回页面回调
                          //如果同意了位置授权则userLocation=true
                          if (res.authSetting["scope.userLocation"]) { //授权中如果有位置授权则执行逻辑
                            console.log(res);
                            _self.getUserLocation()
                          }
                        }
                      })
                    }
                  }
                })
              } else { //用户手机未打开定位
                wx.showModal({
                  title: '',
                  content: '请在系统定位中打开位置服务',
                  success(res) {

                  }
                })
              }
            }
          })
        }
      })
    }
  },

  //改变地图中心位置
  bindregionchange: function (e) {
    console.log(e)
    if (e.type == 'end' && (e.causedBy == 'scale' || e.causedBy == 'drag')) {
      if (app.globalData.strLongitude && app.globalData.strLatitude) {
        this.getCurLocationChange()
      }
    }
  },

  getCurLocationChange() {
    let _this = this;
    this.mapCtx.getCenterLocation({
      success: function (res) {
        qqmapsdk.reverseGeocoder({
          location: {
            latitude: res.latitude,
            longitude: res.longitude,
          },
          success: function (res) {
            console.log('location4',res)
            app.globalData.strLongitude = res.result.location.lng;
            app.globalData.strLatitude = res.result.location.lat;
            app.globalData.strAddress = res.result.formatted_addresses.recommend;
            app.globalData.startCity = res.result.address_component.city;
            _this.setData({
              latitude: res.result.location.lat,
              longitude: res.result.location.lng,
              startAddress: res.result.formatted_addresses.recommend
            })
          },
        });
      }
    })
  },

  //重回当前位置
  getMyLocation() {
    console.log(1)
    var _self = this
    wx.getLocation({
      type: "gcj02",
      success(res) {
        console.log(res);
        qqmapsdk.reverseGeocoder({
          location: {
            latitude: res.latitude,
            longitude: res.longitude,
          },
          success: function (res1) {
            console.log('location4',res1)
            app.globalData.strLongitude = res1.result.location.lng;
            app.globalData.strLatitude = res1.result.location.lat;
            app.globalData.strAddress = res1.result.formatted_addresses.recommend;
            app.globalData.startCity = res1.result.address_component.city;
            _self.setData({
              latitude: res1.result.location.lat,
              longitude: res1.result.location.lng,
              startAddress: res1.result.formatted_addresses.recommend
            })
          },
        });
      },
      fail(err) {
        console.log(err);
      }
    })
  },

  //现在打车/预约打车
  footerTab(e) {
    if (!this.data.onlyAppointmentTime) {
      this.setData({
        changeTab: e.currentTarget.dataset.current
      })
    }
    app.globalData.nowOrFutureId = this.data.changeTab;
    if (this.data.changeTab == 1) {

    } else {
      wx.setStorageSync('startDate', this.data.startDate)
    }

    if (e.currentTarget.dataset.current === 1) {
      this.data.onlyAppointmentTime ?
        wx.showModal({
          title: '提示',
          content: '好友司机不在线呢~'
        }) :
        this.setData({
          onlyNowTime: true
        })
    } else {
      this.setData({
        onlyNowTime: false
      })
    }
  },


  showUser() {
    var phoneNumber = wx.getStorageSync("phoneNumber")
    wx.checkSession({
      success: (res) => {
        if (phoneNumber) {
          wx.navigateTo({
            url: "/user_center/pages/personalCenter/personalCenter",
          })
        } else {
          wx.navigateTo({
            url: "/user_center/pages/login/login",
          })
        }
      },
      fail(err) {
        wx.navigateTo({
          url: "/user_center/pages/login/login",
        })
      }
    })


  },

  //关闭优惠券弹窗
  closeCoupon() {
    this.setData({
      showCoupon: false
    })
  },

  hideDelModal() {
    this.setData({
      showDel: null
    })
  },

  useCart(e) {
    console.log('好友司机==>', e.currentTarget.dataset)
    let driverFriend;
    if (e.currentTarget.dataset.state == 2) {
      driverFriend = {
        name: e.currentTarget.dataset.name,
        cart_num: e.currentTarget.dataset.cart_num,
        cart_id: e.currentTarget.dataset.cart_id,
        cart_no: e.currentTarget.dataset.cart_no,
        fromOffline: true,
      }
    } else {
      driverFriend = {
        name: e.currentTarget.dataset.name,
        cart_num: e.currentTarget.dataset.cart_num,
        cart_id: e.currentTarget.dataset.cart_id,
        cart_no: e.currentTarget.dataset.cart_no
      }
    }
    app.globalData.nowOrFutureId = 1;
    wx.navigateTo({
      url: '/pages/index/index?driverFriend=' + JSON.stringify(driverFriend),
    })
  },
  callPhone(e) {
    console.log('电话号码：', e.currentTarget.dataset)
    wx.makePhoneCall({
      phoneNumber: e.currentTarget.dataset.phone,
      success() {
        console.log('拨打成功')
      }
    })
  },

  // unfold1() {
  //   if (this.data.list1Show) {
  //     this.animationData1.rotate(-45).step();
  //     this.setData({
  //       animationData1: this.animationData1.export(),
  //       list1Show: false
  //     })
  //   } else {
  //     this.animationData1.rotate(45).step();
  //     this.setData({
  //       animationData1: this.animationData1.export(),
  //       list1Show: true
  //     })
  //   }
  // },

  // unfold2() {
  //   if (this.data.list2Show) {
  //     this.animationData2.rotate(-45).step();
  //     this.setData({
  //       animationData2: this.animationData2.export(),
  //       list2Show: false
  //     })
  //   } else {
  //     this.animationData2.rotate(45).step();
  //     this.setData({
  //       animationData2: this.animationData2.export(),
  //       list2Show: true
  //     })
  //   }
  // },

  // unfold3() {
  //   if (this.data.list3Show) {
  //     this.animationData3.rotate(-45).step();
  //     this.setData({
  //       animationData3: this.animationData3.export(),
  //       list3Show: false
  //     })
  //   } else {
  //     this.animationData3.rotate(45).step();
  //     this.setData({
  //       animationData3: this.animationData3.export(),
  //       list3Show: true
  //     })
  //   }
  // },

  // useCartOnline(e) {
  //   console.log('好友司机==>', e.currentTarget.dataset)
  //   let driverFriend = {
  //     name: e.currentTarget.dataset.name,
  //     cart_num: e.currentTarget.dataset.cart_num,
  //     cart_id: e.currentTarget.dataset.cart_id,
  //     cart_no: e.currentTarget.dataset.cart_no
  //   }
  //   wx.navigateTo({
  //     url: '/pages/index/index?driverFriend=' + JSON.stringify(driverFriend),
  //   })
  // },
  // useCartWorking(e) {
  //   console.log('好友司机==>', e.currentTarget.dataset)
  //   let driverFriend = {
  //     name: e.currentTarget.dataset.name,
  //     cart_num: e.currentTarget.dataset.cart_num,
  //     cart_id: e.currentTarget.dataset.cart_id,
  //     cart_no: e.currentTarget.dataset.cart_no
  //   }
  //   wx.navigateTo({
  //     url: '/pages/index/index?driverFriend=' + JSON.stringify(driverFriend),
  //   })
  // },
  // useCartOffline(e) {
  //   console.log('好友司机==>', e.currentTarget.dataset)
  //   let driverFriend = {
  //     name: e.currentTarget.dataset.name,
  //     cart_num: e.currentTarget.dataset.cart_num,
  //     fromOffline: true,
  //     cart_id: e.currentTarget.dataset.cart_id,
  //     cart_no: e.currentTarget.dataset.cart_no
  //   }
  //   wx.navigateTo({
  //     url: '/pages/index/index?driverFriend=' + JSON.stringify(driverFriend),
  //   })
  // },

  addFriends() {
    wx.navigateTo({
      url: '/pages/addFriends/addFriends',
    })
  },

  // 预约日期
  pickerTap: function () {
    date = new Date(d30);

    var monthDay = ['今天', '明天'];
    var hours = [];
    var minute = [];

    currentHours = date.getHours();
    currentMinute = date.getMinutes();

    // 月-日
    for (var i = 2; i <= 2; i++) {
      var date1 = new Date(date);
      date1.setDate(date.getDate() + i);
      var md = (date1.getMonth() + 1) + "-" + date1.getDate();
      monthDay.push(md);
    }

    var data = {
      multiArray: this.data.multiArray,
      multiIndex: this.data.multiIndex
    };

    if (data.multiIndex[0] === 0) {
      if (data.multiIndex[1] === 0) {
        this.loadData(hours, minute);
      } else {
        this.loadMinute(hours, minute);
      }
    } else {
      this.loadHoursMinute(hours, minute);
    }
    hours = hours.map(val => {
      return val + '点'
    })

    minute = minute.map(val => {
      return val + '分'
    })

    console.log(data)
    data.multiArray[0] = monthDay;
    data.multiArray[1] = hours;
    data.multiArray[2] = minute;

    this.setData(data);
  },




  bindMultiPickerColumnChange: function (e) {
    date = new Date(d30);

    var that = this;

    var monthDay = ['今天', '明天'];
    var hours = [];
    var minute = [];

    currentHours = date.getHours();
    currentMinute = date.getMinutes();

    var data = {
      multiArray: this.data.multiArray,
      multiIndex: this.data.multiIndex
    };
    // 把选择的对应值赋值给 multiIndex
    data.multiIndex[e.detail.column] = e.detail.value;

    // 然后再判断当前改变的是哪一列,如果是第1列改变
    if (e.detail.column === 0) {
      // 如果第一列滚动到第一行
      if (e.detail.value === 0) {

        that.loadData(hours, minute);

      } else {
        that.loadHoursMinute(hours, minute);
      }

      data.multiIndex[1] = 0;
      data.multiIndex[2] = 0;

      // 如果是第2列改变
    } else if (e.detail.column === 1) {

      // 如果第一列为今天
      if (data.multiIndex[0] === 0) {
        if (e.detail.value === 0) {
          that.loadData(hours, minute);
        } else {
          that.loadMinute(hours, minute);
        }
        // 第一列不为今天
      } else {
        that.loadHoursMinute(hours, minute);
      }
      data.multiIndex[2] = 0;

      // 如果是第3列改变
    } else {
      // 如果第一列为'今天'
      if (data.multiIndex[0] === 0) {

        // 如果第一列为 '今天'并且第二列为当前时间
        if (data.multiIndex[1] === 0) {
          that.loadData(hours, minute);
        } else {
          that.loadMinute(hours, minute);
        }
      } else {
        that.loadHoursMinute(hours, minute);
      }
    }
    hours = hours.map(val => {
      return val + ' 点'
    })

    minute = minute.map(val => {
      return val + ' 分'
    })
    data.multiArray[1] = hours;
    data.multiArray[2] = minute;
    this.setData(data);
  },

  loadData: function (hours, minute) {

    var minuteIndex;
    if (currentMinute > 0 && currentMinute <= 10) {
      minuteIndex = 10;
    } else if (currentMinute > 10 && currentMinute <= 20) {
      minuteIndex = 20;
    } else if (currentMinute > 20 && currentMinute <= 30) {
      minuteIndex = 30;
    } else if (currentMinute > 30 && currentMinute <= 40) {
      minuteIndex = 40;
    } else if (currentMinute > 40 && currentMinute <= 50) {
      minuteIndex = 50;
    } else {
      minuteIndex = 60;
    }

    if (minuteIndex == 60) {
      // 时
      for (var i = currentHours + 1; i < 24; i++) {
        hours.push(i);
      }
      // 分
      for (var i = 0; i < 60; i += 10) {
        minute.push(i);
      }
    } else {
      // 时
      for (var i = currentHours; i < 24; i++) {
        hours.push(i);
      }
      // 分
      for (var i = minuteIndex; i < 60; i += 10) {
        minute.push(i);
      }
    }
  },

  loadHoursMinute: function (hours, minute) {
    // 时
    for (var i = 0; i < 24; i++) {
      hours.push(i);
    }
    // 分
    for (var i = 0; i < 60; i += 10) {
      minute.push(i);
    }
  },

  loadMinute: function (hours, minute) {
    var minuteIndex;
    if (currentMinute > 0 && currentMinute <= 10) {
      minuteIndex = 10;
    } else if (currentMinute > 10 && currentMinute <= 20) {
      minuteIndex = 20;
    } else if (currentMinute > 20 && currentMinute <= 30) {
      minuteIndex = 30;
    } else if (currentMinute > 30 && currentMinute <= 40) {
      minuteIndex = 40;
    } else if (currentMinute > 40 && currentMinute <= 50) {
      minuteIndex = 50;
    } else {
      minuteIndex = 60;
    }

    if (minuteIndex == 60) {
      // 时
      for (var i = currentHours + 1; i < 24; i++) {
        hours.push(i);
      }
    } else {
      // 时
      for (var i = currentHours; i < 24; i++) {
        hours.push(i);
      }
    }
    // 分
    for (var i = 0; i < 60; i += 10) {
      minute.push(i);
    }
  },

  bindStartMultiPickerChange: function (e) {
    var that = this;
    var monthDay = that.data.multiArray[0][e.detail.value[0]];
    var hours = that.data.multiArray[1][e.detail.value[1]];
    var minute = that.data.multiArray[2][e.detail.value[2]];
    var globalMonthDay;

    if (monthDay === "今天") {
      var month = date.getMonth() + 1;
      var day = date.getDate();
      monthDay = month + "月" + day + "日";
      globalMonthDay = new Date().getFullYear() + '-' + month + "-" + day
    } else if (monthDay === "明天") {
      var date1 = new Date(date);
      date1.setDate(date.getDate() + 1);
      monthDay = (date1.getMonth() + 1) + "月" + date1.getDate() + "日";
      globalMonthDay = new Date().getFullYear() + '-' + (date1.getMonth() + 1) + "-" + date1.getDate()

    } else {
      var month = monthDay.split("-")[0]; // 返回月
      var day = monthDay.split("-")[1]; // 返回日
      monthDay = month + "月" + day + "日";
      globalMonthDay = new Date().getFullYear() + '-' + month + "-" + day
    }

    var startDate = monthDay + " " + parseInt(hours) + " : " + parseInt(minute);
    var globalStartDate = globalMonthDay + " " + parseInt(hours) + ":" + parseInt(minute);
    that.setData({
      startDate: startDate
    })
    wx.setStorageSync('startDate', startDate)
    app.globalData.friendStartDate = parseInt(new Date(globalStartDate).getTime(globalStartDate)) / 1000;
  },



  // 扫码进入点击进入行程中
  scanBtn() {
    var phoneNumber = wx.getStorageSync('phoneNumber')
    if (!phoneNumber) {
      wx.navigateTo({
        url: '/user_center/pages/login/login',
      })
      return false
    }

    let data = {
      userLongitude: parseFloat(this.data.longitude),
      userLatitude: parseFloat(this.data.latitude),
      startAddress: this.data.startAddress,
      destinationLongitude: parseFloat(this.data.endLongitude) || null,
      destinationLatitude: parseFloat(this.data.endLatitude) || null,
      endAddress: this.data.destination || null,
      driverId: this.data.scanDriverId,
    }

    let header = wx.getStorageSync('header');
    header.channel = 6;
    http.postRequest("/qrCode/createOrder", data, header, res => {
      console.log(res)
      if (res.code === '1') {
        if (res.content.canPlaceOrder) {
          wx.redirectTo({
            url: '/pages/orderService/orderService?from=scan&&scanDriverInfo=' + JSON.stringify(res.content),
          })
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
    }, err => {
      console.log(err)
    })

  },

  getNotice() {
    http.getRequest("/passenger/user/notice", {}, wx.getStorageSync('header'), res => {
      console.log('公告信息', res)
      if (res.code === '1' && res.content.length > 0) {
        this.setData({
          showNotice: true,
          noticeCont: res.content
        })
        app.globalData.reqNotice = false;
      }
    }, err => {
      console.log(err)
    })
  },
  closeNotice() {
    this.setData({
      showNotice: false,
    })
  },
  toOut(e) {
    let href = e.currentTarget.dataset.href;
    console.log(href)
    if (href) {
      wx.navigateTo({
        url: '../out/out?href=' + href,
      })
    }
  },
  toMsg() {
    wx.navigateTo({
      url: '/pages/notice/notice',
    })
  },
  closeCoupon() {
    this.setData({
      showCoupon: false
    })
  },
  couponCheck() {
    wx.redirectTo({
      url: '/user_center/pages/coupon/coupon',
    })
  },

  // 点击乘车人数
  clickPerNum(e){
    let num = e.currentTarget.dataset.num;
    this.setData({
      lineCurPerNum:num
    })
  },

  // 远程选择定位城市
  chooseLineCity(){
    wx.navigateTo({
      url: '/pages/searchCity/searchCity?urlFrom=3',
    })
  }
})