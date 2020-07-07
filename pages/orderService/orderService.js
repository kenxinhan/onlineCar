var QQMapWX = require('../../libs/qqmap-wx-jssdk.js');
var qqmapsdk;
qqmapsdk = new QQMapWX({
  key: 'DHNBZ-2ZLKK-T7IJJ-AXSQW-WX5L6-A6FJZ'
});
import http from '../../utils/http';
import {
  Base64
} from 'js-base64';

const app = getApp();

Page({
  data: {
    fromCall: true,
    hasMqttMsg: false,
    latitude: 0,
    longitude: 0,
    controls: [],
    markers: [],
    points: [],
    driver: {},
    startAddress: '',
    modalHidden: true,
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
    driverImg: '../../assets/images/driver.png',
  },

  onLoad: function (opt) {
    this.mapCtx = wx.createMapContext("map");
    let _this = this;
    console.log('行程opt：', opt)
    console.log('起点坐标', app.globalData.originLatitude, app.globalData.originLongitude);
    this.setData({
      latOri: app.globalData.originLatitude,
      lngOri: app.globalData.originLongitude,
      latStr: app.globalData.strLatitude,
      lngStr: app.globalData.strLongitude,
      latEnd: app.globalData.endLatitude,
      lngEnd: app.globalData.endLongitude,
      opt,
    })
    let _points = [{
        latitude: this.data.latStr,
        longitude: this.data.lngStr
      },
      {
        latitude: this.data.latEnd,
        longitude: this.data.lngEnd
      },
    ]

    this.mapCtx.includePoints({
      padding: [70],
      points: _points,
    })
    //从确认呼叫来的
    let token = wx.getStorageSync('token') || '';
    if (opt.from === 'call') {
      this.setData({
        fromCall: true
      })
      this.driving(this.data.latStr.toString(), this.data.lngStr.toString(), this.data.latEnd.toString(), this.data.lngEnd.toString(), 'TRIP,REAL_TRAFFIC')
      if (!this.data.has1007) {
        http.postRequest("/carOrder/passenger/lineValuation", {
          userLongitude: this.data.lngStr,
          userLatitude: this.data.latStr,
          destinationLongitude: this.data.lngEnd,
          destinationLatitude: this.data.latEnd,
          businessType: 1
        }, {
          'channel': 2, //请求来源 2-小程序
          'appChannel': wx.getStorageSync('systemInfo').model, //systemInfo.brand, //app渠道
          'platformType': 3, //systemInfo.platform,  //系统类型
          'sysVersion': wx.getStorageSync('systemInfo').system, //操作系统版本
          'token': token
        }, res => {
          console.log('callValuation====', res)
          this.setData({
            totPrice: res.content[0].totalPrice,
            descPrice: res.content[0].preferentialPrice,
          })
        }, err => {
          console.log(err)
        })
      }
    }

    // 扫码进入时
    if (opt.from === 'scan') {
      let driver = JSON.parse(opt.scanDriverInfo);
      this.setData({
        driver,
        fromCall: false,
        isWaiting: false,
        hideWalkTips: true,
        pathTips: true,
        opt,
      })
      wx.setNavigationBarTitle({
        title: '待出发',
      })
      this.driving(driver.srcLat.toString(), driver.srcLng.toString(), driver.desLat.toString(), driver.desLng.toString(), 'TRIP,REAL_TRAFFIC', driver.bear);
      http.postRequest("/carOrder/passenger/lineValuation", {
        userLongitude: driver.srcLng,
        userLatitude: driver.srcLat,
        destinationLongitude: driver.desLng,
        destinationLatitude: driver.desLat,
        businessType: 1
      }, {
        'channel': 2, //请求来源 2-小程序
        'appChannel': wx.getStorageSync('systemInfo').model, //systemInfo.brand, //app渠道
        'platformType': 3, //systemInfo.platform,  //系统类型
        'sysVersion': wx.getStorageSync('systemInfo').system, //操作系统版本
        'token': token
      }, res => {
        console.log(res)
        this.setData({
          totPrice: res.content[0].totalPrice,
          descPrice: res.content[0].preferentialPrice,
        })
      }, err => {
        console.log(err)
      })
    }

    // 从订单列表来的
    if (opt.from === 'orderList' && !this.data.hasMqttMsg) {
      console.log('from订单列表')
      this.setData({
        fromCall: false
      })
      http.postRequest("/carOrder/passenger/recoverOrder?orderNo=" + opt.orderNo, '', wx.getStorageSync('header'), res => {
        console.log('from订单：', res)
        // _this.mqttClient()
      }, err => {
        console.log(err)
      })
    }

    // 判断有未完成订单时
    if (opt.from === 'hasNoOrder' && !this.data.hasMqttMsg) {
      console.log('hasNoOrder')
      this.setData({
        fromCall: false
      })
      http.postRequest("/carOrder/passenger/recoverOrder", '', wx.getStorageSync('header'), res => {
        console.log('hasNoOrder', res)
        // _this.mqttClient()
      }, err => {
        console.log(err)
      })
    }


    wx.getSystemInfo({
      success: (res) => {
        this.setData({
          controls: [{
            id: 1,
            iconPath: '../../assets/images/location.png',
            position: {
              left: res.windowWidth - 60, // 单位px
              top: res.windowHeight - 350,
              width: 50, // 控件宽度/px
              height: 50,
            },
            clickable: true
          }, ],

        })
      }
    })
    this.mqttClient();

  },
  onReady() {
    if (this.data.opt.from === 'call') {
      clearInterval(this.countTimer);
      this.countInterval();
    }
  },

  onShow() {
    this.mqttClient()
  },


  onUnload() {
    wx.removeStorageSync('driverInfoMqtt')
    app.globalData.mqtt1001 = 0;
    app.globalData.mqtt1002 = 0;
    app.globalData.mqtt1007 = 0;
  },

  mqttClient() {
    let _this = this;
    let order = this.data.opt.orderNo || this.data.driver.orderNo || wx.getStorageSync('orderNo');
    let token = wx.getStorageSync('token') || '';

    app.globalData.client.on('reconnect', (error) => {
      console.log('正在重连...', )
    })

    app.globalData.client.on('connect', (connack) => {
      console.log('mqtt连接成功')
    })

    app.globalData.client.subscribe(app.globalData.pubTopic, (err, granted) => {
      console.log('订阅成功')
      http.postRequest("/carOrder/passenger/recoverOrder", '', wx.getStorageSync('header'), res => {
        if (res.success) {
          console.log('onshow,recoverOrder');
        }
      }, err => {
        console.log(err)
      })
    })
    app.globalData.client.on('message', (topic, message, packet) => {
      let msg = JSON.parse(Base64.decode(message.toString()));
      console.log(msg);

      if (msg.code) {
        this.setData({
          hasMqttMsg: true
        })
      }
      console.log("收到：", msg)

      if (msg.code == '1000') {
        let startDate = wx.getStorageSync('startDate')
        if (startDate && startDate !== '预约时间' && app.globalData.nowOrFutureId == 2) {
          this.setData({
            startDate
          })
        }
        // app.globalData.mqtt1000++;
        // if (app.globalData.mqtt1000 <= 1) {
        clearInterval(this.countTimer);
        console.log('清除定时器')
        wx.setNavigationBarTitle({
          title: '等待接驾',
        })
        wx.setStorageSync('driverInfoMqtt', msg.data);
        let driver = wx.getStorageSync('driverInfoMqtt');
        this.setData({
          isWaiting: false,
          driver,
          hideWalkTips: false,
          pathTips: false,
          startAddress: app.globalData.strAddress || msg.data.srcName,
          hasSit: false
        })
        // if(this.data.latOri !== this.data.driver.srcLat && this.data.latOri !== this.data.driver.srcLat){
        //   this.walking(this.data.latOri.toString(), this.data.lngOri.toString(),this.data.driver.srcLat.toString(),this.data.driver.srcLng.toString());
        // }else{
        this.driving(this.data.driver.currentLat.toString(), this.data.driver.currentLng.toString(), this.data.driver.srcLat.toString(), this.data.driver.srcLng.toString(), 'PICKUP,REAL_TRAFFIC', msg.data.bear, true)
        // }
      } else if (msg.code == '1001') {
        app.globalData.mqtt1001++;
        if (app.globalData.mqtt1001 <= 1) {
          wx.showModal({
            content: '车主已取消订单，请重新叫车',
            showCancel: false,
            confirmText: "确认",
            success(res) {
              wx.reLaunch({
                url: '/pages/index/index',
              })
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
            cancelColor: "#006eff",
            success(res) {
              if (res.confirm) {
                wx.showModal({
                  content: '您确定不等了吗？',
                  confirmText: "取消叫车",
                  confirmColor: "#999",
                  cancelText: "等待司机",
                  cancelColor: "#006eff",
                  success(res) {
                    console.log(res)
                    if (res.confirm) {
                      http.postRequest('/carOrder/passenger/disposeOrder?orderNo=' + order, {}, wx.getStorageSync('header'), res => {
                        console.log(res)
                        if (res.code === '1') {
                          clearInterval(_this.countTimer);
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
        // app.globalData.mqtt1003++;
        // if (app.globalData.mqtt1003 <= 1) {
        wx.setNavigationBarTitle({
          title: '司机已到达',
        })
        this.setData({
          isWaiting: false,
          pathTips: false,
          hasSit: false
        })

        this.walking(this.data.latOri.toString(), this.data.lngOri.toString(), this.data.driver.srcLat.toString(), this.data.driver.srcLng.toString())
        this.setData({
          cancleCont: '亲，司机已经到达上车地点，您确定要取消吗？',
          isWaiting: false,
          hideWalkTips: true,
        })
        // }
      } else if (msg.code == '1004') {
        let driver = wx.getStorageSync('driverInfoMqtt')
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
          })
          this.driving(msg.data.currentLat.toString(), msg.data.currentLng.toString(), driver.srcLat.toString(), driver.srcLng.toString(), 'TRIP,REAL_TRAFFIC', msg.data.bear, true);
        } else if (msg.data.state == 2) {
          wx.setNavigationBarTitle({
            title: '行程中',
          })
          this.setData({
            isWaiting: false,
            hideWalkTips: true,
            pathTips: true,
            totPrice: msg.data.amount,
            hasSit: true,
          })
          this.driving(msg.data.currentLat.toString(), msg.data.currentLng.toString(), app.globalData.endLatitude.toString() || this.data.driver.desLat.toString(), app.globalData.endLongitude.toString() || this.data.driver.desLng.toString(), 'TRIP,REAL_TRAFFIC', msg.data.bear, true);
        }
      } else if (msg.code == '1006') {
        app.globalData.mqtt1006++;
        // if (app.globalData.mqtt1006 <= 1) {
        wx.setNavigationBarTitle({
          title: '行程中',
        })
        wx.setStorageSync('driverInfoMqtt', msg.data);
        let driver = wx.getStorageSync('driverInfoMqtt');
        this.setData({
          driver,
          isWaiting: false,
          hideWalkTips: true,
          pathTips: true,
          hasSit: true,
          totPrice: msg.data.amount,
        })
        this.driving(msg.data.currentLat.toString(), msg.data.currentLng.toString(), msg.data.desLat.toString(), msg.data.desLng.toString(), 'TRIP,REAL_TRAFFIC', msg.data.bear, true)
        // }
      } else if (msg.code == '1005') {
        console.log('1005', msg.data);
        // app.globalData.mqtt1005++;
        // if (app.globalData.mqtt1005 <= 1) {
        wx.redirectTo({
          url: '/pages/travalEnd/travalEnd?resData=' + JSON.stringify(msg.data),
        })
        // }
      } else if (msg.code == '1007') {
        if (app.globalData.mqtt1007 <= 1) {
          app.globalData.mqtt1007++;
          wx.setStorageSync('driverInfoMqtt', msg.data);
          let driver = wx.getStorageSync('driverInfoMqtt');
          _this.setData({
            driver,
          })
          clearInterval(_this.countTimer);
          _this.countInterval();
          _this.driving(msg.data.srcLat.toString(), msg.data.srcLng.toString(), msg.data.desLat.toString(), msg.data.desLng.toString(), 'TRIP,REAL_TRAFFIC', 0);
          http.postRequest("/carOrder/passenger/lineValuation", {
            userLongitude: msg.data.srcLng,
            userLatitude: msg.data.srcLat,
            destinationLongitude: msg.data.desLng,
            destinationLatitude: msg.data.desLat,
            businessType: msg.data.businessType
          }, {
            'channel': 2, //请求来源 2-小程序
            'appChannel': wx.getStorageSync('systemInfo').model, //systemInfo.brand, //app渠道
            'platformType': 3, //systemInfo.platform,  //系统类型
            'sysVersion': wx.getStorageSync('systemInfo').system, //操作系统版本
            'token': token
          }, res => {
            _this.setData({
              has1007: true,
              totPrice: res.content[0].totalPrice,
              descPrice: res.content[0].preferentialPrice,
            })
          }, err => {
            console.log(err)
          })
        }

      }
    })
  },

  countInterval() {
    let curr = this.data.count >= 2 ? this.data.count : 0;
    let hasInterval = new Date(new Date(0, 0).getTime()+((this.data.count-2)*1000));
    let timer = this.data.count >= 2 ? hasInterval : new Date(0, 0);
    this.setData({
      count:curr
    })
    this.countTimer = setInterval(() => {
      this.setData({
        time: this.parseTime(timer.getMinutes()) + ":" + this.parseTime(timer.getSeconds()),
      });
      timer.setMinutes(curr / 60);
      timer.setSeconds(curr % 60);
      curr++;
      this.data.count++;
      if (this.data.count == 32) {
        this.setData({
          title_tips: '正在优先为您派单',
        })
      }
    }, 1000)
  },

  walking(str1, str2, end1, end2) {
    var _this = this;
    //调用距离计算接口
    qqmapsdk.direction({
      mode: 'walking', //可选值：'driving'（驾车）、'walking'（步行）、'bicycling'（骑行），不填默认：'driving',可不填
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
        console.log(res.result.routes[0]);
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
        //设置polyline属性，将路线显示出来,将解压坐标第一个数据作为起点
        let _points = [{
          latitude: str1,
          longitude: str2
        }, {
          latitude: end1,
          longitude: end2
        }];
        _this.setData({
          // latitude: pl[0].latitude,
          // longitude: pl[0].longitude,
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


  driving(str1, str2, end1, end2, policy, rotate, car) {
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
      policy,
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
        console.log(res.result.routes[0]);
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
        //设置polyline属性，将路线显示出来,将解压坐标第一个数据作为起点
        _this.setData({
          markers: []
        })
        _this.setData({
          // latitude: pl[0].latitude,
          // longitude: pl[0].longitude,
          polyline: [{
            points: pl,
            color: '#3091e0DD',
            width: 4,
            arrowLine: true
          }],
          distance,
          pathTime: time,
          markers: [{
            iconPath: car ? "../../assets/images/mapCart.png" : "../../assets/images/mapicon_navi_s.png",
            id: 0,
            latitude: str1,
            longitude: str2,
            width: 30,
            height: 30,
            rotate,
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
          padding: [80],
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
    let order = this.data.opt.orderNo || wx.getStorageSync('orderNo');
    this.setData({
      modalHidden: true
    })
    wx.showModal({
      content: '您确定取消吗？',
      confirmText: "取消叫车",
      confirmColor: "#999",
      cancelText: "等待司机",
      cancelColor: "#006eff",
      success(res) {
        if (res.confirm) {
          http.postRequest('/carOrder/passenger/disposeOrder?orderNo=' + order, {}, wx.getStorageSync('header'), res => {
            if (res.code === '1') {
              clearInterval(_this.countTimer);
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

  //等待司机
  modalConfirm() {
    console.log("继续等待")
    this.setData({
      modalHidden: true
    })

  },


  parseTime(time) {
    var time = time.toString();
    return time[1] ? time : '0' + time;
  },

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
    let order = this.data.opt.orderNo || this.data.driver.orderNo || wx.getStorageSync('orderNo');
    let _this = this;
    wx.showModal({
      content: "您确定不等了吗？",
      cancelText: "继续等待",
      confirmText: "取消叫车",
      cancelColor: "#006eff",
      confirmColor: "#999",
      success(res) {
        if (res.confirm) {
          http.postRequest('/carOrder/passenger/disposeOrder?orderNo=' + order, {}, wx.getStorageSync('header'), res => {
            if (res.code == '1') {
              clearInterval(_this.countTimer);
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
          _this.setData({
            modalHidden: true
          })
        }
      },
      fail(err) {
        console.log(err)
      }
    })
  },

  toService() {
    //登录返回客服电话
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
    // wx.showToast({
    //   title: '该功能即将上线，敬请期待',
    //   icon: 'none'
    // })
  },

})