import http from '../../utils/http';
import {
  Base64
} from 'js-base64';
let mqtt = require('../../utils/mqtt.js');
let client = null;
let d30 = new Date().getTime() + 1800000;
let date = new Date(d30);
let weekday = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
let currentHours = date.getHours();
let currentMinute = date.getMinutes();
let toUserTimer = null;
import qqmapsdk from '../../libs/qqMap';
let SCREEN_WIDTH = 750;
let RATE = wx.getSystemInfoSync().screenHeight / wx.getSystemInfoSync().screenWidth;
const app = getApp();
let mqtt1013timer = null;
let mqtt1005timer = null;
let curPageOnShow = false;

Page({
  data: {
    fromScan: false,
    ScreenTotalW: SCREEN_WIDTH,
    ScreenTotalH: SCREEN_WIDTH * RATE - 440, //地图高度自适应 508 = 导航 + footer
    navScrollLeft: 0,
    currentTab: 0,
    isLoading: true,
    color: "#cccccc",
    destination: '',
    startAddress: '',
    longitude: null,
    latitude: null,
    endLongitude: null,
    endLatitude: null,
    scale: 14,
    markers: [],
    hideNowTab: false,
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
      ['今天', '明天', '后天'],
      [0, 1, 2, 3, 4, 5, 6],
      [0, 10, 20]
    ],
    multiIndex: [0, 0, 0],
    showNotice: false,
    noticeCont: null,
    showCoupon: false,
    driverImg: 'http://scapp.xysc16.com/upload/wmp/imgs/driver.png',
    reqRecoverOrder: 0,
    // 远程
    fixedLine: false,
    loading: false,
    noMore: false,
    usedLineList: null,
    allLineList: null,
    lineCurrentPage: 1,
    hasCityLine: true,
    // 包车
    exclusiveCar: false,
    EXC_city: '',
    EXC_currentPage: 1,
    EXC_lineList: null,
    dateReqInfo: null,
    friendsDriverType: null,
    hideCityNoService: true,
    currentBusinessType: 1,
    integralMqttData: null,
    showVipProgress: false,
    mqttData1005:null,
  },

  onLoad: async function (opt) {
    console.log('indexopt:', opt)
    await this.getCurrentLocation();


    // 预约单跳转
    if (opt.hasYuYue) {
      if (opt.hasYuYue == 1) {
        wx.showModal({
          content: '预约订单已提交，请等待司机确认',
          showCancel: false,
        })
      }
      if (opt.friendBusinessType == 10) {
        this.setData({
          currentTab: 3
        })
      } else if (opt.friendBusinessType == 5) {
        this.setData({
          isDriverFriends: true,
          currentTab: 4,
        })
        this.reqFriendsList();
      }
    }
    this.setData({
      scanDriverId: app.globalData.scanDriverId
    })

    // 扫码进入
    if (opt.driver) {
      if (opt['amp;businesstype'] === '1' || opt.businesstype === '1') {
        this.setData({
          fromScan: true,
        })
        app.globalData.scanDriverId = opt.driver
        this.setData({
          scanDriverId: opt.driver
        })
      } else if (opt['amp;businesstype'] === '2' || opt.businesstype === '2') {
        wx.redirectTo({
          url: '/pages/addFriends/addFriends?scanId=' + opt.driver,
        })
      }

    }

    if (opt.des === 'scan') {
      this.setData({
        fromScan: true,
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
      wx.setNavigationBarTitle({
        title: '好友司机',
      })
      this.setData({
        fromFriendUseCart: true,
        driverFriend: JSON.parse(opt.driverFriend),
        canAppointment: true,
        canChooseStatus: true,
        currentTab: 4,
        friendsDriverType: opt.driverType,
        ScreenTotalH: SCREEN_WIDTH * RATE - 400,
        currentBusinessType:5
      })
      this.dateReq();
      app.globalData.friendDriver = null;
      app.globalData.friendDriver = this.data.driverFriend;
      if (this.data.driverFriend.fromOffline) {
        app.globalData.nowOrFutureId = 2;
        this.setData({
          onlyAppointmentTime: true,
          changeTab: 2,
          onlyNowTime: false,
          hideNowTab: true
        })
      } else {
        this.setData({
          onlyAppointmentTime: false,
          changeTab: 1,
          onlyNowTime: true
        })
      }
      console.log('a')
    } else {
      this.setData({
        fromFriendUseCart: false,
        driverFriend: null,
        canAppointment: false,
        canChooseStatus: false
      })
    }

    if (opt['amp;from'] === 'scanFullToLine' || opt.from === 'scanFullToLine') {
      this.setData({
        currentTab: 1
      })
      if (this.data.currentTab === 1) {
        this.setData({
          fixedLine: true
        })
        app.globalData.lineStartAddress = '';
        app.globalData.lineStartLat = '';
        app.globalData.lineStartLng = '';
        app.globalData.lineEndAddress = '';
        app.globalData.lineEndLat = '';
        app.globalData.lineEndLng = '';
        await this.getCurrentLocation();
        if (app.globalData.lineCityCode) {
          this.setData({
            lineCurrentPage: 1
          })
          this.remoteLineList(false)
        } else {
          console.log(app.globalData)
        }
        this.setData({
          fixedLine: true,
          currentCity: app.globalData.lineStartCity,
        })
      }
    }else if(opt['amp;from'] === 'scanFullTaxi' || opt.from === 'scanFullTaxi'){
      this.setData({
        currentTab: 3
      })
    }

    if (this.data.currentTab == 0 && !this.data.fromFriendUseCart) {
      console.log(1,this.data.currentTab)
      app.globalData.nowOrFutureId = null;
      app.globalData.friendDriver = null;
      app.globalData.friendStartDate = null;
    }

    if (app.globalData.nowOrFutureId === null) {
      wx.removeStorageSync('startDate')
    }
  },
  onShow() {
    console.log('onShow in index')
    this.getUserLocation()
    
    var _this = this;
    var add = ''
    if (app.globalData.strAddress) {
      add = app.globalData.strAddress
    } else {
      add = app.globalData.originAddress
    }
    this.setData({
      startAddress: add,
      currentCity: app.globalData.lineStartCity,
      EXC_city: app.globalData.exclusiveCarStartCity,
    })

    // if (this.data.currentTab == 0 && !this.data.fromFriendUseCart) {
    //   console.log(1,this.data.currentTab)
    //   app.globalData.nowOrFutureId = null;
    //   app.globalData.friendDriver = null;
    //   app.globalData.friendStartDate = null;
    // }

    // if (app.globalData.nowOrFutureId === null) {
    //   wx.removeStorageSync('startDate')
    // }

    wx.checkSession({
      success: () => {
        if (!_this.data.notLogin) {
          if (app.globalData.reqNotice && wx.getStorageSync('token') && !wx.getStorageSync('needLogin')) {
            _this.getNotice();
          }
          if (app.globalData.originLongitude && wx.getStorageSync('token') && !wx.getStorageSync('needLogin')) {
            _this.reqFriendsList()
          }
        }
      }
    })
    // if (!this.data.fromScan) {
    //   //每次返回主页清空目的地
    //   app.globalData.destinationCity = ''
    //   app.globalData.destination = ''
    //   app.globalData.endLatitude = ''
    //   app.globalData.endLongitude = ''
    // }

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

    // 远程
    this.setData({
      lineCurrentPage: 1,
      usedLineList: null,
      allLineList: null,
    })

    if (this.data.currentTab == 1 && app.globalData.lineCityCode) { // 远程
      this.remoteLineList(false)
    } else if (this.data.currentTab == 2 && app.globalData.exclusiveCarCityCode) { // 包车
      this.EXC_list(false)
    }

    app.globalData.EXCStartAddress = null;
    app.globalData.EXCStartLat = null;
    app.globalData.EXCStartLng = null;

    curPageOnShow = true;

    if(app.globalData.clientDriving) this.mqttClient();

    if (wx.getStorageSync('phoneNumber')) {
      this.reqHasOrder();
    }
  },

  onReady: function () {
    this.mapCtx = wx.createMapContext("indexMap"); // 地图组件的id
  },
  onHide() {
    app.globalData.strAddress = this.data.startAddress;
    app.globalData.strLatitude = this.data.latitude;
    app.globalData.strLongitude = this.data.longitude;
    // app.globalData.clientDriving = null;
    curPageOnShow = false;
  },

  onUnload(){
    console.log('onUnload in index')
    curPageOnShow = false;
    // if(client) client.end();
    // if (app.globalData.clientDriving) {
    //   app.globalData.clientDriving.unsubscribe(app.globalData.pubTopic, (err) => {
    //     if (!err) {
    //       console.log('退订成功')
    //     } else console.log('请先连接服务器')
    //   })
    // }
    // app.globalData.clientDriving = null;
  },

  // 转发
  onShareAppMessage(e) {
    return {
      title: '峡市约车',
      imageUrl: "http://scapp.xysc16.com/upload/wmp/imgs/share.png",
      path: "/pages/index/index",
      success: (res) => {
        console.log("转发成功", res);
      },
      fail: (res) => {
        console.log("转发失败", res);
      }
    }
  },

  //切换导航 获取不同计价方式
  async switchNav(event) {
    let item = event.currentTarget.dataset.item;
    console.log(item)
    if(item.businessType == 5){
      this.setData({
        currentBusinessType: 5,
        hideCityNoService:true
      })
    }else if(item.businessType != 6 && item.businessType != 9){
      await this.checkCityStatus(item.businessType);
      this.setData({
        currentBusinessType: item.businessType,
      })
    }
    this.setData({
      cart: item.name,
      currentTab: item.id,
      
      isLoading: true,
    })

    // 网约车
    if (item.id === 0 || item.id === 3) {
      app.globalData.lineStartAddress = '';
      app.globalData.lineEndAddress = '';
    }

    if (this.data.integralMqttData && item.id === 0) {
      this.setData({
        showVipProgress: true
      })
    } else {
      this.setData({
        showVipProgress: false
      })
    }

    // 远程
    if (item.id === 1) {
      this.setData({
        fixedLine: true
      })
      app.globalData.lineStartAddress = '';
      app.globalData.lineStartLat = '';
      app.globalData.lineStartLng = '';
      app.globalData.lineEndAddress = '';
      app.globalData.lineEndLat = '';
      app.globalData.lineEndLng = '';
      await this.getCurrentLocation();
      // if (wx.getStorageSync('token')) {
      if (app.globalData.lineCityCode) {
        this.setData({
          lineCurrentPage: 1
        })
        this.remoteLineList(false)
      } else {
        console.log(app.globalData)
      }
      this.setData({
        fixedLine: true,
        currentCity: app.globalData.lineStartCity,
      })
    } else {
      this.setData({
        fixedLine: false,
      })
    }

    // 包车
    if (item.id === 2) {
      this.setData({
        exclusiveCar: true,
        EXC_city: app.globalData.exclusiveCarStartCity,
      })
      this.setData({
        EXC_currentPage: 1
      })
      this.EXC_list(false);
    } else {
      this.setData({
        exclusiveCar: false
      })
    }

    // 好友司机
    if (item.id === 4) {
      this.setData({
        isDriverFriends: true
      })
      if (wx.getStorageSync('token')) this.reqFriendsList();
      // 非好友司机
    } else {
      this.setData({
        isDriverFriends: false,
        canChooseStatus: false,
        fromFriendUseCart: false,
      })
      if (this.data.currentTab != 4 && !this.data.fromFriendUseCart) {
        console.log(2)
        app.globalData.nowOrFutureId = null;
        app.globalData.friendDriver = null;
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
    let _this = this;
    http.postRequest("/v1/carOrder/passenger/checkRecoverOrder", '', wx.getStorageSync('header'), res => {
      if (res.code === '1' && res.content.state === 1) {
        this.setData({
          reqRecoverOrder: this.data.reqRecoverOrder++
        })
        if (this.data.reqRecoverOrder <= 1 && this.data.currentTab != 4) {
          wx.showModal({
            content: "您有一个尚未完成的订单，是否进入该订单",
            success(res) {
              if (res.confirm) {
                if(_this.data.mqttData1005){
                  _this.toDrivingEnd()
                }else{
                  wx.redirectTo({
                    url: '/driving_status/pages/orderService/orderService?from=hasNoOrder',
                  })
                }
              } 
            }
          })
        }
      } else if (res.code === '100' || res.code === '101') {
        this.setData({
          notLogin: true
        })
      }
      if (!this.data.fromFriendUseCart) {
        wx.setNavigationBarTitle({
          title: '峡市约车',
        })
      }
    }, err => {
      console.log(err)
      if (!this.data.fromFriendUseCart) {
        wx.setNavigationBarTitle({
          title: '峡市约车',
        })
      }
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
    http.getRequest("/v1/passenger/friendDriver/list", data, wx.getStorageSync('header'), res => {
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
    http.postRequest("/v1/passenger/friendDriver/attentionOrCancel?driverNo=" + driverNo, '', wx.getStorageSync('header'), res => {
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
          console.log('location1:', addressRes);
          let res = addressRes.result;
          app.globalData.strLatitude = res.location.lat;
          app.globalData.strLongitude = res.location.lng;
          app.globalData.strAddress = res.formatted_addresses.recommend;
          app.globalData.startCity = res.address_component.city;
          app.globalData.startCityAdcode = res.ad_info.adcode;
          app.globalData.lineStartCity = res.address_component.city;
          if (!app.globalData.exclusiveCarStartCity) {
            app.globalData.exclusiveCarStartCity = res.address_component.city;
            app.globalData.exclusiveCarCityCode = res.ad_info.city_code.substr(3);
          }

          if (_self.data.currentTab == 1 && app.globalData.lineCityCode == res.ad_info.city_code.substr(3)) {
            _self.remoteLineList(false)
          }
          app.globalData.lineCityCode = res.ad_info.city_code.substr(3);
          wx.setStorageSync('areaCodeIndex', res.ad_info.adcode)
          _self.setData({
            latitude: res.location.lat,
            longitude: res.location.lng,
            startAddress: res.formatted_addresses.recommend,
            scale: 16,
          })
          if(_self.data.currentTab == 0 || _self.data.currentTab == 3){
            _self.checkCityStatus(_self.data.currentBusinessType);
          }
          _self.navNumReq(app.globalData.startCityAdcode);
            
        },
        fail() {
          _self.setData({})
          console.log("获取位置失败");
        }
      })
    } else {
      this.getCurrentLocation()
    }
  },

  getCurrentLocation() {
    let _self = this;
    return new Promise((resolve, reject) => {
      wx.getLocation({
        type: 'gcj02',
        success(res) {
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
              console.log('location2:', addressRes);
              let obj = addressRes.result.address_component

              app.globalData.originCity = obj.city; //市
              app.globalData.originAddress = addressRes.result.formatted_addresses.recommend;
              app.globalData.originLongitude = _longitude;
              app.globalData.originLatitude = _latitude;
              app.globalData.strLongitude = _longitude;
              app.globalData.strLatitude = _latitude;
              app.globalData.startCity = obj.city;
              app.globalData.startCityAdcode = addressRes.result.ad_info.adcode;
              app.globalData.lineStartCity = obj.city;
              if (!app.globalData.exclusiveCarStartCity) {
                app.globalData.exclusiveCarStartCity = obj.city;
                app.globalData.exclusiveCarCityCode = addressRes.result.ad_info.city_code.substr(3);
              }
              if (_self.data.currentTab == 1 && app.globalData.lineCityCode == addressRes.result.ad_info.city_code.substr(3)) {
                _self.remoteLineList(false)
              }
              app.globalData.lineCityCode = addressRes.result.ad_info.city_code.substr(3);
              wx.setStorageSync('areaCodeIndex', addressRes.result.ad_info.adcode)
              if (wx.getStorageSync('token') && !wx.getStorageSync('needLogin')) _self.reqFriendsList()

              _self.setData({
                latitude: addressRes.result.location.lat,
                longitude: addressRes.result.location.lng,
                startAddress: addressRes.result.formatted_addresses.recommend,
                currentCity: app.globalData.lineStartCity,
                EXC_city: app.globalData.exclusiveCarStartCity,
              })
              if(_self.data.currentTab == 0 || _self.data.currentTab == 3){
                _self.checkCityStatus(_self.data.currentBusinessType);
              }
              _self.navNumReq(app.globalData.startCityAdcode);
              resolve();
            },
            fail() {
              console.log("获取位置失败");
              reject()
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
                })
              }
            }
          })
        }
      })
    })
  },

  //改变地图中心位置
  bindregionchange: function (e) {
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
            console.log('location3:', res);
            let adRes = res.result;
            app.globalData.strLongitude = adRes.location.lng;
            app.globalData.strLatitude = adRes.location.lat;
            app.globalData.strAddress = adRes.formatted_addresses.recommend;
            app.globalData.startCity = adRes.address_component.city;
            app.globalData.startCityAdcode = adRes.ad_info.adcode;

            if(_this.data.currentTab == 0 || _this.data.currentTab == 3) {
                _this.checkCityStatus(_this.data.currentBusinessType);
              }
            _this.setData({
              latitude: adRes.location.lat,
              longitude: adRes.location.lng,
              startAddress: adRes.formatted_addresses.recommend
            })
          },
        });
      }
    })
  },

  //重回当前位置
  getMyLocation() {
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
            console.log('location4:', res1);
            let adRes = res1.result;
            app.globalData.strLongitude = adRes.location.lng;
            app.globalData.strLatitude = adRes.location.lat;
            app.globalData.strAddress = adRes.formatted_addresses.recommend;
            app.globalData.startCity = adRes.address_component.city;
            app.globalData.startCityAdcode = adRes.ad_info.adcode;
            _self.setData({
              latitude: adRes.location.lat,
              longitude: adRes.location.lng,
              startAddress: adRes.formatted_addresses.recommend
            })
            if(_self.data.currentTab == 0 || _self.data.currentTab == 3){
              _self.checkCityStatus(_self.data.currentBusinessType);
            }
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
    console.log(3)
    app.globalData.nowOrFutureId = this.data.changeTab;
    if (e.currentTarget.dataset.current == 1) {
      wx.removeStorageSync('startDate');
      this.setData({
        onlyNowTime: true
      })
    } else {
      wx.setStorageSync('startDate', this.data.startDate)
      this.setData({
        onlyNowTime: false
      })
    }
  },


  showUser() {
    var phoneNumber = wx.getStorageSync("phoneNumber");
    if (toUserTimer) clearTimeout(toUserTimer)
    toUserTimer = setTimeout(() => {
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
        },
      })
    }, 500);


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
    wx.removeStorageSync('startDate');
    let driverFriend;
    let item = e.currentTarget.dataset.item;
    if (item.driverType == 1 || item.driverType == 6) {
      if (item.state != 0) {
        driverFriend = {
          name: item.driverName,
          cart_num: item.carNumber,
          cart_id: item.driverId,
          cart_no: item.driverNo,
          fromOffline: true,
        }
      } else {
        driverFriend = {
          name: item.driverName,
          cart_num: item.carNumber,
          cart_id: item.driverId,
          cart_no: item.driverNo
        }
      }
      app.globalData.nowOrFutureId = 1;
      wx.navigateTo({
        url: '/pages/index/index?driverFriend=' + JSON.stringify(driverFriend) + '&driverType=' + item.driverType,
      })
    } else {
      wx.showToast({
        title: `${item.driverTypeName}暂不支持好友司机服务`,
        icon: 'none'
      })
    }
  },

  callPhone(e) {
    wx.makePhoneCall({
      phoneNumber: e.currentTarget.dataset.phone,
      success() {
        console.log('拨打成功')
      }
    })
  },

  addFriends() {
    wx.navigateTo({
      url: '/pages/addFriends/addFriends',
    })
  },

  // 时间限制请求
  dateReq() {
    let url = '/v2/passenger/charteredCar/getTime?businessType=5&driverType=' + this.data.friendsDriverType;
    http.postRequest(url, '', wx.getStorageSync('header'), res => {
      this.setData({
        dateReqInfo: res.content
      })
    }, err => {
      console.log(err)
    })
  },

  // 预约日期
  pickerTap: function () {
    let d = new Date().getTime() + (this.data.dateReqInfo.appointmentTime * 60000);
    date = new Date(d);

    let day1 = (date.getMonth() + 1) + "月" + date.getDate() + "日" + ' ' + '今天';
    let day2 = (new Date(date.getTime() + 24 * 3600000).getMonth() + 1) + "月" + new Date(date.getTime() + 24 * 3600000).getDate() + "日" + ' ' + '明天';
    let day3 = (new Date(date.getTime() + 48 * 3600000).getMonth() + 1) + "月" + new Date(date.getTime() + 48 * 3600000).getDate() + "日" + ' ' + '后天';

    var monthDay = [day1, day2, day3];
    var hours = [];
    var minute = [];

    currentHours = date.getHours();
    currentMinute = date.getMinutes();

    // 月-日
    let maxDate = this.data.dateReqInfo.appointmentDay;
    if (maxDate >= 4) {
      for (var i = 3; i <= maxDate - 1; i++) {
        var date1 = new Date(date);
        date1.setDate(date.getDate() + i);
        var md = (date1.getMonth() + 1) + "月" + date1.getDate() + "日" + " " + weekday[date1.getDay()];
        monthDay.push(md);
      }
    } else if (maxDate == 2) {
      monthDay = ['今天', '明天'];
    } else if (maxDate == 1) {
      monthDay = ['今天'];
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
    let d = new Date().getTime() + (this.data.dateReqInfo.appointmentTime * 60000);
    date = new Date(d);

    var that = this;

    var monthDay = ['今天', '明天', '后天'];
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
    let start = this.data.dateReqInfo.ridingTimeStart.split(':');
    let end = this.data.dateReqInfo.ridingTimeEnd.split(':');
    // 时
    for (var i = parseInt(start[0]); i <= parseInt(end[0]); i++) {
      hours.push(i);
    }
    // 分
    for (var i = parseInt(start[1]); i <= parseInt(end[1]); i += 10) {
      minute.push(i);
    }
  },

  loadMinute: function (hours, minute) {
    var minuteIndex;
    let end = this.data.dateReqInfo.ridingTimeEnd.split(':');
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
      for (var i = currentHours + 1; i <= parseInt(end[0]); i++) {
        hours.push(i);
      }
    } else {
      // 时
      for (var i = currentHours; i <= parseInt(end[0]); i++) {
        hours.push(i);
      }
    }
    // 分
    for (var i = 0; i <= parseInt(end[1]); i += 10) {
      minute.push(i);
    }
  },

  bindStartMultiPickerChange: function (e) {
    var that = this;
    let d = new Date().getTime() + (this.data.dateReqInfo.appointmentTime * 60000);
    date = new Date(d);
    var monthDay = that.data.multiArray[0][e.detail.value[0]];
    var hours = that.data.multiArray[1][e.detail.value[1]];
    var minute = that.data.multiArray[2][e.detail.value[2]];
    var globalMonthDay;

    if (monthDay.split(' ')[1] === "今天") {
      var month = date.getMonth() + 1;
      var day = date.getDate();
      monthDay = month + "月" + day + "日";
      globalMonthDay = date.getFullYear() + '-' + month + "-" + day
    } else if (monthDay.split(' ')[1] === "明天") {
      var date1 = new Date(date);
      date1.setDate(date.getDate() + 1);
      monthDay = (date1.getMonth() + 1) + "月" + date1.getDate() + "日";
      globalMonthDay = date.getFullYear() + '-' + (date1.getMonth() + 1) + "-" + date1.getDate()

    } else if (monthDay.split(' ')[1] === "后天") {
      var date2 = new Date(date);
      date2.setDate(date.getDate() + 2);
      monthDay = (date2.getMonth() + 1) + "月" + date2.getDate() + "日";
      globalMonthDay = date.getFullYear() + '-' + (date2.getMonth() + 1) + "-" + date2.getDate()

    } else {
      var month = monthDay.split("月")[0]; // 返回月
      var day = monthDay.split("月")[1].split("日")[0]; // 返回日
      globalMonthDay = date.getFullYear() + '-' + month + "-" + day
    }
    let resHours = parseInt(hours) < 10 ? '0' + parseInt(hours) : parseInt(hours);
    let resMinute = parseInt(minute) < 10 ? '0' + parseInt(minute) : parseInt(minute);
    var startDate = monthDay + " " + resHours + " : " + resMinute;
    var globalStartDate = globalMonthDay + " " + resHours + ":" + resMinute;
    console.log(startDate)
    that.setData({
      startDate: startDate
    })
    wx.setStorageSync('startDate', startDate)
    app.globalData.friendStartDate = parseInt(new Date(globalStartDate).getTime(globalStartDate));
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
    http.postRequest("/v1/qrCode/createOrder", data, header, res => {
      console.log(res)
      if (res.code === '1') {
        if (res.content.canPlaceOrder) {
          wx.redirectTo({
            url: '/driving_status/pages/orderService/orderService?from=scan&&scanDriverInfo=' + JSON.stringify(res.content),
          })
        } else {
          wx.showModal({
            content: "您有一个尚未完成的订单，是否进入该订单",
            success(res) {
              if (res.confirm) {
                wx.redirectTo({
                  url: '/driving_status/pages/orderService/orderService?from=hasNoOrder',
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
    http.getRequest("/v1/passenger/user/notice", {}, wx.getStorageSync('header'), res => {
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
  toStarting() {
    if (this.data.currentTab == 3) {
      wx.navigateTo({
        url: '/pages/starting/starting?from=taxi',
      })
    } else {
      wx.navigateTo({
        url: '/pages/starting/starting',
      })
    }

  },

  // 点击选择终点
  toDestination(e) {
    console.log(app.globalData)
    if (this.data.hideCityNoService) {
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
          if (this.data.currentTab == 3) { // 出租车
            wx.navigateTo({
              url: '/pages/destination/destination?from=taxi&friendsDriverType=' + this.data.friendsDriverType,
            })
          } else if (this.data.currentTab == 4) { // 好友司机
            wx.redirectTo({
              url: '/pages/destination/destination?friendsDriverType=' + this.data.friendsDriverType,
            })
          } else {
            wx.navigateTo({
              url: '/pages/destination/destination?friendsDriverType=' + this.data.friendsDriverType,
            })
          }
          this.setData({
            friendsDriverType: null
          })
        }
      }
    }
  },

  //到达底部
  scrollToLower: function (e) {
    console.log(e)
    if (!this.data.loading && !this.data.noMore) {
      if (this.data.fixedLine) { // 远程
        this.setData({
          loading: true,
          lineCurrentPage: this.data.lineCurrentPage + 1
        });
        this.remoteLineList(true);
      } else if (this.data.exclusiveCar) { // 包车
        this.setData({
          loading: true,
          EXC_currentPage: this.data.EXC_currentPage + 1
        });
        this.EXC_lineList(true);
      }
    }
  },

  // 远程站点列表
  remoteLineList(isPage) {
    const _this = this;
    http.postRequest('/v2/passenger/remote/getBaseLineListByCityCode?cityCode=' + app.globalData.lineCityCode + '&pageSize=30&currentPage=' + this.data.lineCurrentPage, '', wx.getStorageSync('header'), res => {
      this.setData({
        loading: false,
        fixedLine: true
      })
      let historyLine = res.content.filter(item => item.type === 0);
      let allLine = res.content.filter(item => item.type === 1);
      if (isPage) {
        if (allLine.length === 0) {
          _this.setData({
            noMore: true
          })
        }
        _this.setData({
          allLineList: this.data.allLineList.concat(allLine),
          hasCityLine: true
        })
      } else {
        if (allLine.length === 0) {
          _this.setData({
            hasCityLine: false
          })
        } else {
          _this.setData({
            usedLineList: historyLine,
            allLineList: allLine,
            hasCityLine: true
          })
        }
      }
    }, err => {
      console.log(err)
    })
  },

  // 远程选择城市
  chooseLineCity() {
    wx.navigateTo({
      url: '/pages/searchCity/searchCity?urlFrom=3',
    })
  },

  // 远程选择线路
  chooseStation(e) {
    let item = e.currentTarget.dataset.item;
    console.log('远程站点选择：', item)
    if (item) {
      wx.navigateTo({
        url: '/pages/remoteLineCallCar/remoteLineCallCar?lineItem=' + JSON.stringify(item),
      })
    }
  },

  // 包车选择城市
  chooseEXCCity() {
    wx.navigateTo({
      url: '/pages/searchCity/searchCity?urlFrom=4',
    })
  },

  // 包车列表
  EXC_list(isPage) {
    let url = '/v2/passenger/charteredCar/getLineListByCityCode?cityCode=' + app.globalData.exclusiveCarCityCode + '&pageSize=20&currentPage=' + this.data.EXC_currentPage;
    http.postRequest(url, '', wx.getStorageSync('header'), res => {

      this.setData({
        loading: false,
        exclusiveCar: true
      })
      if (isPage) {
        if (res.content.length === 0) {
          this.setData({
            noMore: true
          })
        }
        this.setData({
          EXC_lineList: this.data.EXC_lineList.concat(res.content),
          hasCityLine: true
        })
      } else {
        if (res.content.length === 0) {
          this.setData({
            noMore: true,
            hasCityLine: false
          })
        } else {
          this.setData({
            EXC_lineList: res.content,
            hasCityLine: true
          })
        }
      }
    }, err => {
      console.log(err)
    })
  },

  // 包车选择线路
  chooseExclusiveCarLine(e) {
    let item = e.currentTarget.dataset.item;
    wx.navigateTo({
      url: '/pages/exclusiveCar/exclusiveCar?lineInfo=' + JSON.stringify(item),
    })
  },

  // 查询城市业务是否开通
  checkCityStatus(businessType) {
    let _this = this;
    if (app.globalData.startCityAdcode && wx.getStorageSync('token')) {
      let driverId = 0;
      if(businessType == 5 && this.data.driverFriend){
        driverId = this.data.driverFriend.cart_id;
      }
      if((businessType == 5 && this.data.driverFriend) || businessType != 5){
        let url = "/v2/passenger/cityAreaBusinessManager/checkOpenCityBusiness?areaCode=" + app.globalData.startCityAdcode + "&businessType=" + businessType+"&driverId="+driverId;
        return new Promise((resolve, reject) => {
          http.postRequest(url, '', wx.getStorageSync('header'), res => {
            if (res.content.isOpen === 0) {
              _this.setData({
                hideCityNoService: false
              })
              app.globalData.hideCityNoService = false;
            } else {
              _this.setData({
                hideCityNoService: true
              })
              app.globalData.hideCityNoService = true;
            }
            resolve(res.content.isOpen);
          }, err => {
            console.log(err);
            reject();
          })
        })
      }
    }
  },

  mqttClient() {
    
    app.globalData.clientDriving.on('message', (topic, message, packet) => {
      let msg = JSON.parse(Base64.decode(message.toString()));
      if(!curPageOnShow){
        console.log("收到mqtt in index：return");
        return;
      }
      if (msg && JSON.stringify(msg.data) !== '{}') {
        console.log("收到mqtt in index：", msg.code);
        if (msg.code == '1009') { 
          this.orderRecover();
        } else if(msg.code == '1005'){
          this.setData({
            mqttData1005:msg.data
          })
          this.toDrivingEnd();
        } else if (msg.code == '1013') {
          if (mqtt1013timer) clearTimeout(mqtt1013timer);
          mqtt1013timer = setTimeout(() => {
            let integralMqttData = msg.data;
            if (integralMqttData.describe) {
              this.setData({
                showVipProgress: false
              })
              wx.showModal({
                content: integralMqttData.describe,
                showCancel: false,
                confirmColor: "#FF8008",
                confirmText: "确定",
              })
            } else {
              if(this.data.currentTab == 0){
                let orderPercent = (integralMqttData.orderNumber / integralMqttData.standardOrderNumber).toFixed(2)*100;
                let integralPercent = (integralMqttData.integralNumber / integralMqttData.standardIntegralNumber).toFixed(2)*100;
                // let orderPercent = parseFloat(integralMqttData.orderPercent)*100;
                // let integralPercent = parseFloat(integralMqttData.integralPercent)*100;
                integralMqttData.orderPercent = orderPercent;
                integralMqttData.integralPercent = integralPercent;
                this.setData({
                  showVipProgress: true,
                  integralMqttData,
                  // orderPercent,
                  // integralPercent,
                })
              }
            }
          }, 500);
        }
      }
    })

  },

  toDrivingEnd(){
    if (mqtt1005timer) clearTimeout(mqtt1005timer);
    mqtt1005timer = setTimeout(() => {
      wx.removeStorageSync('lineOrderNo')
      let from;
      if (this.data.mqttData1005.businessType == 6 || this.data.mqttData1005.businessType == 7) {
        from = 'fixedLine';
      } else if (this.data.mqttData1005.businessType == 9) {
        from = 'exclusiveCar';
      } else if (this.data.mqttData1005.businessType == 1) {
        from = 'callCar';
      } else if (this.data.mqttData1005.businessType == 10) {
        from = 'taxi';
      }else if(this.data.mqttData1005.businessType == 5){
        if(this.data.mqttData1005.driverType == 6){
          from = 'taxi';
        }
      }
      wx.redirectTo({
        url: '/driving_status/pages/travalEnd/travalEnd?resData=' + JSON.stringify(this.data.mqttData1005) + '&from=' + from,
      })
    }, 500);
  },

  // 订单恢复
  orderRecover() {
    if(wx.getStorageSync('token')){
      http.postRequest("/v1/carOrder/passenger/recoverOrder", '', wx.getStorageSync('header'), res => {
        if (res.success) {
          console.log('recoverOrder');
        }
      }, err => {
        console.log(err)
      })
    }
  },

  navNumReq(code) {
    let navData = [{
      "id": 0,
      "businessType": 1,
      "name": "网约车",
    },
    {
      "id": 1,
      "businessType": 6,
      "name": "远程",
    },
    {
      "id": 2,
      "businessType": 9,
      "name": "包车",
    },
    {
      "id": 3,
      "businessType": 10,
      "name": "出租车",
    },
    {
      "id": 4,
      "businessType": 5,
      "name": "好友司机",
    }
  ]
    this.setData({
       navData
    })
    http.postRequest("/v2/passenger/cityAreaBusinessManager/getCityAreaBusinessManagerByCityCode?cityCode=" + code, "", wx.getStorageSync('header'), res => {
      if (res.content.length > 0) {
        let tempArr = [],
          resArr = [];
        for (let i = 0; i < res.content.length; i++) {
          tempArr = navData.filter(val => {
            return val.businessType == res.content[i];
          })
          resArr = resArr.concat(tempArr);
        }
        this.setData({
          navData:resArr
        })
      }
    }, err => {
      console.log(err)
    })
  },
  
  toMyIntegral() {
    wx.navigateTo({
      url: '/user_center/pages/integral/integral',
    })
  },
})