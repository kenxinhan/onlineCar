import http from '../../utils/http';
// pages/notice/notice.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    noticeList: null,
    allRead:false,
  },

  onLoad: function (options) {

  },

  onShow: function () {
    this.getNoticeList()
  },

  getNoticeList() {
    http.postRequest("/passenger/message/getAllMessageType", '', wx.getStorageSync('header'), res => {
      console.log('消息中心', res)
      if (res.code === '1') {
        let allRead = res.content.every(val=>val.num === 0)
        this.setData({
          noticeList:res.content,
          allRead,
        })
      }
    }, err => {
      console.log(err)
    })
  },

  hasRead(){
    if(!this.data.allRead){
      http.postRequest("/passenger/message/updateMessageReadState?messageTypeId=0", {}, wx.getStorageSync('header'), res =>{
        console.log('全部已读：',res)
        if(res.code === '1'){
          this.getNoticeList()
        }
      },err=>{
        console.log(err)
      })
    }
  },

  toDetail(e) {
    let id = e.currentTarget.dataset.id;
    console.log(id)
    wx.navigateTo({
      url: '/pages/noticeDetail/noticeDetail?id='+id,
    })
  }
})