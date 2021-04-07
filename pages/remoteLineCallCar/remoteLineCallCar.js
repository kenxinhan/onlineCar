import http from '../../utils/http';
const app = getApp();
let date = new Date();
let weekday = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
let currentHours = date.getHours();
let currentMinute = date.getMinutes();
let callCarTimer = null; // 防抖
let scanCallCarTimer = null; // 防抖
Page({
  data: {
    fromScan: false,
    scanLineList: null,
    startDate: "预约时间",
    multiArray: [
      ['今天', '明天', '后天'],
      [0, 1, 2, 3, 4, 5, 6],
      [0, 10, 20]
    ],
    multiIndex: [0, 0, 0],
    currentCity: null,
    lineItem: "",
    scanLineActiveIndex: 0,
    lineStartAddress: '',
    lineEndAddress: '',
    lineStartColor: '#999',
    lineEndColor: '#999',
    lineStartDate: '请选择时间',
    lineDateReq: 0,
    lineCurPerNum: 1,
    lineStartList: null,
    lineStartItem: null,
    lineEndItem: null,
    strContract: false,
    endContract: false,
    linePrice: 0,
    lineDescPrice: 0,
    stationType: 0,
    hasChooseLineTime: false,
    d40: null,
    scanDriverIdParams: null,
    scanCurrentLine: null,
    canShowCurAddress: false,
    dateReqInfo: null,
    agreementChecked: false,
    disableCall:true,
    showCoupon: false,
    isFromIcon: true,
    curCouponData: null,
    hasChooseId: null,
    exchangeItem: null,
    couponDescribe: "",
    reducePrice: "",
    isBack:false,
    lineAdcode:null,
    isCouponChoose:false,
    isReqLineInfo:true,
  },

  onLoad: function (opt) {
    console.log('远程：', opt)
    // 远程扫码进入
    if (opt['amp;businesstype'] === '3' || opt.businesstype === '3') {
      this.setData({
        fromScan: true,
        isReqLineInfo: true,
        scanDriverIdParams: opt.driver
      })
    } else if (opt.lineItem) {
      let lineItem = JSON.parse(opt.lineItem);
      console.log('远程线路：', lineItem);
      this.lineItemDateReq(lineItem.lineId);
    }

  },

  onShow: function () {
    console.log('show',this.data.isReqLineInfo)
    if (!this.data.fromScan) {
      this.setData({
        currentCity: app.globalData.lineStartCity,
        lineStartAddress: app.globalData.lineStartAddress || this.data.lineItem && this.data.lineItem.startName ,
        lineEndAddress: app.globalData.lineEndAddress || this.data.lineItem && this.data.lineItem.endName,
      })
      if (this.data.fromStartDetail) this.lineStrContrast();
      if (this.data.fromEndDetail) this.lineEndContrast();
      this.dateReq()
    } else {
      this.setData({
        lineCurPerNum: 1
      })
      if(this.data.isReqLineInfo){
        this.scanDriverInfoReq()
      }
    }

    this.checkIntegral();
  },

  onReady() {
    if (app.globalData.startCityAdcode && (this.data.lineItem && app.globalData.startCityAdcode == this.data.lineItem.startRegionalCode)) {
      this.setData({
        lineStartAddress: app.globalData.strAddress,
        canShowCurAddress: true
      })
      app.globalData.lineStartAddress = app.globalData.strAddress;
      app.globalData.lineStartLat = app.globalData.strLatitude;
      app.globalData.lineStartLng = app.globalData.strLongitude;
    }
  },

  // 扫码司机信息
  scanDriverInfoReq() {
    let header = wx.getStorageSync('header');
    if (header) header.channel = 6;
    http.postRequest('/v1/qrCode/createRemoteOrder?driverIdNo=' + this.data.scanDriverIdParams, '', header, res => {
      console.log('扫码乘车信息：', res)
      if (res.content.pageType == 2) {
        wx.showModal({
          content: res.content.message,
          showCancel: false,
          success() {
            wx.redirectTo({
              url: '/pages/index/index?from=scanFullToLine',
            })
          }
        })
      } else {
        this.setData({
          scanLineList: res.content,
          scanCurrentLine: res.content[0],
          linePrice: res.content[0].singlePrice,
          lineDescPrice: res.content[0].virtualPrice,
          reducePrice: res.content[0].reducePrice,
        })

        if(res.content[0].couponId && res.content[0].couponDescribe){
          this.setData({
            curCouponData: {
              couponId: res.content[0].couponId,
              couponDescribe: res.content[0].couponDescribe
            },
            isCouponChoose:true
          })
        }
      }
    }, err => {
      console.log(err)
    })
  },

  // 点击某一条线路
  scanLineItemClick(e) {
    let dataset = e.currentTarget.dataset;
    console.log(dataset)
    this.setData({
      scanLineActiveIndex: dataset.index,
      linePrice: dataset.item.singlePrice,
      lineDescPrice: dataset.item.virtualPrice,
      scanCurrentLine: dataset.item,
      lineCurPerNum: 1
    })
  },

  // 扫码远程下单
  scanLineCallCar() {
    if (!this.data.disableCall && this.data.scanCurrentLine) {
      let _this = this;
      let header = wx.getStorageSync('header');
      if (header) header.channel = 6;
      let scanPayParams = {
        driverId: this.data.scanCurrentLine.driverId,
        remoteLineId: this.data.scanCurrentLine.lineId,
        remoteFerryLineId: this.data.scanCurrentLine.remoteFerryLineId,
        rideNumber: this.data.lineCurPerNum,
        couponId:(this.data.curCouponData && this.data.curCouponData.couponId) || 0
      }
      if (scanCallCarTimer) clearTimeout(scanCallCarTimer);
      scanCallCarTimer = setTimeout(() => {
        http.postRequest('/v1/qrCode/paymentByBus', scanPayParams, header, res => {
          console.log('远程扫码下单：', res)
          if (res.content.pageType == 1) {
            wx.showModal({
              content: res.content.message,
              showCancel: false,
              success() {
                _this.scanDriverInfoReq()
              }
            })
          } else if (res.content.pageType == 2) {
            wx.showModal({
              content: res.content.message,
              showCancel: false,
              success() {
                wx.redirectTo({
                  url: '/pages/index/index?from=scanFullToLine',
                })
              }
            })
          } else {
            if (res.content.isOrder == 1) {
              wx.showModal({
                content: "您当前存在未支付完成的订单",
                confirmText: "继续支付",
                confirmColor: "#FF8008",
                cancelText: "取消支付",
                cancelColor: "#999",
                success(res2) {
                  if (res2.cancel) {
                    _this.cancleOrderPay(res.content.orderNo);
                  } else {
                    _this.scanLinePay(res.content.orderNo)
                  }
                }
              })
            } else if (res.content.isOrder == 0) {
              _this.scanLinePay(res.content.orderNo)
            }
          }
        }, err => {
          console.log(err)
        })
      }, 500);
    }
  },

  cancleOrderPay(order) {
    http.postRequest("/v1/qrCode/cancelPayment?orderNo=" + order, "", wx.getStorageSync('header'), res => {}, err => {
      console.log(err)
    })
  },

  // 扫码远程支付
  scanLinePay(order) {
    let header = wx.getStorageSync('header');
    if (header) header.channel = 6;
    this.setData({
      isReqLineInfo:false
    })
    http.postRequest('/v1/wx/applet/order/advancePay?orderNo=' + order, '', header, res => {
      console.log('远程扫码支付：', res)
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
              wx.redirectTo({
                url: '/driving_status/pages/orderService/orderService?from=scanLine&orderNo=' + order,
              })
            }
          })
        },
        fail(err) {
          console.log(err)
        }
      })
    }, err => {
      console.log(err)
    })
  },

  // 时间限制请求
  dateReq() {
    let url = '/v2/passenger/charteredCar/getTime?businessType=6';
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
      // if(){
      // data.multiArray = []
      // }
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

    if (data.multiIndex[0] === 0 && date.getHours() == 23 && date.getMinutes() >= 50) {
      data.multiArray[0][0] = '';
      data.multiIndex[0] = 1;
      this.loadHoursMinute(hours, minute);
      hours = hours.map(val => {
        return val + '点'
      })
      data.multiArray[1] = hours;
      this.setData(data);
    }
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

    if (data.multiIndex[0] === 0 && date.getHours() == 23 && date.getMinutes() >= 50) {
      data.multiArray[2] = [];
      this.setData(data);
    }
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
      globalMonthDay = date.getFullYear() + '-' + month + "-" + day;
    } else if (monthDay.split(' ')[1] === "明天") {
      var date1 = new Date(date);
      date1.setDate(date.getDate() + 1);
      monthDay = (date1.getMonth() + 1) + "月" + date1.getDate() + "日";
      globalMonthDay = date.getFullYear() + '-' + (date1.getMonth() + 1) + "-" + date1.getDate();

    } else if (monthDay.split(' ')[1] === "后天") {
      var date2 = new Date(date);
      date2.setDate(date.getDate() + 2);
      monthDay = (date2.getMonth() + 1) + "月" + date2.getDate() + "日";
      globalMonthDay = date.getFullYear() + '-' + (date2.getMonth() + 1) + "-" + date2.getDate();

    } else {
      var month = monthDay.split("月")[0]; // 返回月
      var day = monthDay.split("月")[1].split("日")[0]; // 返回日
      globalMonthDay = date.getFullYear() + '-' + month + "-" + day;
    }
    let resHours = parseInt(hours) < 10 ? '0' + parseInt(hours) : parseInt(hours);
    let resMinute = parseInt(minute) < 10 ? '0' + parseInt(minute) : parseInt(minute);
    var globalStartDate = globalMonthDay + " " + resHours + ":" + resMinute;
    that.lineTimeReq(globalStartDate);
  },

  // 点击乘车人数
  clickPerNum(e) {
    let num = e.currentTarget.dataset.num;
    this.setData({
      lineCurPerNum: num
    })
    this.changePersonReqPrice()
  },

  // 重新选择线路
  reChooseLine() {
    wx.navigateBack()
  },

  // 远程起点选择
  lineDetailStr() {
    wx.navigateTo({
      url: '/pages/starting/starting?from=fixedLine',
    })
  },

  // 远程终点选择
  lineDetailEnd() {
    wx.navigateTo({
      url: '/pages/destination/destination?from=fixedLine',
    })
  },


  // 线路起点对比是否一个区域
  lineStrContrast() {
    let _this = this;
    let lat = app.globalData.lineStartLat || this.data.lineItem.startLat;
    let lng = app.globalData.lineStartLng || this.data.lineItem.startLng;
    if (this.data.canShowCurAddress) {
      lat = app.globalData.strLatitude;
      lng = app.globalData.strLongitude;
    }
    let code = this.data.lineItem.startRegionalCode;
    let url = "/v2/passenger/remote/verifyRange?lat=" + lat + "&lng=" + lng + "&code=" + code;
    http.postRequest(url, '', wx.getStorageSync('header'), res => {
      if (res.code == 1 && res.content) {
        this.setData({
          strContract: true
        })
        this.linePriceReq()
      } else {
        wx.showModal({
          content: res.message,
          showCancel: false,
          success(res) {
            _this.setData({
              lineStartAddress: _this.data.lineItem.startName
            })
            app.globalData.lineStartAddress = '';
            app.globalData.lineStartLat = '';
            app.globalData.lineStartLng = '';
          }
        })

      }
    }, err => {
      console.log(err)
    })
  },

  // 线路终点对比是否一个区域
  lineEndContrast() {
    let _this = this;
    let lat = app.globalData.lineEndLat || this.data.lineItem.endLat;
    let lng = app.globalData.lineEndLng || this.data.lineItem.endLng;
    let code = this.data.lineItem.endRegionalCode;
    let url = "/v2/passenger/remote/verifyRange?lat=" + lat + "&lng=" + lng + "&code=" + code;
    http.postRequest(url, '', wx.getStorageSync('header'), res => {
      if (res.code == 1 && res.content) {
        this.setData({
          endContract: true
        })
        this.linePriceReq()
      } else {
        wx.showModal({
          content: res.message,
          showCancel: false,
          success(res) {
            _this.setData({
              lineEndAddress: _this.data.lineItem.endName
            })
            app.globalData.lineEndAddress = '';
            app.globalData.lineEndLat = '';
            app.globalData.lineEndLng = '';
          }
        })
      }
    }, err => {
      console.log(err)
    })
  },

  // 远程时间范围请求
  lineTimeReq(time) {
    let timeReq = new Date(time.replace(/-/g, '/')).getTime();
    console.log('时间戳：', timeReq)
    http.postRequest("/v2/passenger/remote/timeVerification?appointmentTime=" + timeReq, '', wx.getStorageSync('header'), res => {
      console.log('远程时间请求：', res)
      if (res.code == 1) {
        this.setData({
          checkLineTime: true,
          lineStartDate: time,
          hasChooseLineTime: true,
          lineDateReq: timeReq
        })
      }
    }, err => {
      console.log(err)
    })
  },

  // 远程下单
  lineCallCar() {
    if (!this.data.disableCall) {
      if (this.data.lineStartDate !== '请选择时间') {
        let strLat, strLng;
        if (this.data.canShowCurAddress) {
          strLat = app.globalData.strLatitude;
          strLng = app.globalData.strLongitude;
        } else {
          strLat = app.globalData.lineStartLat || this.data.lineItem.startLat;
          strLng = app.globalData.lineStartLng || this.data.lineItem.startLng;
        }
        let reqData = {
          plan: 3,
          businessType: this.data.lineItem.businessType,
          startAddress: this.data.lineStartAddress,
          endAddress: this.data.lineEndAddress,
          rideNumber: this.data.lineCurPerNum,
          appointmentTime: this.data.lineDateReq,
          remoteLineId: this.data.lineItem.lineId,
          remoteStartLng: strLng,
          remoteStartLat: strLat,
          remoteEndLng: app.globalData.lineEndLng || this.data.lineItem.endLng,
          remoteEndLat: app.globalData.lineEndLat || this.data.lineItem.endLat,
          couponId:(this.data.curCouponData && this.data.curCouponData.couponId) || 0
        }
        if (callCarTimer) clearTimeout(callCarTimer);
        callCarTimer = setTimeout(() => {
          http.postRequest('/v1/carOrder/passenger/getRentCar', reqData, wx.getStorageSync('header'), (res) => {
            if (res.code === '1') {
              if (res.content.canPlaceOrder) {
                wx.setStorageSync('lineOrderNo', res.content.orderNo);
                wx.redirectTo({
                  url: '/driving_status/pages/orderService/orderService?from=fixedLine&orderInfo=' + JSON.stringify(res.content),
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
          }, (err) => {
            console.log(err)
          })
        }, 500);
      } else {
        wx.showModal({
          content: '请选择时间',
          showCancel: false
        })
      }
    }
  },

  agreementChange(e) {
    this.setData({
      disableCall: !this.data.disableCall
    })
  },
  
  //积分兑换
  showSlideCoupon() {
    console.log('showSlideCoupon');
    let lineId,cityCode;
    if(this.data.fromScan){
      lineId = this.data.scanCurrentLine.lineId;
      cityCode = this.data.scanCurrentLine.startRegionalCode.substr(0,6);
    }else{
      lineId = this.data.lineItem.lineId;
      cityCode = this.data.lineAdcode.substr(0,6);
      console.log(cityCode);
    }

    let slideCouponParams = {
      businessType:6,
      lineId,
      rideNumber:this.data.lineCurPerNum,
      cityCode
    }
    let data = {
      businessType:6,
      cityCode,
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
      couponDescribe: e.detail.data.couponDescribe,
      linePrice: e.detail.data.singlePrice,
      lineDescPrice: e.detail.data.virtualPrice,
      reducePrice: e.detail.data.reducePrice,
      isCouponChoose:e.detail.isChoose
    })
  },

  //选择优惠券
  chooseCoupon() {
    console.log('chooseCoupon');
    let lineId,cityCode;
    if(this.data.fromScan){
      lineId = this.data.scanCurrentLine.lineId;
      cityCode = this.data.scanCurrentLine.startRegionalCode.substr(0,6);
    }else{
      lineId = this.data.lineItem.lineId;
      cityCode = this.data.lineAdcode.substr(0,6);
    }
    if (this.data.curCouponData) {
      this.setData({
        hasChooseId: this.data.curCouponData.couponId
      })
    }
    let slideCouponParams = {
      businessType:6,
      lineId,
      rideNumber:this.data.lineCurPerNum,
      cityCode
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

  // 改变人数请求优惠券价格
  changePersonReqPrice(){
    let lineId,cityCode;
    if(this.data.fromScan){
      lineId = this.data.scanCurrentLine.lineId;
      cityCode = this.data.scanCurrentLine.startRegionalCode;
    }else{
      lineId = this.data.lineItem.lineId;
      cityCode = app.globalData.startCityAdcode;
    }
    let url = "/v2/passenger/integral/updateRemotemNumber";
    let data = {
      lineId,
      rideNumber:this.data.lineCurPerNum,
      cityCode,
      isCoupon:this.data.isCouponChoose ? 1 : 0,
    }
    http.postRequest(url,data,wx.getStorageSync('header'),res=>{
      this.setData({
        linePrice:res.content.singlePrice,
        lineDescPrice:res.content.virtualPrice,
        reducePrice:res.content.reducePrice,
        curCouponData: {
          couponId: res.content.couponId,
          couponDescribe: res.content.couponDescribe
        },
      })
    },err=>{
      console.log(err)
    })
  },

  lineItemDateReq(id){
    if(id){
      http.postRequest("/v2/passenger/remote/getBaseLineByLineId?lineId="+id,"",wx.getStorageSync('header'),res=>{
        let lineItem =res.content;
        if (!app.globalData.startCityAdcode && app.globalData.startCityAdcode != lineItem.startRegionalCode) {
          this.setData({
            lineStartAddress: lineItem.startName,
            canShowCurAddress: false
          })
        }else{
          this.setData({
            lineStartAddress: app.globalData.lineStartAddress || lineItem.startName,
          })
        }
        
        if(lineItem.couponId && lineItem.couponDescribe){
          this.setData({
            curCouponData: {
              couponId: lineItem.couponId,
              couponDescribe: lineItem.couponDescribe
            },
            isCouponChoose:true
          })
        }

        if(!this.data.lineAdcode){
          this.setData({
            lineAdcode:lineItem.startRegionalCode
          })
        }

        this.setData({
          lineItem,
          lineEndAddress: lineItem.endName,
          linePrice: lineItem.singlePrice,
          lineDescPrice: lineItem.virtualPrice,
          reducePrice: lineItem.reducePrice,
        })
      },err=>{
        console.log(err)
      })
    }
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