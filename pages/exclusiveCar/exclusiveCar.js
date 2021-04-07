import http from '../../utils/http';
const app = getApp();
let date = new Date();
let weekday = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
let currentHours = date.getHours();
let currentMinute = date.getMinutes();
let callCarTimer = null;

Page({

  data: {
    timeMode: true,
    lineMode: false,
    lineInfo: null,
    needBack: false,
    notBack: false,
    reqId: null,
    curCity: '',
    startDate: '请选择时间',
    multiArray: [
      ['今天', '明天', '后天'],
      [0, 1, 2, 3, 4, 5, 6],
      [0, 10, 20]
    ],
    multiIndex: [0, 0, 0],
    rangeArray: [{
        "id": 1,
        "rulesName": "5小时100公里"
      },
      {
        "id": 2,
        "rulesName": "2小时100里"
      }
    ],
    rangeIdx: 0,
    needDateNum: 1,
    maxPeopleNum: '',
    strAddress: '',
    lat: null,
    lng: null,
    strLineName: '',
    endLineName: '',
    realPrice: 0,
    delPrice: 0,
    timeStamp: null,
    dateReqInfo: null,
    showCoupon: false,
    isFromIcon: true,
    curCouponData: null,
    hasChooseId: null,
    exchangeItem: null,
    couponDescribe: "",
    reducePrice: "",
    isBack: false,
    lineAdcode: null,
    isCouponChoose:0
  },

  onLoad(opt) {
    let lineInfoTemp = JSON.parse(opt.lineInfo);
    console.log('包车线路信息：', lineInfoTemp);
    if (lineInfoTemp.lineType == 5) { // 线路
      this.setData({
        timeMode: false,
        lineMode: true,
      })
    } else if (lineInfoTemp.lineType == 6) { // 时间
      this.setData({
        timeMode: true,
        lineMode: false,
      })
    }

    this.setData({
      curCity: app.globalData.originCity,
      reducePrice: lineInfoTemp.reducePrice,
    })

    this.lineListReq(lineInfoTemp);
  },

  onShow() {
    this.checkIntegral()
    this.dateReq();
  },

  showStrAddress() {
    console.log('GL:', app.globalData);
    if (this.data.lineInfo.cityCode != app.globalData.startCityAdcode) {
      this.setData({
        strAddress: this.data.lineInfo.startName,
        lat: this.data.lineInfo.startLat,
        lng: this.data.lineInfo.startLng,
      })
    } else {
      this.setData({
        strAddress: app.globalData.EXCStartAddress || app.globalData.strAddress,
        lat: app.globalData.EXCStartLat || app.globalData.strLatitude,
        lng: app.globalData.EXCStartLng || app.globalData.strLongitude,
      })
    }
  },

  desNum() {
    if (this.data.lineInfo.lineType == 6) {
      if (this.data.needDateNum <= 1) {

      } else {
        this.setData({
          needDateNum: this.data.needDateNum - 1
        })
        this.changePriceByDateNum(this.data.reqId, this.data.needDateNum);
      }
    }
  },

  addNum() {
    if (this.data.lineInfo.lineType == 6) {
      if (this.data.needDateNum >= this.data.lineInfo.maxDayNumber) {
        wx.showToast({
          icon: 'none',
          title: `包车天数最多只能${this.data.lineInfo.maxDayNumber}天`,
        })
      } else {
        this.setData({
          needDateNum: this.data.needDateNum + 1
        })
        this.changePriceByDateNum(this.data.reqId, this.data.needDateNum);
      }
    }
  },

  switchStatus(e) {
    let checked = e.detail.value;
    if (checked) {
      this.setData({
        reqId: this.data.lineInfo.reverseLineId,
        hasChecked:true
      })
      if (this.data.curCouponData) {
        this.setData({
          realPrice: this.data.curCouponData.reverseSinglePrice,
          delPrice: this.data.curCouponData.reverseVirtualPrice,
          reducePrice: this.data.curCouponData.reverseReducePrice,
          couponDescribe: this.data.curCouponData.reverseCouponDescribe,
        })
      } else {
        this.setData({
          realPrice: this.data.lineInfo.reverseSinglePrice,
          delPrice: this.data.lineInfo.reverseVirtualPrice,
          reducePrice: this.data.lineInfo.reverseReducePrice,
          couponDescribe: this.data.lineInfo.reverseCouponDescribe,
        })
      }
    } else {
      this.setData({
        reqId: this.data.lineInfo.id,
      })
      if (this.data.curCouponData) {
        this.setData({
          realPrice: this.data.curCouponData.singlePrice,
          delPrice: this.data.curCouponData.virtualPrice,
          reducePrice: this.data.curCouponData.reducePrice,
          couponDescribe: this.data.curCouponData.couponDescribe,
        })
      } else {
        this.setData({
          realPrice: this.data.lineInfo.singlePrice,
          delPrice: this.data.lineInfo.virtualPrice,
          reducePrice: this.data.lineInfo.reducePrice,
          couponDescribe: this.data.lineInfo.couponDescribe,
        })
      }
    }
    console.log('id:', this.data.reqId)
  },


  reChooseLine() {
    wx.navigateBack()
  },

  chooseStrAddress() {
    wx.navigateTo({
      url: '/pages/starting/starting?from=exclusiveCar',
    })
  },

  loneTimeChoose(e) {
    console.log(e)
    let val = parseInt(e.detail.value);
    console.log('val', val)
    this.setData({
      rangeIdx: e.detail.value,
      reqId: this.data.rangeArray[val].rulesId,
      needDateNum: 1
    })
    let params = {
      id: this.data.rangeArray[val].rulesId,
      lineType: 6
    }
    this.lineListReq(params);
    this.changePriceByDateNum(this.data.rangeArray[val].rulesId, 1);
  },

  // 时间限制请求
  dateReq() {
    let url = '/v2/passenger/charteredCar/getTime?businessType=9';
    http.postRequest(url, '', wx.getStorageSync('header'), res => {
      this.setData({
        dateReqInfo: res.content
      })
    }, err => {
      console.log(err)
    })
  },

  // 请求包车信息
  lineListReq(params) {
    let url = `/v2/passenger/charteredCar/getLineInfo?id=${params.id}&lineType=${params.lineType}`;
    http.postRequest(url, '', wx.getStorageSync('header'), res => {
      this.setData({
        lineInfo: res.content,
        reqId: res.content.id,
        realPrice: res.content.singlePrice,
        delPrice: res.content.virtualPrice,
        reducePrice: res.content.reducePrice,
        needDateNum: 1,
      })
      if (res.content.couponDescribe) {
        this.setData({
          hasChooseId: res.content.couponId,
          couponDescribe: res.content.couponDescribe,
          isCouponChoose:1
        })
      }
      if (res.content.lineType == 5) { // 线路
        this.setData({
          strLineName: res.content.startStationName,
          endLineName: res.content.endStationName,
          maxPeopleNum: res.content.maxRideNumber,
        })
        if (res.content.reverseLineId == 0) {
          this.setData({
            notBack: true,
          })
        }
      } else if (res.content.lineType == 6) { // 时间
        let cur = res.content.rulesList.filter((val) => {
          return res.content.rulesName === val.rulesName;
        })
        let temp = Object.keys(res.content.rulesList);
        let index;
        for (let i = 0; i < temp.length; i++) {
          if (res.content.rulesList[i].rulesId == cur[0].rulesId) {
            index = i
          }
        }
        this.setData({
          needDateNum: res.content.number,
          maxPeopleNum: res.content.maxRideNumber,
          rangeArray: res.content.rulesList,
          rangeIdx: index
        })
      }
      if (!this.data.lineAdcode) {
        this.setData({
          lineAdcode: res.content.cityCode
        })
      }
      this.showStrAddress();
      this.checkStartAddress();
    }, err => {
      console.log(err)
    })
  },

  // 修改包车天数价格变动
  changePriceByDateNum(id, num) {
    let url = `/v2/passenger/charteredCar/updateDayNumber?id=${id}&number=${num}&isCoupon=${this.data.isCouponChoose}`;
    http.postRequest(url, '', wx.getStorageSync('header'), res => {
      this.setData({
        reqId: res.content.id,
        realPrice: res.content.singlePrice,
        delPrice: res.content.virtualPrice,
        reducePrice: res.content.reducePrice,
        couponDescribe: res.content.couponDescribe,
      })
    }, err => {
      console.log(err)
    })
  },

  // 检测上车点区域
  checkStartAddress() {
    let _this = this;
    let url = `/v2/passenger/charteredCar/verifyRange?lng=${this.data.lng}&lat=${this.data.lat}&code=${this.data.lineInfo.cityCode}`;
    http.postRequest(url, '', wx.getStorageSync('header'), res => {
      if (!res.content) {
        wx.showToast({
          title: res.message,
          icon: 'none',
          success() {
            // _this.showStrAddress();
            _this.setData({
              strAddress: _this.data.lineInfo.startName,
              lat: _this.data.lineInfo.startLat,
              lng: _this.data.lineInfo.startLng,
            })
          }
        })
      }
    }, err => {
      console.log(err)
    })
  },

  // 时间范围是否合法
  lineTimeReq(time, startDate) {
    let timeReq = new Date(time).getTime();
    console.log('时间戳：', timeReq)
    http.postRequest("/v2/passenger/charteredCar/timeVerification?appointmentTime=" + timeReq, '', wx.getStorageSync('header'), res => {
      console.log('远程时间请求：', res)
      if (res.code == 1) {
        this.setData({
          startDate,
          timeStamp: timeReq
        })
      }
    }, err => {
      console.log(err)
    })
  },

  // 下单
  callCar() {
    let _this = this;
    let data = {
      id: this.data.reqId,
      startLng: this.data.lng,
      startLat: this.data.lat,
      startAddress: this.data.strAddress,
      appointmentTime: this.data.timeStamp,
      lineType: this.data.lineInfo.lineType,
      cityCode: this.data.lineInfo.cityCode,
      couponId: (this.data.curCouponData && this.data.curCouponData.couponId) || 0
    }
    if (this.data.startDate !== '请选择时间') {
      if (callCarTimer) clearTimeout(callCarTimer);
      callCarTimer = setTimeout(() => {
        http.postRequest('/v2/passenger/charteredCar/getRentCar', data, wx.getStorageSync('header'), res => {
          if (res.content.canPlaceOrder) {
            if (res.content.isOrder == 1) {
              wx.showModal({
                content: "您当前存在未支付完成的订单",
                confirmText: "继续支付",
                confirmColor: "#FF8008",
                cancelText: "取消支付",
                cancelColor: "#999",
                success(res2) {
                  if (res2.cancel) {
                    _this.cancleOrderPay();
                  } else {
                    _this.payReq(res.content)
                  }
                }
              })
            } else if (res.content.isOrder == 0) {
              this.payReq(res.content)
            }
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
        }, err => {
          console.log(err)
        })
      }, 800)
    }
  },

  cancleOrderPay() {
    http.postRequest("/v2/passenger/charteredCar/cancelPreOrder", "", wx.getStorageSync('header'), res => {}, err => {
      console.log(err)
    })
  },

  // 支付
  payReq(data) {
    let _this = this;
    http.postRequest('/v1/wx/applet/order/charteredCar/pay?orderNo=' + data.orderNo, '', wx.getStorageSync('header'), res => {
      if (res.code === '1') {
        wx.requestPayment({
          nonceStr: res.content.nonceStr,
          package: res.content.package,
          paySign: res.content.paySign,
          timeStamp: res.content.timeStamp,
          signType: res.content.signType,
          success(res) {
            _this.checkHasOrder(data)
          },
          fail(err) {
            console.log(err)
          }
        })
      }
    }, err => {
      console.log(err)
    })
  },

  checkHasOrder(data) {
    http.getRequest("/v1/passenger/center/orderDetail?orderNo=" + data.orderNo + "&businessType=9", "", wx.getStorageSync('header'), res => {
      console.log('调用支付成功：', res)
      if (res.code == 1) {
        wx.showToast({
          title: '支付成功',
          duration: 2000,
          success() {
            wx.redirectTo({
              url: '/driving_status/pages/orderService/orderService?from=exclusiveCar&orderInfo=' + JSON.stringify(data),
            })
          }
        })
      }
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
    var tempDate = monthDay.split(' ')[1];

    if (monthDay.split(' ')[1] === "今天") {
      var month = date.getMonth() + 1;
      var day = date.getDate();
      monthDay = month + "月" + day + "日";
      globalMonthDay = date.getFullYear() + '/' + month + "/" + day;
    } else if (monthDay.split(' ')[1] === "明天") {
      var date1 = new Date(date);
      date1.setDate(date.getDate() + 1);
      monthDay = (date1.getMonth() + 1) + "月" + date1.getDate() + "日";
      globalMonthDay = date.getFullYear() + '/' + (date1.getMonth() + 1) + "/" + date1.getDate();

    } else if (monthDay.split(' ')[1] === "后天") {
      var date2 = new Date(date);
      date2.setDate(date.getDate() + 2);
      monthDay = (date2.getMonth() + 1) + "月" + date2.getDate() + "日";
      globalMonthDay = date.getFullYear() + '/' + (date2.getMonth() + 1) + "/" + date2.getDate();

    } else {
      var month = monthDay.split("月")[0]; // 返回月
      var day = monthDay.split("月")[1].split("日")[0]; // 返回日
      globalMonthDay = date.getFullYear() + '/' + month + "/" + day;
    }
    let resHours = parseInt(hours) < 10 ? '0' + parseInt(hours) : parseInt(hours);
    let resMinute = parseInt(minute) < 10 ? '0' + parseInt(minute) : parseInt(minute);
    if (tempDate === "今天" || tempDate === "明天" || tempDate === "后天") {
      var startDate = monthDay + " " + tempDate + " " + resHours + ":" + resMinute;
    } else {
      var startDate = monthDay + " " + resHours + ":" + resMinute;
    }
    var globalStartDate = globalMonthDay + " " + resHours + ":" + resMinute;
    this.lineTimeReq(globalStartDate, startDate);
  },


  showSlideCoupon() {
    let lineId;
    if(this.data.reqId){
      lineId = this.data.reqId
    }else{
      lineId = this.data.lineInfo.id
    }
    let slideCouponParams = {
      businessType: 9,
      lineType: this.data.lineInfo.lineType,
      cityCode: this.data.lineAdcode.substr(0,6),
      lineId
    }
    let data = {
      businessType: 9,
      cityCode: this.data.lineAdcode.substr(0,6),
      pageSize: 20,
      currentPage: 1,
    }
    http.postRequest("/v2/passenger/integral/verifyChangeCoupon", data, wx.getStorageSync('header'), res => {
      if (res.content.change) {
        this.setData({
          showCoupon: true,
          isFromIcon: true,
          slideCouponParams
        })
      } else {
        this.setData({
          showIntegralExchangeModal: true,
          abnormalData: res.content.describe
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
    if(this.data.hasChecked){
      this.setData({
        realPrice: e.detail.data.reverseSinglePrice,
        delPrice: e.detail.data.reverseVirtualPrice,
        reducePrice: e.detail.data.reverseReducePrice,
        couponDescribe: e.detail.data.reverseCouponDescribe,
      })
    }else{
      this.setData({
        couponDescribe: e.detail.data.couponDescribe,
        delPrice: e.detail.data.virtualPrice,
        realPrice: e.detail.data.singlePrice,
        reducePrice: e.detail.data.reducePrice,
      })
    }
    this.setData({
      curCouponData: e.detail.data,
      isCouponChoose:e.detail.isChoose ? 1 : 0
    })
  },

  chooseCoupon() {
    if (this.data.curCouponData) {
      if(this.data.hasChecked){
        this.setData({
          hasChooseId: this.data.curCouponData.reverseCouponId
        })
      }else{
        this.setData({
          hasChooseId: this.data.curCouponData.couponId
        })
      }
    }
    let lineId;
    if(this.data.reqId){
      lineId = this.data.reqId
    }else{
      lineId = this.data.lineInfo.id
    }
    let slideCouponParams = {
      businessType: 9,
      lineType: this.data.lineInfo.lineType,
      cityCode: this.data.lineAdcode.substr(0,6),
      lineId
    }
    this.setData({
      showCoupon: true,
      isFromIcon: false,
      slideCouponParams
    })
  },

  onExchangeItem(e) {
    console.log(e.detail)
    this.setData({
      exchangeItem: e.detail,
      showIntegralExchangeModal: true
    })
  },

  CoverState(e) {
    this.setData({
      showIntegralExchangeModal: e.detail
    })
  },

  checkIntegral() {
    http.postRequest("/v2/passenger/integral/verifyIntegralOrder", "", wx.getStorageSync('header'), res => {
      if (res.content.showDialog == 1) {
        this.setData({
          showIntegralExchangeModal: true,
          isBack: true,
          abnormalData: res.content.describe
        })
      }
    })
  },
})