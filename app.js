//app.js
var mqtt = require('/utils/mqtt.js')
const BASE_URL = require("./utils/BASE_URL");
var http = require('/utils/httpLogin.js');


App({
  onLaunch: function () {
    // wx.clearStorageSync();
    this.hasUpdate();
  },

  onShow() {
    console.log("token", wx.getStorageSync('token'));

    if (wx.getStorageSync('token')) this.mqttConnect();
    wx.login({
      success(res) {
        wx.setStorageSync('code', res.code)
      }
    })
    wx.checkSession({
      fail() {
        wx.navigateTo({
          url: '/user_center/pages/login/login',
        })
        return false
      }
    })

    var phoneNumber = wx.getStorageSync('phoneNumber')
    if (!phoneNumber) {
      wx.navigateTo({
        url: '/user_center/pages/login/login',
      })
      return false
    }

  },

  onHide(){
    this.globalData.client.end();
  },

  globalData: {
    uuid: null,
    token: null,
    originProvince: '', //定位省份
    originCity: '', //定位城市
    originDistrict: '', //定位区 或者县
    originStreet: '', //定位街道
    originAddress: '', //定位地址
    originLongitude: 0, //定位经度
    originLatitude: 0, //定位纬度
    startCity: '', //起点市
    strAddress: '', //选择的起点
    strLatitude: 0, //起点纬度 
    strLongitude: 0, //起点经度
    destinationProvince: '', //终点省份
    destinationCity: '', //终点地市
    destinationDistrict: '', //终点区 县
    destinationStreet: '', //终点街道
    destination: '', //终点地址
    endLatitude: 0, //终点纬度 
    endLongitude: 0, //终点经度
    walkDistance: 0, //步行距离(定位点-起点)
    driDistance: 0, //行车距离(起点-终点)
    totalDistance: 0, //总距离(米)
    orderStatus: '', //订单状态(已完成、已关闭、行程中)
    client: null, // 数据通信
    friendDriverId: null,
    nowOrFutureId: null,
    friendStartDate: null,
    scanDriverId: null,
    reqNotice: true,
    couponModal: false,
    mqtt1001: 0,
    mqtt1002: 0,
    mqtt1007: 0,
    lineCityCode:'',
    lineStartCity:'',
  },


  /**
   * API：connect([url], options)
   * description：连接到由给定的url和options
   */
  mqttConnect() {
    const options = {
      clientId: 'mqttjs_' + Math.random().toString(16).substr(2, 8),
      keepalive: 60,
      reschedulePings: true,
      protocolId: 'MQTT',
      protocolVersion: 4,
      reconnectPeriod: 1000,
      connectTimeout: 30 * 1000,
      clean: true,
      resubscribe: true,
      // port: '8084', // 有时8083
      // username: 'admin',
      // password: 'password',
      username: wx.getStorageSync('uuid') ? `mini_p_${wx.getStorageSync('uuid')}` : `mini_p_${this.globalData.uuid}`,
      password: wx.getStorageSync('token') || this.globalData.token,
    }
    console.log('user:', options.username)
    console.log('password:', options.password)
    // const host = 'wxs://192.168.1.202/mqtt'; //服务器域名
    const host = 'wxs://www.yimaxiankeji.com/mqtt'; //本地 服务器域名
    // const host = 'wxs://scapp.xysc16.com/mqtt'; //线上 服务器域名。

    this.globalData.pubTopic = wx.getStorageSync('uuid') ? `mini/event/mini_p_${wx.getStorageSync('uuid')}` : `mini/event/mini_p_${this.globalData.uuid}` //发布消息主题，数据类型为String
    this.globalData.client = mqtt.connect(host, options);

    // this.globalData.client.on('reconnect', (error) => {
    //   console.log('正在重连...')
    // })
    // this.globalData.client.on('connect', (connack) => {
    //   console.log('mqtt连接成功')
    // })
    // this.globalData.client.subscribe(this.globalData.pubTopic,{qos: 2}, (err, granted) => {
    //   console.log('订阅成功')
    // })

    // this.globalData.mqttHost = mqttHost;
    // this.globalData.mqttOptions = mqttOptions;

    //事件 'connect'，在成功（重新）连接时发出（即connack rc = 0）。
    // this.globalData.client.on('connect', (connack) => {
    //   console.log('mqtt重新连接成功')
    // })

    // this.globalData.client.subscribe(this.globalData.pubTopic, (err, granted) => {
    //   console.log('订阅成功')
    //   console.log(this.globalData.pubTopic)
    // })

    // this.globalData.client.on('message', (topic, message, packet) => {
    //   console.log( "收到：", message)
    // })



    //事件 'close'，断开连接后发出。
    // this.globalData.client.on('close', () => {
    //   console.log("clientClose","mqtt断开连接")
    // })

    //事件 'offline'， 客户端脱机时发出。
    // this.globalData.client.on('offline', () => {
    //   console.log("clientOffline")
    // })

    //事件 'error'，当客户端无法连接（即connack rc！= 0）或发生解析错误时发出。
    // this.globalData.client.on('error', (error) => {
    //   console.log('连接失败:', error)
    // })

    // //事件 'end'在调用时发出。如果将回调传递给，则回调返回后将触发此事件。
    // this.globalData.client.on('end', () => {
    //   console.log("clientEnd")
    // })



    // //事件 'packetsend'，客户端发送任何数据包时发出。
    // this.globalData.client.on('packetsend', (packet) => {
    //   console.log(packet)
    // })

    // 事件 'packetreceive' 当客户端收到任何数据包时发出。
    // this.globalData.client.on('packetreceive', (packet) => {
    //   console.log(packet)
    // })



    /**
     * API：publish(topic, message, [options], [callback])
     * description：将消息发布到主题
     */
    // this.globalData.client.publish(this.globalData.pubTopic, "Hello,I am client!")


    /**
     * API：unsubscribe(topic/topic array, [options], [callback])
     * description：退订一个或多个主题
     */
    // this.globalData.client.unsubscribe(this.globalData.pubTopic, (err) => {
    //   if (!err) {
    //     console.log('退订成功')
    //   } else console.log('请先连接服务器')
    // })


    /**
     * API：end（[force]，[options]，[cb]）
     * description：关闭客户端
     */
    // this.globalData.client.end();
  },



  hasUpdate() {
    // 获取小程序更新机制兼容
    if (wx.canIUse('getUpdateManager')) {
      const updateManager = wx.getUpdateManager()
      updateManager.onCheckForUpdate(function (res) {
        // 请求完新版本信息的回调
        if (res.hasUpdate) {
          updateManager.onUpdateReady(function () {
            wx.showModal({
              title: '更新提示',
              content: '新版本已经准备好，是否重启应用？',
              success: function (res) {
                if (res.confirm) {
                  // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
                  updateManager.applyUpdate()
                }
              }
            })
          })
          updateManager.onUpdateFailed(function () {
            // 新的版本下载失败
            wx.showModal({
              title: '已经有新版本了哟~',
              content: '新版本已经上线啦~，请您删除当前小程序，重新搜索打开哟~',
            })
          })
        }
      })
    } else {
      // 如果希望用户在最新版本的客户端上体验您的小程序，可以这样子提示
      wx.showModal({
        title: '提示',
        content: '当前微信版本过低，无法使用该功能，请升级到最新微信版本后重试。'
      })
    }
  }

})