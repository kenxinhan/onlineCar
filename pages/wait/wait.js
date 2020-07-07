import http from '../../utils/http.js';
import {
  Base64
} from 'js-base64';
var QQMapWX = require('../../libs/qqmap-wx-jssdk.js');
var qqmapsdk;
qqmapsdk = new QQMapWX({
  key: 'ACZBZ-XOJRU-AKQVD-BDUEX-2WJSZ-Y4BNN'
});

var util = require('../../utils/util.js');
const app = getApp()
Page({
  data: {
    longitude: '',
    latitude: '',
    polyline: [],
    markers: [],
    controls: [],
    scale: '14',
    title_tips: '30秒无应答优先为您派单',
    progress_txt: '已等待',
    count: 0,
    randomTime: 30, //从后台获取时间
    waitTimer: null,
    time: '00:00',
  },

  onLoad() {
    // var latOri = app.globalData.originLatitude;
    // var lngOri = app.globalData.originLongitude;
    // var latStr = app.globalData.strLatitude;
    // var lngStr = app.globalData.strLongitude;
    // var latEnd = app.globalData.endLatitude;
    // var lngEnd = app.globalData.endLongitude;
    // console.log(latOri)
    // console.log(lngOri)
    // console.log(latStr)
    // console.log(lngStr)
    // console.log(latEnd)
    // console.log(lngEnd)
    // app.globalData.client.publish(app.globalData.pubTopic, "2333333333333")
    // console.log(app.globalData.pubTopic)
  },

  parseTime(time) {
    var time = time.toString();
    return time[1] ? time : '0' + time;
  },


  countInterval(msg) {
    var curr = 0;
    var timer = new Date(0, 0);
    this.countTimer = setInterval(() => {
      if (this.data.count <= this.data.randomTime) {
        this.setData({
          time: this.parseTime(timer.getMinutes()) + ":" + this.parseTime(timer.getSeconds()),
        });
        timer.setMinutes(curr / 60);
        timer.setSeconds(curr % 60);
        curr++;
        this.drawProgress(this.data.count / (60 / 2))
        this.data.count++;
        if (this.data.count == 32) {
          this.setData({
            title_tips: '正在优先为您派单',
          })
        }
        if (msg && msg.code === '1000') {
          this.setData({
            progress_txt: "匹配成功"
          });
          clearInterval(this.countTimer);
          wx.redirectTo({
            url: "/pages/orderService/orderService?driverInfo=" + JSON.stringify(msg.data),
          });
        }
      } else {
        this.setData({
          progress_txt: "匹配成功"
        });
        // wx.redirectTo({
        //   url: "/pages/orderService/orderService",
        // });
        clearInterval(this.countTimer);
      }
    }, 1000)
  },

  drawProgressbg() {
    var ctx = wx.createCanvasContext('canvasProgressbg');
    ctx.setLineWidth(4);
    ctx.setStrokeStyle("#e5e5e5");
    ctx.setLineCap("round");
    ctx.beginPath();
    ctx.arc(110, 110, 100, 0, 2 * Math.PI, false);
    ctx.stroke();
    ctx.draw();
  },
  onShow() {
    this.setData({
      address: app.globalData.strAddress,
    })
  },
  onReady() {
    this.drawProgressbg();
    app.globalData.client.on('message', (topic, message, packet) => {
      // console.log(message.toString())
      let msg = JSON.parse(message.toString());
      // let msg = JSON.parse(Base64.decode(message.toString()));
      console.log("收到：", msg)
      this.countInterval(msg);
    })
  },

  drawProgress(step) {
    var context = wx.createCanvasContext('canvasProgress');
    var p = this.data.count / this.data.randomTime
    context.setLineWidth(4);
    context.setStrokeStyle("#fbcb02");
    context.setLineCap('round')
    context.beginPath();
    // 参数step 为绘制的圆环周长，从0到2为一周 。 -Math.PI / 2 将起始角设在12点钟位置 ，结束角12点位置，平分每一秒刻度
    // context.arc(110, 110, 100, -Math.PI /2, step*Math.PI /2-Math.PI /2, false);
    context.arc(110, 110, 100, -Math.PI / 2, (p * 360 - 90) * Math.PI / 180, false)
    context.stroke();
    context.draw()
  },
  toCancel() {
    wx.showModal({
      content: '确定要取消行程吗',
      cancelColor: '#cccccc',
      confirmColor: '#fc9c56',
      success: (res) => {
        // 包括长连接后台返回，是否继续查找车辆的接口
        if (res.confirm) {
          console.log(http)
          http.postRequest('/carOrder/passenger/disposeOrder', {
            orderNo: wx.getStorageSync('orderNo')
          }, {
            'content-type': 'application/x-www-form-urlencoded',
            'token': wx.getStorageSync('token'),
            'channel': 2
          }, res => {
            console.log(res)
            clearInterval(this.countTimer);
            wx.redirectTo({
              url: "/pages/cancleReason/cancleReason",
            })
          }, err => {
            console.log(err)
          })

        } else if (res.cancel) {

        }
      }
    })
  },


})