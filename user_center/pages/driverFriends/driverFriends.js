// user_center/pages/driverFriends/driverFriends.js
import http from '../../../utils/http';
const app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    noFriends:false,
    status:'在线',
    driver:null,
    showDel:null,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log(app.globalData)
    let data = {
      lng:app.globalData.originLongitude,
      lat:app.globalData.originLatitude,
      pageSize:30,
      currentPage:1,
    }
    http.getRequest("/v1/passenger/friendDriver/list",data,wx.getStorageSync('header'), res =>{
      if(res.code === '1' && res.content.length !== 0){
        this.setData({
          noFriends:false,
          driver:res.content
        })
      }else{
        this.setData({
          noFriends:false
        })
      }
    },err=>{
      console.log(err)
    })
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  delFriend(e){
    this.setData({
      showDel:e.currentTarget.dataset.id
    })
  },

  confirmDel(e){
    let driverNo = e.currentTarget.dataset.id;
    let _this = this;
    wx.showModal({
      content:"是否解除好友司机关系",
      confirmText:"解除",
      cancelText:"取消",
      success(res){
        if(res.confirm){
          _this.reqDelFriend(driverNo)
        }else{
          _this.setData({
            showDel:null,
          })
        }
      }
    })
   
  },

  reqDelFriend(driverNo){
    let newDriver;
    http.postRequest("/v1/passenger/friendDriver/attentionOrCancel?driverNo="+driverNo,'',wx.getStorageSync('header'),res=>{
      if(res.code === '1' && res.content.length !== 0){
        this.setData({
          showDel:null,
        })
        newDriver = this.data.driver.filter(item=> item.driverNo != driverNo);
        console.log(newDriver)
        this.setData({
          driver:newDriver
        })
        wx.showToast({
          title: '删除成功',
        })
        if(this.data.driver.length == 0){
          this.setData({
            noFriends:true
          })
        }
      }else{
        this.setData({
          noFriends:true
        })
      }
    },err=>{
      console.log(err)
    })
  }
})