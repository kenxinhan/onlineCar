// pages/addFriends/addFriends.js
import http from '../../utils/http';
Page({
  data: {
    hasSearchRes: false,
    addText: '加好友',
    driverInfo:null,
    value:'',
    driverImg:'http://scapp.xysc16.com/upload/wmp/imgs/driver.png'
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    if(options.scanId){
      this.setData({
        value:options.scanId
      })
      this.searchDriver();
    }
  },

  getId(e) {
    if (e.detail.value.length === 4) {
      this.setData({
        value:e.detail.value
      })
      this.searchDriver();
    }else{
      this.setData({
        hasSearchRes:false,
        noDriver:false,
      })
    }

  },

  searchDriver(){
    http.getRequest("/v1/passenger/friendDriver/searchDriver?driverNo="+this.data.value, '', wx.getStorageSync('header'), res => {
      console.log('查询好友司机信息：',res)
      if(res.code === '1'){
        this.setData({
          hasSearchRes:true,
          noDriver:false,
          driverInfo:res.content,
        })
        if(res.content.isFriendDriver === 1){
          this.setData({
            addText:'已添加'
          })
        }else{
          this.setData({
            addText:'加好友'
          })
        }
      }else{
        this.setData({
          hasSearchRes:false,
          noDriver:true
        })
      }
    }, err => {
      console.log(err)
      this.setData({
        hasSearchRes:false,
        noDriver:true
      })
    })
  },
  
  add(){
    if(this.data.addText === '加好友'){
      http.postRequest("/v1/passenger/friendDriver/attentionOrCancel?driverNo="+this.data.driverInfo.driverNo,'',wx.getStorageSync('header'),res=>{
        if(res.code === '1'){
          wx.hideLoading();
          this.setData({
            addText:'已添加'
          })
        }else{
          wx.showToast({
            title: res.message,
            icon:'none'
          })
        }
      },err=>{
        console.log(err)
      })
    }
  }
})