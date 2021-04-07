import qqmapsdk from '../../../libs/qqMap';
import http from '../../../utils/http';
const BASE_URL = require('../../../utils/BASE_URL').BASE_URL;
import {
  Base64
} from 'js-base64';

const app = getApp();
let linePayTimer = null; // 防抖
let mqtt1005timer = null; // 防抖
let mqtt1010timer = null; // 防抖
let mqtt1011timer = null; // 防抖
let mqtt1008timer = null; // 防抖
let exceedGlb = null; // 超时
let curPageOnShow = false;

Page({
  data: {
    isload:true,
    fromCall: false,
    hasMqttMsg: false,
    mapShowLocation: false,
    latitude: 0,
    longitude: 0,
    controls: [],
    markers: [],
    points: [],
    driver: {},
    startAddress: '',
    // modalHidden: true,
    countTimer: null,
    isWaiting: true,
    count: 0,
    time: '00:00',
    title_tips: '30秒无应答优先为您派单',
    distance: 0,
    pathTime: 0,
    cancleCont: '亲，司机快到了，要不要再等等呢?',
    hideWalkTips: true,
    responseEndLat: 0,
    responseEndLng: 0,
    totPrice: 0,
    descPrice: 0,
    pathTips: false,
    hasSit: false,
    driverImg: 'http://scapp.xysc16.com/upload/wmp/imgs/driver.png',
    startDate: '',
    firBtnWidth: '50%',
    secBtnWidth: '100%',
    fixedLine: false, // 远程
    lineTips: '',
    linePayText: '付款',
    desName: '', // 远程终点名称
    fromLineScan: false,
    showCancleBtn: true,
    msgExceedTimeInfo: null,
    msg1012: null,
    exclusiveCar: false, // 包车
    EXC_dateNum: null, // 包车剩余天数
    EXC_orderInfo: null, // 包车信息
    EXC_showDistance: false, // 包车行程中显示时长/里程
    EXC_drivingWaiting: false, // 包车行程等待中
    exceedWaitingTime: false, // 包车行程等待中超时
    exceedWaitingTimeNum: '', // 包车行程等待中超时时间
    taxi: false,
    isFriend: false,
    fromFriendUseCart: false,
    taxi1004counter : 0, // 出租车1004
    taxi1006counter : 0, // 出租车1006
    showIntegral:false,
  },

  async onLoad(opt) {
    this.mapCtx = wx.createMapContext("map");
    let _this = this;
    console.log('进入行程参数：', opt)
    this.setData({
      latOri: app.globalData.originLatitude,
      lngOri: app.globalData.originLongitude,
      latStr: app.globalData.strLatitude,
      lngStr: app.globalData.strLongitude,
      latEnd: app.globalData.endLatitude,
      lngEnd: app.globalData.endLongitude,
      opt,
    })
    let callDriverInfo;
    if (opt.callDriverInfo) {
      callDriverInfo = JSON.parse(opt.callDriverInfo);
      if (callDriverInfo.businessType == 5) {
        wx.setNavigationBarTitle({
          title: '等待接单',
        })
        this.setData({
          isFriend: true,
          hideWalkTips: true,
          isWaiting: true,
          fromFriendUseCart: true,
          friendDriver: app.globalData.friendDriver,
        })
        app.globalData.friendDriver = null;
      }
    }
    if (opt.from === 'call' || opt.from === 'taxi') {
      callDriverInfo = JSON.parse(opt.callDriverInfo);
      if (opt.from === 'call') {
        this.setData({
          fromCall: true,
        })
      } else if (opt.from === 'taxi') {
        this.setData({
          taxi: true,
        })
      }
      this.setData({
        driver: callDriverInfo,
        latitude: callDriverInfo.srcLat,
        longitude: callDriverInfo.srcLng,
      })
      this.driving(callDriverInfo.srcLat.toString(), callDriverInfo.srcLng.toString(), callDriverInfo.desLat.toString(), callDriverInfo.desLng.toString(), 'TRIP,REAL_TRAFFIC')
      if (!this.data.has1007) {
        this.setData({
          totPrice: callDriverInfo.actualAmount,
          descPrice: callDriverInfo.discountsAmount,
        })
      }
    } else if (opt.from === 'scan') { // 扫码进入时
      let driver = JSON.parse(opt.scanDriverInfo);
      this.setData({
        driver,
        fromCall: false,
        isWaiting: false,
        hideWalkTips: true,
        pathTips: true,
        opt,
        totPrice: driver.actualAmount,
        descPrice: driver.discountsAmount,
      })
      wx.setNavigationBarTitle({
        title: '待出发',
      })
      this.driving(driver.srcLat.toString(), driver.srcLng.toString(), driver.desLat.toString(), driver.desLng.toString(), 'TRIP,REAL_TRAFFIC', driver.bear);
    } else if (opt.from === 'scanLine') { // 远程扫码进入
      this.setData({
        fixedLine: true,
        fromLineScan: true,
        orderListOrder: opt.orderNo,
        businessType: 6,
        showCancleBtn: false,
        firBtnWidth: '100%'
      })
      wx.setStorageSync('lineOrderNo', opt.orderNo)
    } else if (opt.from === 'orderList' && !this.data.hasMqttMsg) { // 从订单列表来的
      let driver = JSON.parse(opt.driver);
      console.log('from订单列表：', driver);
      this.setData({
        fromCall: false,
        orderListOrder: driver.orderNo,
        businessType: driver.businessType,
        lineOrderInfo: driver,
        EXC_orderInfo: driver,
      })
      if (driver.businessType == 6 || driver.businessType == 7) {
        this.setData({
          fixedLine: true
        })
      } else if (driver.businessType == 9) {
        this.setData({
          exclusiveCar: true
        })
      } else if (driver.businessType == 10) {
        this.setData({
          taxi: true
        })
      } else if (driver.businessType == 5) {
        wx.setNavigationBarTitle({
          title: '等待接单',
        })
        if (driver.driverType == 6) {
          this.setData({
            taxi: true
          })
        }
        let driverInfoDetail = await this.orderCheck(driver.orderNo, driver.businessType);
        console.log('driverInfoDetail:', driverInfoDetail);
        let friendDriver = {
          name: driverInfoDetail.driverCarInfo.driverName,
          cart_no: driverInfoDetail.driverCarInfo.driverNo,
        }
        this.setData({
          fromFriendUseCart: true,
          hideWalkTips: true,
          isWaiting: true,
          friendDriver,
        })
      }
    } else if (opt.from === 'hasNoOrder' && !this.data.hasMqttMsg) { // 判断有未完成订单时
      console.log('hasNoOrder')
      this.setData({
        fromCall: false,
        fromHasNoOrder: true
      })
    } else if (opt.from === 'fixedLine') { // 远程下单
      wx.showModal({
        content: `亲！订单已收到，客服马上联系您。请您接听${wx.getStorageSync('servicePhone')}的来电。`,
        showCancel: false,
        success() {
           _this.mqttClient();
        }
      })
      let orderInfo = JSON.parse(opt.orderInfo);
      let date = new Date(parseInt(orderInfo.reservationTime));
      let prev = date.getTime();
      let now = new Date().getTime();
      console.log(date, now)
      let M = date.getMonth() + 1;
      let D = date.getDate();
      let h = date.getHours() < 10 ? '0' + date.getHours() : date.getHours();
      let m = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes();
      let resDate = M + '月' + D + '日' + ' ' + h + ' : ' + m;
      this.setData({
        fixedLine: true,
        lineOrderInfo: orderInfo,
        lineTotPrice: orderInfo.actualAmount,
        startDate: resDate,
        desName: orderInfo.endAddress,
        latitude: orderInfo.srcLat,
        longitude: orderInfo.srcLng,
      })
      this.driving(orderInfo.srcLat.toString(), orderInfo.srcLng.toString(), app.globalData.lineEndLat.toString(), app.globalData.lineEndLng.toString(), 'TRIP,REAL_TRAFFIC', 0, false, orderInfo.endAddress)
    } else if (opt.from === 'exclusiveCar') { // 包车下单
      wx.showModal({
        content: `亲！订单已收到，客服马上联系您。请您接听${wx.getStorageSync('servicePhone')}的来电。`,
        showCancel: false,
        success() {
           _this.mqttClient();
        }
      })
      let orderInfo = JSON.parse(opt.orderInfo);
      let date = new Date(parseInt(orderInfo.reservationTime));
      let M = date.getMonth() + 1;
      let D = date.getDate();
      let h = date.getHours() < 10 ? '0' + date.getHours() : date.getHours();
      let m = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes();
      let resDate = M + '月' + D + '日' + ' ' + h + ' : ' + m;
      this.setData({
        exclusiveCar: true,
        EXC_orderInfo: orderInfo,
        lineTotPrice: orderInfo.actualAmount,
        startDate: resDate,
        mapShowLocation: true
      })
      if (orderInfo.isCancel == 0) { // 不能取消订单
        this.setData({
          showCancleBtn: false
        })
      } else if (orderInfo.isCancel == 1) { // 可以取消订单
        this.setData({
          showCancleBtn: true
        })
      }
    }

    let _points;
    if (this.data.exclusiveCar || this.data.businessType == 9) {
      await this.getCurrentLocation();
      _points = [{
          latitude: this.data.latitude,
          longitude: this.data.longitude
        },
        {
          latitude: this.data.EXC_orderInfo.srcLat,
          longitude: this.data.EXC_orderInfo.srcLng
        },
      ]
    } else {
      _points = [{
          latitude: this.data.latStr,
          longitude: this.data.lngStr
        },
        {
          latitude: this.data.latEnd,
          longitude: this.data.lngEnd
        },
      ]

      this.mapCtx.includePoints({
        padding: [200],
        points: _points,
      })
    }

    this.setData({
        isload:false
    })

    wx.getSystemInfo({
      success: (res) => {
        this.setData({
          controls: [{
            id: 1,
            iconPath: '/assets/images/location.png',
            position: {
              left: res.windowWidth - 60, // 单位px
              top: res.windowHeight - 380,
              width: 50, // 控件宽度/px
              height: 50,
            },
            clickable: true
          }, ],

        })
      }
    })

  },

  onShow() {
    console.log('onShow in orderService', )
    app.globalData.isToTaxiDriving = true;
    curPageOnShow = true;
    if(app.globalData.clientDriving){
      this.mqttClient();
    }   
  },

  onReady() {
    if (this.data.opt.from === 'call') {
      clearInterval(this.data.countTimer);
      this.countInterval();
    }
  },

  onHide() {
    console.log('onHide...', )
    curPageOnShow = false;

    if (exceedGlb) clearInterval(exceedGlb);
    app.globalData.clientDriving._events.message=app.globalData.clientDriving._events.message['0']
  },

  onUnload() {
    curPageOnShow = false;
    wx.removeStorageSync('driverInfoMqtt')
    app.globalData.mqtt1001 = 0;
    app.globalData.mqtt1002 = 0;
    app.globalData.mqtt1008 = 0;
    app.globalData.mqtt1011 = 0;
    app.globalData.lineStartAddress = '';
    app.globalData.lineStartLat = '';
    app.globalData.lineStartLng = '';
    app.globalData.lineEndAddress = '';
    app.globalData.lineEndLat = '';
    app.globalData.lineEndLng = '';
    if (exceedGlb) clearInterval(exceedGlb);
    app.globalData.clientDriving._events.message=app.globalData.clientDriving._events.message['0']
  },

  mqttClient() {
    let _this = this;
    let order = this.data.opt.orderNo || this.data.driver.orderNo;
    if (this.data.fixedLine) {
      order = this.data.opt.orderNo || this.data.driver.orderNo || wx.getStorageSync('lineOrderNo')
    } else if (this.data.exclusiveCar) {
      order = this.data.EXC_orderInfo.orderNo || this.data.orderListOrder;
    }

    app.globalData.clientDriving.subscribe(app.globalData.pubTopic, (err, granted) => {
      console.log('订阅成功in orderService')
      setTimeout(() => {
        if (this.data.orderListOrder) {
          this.orderRecover(this.data.orderListOrder)
        } else {
          this.orderRecover();
        }
      }, 1000);
    })

    app.globalData.clientDriving.on('message', (topic, message, packet) => {
      let msg = JSON.parse(Base64.decode(message.toString()));
      if(!curPageOnShow){
        console.log("收到mqtt in orderService return");
        return;
      }
      console.log("收到mqtt：in orderService", msg)
      if (msg && JSON.stringify(msg.data) !== '{}') {
        if (msg.code) {
          this.setData({
            hasMqttMsg: true,
          })
        }
        // 远程
        if (msg.data.hasOwnProperty('businessType') && (msg.data.businessType == 6 || msg.data.businessType == 7)) {
          this.setData({
            fixedLine: true
          })
        }

        if (msg.code == '1000') {
          this.setData({
            fromFriendUseCart: false,
          })
          if (msg.data.businessType == 6 || msg.data.businessType == 7) {
            this.setData({
              lineOrderInfo: msg.data,
              lineTotPrice: msg.data.actualAmount
            })
            if (msg.data.isQrCode == 1) { // 扫码
              this.setData({
                showCancleBtn: false,
                fromLineScan: true,
                firBtnWidth: '100%'
              })
            }
          } else if (msg.data.businessType == 9) {
            if (msg.data.number && msg.data.lineType == 7) {
              this.setData({
                msg1012: null,
                EXC_dateNum: msg.data.number,
                lineTips: msg.data.timeDescribe || '',
              })
            }
            if (msg.data.isCancel == 0) {
              this.setData({
                showCancleBtn: false,
                firBtnWidth: '100%'
              })
            }
            this.setData({
              EXC_showDistance: false
            })
          } else if (msg.data.businessType == 10) {
            this.setData({
              taxi: true
            })
          }else if (msg.data.businessType == 5){
            if(msg.data.driverType == 6){
              this.setData({
                taxi: true
              })
            }
          }
          if (msg.data.orderType == 2) {
            let date = new Date(msg.data.reservationTime);
            let M = date.getMonth() + 1;
            let D = date.getDate();
            let h = date.getHours() < 10 ? '0' + date.getHours() : date.getHours();
            let m = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes();
            let resDate = M + '月' + D + '日' + ' ' + h + ' : ' + m
            this.setData({
              startDate: resDate
            })
          }
          clearInterval(this.data.countTimer);
          wx.setNavigationBarTitle({
            title: '等待接驾',
          })
          wx.setStorageSync('driverInfoMqtt', msg.data);
          let driver = wx.getStorageSync('driverInfoMqtt');
          this.setData({
            isWaiting: false,
            driver,
            latitude: msg.data.currentLat,
            longitude: msg.data.currentLng,
            hideWalkTips: false,
            pathTips: false,
            startAddress: app.globalData.strAddress || msg.data.srcName,
            hasSit: false,
            startDate: '',
            lineTips: msg.data.timeDescribe || '',
            strName: msg.data.srcName,
            businessType: msg.data.businessType
          })
          if (this.data.exclusiveCar) {
            this.driving(msg.data.currentLat.toString(), msg.data.currentLng.toString(), msg.data.srcLat.toString(), msg.data.srcLng.toString(), 'PICKUP,REAL_TRAFFIC', msg.data.bear, true, this.data.strName)
          } else {
            this.driving(msg.data.currentLat.toString(), msg.data.currentLng.toString(), msg.data.srcLat.toString(), msg.data.srcLng.toString(), 'PICKUP,REAL_TRAFFIC', msg.data.bear, true, this.data.strName, 1)
          }
        } else if (msg.code == '1001') {
          app.globalData.mqtt1001++;
          if (app.globalData.mqtt1001 <= 1) {
            wx.showModal({
              content: msg.data,
              showCancel: false,
              confirmText: "确认",
              success(res) {
                if (res.confirm) {
                  wx.reLaunch({
                    url: '/pages/index/index',
                  })
                }
              }
            })
          }
        } else if (msg.code == '1002') {
          app.globalData.mqtt1002++;
          if (app.globalData.mqtt1002 <= 1) {
            wx.showModal({
              content: '附近空闲司机较少，是否继续等待？',
              confirmText: "取消叫车",
              confirmColor: "#999",
              cancelText: "继续等待",
              cancelColor: "#FF8008",
              success(res) {
                if (res.confirm) {
                  wx.showModal({
                    content: '您确定不等了吗？',
                    confirmText: "取消叫车",
                    confirmColor: "#999",
                    cancelText: "等待司机",
                    cancelColor: "#FF8008",
                    success(res) {
                      if (res.confirm) {
                        http.postRequest('/v1/carOrder/passenger/disposeOrder?orderNo=' + _this.data.driver.orderNo, {}, wx.getStorageSync('header'), res => {
                          console.log(res)
                          if (res.code === '1') {
                            clearInterval(_this.data.countTimer);
                            wx.removeStorageSync('lineOrderNo');
                            wx.reLaunch({
                              url: "/pages/index/index",
                            })
                            wx.showToast({
                              title: '订单已取消'
                            })
                          }
                        }, err => {
                          console.log(err)
                        })
                      }
                    },
                    fail(err) {
                      console.log(err)
                    }
                  })
                }
              },
              fail(err) {
                console.log(err)
              }
            })
          }
        } else if (msg.code == '1003') {
          wx.setNavigationBarTitle({
            title: '司机已到达',
          })
          this.setData({
            isWaiting: false,
            pathTips: false,
            hasSit: false,
            startDate: '',
          })

          this.walking(this.data.latOri.toString(), this.data.lngOri.toString(), this.data.driver.srcLat.toString(), this.data.driver.srcLng.toString())
          this.setData({
            cancleCont: '亲，司机已经到达上车地点，您确定要取消吗？',
            isWaiting: false,
            hideWalkTips: true,
          })
        } else if (msg.code == '1004') {
          if (this.data.fixedLine) {
            this.setData({
              isWaiting: false,
              hideWalkTips: true,
              pathTips: true,
            })
            if (msg.data.state == 1) {
              this.setData({
                strName: msg.data.desName
              })
              this.driving(msg.data.currentLat.toString(), msg.data.currentLng.toString(), msg.data.desLat.toString(), msg.data.desLng.toString(), 'TRIP,REAL_TRAFFIC', msg.data.bear, true, this.data.strName, msg.data.state);
            } else if (msg.data.state == 2) {
              this.driving(msg.data.currentLat.toString(), msg.data.currentLng.toString(), msg.data.desLat.toString(), msg.data.desLng.toString(), 'TRIP,REAL_TRAFFIC', msg.data.bear, true, this.data.desName, msg.data.state);
            }
          } else if (this.data.exclusiveCar) { // 包车
            wx.setNavigationBarTitle({
              title: '行程中',
            })
            this.setData({
              polyline: [],
              points: []
            })
            this.setData({
              isWaiting: false,
              hideWalkTips: true,
              pathTips: false,
              mapShowLocation: false,
              msg1012: false,
              latitude: msg.data.currentLat,
              longitude: msg.data.currentLng,
              markers: [{
                iconPath: '/assets/images/mapCart.png',
                id: 0,
                latitude: msg.data.currentLat,
                longitude: msg.data.currentLng,
                width: 30,
                height: 30,
                rotate: msg.data.bear,
              }]
            })

            if (msg.data.lineType == 7) { // 时间包车
              this.setData({
                msgExceedTimeInfo: msg.data,
                EXC_showDistance: true,
                EXC_dateNum: null,
              })
            }
          } else if (this.data.driver.businessType == 10 && msg.data.state == 2) {
            if (this.data.taxi1004counter === 0) {
              this.data.taxi1004counter++;
              wx.reLaunch({
                url: '/driving_status/pages/taxiDriving/taxiDriving?driverInfo=' + JSON.stringify(this.data.driver),
              })
            }
          } else if(this.data.driver.businessType == 5){
            if(this.data.driver.driverType == 6 && msg.data.state == 2){
              if (this.data.taxi1004counter === 0) {
                this.data.taxi1004counter++;
                wx.reLaunch({
                  url: '/driving_status/pages/taxiDriving/taxiDriving?driverInfo=' + JSON.stringify(this.data.driver),
                })
              }
            }else{
              this.setData({
                showIntegral:true
              })
            }
          } else {
            if (msg.data.state == 1) {
              wx.setNavigationBarTitle({
                title: '等待接驾',
              })
              this.setData({
                startAddress: app.globalData.strAddress || msg.data.srcName,
                isWaiting: false,
                hideWalkTips: false,
                pathTips: true,
                totPrice: 0,
                hasSit: false,
                startDate: '',
                lineTips: '',
                strName: msg.data.desName
              })
            } else if (msg.data.state == 2) {
              wx.setNavigationBarTitle({
                title: '行程中',
              })
              this.setData({
                isWaiting: false,
                hideWalkTips: true,
                pathTips: true,
                totPrice: msg.data.amount || 0,
                hasSit: true,
              })

              if(this.data.driver.businessType != 10){
                this.setData({
                  showIntegral:true
                })
              }
            }
            this.driving(msg.data.currentLat.toString(), msg.data.currentLng.toString(), msg.data.desLat.toString(), msg.data.desLng.toString(), 'TRIP,REAL_TRAFFIC', msg.data.bear, true, '', msg.data.state);
          }
        } else if (msg.code == '1006') {
          wx.setNavigationBarTitle({
            title: '行程中',
          })
          wx.setStorageSync('driverInfoMqtt', msg.data);
          let driver = wx.getStorageSync('driverInfoMqtt');
          if (msg.data.businessType == 6 || msg.data.businessType == 7) {
            this.setData({
              lineOrderInfo: msg.data,
              desName: msg.data.desName,
              lineTotPrice: msg.data.totalPrice,
            })
          } else if (msg.data.businessType == 9) {
            this.setData({
              EXC_orderInfo: msg.data,
              mapShowLocation: false,
              EXC_drivingWaiting: false,
              lineTips: '',
              msg1012: false,
              latitude: msg.data.currentLat,
              longitude: msg.data.currentLng,
              markers: [{
                iconPath: "/assets/images/mapCart.png",
                id: 0,
                latitude: msg.data.currentLat,
                longitude: msg.data.currentLng,
                width: 30,
                height: 30,
                rotate: msg.bear,
              }]
            })
            if (msg.data.lineType == 7) { // 时间包车
              this.setData({
                msgExceedTimeInfo: msg.data,
                EXC_showDistance: true,
                EXC_dateNum: null,
              })
            }
          } else if (msg.data.businessType == 10) { 
            if (this.data.taxi1006counter === 0) {
              this.data.taxi1006counter++;
              wx.reLaunch({
                url: '/driving_status/pages/taxiDriving/taxiDriving?driverInfo=' + JSON.stringify(msg.data),
              })
            }
          } else if (msg.data.businessType == 5) {
            if (msg.data.driverType == 6) {
              if (this.data.taxi1006counter === 0) {
                this.data.taxi1006counter++;
                wx.reLaunch({
                  url: '/driving_status/pages/taxiDriving/taxiDriving?driverInfo=' + JSON.stringify(msg.data),
                })
              }
            }else{
              this.setData({
                showIntegral:true
              })
            }
          }
          this.setData({
            driver,
            latitude: msg.data.currentLat,
            longitude: msg.data.currentLng,
            isWaiting: false,
            hideWalkTips: true,
            hasSit: true,
            totPrice: msg.data.amount,
            startDate: '',
            lineTips: '',
            businessType: msg.data.businessType,
            fromFriendUseCart: false
          })

          if(msg.data.businessType != 10){
            this.setData({
              showIntegral:true
            })
          }

          if (msg.data.businessType == 9) {
            this.setData({
              pathTips: false,
            })
          } else {
            this.driving(msg.data.currentLat.toString(), msg.data.currentLng.toString(), msg.data.desLat.toString(), msg.data.desLng.toString(), 'TRIP,REAL_TRAFFIC', msg.data.bear, true, msg.data.desName)
            this.setData({
              pathTips: true,
            })
          }
          if (msg.data.payState == 0) {
            this.setData({
              linePayText: '付款'
            })
          } else if (msg.data.payState == 1) {
            this.setData({
              linePayText: `已付款${msg.data.totalPrice}元`
            })
          }
        } else if (msg.code == '1005') {
          if (mqtt1005timer) clearTimeout(mqtt1005timer);
          mqtt1005timer = setTimeout(() => {
            wx.removeStorageSync('lineOrderNo')
            let from;
            if (msg.data.businessType == 6 || msg.data.businessType == 7) {
              from = 'fixedLine';
            } else if (msg.data.businessType == 9) {
              from = 'exclusiveCar';
            } else if (msg.data.businessType == 1) {
              from = 'callCar';
            } else if (msg.data.businessType == 10) {
              from = 'taxi';
            }else if(msg.data.businessType == 5){
              if(msg.data.driverType == 6){
                from = 'taxi';
              }
            }
            wx.redirectTo({
              url: '/driving_status/pages/travalEnd/travalEnd?resData=' + JSON.stringify(msg.data) + '&from=' + from,
            })
          }, 500);
          // }
        } else if (msg.code == '1007') {
          console.log('mydata:', this.data)
          let date = new Date(parseInt(msg.data.reservationTime));
          let M = date.getMonth() + 1;
          let D = date.getDate();
          let h = date.getHours() < 10 ? '0' + date.getHours() : date.getHours();
          let m = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes();
          let resDate = M + '月' + D + '日' + ' ' + h + ' : ' + m;
          // }

          if (msg.data.businessType == 6 || msg.data.businessType == 7) { // 远程
            if (msg.data.isQrCode == 1) { // 扫码
              this.setData({
                showCancleBtn: false,
                fromLineScan: true,
                firBtnWidth: '100%'
              })
            }
            this.setData({
              fixedLine: true,
              lineOrderInfo: msg.data,
              startDate: resDate,
              strName: msg.data.srcName,
              desName: msg.data.desName,
              latitude: msg.data.srcLat,
              longitude: msg.data.srcLng,
            })
            wx.setStorageSync('lineOrderNo', msg.data.orderNo);
            if (msg.data.srcLat != msg.data.desLat && msg.data.srcLng != msg.data.desLng) {
              this.driving(msg.data.srcLat.toString(), msg.data.srcLng.toString(), msg.data.desLat.toString(), msg.data.desLng.toString(), 'TRIP,REAL_TRAFFIC', 0, false, msg.data.desName)
            }
          } else if (msg.data.businessType == 9) { // 包车
            this.setData({
              exclusiveCar: true,
              latitude: msg.data.srcLat,
              longitude: msg.data.srcLng,
              EXC_orderInfo: msg.data,
              lineTotPrice: msg.data.actualAmount,
              startDate: resDate,
              mapShowLocation: true,
            })
            if (msg.data.isCancel == 0) { // 不能取消订单
              this.setData({
                showCancleBtn: false
              })
            }
          } else {
            wx.setStorageSync('driverInfoMqtt', msg.data);
            let driver = wx.getStorageSync('driverInfoMqtt');
            _this.setData({
              driver,
              latitude: msg.data.srcLat,
              longitude: msg.data.srcLng,
              has1007: true,
              totPrice: msg.data.actualAmount,
              descPrice: msg.data.discountsAmount,
            })
            if (msg.data.businessType == 10) { // 出租车
              this.setData({
                taxi: true
              })
            }else if(msg.data.businessType == 5){
              if(msg.data.driverType == 6){
                this.setData({
                  taxi: true
                })
              }
            }
            this.driving(msg.data.srcLat.toString(), msg.data.srcLng.toString(), msg.data.desLat.toString(), msg.data.desLng.toString(), 'TRIP,REAL_TRAFFIC', 0, false, msg.data.desName);
            clearInterval(this.data.countTimer);
            this.countInterval();
            if (msg.data.businessType == 5) {
              this.setData({
                fromFriendUseCart: true,
                hideWalkTips: true,
                isWaiting: true,
              })
            }
            // 有预约时间
            if (msg.data.orderType == 2) {
              this.setData({
                startDate: resDate,
                startAddress: app.globalData.strAddress || msg.data.srcName,
                // hideWalkTips: false,
                fixedLine: (msg.data.businessType == 6 || msg.data.businessType == 7) ? true : false,
              })
              clearInterval(this.data.countTimer);
            }

          }

          this.setData({
            businessType: msg.data.businessType
          })

        } else if (msg.code == '1008') { // 乘客下预约单，距离预约时间还是15分钟时，司机未接单，通知乘客
          if (mqtt1008timer) clearTimeout(mqtt1008timer);
          mqtt1008timer = setTimeout(() => {
            wx.showModal({
              content: msg.data,
              showCancel: false,
              success() {
                clearInterval(_this.data.countTimer);
                wx.reLaunch({
                  url: "/pages/index/index",
                })
              }
            })
          }, 500);
        } else if (msg.code == '1009') { // 乘客远程订单数据被后台主动修改，乘客端重新调用订单恢复接口
          this.orderRecover(msg.data);
        } else if (msg.code == '1010') { // 加价确认
          if (mqtt1010timer) clearTimeout(mqtt1010timer);
          mqtt1010timer = setTimeout(() => {
            wx.showModal({
              content: msg.data.description,
              confirmText: '同意',
              cancelText: '拒绝',
              success(res) {
                if (res.confirm) {
                  _this.lineAdditionalPay(0, msg.data.price)
                } else {
                  _this.lineAdditionalPay(1, msg.data.price)
                }
              }
            })
          }, 500);
        } else if (msg.code == '1011') { // 加价司机撤回
          if (mqtt1011timer) clearTimeout(mqtt1011timer);
          mqtt1011timer = setTimeout(() => {
            wx.showModal({
              content: msg.data,
              showCancel: false,
            })
          }, 500);
        } else if (msg.code == '1012') { // 等待行程中
          if (msg.data.businessType == 9) {
            wx.setNavigationBarTitle({
              title: '行程等待中',
            })
            this.setData({
              markers: [],
              polyline: [],
              points: []
            })
            this.setData({
              driver: msg.data,
              EXC_orderInfo: msg.data,
              msg1012: msg.data,
              lineTips: msg.data.srcName,
              mapShowLocation: true,
              EXC_showDistance: false,
              EXC_drivingWaiting: true,
              isWaiting: false,
              hideWalkTips: true,
              pathTips: false,
              hasSit: true,
              businessType: msg.data.businessType,
              markers: [{
                iconPath: "/assets/images/mapCart.png",
                id: 0,
                latitude: msg.data.srcLat,
                longitude: msg.data.srcLng,
                width: 30,
                height: 30,
              }],
              showIntegral:false
            })
            if (exceedGlb) clearInterval(exceedGlb);
            _this.exceedTimeHandle(msg.data.timestamp);
          }
        }
      }
    })
  },

  // 等待应答计时器
  countInterval() {
    let curr = this.data.count >= 2 ? this.data.count : 0;
    let hasInterval = new Date(new Date(0, 0).getTime() + (this.data.count * 1000));
    let timer = this.data.count >= 2 ? hasInterval : new Date(0, 0);
    this.setData({
      count: curr
    })
    this.data.countTimer = setInterval(() => {
      this.setData({
        time: this.parseTime(timer.getMinutes()) + ":" + this.parseTime(timer.getSeconds()),
      });
      timer.setMinutes(curr / 60);
      timer.setSeconds(curr % 60);
      curr++;
      this.data.count++;
      if (this.data.count >= 32) {
        this.setData({
          title_tips: '正在优先为您派单',
        })
      }
    }, 1000)
  },

  // 步行路线规划
  walking(str1, str2, end1, end2, showEnd) {
    var _this = this;
    //调用距离计算接口
    qqmapsdk.direction({
      mode: 'walking',
      from: {
        'latitude': str1,
        'longitude': str2
      },
      to: {
        'latitude': end1,
        'longitude': end2
      },
      success: function (res) {
        var ret = res;
        var coors = ret.result.routes[0].polyline,
          pl = [];
        //坐标解压（返回的点串坐标，通过前向差分进行压缩）
        var kr = 1000000;
        for (var i = 2; i < coors.length; i++) {
          coors[i] = Number(coors[i - 2]) + Number(coors[i]) / kr;
        }
        for (var i = 0; i < coors.length; i += 2) {
          pl.push({
            latitude: coors[i],
            longitude: coors[i + 1]
          })
        }
        let distance = (res.result.routes[0].distance / 1000).toFixed(1);
        let time = res.result.routes[0].duration;
        let hours = Math.floor(time / 60);
        let minutes = time % 60;
        if (time < 60) {
          time = time + '分钟';
        } else {
          time =
            hours + "小时" + (minutes.length < 2 ? "0" + minutes : minutes) + '分钟';
        }
        let _points = [{
          latitude: str1,
          longitude: str2
        }, {
          latitude: end1,
          longitude: end2
        }];
        _this.setData({
          polyline: [{
            points: pl,
            color: '#f17f4bDD',
            width: 3,
            dottedLine: true,
            arrowLine: true
          }],
          distance,
          pathTime: time,
        })

        if (showEnd) {
          _this.setData({
            markers: [{
              iconPath: "/assets/images/mapicon_navi_e.png",
              id: 0,
              latitude: end1,
              longitude: end2,
              width: 30,
              height: 30,
            }],
          })
          _this.mapCtx.includePoints({
            padding: [200],
            points: _points,
          })
        } else {
          _this.mapCtx.includePoints({
            padding: [200],
            points: _points,
          })
        }

      },
      fail: function (error) {
        console.error(error);
      }
    });
  },

  // 驾车路线规划
  driving(str1, str2, end1, end2, policy, rotate, car, desName, strOrEnd) {
    var _this = this;
    qqmapsdk.direction({
      mode: 'driving',
      from: {
        'latitude': str1,
        'longitude': str2
      },
      to: {
        'latitude': end1,
        'longitude': end2
      },
      policy,
      success: function (res) {
        var ret = res;
        var coors = ret.result.routes[0].polyline,
          pl = [];
        var kr = 1000000;
        for (var i = 2; i < coors.length; i++) {
          coors[i] = Number(coors[i - 2]) + Number(coors[i]) / kr;
        }
        for (var i = 0; i < coors.length; i += 2) {
          pl.push({
            latitude: coors[i],
            longitude: coors[i + 1]
          })
        }
        let distance = (res.result.routes[0].distance / 1000).toFixed(1);
        let time = res.result.routes[0].duration;
        let hours = Math.floor(time / 60);
        let minutes = time % 60;
        if (time < 60) {
          time = time + '分钟';
        } else {
          time =
            hours + "小时" + (minutes.length < 2 ? "0" + minutes : minutes) + '分钟';
        }
        let _points = [{
          latitude: parseFloat(str1),
          longitude: parseFloat(str2)
        }, {
          latitude: parseFloat(end1),
          longitude: parseFloat(end2)
        }]
        let endImg = strOrEnd == 1 ? "/assets/images/mapicon_navi_s.png" : "/assets/images/mapicon_navi_e.png";
        _this.setData({
          markers: []
        })
        _this.setData({
          polyline: [{
            points: pl,
            color: '#3091e0DD',
            width: 4,
            arrowLine: true
          }],
          distance,
          pathTime: time,
          markers: [{
            iconPath: car ? "/assets/images/mapCart.png" : "/assets/images/mapicon_navi_s.png",
            id: 0,
            latitude: str1,
            longitude: str2,
            width: 30,
            height: 30,
            rotate,
          }, {
            iconPath: endImg,
            id: 1,
            latitude: end1,
            longitude: end2,
            width: 30,
            height: 30,
            callout: {
              content: _this.data.fixedLine ? (desName || app.globalData.lineEndAddress) : '',
              borderRadius: 5,
              padding: 3
            }
          }],
        })
        _this.mapCtx.includePoints({
          padding: [200],
          points: _points,
        })
      },
      fail: function (error) {
        console.error(error);
      }
    });
  },

  bindcontroltap(e) {
    this.movetoPosition();
  },

  movetoPosition() {
    this.mapCtx.moveToLocation({
      success(res) {
        console.log(res);
      },
      fail(error) {
        console.log(error);
      }
    });
  },


  toCancel() {
    wx.redirectTo({
      url: "/pages/cancel/cancel"
    })

  },

  //取消叫车
  modalCancel() {
    let order = this.data.opt.orderNo || this.data.driver.orderNo; //  || wx.getStorageSync('orderNo')
    if (this.data.fixedLine) {
      order = this.data.opt.orderNo || this.data.driver.orderNo || wx.getStorageSync('lineOrderNo');
    } else if (this.data.exclusiveCar) {
      order = this.data.EXC_orderInfo.orderNo || this.data.orderListOrder;
    }
    console.log(order);

    wx.showModal({
      content: '您确定取消吗？',
      confirmText: "取消叫车",
      confirmColor: "#999",
      cancelText: "等待司机",
      cancelColor: "#FF8008",
      success(res) {
        if (res.confirm) {
          http.postRequest('/v1/carOrder/passenger/disposeOrder?orderNo=' + order, {}, wx.getStorageSync('header'), res => {
            if (res.code === '1') {
              clearInterval(_this.data.countTimer);
              wx.removeStorageSync('lineOrderNo');
              wx.reLaunch({
                url: "/pages/index/index",
              })
              wx.showToast({
                title: '订单已取消'
              })
            }
          }, err => {
            console.log(err)
          })
        }
      },
      fail(err) {
        console.log(err)
      }
    })


  },

  // 格式化时间
  parseTime(time) {
    var time = time.toString();
    return time[1] ? time : '0' + time;
  },

  // 拨打司机电话
  callDriver(e) {
    console.log('电话号码：', e.currentTarget.dataset)
    wx.makePhoneCall({
      phoneNumber: e.currentTarget.dataset.phone,
      success() {
        console.log('拨打成功')
      }
    })
  },

  //取消行程
  cancleWait() {
    let order = this.data.opt.orderNo || this.data.driver.orderNo; //  || wx.getStorageSync('orderNo')
    if (this.data.fixedLine) {
      order = this.data.opt.orderNo || this.data.driver.orderNo || wx.getStorageSync('lineOrderNo')
    } else if (this.data.exclusiveCar) {
      order = this.data.EXC_orderInfo.orderNo || this.data.orderListOrder;
    }
    console.log('取消行程订单号：', order)
    let _this = this;
    wx.showModal({
      content: "您确定不等了吗？",
      cancelText: "取消叫车",
      confirmText: "继续等待",
      confirmColor: "#FF8008",
      cancelColor: "#999",
      success(res) {
        if (res.cancel) {
          http.postRequest('/v1/carOrder/passenger/disposeOrder?orderNo=' + order, {}, wx.getStorageSync('header'), res => {
            if (res.code == '1') {
              clearInterval(_this.data.countTimer);
              wx.removeStorageSync('lineOrderNo')
              wx.reLaunch({
                url: "/pages/index/index",
              })
              wx.showToast({
                title: '订单已取消'
              })
            }
          }, err => {
            console.log(err)
          })
        } else {
          console.log("继续等待")
        }
      },
      fail(err) {
        console.log(err)
      }
    })
  },

  // 呼叫客服电话
  toService() {
    let servicePhone = wx.getStorageSync('servicePhone')
    wx.makePhoneCall({
      phoneNumber: servicePhone,
      success: function () {
        console.log('拨打成功')
      },
      fail: function () {
        console.log('拨打失败')
      }
    })
  },

  // 重新呼叫
  recallLine() {
    let order = this.data.opt.orderNo || this.data.driver.orderNo || wx.getStorageSync('lineOrderNo');
    wx.showModal({
      content: '您确定重新呼叫吗？',
      confirmText: '等待司机',
      confirmColor: '#FF8008',
      cancelText: '重新呼叫',
      cancelColor: '#999999',
      success(res) {
        if (res.cancel) {
          http.postRequest("/v2/passenger/remote/anewCallOut?orderNo=" + order, '', wx.getStorageSync('header'), res1 => {
            wx.redirectTo({
              url: '/driving_status/pages/orderService/orderService?from=fixedLine&orderInfo=' + JSON.stringify(res1.content),
            })
          }, err => {
            console.log(err)
          })
        }
      }
    })
  },

  // 远程支付
  linePay() {
    let _this = this;
    let order;
    if (this.data.fixedLine) {
      order = this.data.lineOrderInfo.orderNo || wx.getStorageSync('lineOrderNo')
    } else {
      order = this.data.driver.orderNo
    }
    if (this.data.linePayText === '付款') {
      if (linePayTimer) clearTimeout(linePayTimer);
      linePayTimer = setTimeout(() => {
        http.postRequest('/v1/wx/applet/order/pay?orderNo=' + order, '', wx.getStorageSync('header'), res => {
          if (res.code === '1') {
            wx.requestPayment({
              nonceStr: res.content.nonceStr,
              package: res.content.package,
              paySign: res.content.paySign,
              timeStamp: res.content.timeStamp,
              signType: res.content.signType,
              success(res) {
                console.log('调用支付成功：', res)
                wx.showToast({
                  title: '支付成功',
                  duration: 2000,
                  success() {
                    _this.setData({
                      lineTicketPrice: _this.data.lineTotPrice,
                      linePayText: `已付款${_this.data.lineTotPrice}元`,
                      lineTips: ''
                    })
                  }
                })
              },
              fail(err) {
                console.log(err)
              }
            })
          }
        }, err => {
          console.log(err)
        })
      }, 500);

    }
  },

  // 订单查询
  orderCheck(order, businessType) {
    if (order && businessType) {
      return new Promise((resolve, reject) => {
        http.getRequest("/v1/passenger/center/orderDetail?orderNo=" + order + "&businessType=" + businessType, '', wx.getStorageSync('header'), res => {
          if (res.content) {
            resolve(res.content)
          } else {
            reject(res.code)
          }
        }, err => {
          console.log(err);
          reject(err)
        })
      })
    }
  },

  // 订单恢复
  orderRecover(order) {
    if (order) {
      http.postRequest("/v1/carOrder/passenger/recoverOrder?orderNo=" + order, '', wx.getStorageSync('header'), res => {
        if (res.success) {
          console.log('recoverOrder');
        }
      }, err => {
        console.log(err)
      })
    } else {
      http.postRequest("/v1/carOrder/passenger/recoverOrder", '', wx.getStorageSync('header'), res => {
        if (res.success) {
          console.log('recoverOrder');
        }
      }, err => {
        console.log(err)
      })
    }
  },

  // 远程加价请求
  lineAdditionalPay(state, price) {
    let _this = this;
    let order = this.data.opt.orderNo || this.data.driver.orderNo || wx.getStorageSync('lineOrderNo');
    http.postRequest("/v2/passenger/remote/priceConfirmation?orderNo=" + order + '&state=' + state + '&price=' + price, '', wx.getStorageSync('header'), res => {
      console.log('priceConfirmation---', res)
      if (state === 0) { // 同意
        http.postRequest('/v1/wx/applet/order/pay?orderNo=' + order, '', wx.getStorageSync('header'), res1 => {
          wx.requestPayment({
            nonceStr: res1.content.nonceStr,
            package: res1.content.package,
            paySign: res1.content.paySign,
            timeStamp: res1.content.timeStamp,
            signType: res1.content.signType,
            success(res2) {
              console.log('远程加价支付成功：', res2)
              if (state === 0) { // 同意
                if (_this.data.lineTicketPrice) {
                  let showPrice = (parseFloat(_this.data.lineTicketPrice) + parseFloat(res.content.price)).toFixed(2);
                  console.log('showPrice：', showPrice)
                  _this.setData({
                    linePayText: `已付款${showPrice}元`
                  })
                } else {
                  _this.setData({
                    linePayText: `已付款${res.content.price}元`
                  })
                }
              }
            },
            fail(err) {
              console.log(err)
            }
          })
        }, err => {
          console.log(err)
        })
      }
    }, err => {
      console.log(err)
    })
  },

  // 包车打开本地地图
  EXC_toLocalMap() {
    let _this = this;
    qqmapsdk.reverseGeocoder({
      location: {
        latitude: this.data.msg1012.srcLat,
        longitude: this.data.msg1012.srcLng,
      },
      success(res) {
        console.log('司机位置信息：', res)
        wx.openLocation({
          latitude: _this.data.msg1012.srcLat,
          longitude: _this.data.msg1012.srcLng,
          name: res.result.address,
          address: res.result.address,
          success(r) {
            console.log('打开内置地图：', r)
          }
        })
      }
    })
  },

  formatTime(time) {
    if (time >= 10) {
      return time;
    } else {
      return `0${time}`
    }
  },

  EXC_timeHandle(timeStamp, endTime) {
    let exceed, resTime, resSec;
    let nowTime = new Date().getTime();
    if (timeStamp < 0 || parseInt((endTime - nowTime) / 1000) < 0) {
      exceed = true;
      resSec = parseInt((nowTime - endTime) / 1000);
    } else {
      resSec = parseInt((endTime - nowTime) / 1000)
    }
    let d = parseInt(resSec / (24 * 60 * 60));
    let h = this.formatTime(parseInt(resSec / (60 * 60) % 24));
    let m = this.formatTime(parseInt(resSec / 60 % 60));
    let s = this.formatTime(parseInt(resSec % 60));

    if (d > 0) {
      if (parseInt(d) == 0) {
        resTime = d + '天';
      } else {
        if (parseInt(h) == 0) {
          resTime = d + '天';
        } else {
          resTime = d + '天' + h + '小时';
        }
      }
    } else if (d <= 0 && h > 0) {
      if (parseInt(h) == 0) {
        resTime = m + '分钟';
      } else {
        if (parseInt(m) == 0) {
          resTime = h + '小时';
        } else {
          resTime = h + '小时' + m + '分钟';
        }
      }

    } else {
      if (parseInt(m) == 0) {
        resTime = s + '秒';
      } else {
        if (parseInt(s) == 0) {
          resTime = m + '分钟';
        } else {
          resTime = m + '分钟' + s + '秒';
        }
      }
    }
    return {
      exceed,
      resTime
    }
  },

  // 超时 行程等待中
  exceedTimeHandle(timeStamp) {
    let endTime = new Date().getTime() + timeStamp;
    let res = this.EXC_timeHandle(timeStamp, endTime);
    this.setData({
      exceedWaitingTimeNum: res.resTime
    })
    if (exceedGlb) clearInterval(exceedGlb);
    exceedGlb = setInterval(() => {
      res = this.EXC_timeHandle(timeStamp, endTime);
      this.setData({
        exceedWaitingTimeNum: res.resTime
      })
      if (res.exceed) {
        this.setData({
          exceedWaitingTime: res.exceed
        })
      }
    }, 1000);
  },

  // 获取当前位置
  getCurrentLocation() {
    let _this = this;
    return new Promise((resolve, reject) => {
      wx.getLocation({
        type: 'gcj02',
        success(res) {
          console.log(res)
          let _latitude = res.latitude
          let _longitude = res.longitude

          _this.setData({
            latitude: _latitude,
            longitude: _longitude,
          })
          resolve();
        }
      })

    })
  },

  toMyIntegral(){
    wx.navigateTo({
      url: '/user_center/pages/integral/integral',
    })
  },

})