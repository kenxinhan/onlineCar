var QQMapWX = require('../../libs/qqmap-wx-jssdk.js');
var qqmapsdk;
qqmapsdk = new QQMapWX({
  key: 'ACZBZ-XOJRU-AKQVD-BDUEX-2WJSZ-Y4BNN'
});

const app = getApp();
Page({
  data: {
    startCity: '', //目的地城市
    value: '',
    address: [],
    showResList: false,
    usedLocation: null,
    historyLocation: null,
    home: null,
    company: null,
    pois:null
  },
  onLoad() {
    this.searchNearby();
    let historyLocation = wx.getStorageSync('historyLocation');
    // let usedLocation = wx.getStorageSync('usedLocation');
    if (historyLocation) {
      this.setData({
        historyLocation,
      })
    }
    // if (usedLocation) {
    //   this.setData({
    //     usedLocation
    //   })
    // }
    this.setData({
      startCity: app.globalData.startCity || app.globalData.originCity
    })
  },
  
  onShow(){
  //   let home = wx.getStorageSync('home') || '去设置';
  //   let company = wx.getStorageSync('company') || '去设置';
  //   if (home) {
  //     this.setData({
  //       home
  //     })
  //   }
  //   if (company) {
  //     this.setData({
  //       company
  //     })
  //   }
  },

  clickAddress(e) {
    var item = e.currentTarget.dataset.item

    app.globalData.startCity = item.city;
    app.globalData.strAddress = item.title;
    app.globalData.strLatitude = item.location.lat;
    app.globalData.strLongitude = item.location.lng;

    // let historyLocation = wx.getStorageSync('historyLocation') || [];
    // if (historyLocation) {
    //   if (historyLocation.length >= 10) {
    //     historyLocation.pop()
    //   }
    //   historyLocation.forEach((val,index)=>{
    //     if(val.id === item.id){
    //       historyLocation.splice(index,1);
    //     }
    //   })
    // }
    // historyLocation.unshift(item)
    // wx.setStorageSync('historyLocation', historyLocation)

    // wx.redirectTo({
    //   url: "/pages/index/index?fromStrLat="+item.location.lat+"&fromStrLng="+item.location.lng,
    // })
    wx.redirectTo({
      url: "/pages/index/index",
    })

  },

  searchNearby(){
    let _this = this;
    qqmapsdk.reverseGeocoder({
      location:app.globalData.strLatitude+','+app.globalData.strLongitude,
      get_poi:1,
      success(res){
        let pois = res.result.pois;
        console.log('附近',pois)
        _this.setData({
          address: pois,
          pois
        })
      }
    })
  },


  searchInputend(e) {
    var _this = this;
    var value = e.detail.value

    if (value) {
      qqmapsdk.getSuggestion({
        keyword: value,
        region: _this.data.startCity,
        success: function (res) {
          console.log(res)
          let data = res.data
          _this.setData({
            address: data,
            value
          })
        }
      })

    } else {
      this.setData({
        address: this.data.pois,
        value:'',
      })
    }
  },

  //切换城市
  chooseCity() {
    wx.redirectTo({
      url: "/pages/searchCity/searchCity?urlFrom=1",
    })
  },

  // clearHistory() {
  //   let _this = this;
  //   wx.showModal({
  //     content: "确定清空历史记录？",
  //     success(res) {
  //       if (res.confirm) {
  //         _this.setData({
  //           historyLocation: null
  //         })
  //         wx.removeStorageSync('historyLocation')
  //       }
  //     }
  //   })
  // },

  // searchHome(e){
  //   let item = e.currentTarget.dataset.item
  //   if (item.title) {
  //   app.globalData.startCity = item.city;
  //   app.globalData.strAddress = item.title;
  //   app.globalData.strLatitude = item.location.lat;
  //   app.globalData.strLongitude = item.location.lng;
  //   wx.redirectTo({
  //     url: "/pages/index/index?fromStrLat="+item.location.lat+"&fromStrLng="+item.location.lng,
  //   })
  // }else{
  //   wx.navigateTo({
  //     url: "/user_center/pages/searchUsedAddress/searchUsedAddress?getWhich=home",
  //   })
  // }
  // },

  // searchCompany(e){
  //   let item = e.currentTarget.dataset.item
  //   if (item.title) {
  //   app.globalData.startCity = item.city;
  //   app.globalData.strAddress = item.title;
  //   app.globalData.strLatitude = item.location.lat;
  //   app.globalData.strLongitude = item.location.lng;
  //   wx.redirectTo({
  //     url: "/pages/index/index?fromStrLat="+item.location.lat+"&fromStrLng="+item.location.lng,
  //   })
  // }else{
  //   wx.navigateTo({
  //     url: "/user_center/pages/searchUsedAddress/searchUsedAddress?getWhich=company",
  //   })
  // }
  // },

  // searchUsed(e){
  //   let item = e.currentTarget.dataset.item
  //   app.globalData.startCity = item.city;
  //   app.globalData.strAddress = item.title;
  //   app.globalData.strLatitude = item.location.lat;
  //   app.globalData.strLongitude = item.location.lng;
  //   wx.redirectTo({
  //     url: "/pages/index/index?fromStrLat="+item.location.lat+"&fromStrLng="+item.location.lng,
  //   })
  // },


  // searchHistory(e){
  //   let item = e.currentTarget.dataset.item
  //   app.globalData.startCity = item.city;
  //   app.globalData.strAddress = item.title;
  //   app.globalData.strLatitude = item.location.lat;
  //   app.globalData.strLongitude = item.location.lng;
  //   wx.redirectTo({
  //     url: "/pages/index/index?fromStrLat="+item.location.lat+"&fromStrLng="+item.location.lng,
  //   })
  // },

})