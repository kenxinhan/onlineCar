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
    getWhich: null,
    coverHide:true,
    handleItemId:null,
    isChange:false,
    isDel:false,
  },
  onLoad(opt) {
    if(opt.getWhich){
      this.setData({
        getWhich:opt.getWhich
      })
    }
    if(opt.handleItemId){
      this.setData({
        handleItemId:opt.handleItemId
      })
    }
    if(opt.change == 1){
      this.setData({
        isChange:true
      })
    }
  },

  onShow(){
    this.setData({
      destinationCity: app.globalData.destinationCity || app.globalData.originCity,
    })
  },

  clickAddress(e) {
    let data = e.currentTarget.dataset.item;
    let usedLocation = wx.getStorageSync('usedLocation') || [];
    let _this = this;
    if (this.data.getWhich === 'home') {
      this.setData({
        home:data,
        value: ''
      })
      wx.setStorageSync('home', data)
    } else if (this.data.getWhich === 'company') {
      this.setData({
        company:data,
        value: ''
      })
      wx.setStorageSync('company', data)
    } else if (this.data.getWhich === 'location') {
      if (usedLocation.length < 6) {
        usedLocation.push(data)
        this.setData({
          usedLocation,
          value: ''
        })
        wx.setStorageSync('usedLocation', usedLocation)
      }
    }

    // 修改地址
    if(this.data.isChange){
      usedLocation.forEach(val=>{
         if(val.id === this.data.handleItemId){
          val.title = data.title;
          val.address = data.address;
          val.adcode = data.adcode;
          val.category = data.category;
          val.city = data.city;
          val.district = data.district;
          val.location = data.location;
          val.province = data.province;
        }
      })
      wx.setStorageSync('usedLocation', usedLocation);
      this.setData({
        usedLocation,
        value:''
      })
    }

    wx.navigateBack({
      complete: (res) => {},
    })
  },

  searchInputend(e) {
    var that = this;
    var value = e.detail.value

    if (value) {
      qqmapsdk.getSuggestion({
        keyword: value,
        region: that.data.destinationCity,
        success: function (res) {
          console.log(res)
          let data = res.data
          that.setData({
            showResList: true,
            address: data,
            value
          })
        }
      })

    } else {
      this.setData({
        showResList: false
      })
    }


  },

  //切换城市
  chooseCity() {
    wx.navigateTo({
      url: "/pages/searchCity/searchCity?urlFrom=3",
    })
  },


})