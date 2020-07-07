//logs.js
const util = require('../../utils/util.js')
const http = require('../../utils/httpLogin.js');   //相对路径

Page({
  data: {
    logs: []
  },
  onLoad: function () {
    this.setData({
      logs: (wx.getStorageSync('logs') || []).map(log => {
        return util.formatTime(new Date(log))
      })
    })
  },

  //调用请求示例
  getData() {
    var prams = {
      username: "1111",
      password:"123456"
    }
    http.postRequest("http://www.baidu.com", prams,
          function(res) {
            
          },
          function(err) {
          
          })
      },
})
