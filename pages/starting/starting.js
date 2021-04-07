import qqmapsdk from '../../libs/qqMap';

const app = getApp();
Page({
  data: {
    startCity: '',
    value: '',
    address: [],
    showResList: false,
    usedLocation: null,
    historyLocation: null,
    home: null,
    company: null,
    pois: null,
    fixedLine: false,
    exclusiveCar: false,
    taxi: false,
    // friendDriver:false,
  },
  onLoad(opt) {
    if (opt.from === 'fixedLine') {
      this.setData({
        fixedLine: true
      })
    }else if (opt.from === 'exclusiveCar') {
      this.setData({
        exclusiveCar: true
      })
    }else if (opt.from === 'taxi') {
      this.setData({
        taxi: true
      })
    }
    // else if(opt.from === 'friendDriver'){
    //   this.setData({
    //     friendDriver:true
    //   })
    // }
    this.searchNearby();
    let historyLocation = wx.getStorageSync('historyLocation');
    if (historyLocation) {
      this.setData({
        historyLocation,
      })
    }
  },

  onShow() {
    if (this.data.fixedLine) {
      this.setData({
        startCity: app.globalData.lineStartCity || app.globalData.originCity
      })
    } else {
      this.setData({
        startCity: app.globalData.startCity || app.globalData.originCity
      })
    }
  },

  clickAddress(e) {
    let item = e.currentTarget.dataset.item
    let pages = getCurrentPages();
    let prevPages = pages[pages.length-2];
    if (this.data.fixedLine) {
      app.globalData.startCity = item.city;
      app.globalData.lineStartAddress = item.title;
      app.globalData.lineStartLat = item.location.lat;
      app.globalData.lineStartLng = item.location.lng;
      prevPages.setData({
        fromStartDetail:true,
        fromEndDetail:false,
        lineAdcode:item.adcode
      })
      wx.navigateBack()
    } else if(this.data.exclusiveCar){
      app.globalData.EXCStartAddress = item.title;
      app.globalData.EXCStartLat = item.location.lat;
      app.globalData.EXCStartLng = item.location.lng;
      prevPages.setData({
        strAddress: item.title,
        lat: item.location.lat,
        lng: item.location.lng,
        lineAdcode:item.adcode
      })
      prevPages.checkStartAddress();
      wx.navigateBack()
    } else {
      app.globalData.startCity = item.city;
      app.globalData.strAddress = item.title;
      app.globalData.strLatitude = item.location.lat;
      app.globalData.strLongitude = item.location.lng;
      if(this.data.taxi){
        prevPages.setData({
          currentTab: 3
        })
        wx.navigateBack();
      } else{
        wx.navigateBack();
      }
    }
  },

  searchNearby() {
    let _this = this;
    qqmapsdk.reverseGeocoder({
      location: app.globalData.strLatitude + ',' + app.globalData.strLongitude,
      get_poi: 1,
      success(res) {
        let pois = res.result.pois;
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
        value: '',
      })
    }
  },

  //切换城市
  chooseCity() {
    if(this.data.fixedLine){
      wx.navigateTo({
        url: "/pages/searchCity/searchCity?urlFrom=1&type=fixedLine",
      })
    }else{
      wx.navigateTo({
        url: "/pages/searchCity/searchCity?urlFrom=1",
      })
    }
  },

})