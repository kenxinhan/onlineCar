const BASE_URL = require("./BASE_URL")
var baseUrl = BASE_URL.BASE_URL //配置基础url
let timer = null;


/**
 * 供外部post请求调用  
 */
function post(url, params, header, onSuccess, onFailed) {
  request(url, params, "POST", header, onSuccess, onFailed);

}

/**
 * 供外部get请求调用
 */
function get(url, params, header, onSuccess, onFailed) {
  request(url, params, "GET", header, onSuccess, onFailed);
}

/**
 * function: 封装网络请求
 * @url URL地址
 * @params 请求参数
 * @method 请求方式：GET/POST
 * @onSuccess 成功回调
 * @onFailed  失败回调
 */


function request(url, params, method, header, onSuccess, onFailed) {
  let hasToast = false;
  wx.showLoading({
    title: '加载中...'
  })
  wx.request({
    url: baseUrl + url,
    data: dealParams(params),
    method: method,
    header,
    success(res) {
      console.log("请求头：", wx.getStorageSync('header'))
      console.log('请求接口：  ', url)
      console.log('请求数据：  ', params)
      console.log('响应数据：  ', res.data)
      if (res.data.code === '1') {
        if (res.statusCode == 200) {
          wx.removeStorageSync('needLogin')
          onSuccess(res.data); //request success
        } else {
          onFailed(res.data.message); //request failed
        }
      } else if (res.data.code === '100' || res.data.code === '101') {
        // if(!wx.getStorageSync('needLogin')){
          if(timer) clearTimeout(timer);
          wx.setStorageSync('needLogin', '1')
          timer = setTimeout(() => {
            wx.showToast({
              title: res.data.message,
              icon:'none',
              duration:3000,
              success() {
                hasToast = true;
                setTimeout(function () {
                  wx.navigateTo({
                    url: '/user_center/pages/login/login',
                  })
                }, 500)
              }
            })
          }, 500)
        // }
      } else if (res.data.code === '102') {
        if(!wx.getStorageSync('needLogin')){
          wx.setStorageSync('needLogin', '1')
          wx.showModal({
            content: res.data.message,
            cancelText: '联系客服',
            success(res1) {
              hasToast = true;
              if(res1.confirm){
                wx.clearStorageSync();
                wx.reLaunch({
                  url: '/pages/index/index',
                })
              }else{
                wx.makePhoneCall({
                  phoneNumber: wx.getStorageSync('servicePhone'),
                  success() {
                    console.log('拨打成功')
                  },
                  fail: function () {
                    console.log('拨打失败')
                  }
                })
              }
            }
          })
        }
      } else{
        // wx.hideLoading()
        wx.showToast({
          title: res.data.message,
          icon: 'none',
          duration:3000,
          success() {
            hasToast = true;
            setTimeout(function () {
              onFailed(res);
            }, 500)
          }
        })
        
        // if(!wx.getStorageSync('needLogin')){
        //   wx.setStorageSync('needLogin', '1')
        // }
      }
    },
    fail(error) {
      wx.showToast({
        title: error,
        duration:3000,
        icon: 'none',
        success() {
          hasToast = true;
          setTimeout(function () {
            console.log(err)
            onFailed(error);
          }, 500)
        }
      })
    },
    complete() {
      setTimeout(() => {
        let timer = hasToast ? 3000 : 500;
        setTimeout(() => {
          wx.hideLoading()
        }, timer);
      }, 500);
    }
  })
}

/**
 * function: 根据需求处理请求参数：添加固定参数配置等
 * @params 请求参数
 */
function dealParams(params) {
  // console.log("请求参数:", params)
  return params;
}


// 1.通过module.exports方式提供给外部调用
module.exports = {
  postRequest: post,
  getRequest: get,
}