var QQMapWX = require('../../../libs/qqmap-wx-jssdk.js');
var qqmapsdk;
qqmapsdk = new QQMapWX({
  key: 'ACZBZ-XOJRU-AKQVD-BDUEX-2WJSZ-Y4BNN'
});

const app = getApp();
Page({
  data: {
    destinationCity: '', //目的地城市
    value: '',
    address: [],
    showResList: false,
    usedLocation: [],
    focus: false,
    getWhich: null,
    home: {title:'去设置'},
    company: {title:'去设置'},
    coverHide:true,
    handleItemId:null,
    isDel:false,
  },
  onLoad() {
    
  },

  onShow(){
    let home = wx.getStorageSync('home') || '去设置';
    let company = wx.getStorageSync('company') || '去设置';
    let usedLocation = wx.getStorageSync('usedLocation') || [];
    this.setData({
      home,
      company,
      usedLocation
    })
  },

  getFocus(e) {
    let _this = this;
    let usedLocation = wx.getStorageSync('usedLocation') || [];
    if (e.currentTarget.dataset.which === 'location' && usedLocation.length >= 6) {
      wx.showToast({
        title: '常用地址最多只能添加6个',
        icon: 'none',
        success() {
          _this.setData({
            focus: false
          })
        }
      })
    }else{
      wx.navigateTo({
        url: '/user_center/pages/searchUsedAddress/searchUsedAddress?getWhich='+e.currentTarget.dataset.which,
      })
    }
  },

  moreHandle(e) {
    let id = e.currentTarget.dataset.id;
    this.setData({
      coverHide:false,
      handleItemId:id,
      getWhich:null
    })
  },

  changeLocation(){
    wx.navigateTo({
      url: '/user_center/pages/searchUsedAddress/searchUsedAddress?handleItemId='+this.data.handleItemId+'&change=1',
    })
    this.setData({
      coverHide:true
    })
  },

  delLocation(){
    let usedLocation = wx.getStorageSync('usedLocation') || [];
    this.setData({
      coverHide:true,
      focus:true,
      isDel:true
    })
    if(this.data.isDel){
      usedLocation.forEach((val,index)=>{
        if(val.id === this.data.handleItemId){
          usedLocation.splice(index,1)
        }
      })
      wx.setStorageSync('usedLocation', usedLocation);
      this.setData({
        isDel:false,
        usedLocation
      })
    }
  },

  cancle(){
    this.setData({
      coverHide:true
    })
  },


})