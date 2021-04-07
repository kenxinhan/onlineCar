import qqmapsdk from '../../libs/qqMap';
const app = getApp();
Page({
  data: {
    destinationCity: '', //目的地城市
    value: '',
    usedLocation: null,
    historyLocation: false,
    home: null,
    company: null,
    clickToIndex: false,
    pois: null,
    address: [],
    allAddress: null,
    fixedLine: false,
    taxi: false,
  },
  onLoad(opt) {
    console.log('opt:',opt)
    if (opt.from === 'scan') {
      this.setData({
        clickToIndex: true
      })
    }else if (opt.from === 'fixedLine') { 
      this.setData({
        fixedLine: true
      })
    }else if(opt.from === 'taxi' || opt.friendsDriverType == 6){
      this.setData({
        taxi: true
      })
    }

    let historyLocation = wx.getStorageSync('historyLocation');
    if (historyLocation) {
      this.setData({
        historyLocation: true,
        address: historyLocation.concat(this.data.address),
        allAddress: historyLocation.concat(this.data.address),
      })
    }

  },


  onShow() {
    this.setData({
      destinationCity: app.globalData.destinationCity || app.globalData.originCity
    })
  },

  clickAddress(e) {
    let data = e.currentTarget.dataset.item;
    let historyLocation = wx.getStorageSync('historyLocation') || [];
    if (historyLocation) {
      if (historyLocation.length >= 4) {
        historyLocation.pop()
      }
      historyLocation.forEach((val, index) => {
        if (val.id === data.id) {
          historyLocation.splice(index, 1);
        }
      })
    }
    historyLocation.unshift(data);
    historyLocation.forEach(val => {
      val.img = 'http://scapp.xysc16.com/upload/wmp/imgs/clock.png';
    })
    wx.setStorageSync('historyLocation', historyLocation)


    if (this.data.fixedLine) {
      app.globalData.destinationCity = data.city;
      app.globalData.lineEndAddress = data.title;
      app.globalData.lineEndLat = data.location.lat;
      app.globalData.lineEndLng = data.location.lng;
      let pages = getCurrentPages();
      let prevPages = pages[pages.length - 2];
      prevPages.setData({
        fromEndDetail: true,
        fromStartDetail: false,
      })
      wx.navigateBack({
        delta: 1
      })
    } else {
      app.globalData.destinationCity = data.city;
      app.globalData.endLatitude = data.location.lat;
      app.globalData.endLongitude = data.location.lng;
      app.globalData.destination = data.title;
      if (this.data.clickToIndex) {
        wx.redirectTo({
          url: '/pages/index/index?des=scan',
        })
      } else {
        if(this.data.taxi){
          wx.redirectTo({
            url: "/pages/confirmCall/confirmCall?from=taxi",
          })
        }else{
          wx.redirectTo({
            url: "/pages/confirmCall/confirmCall",
          })
        }
      }
    }

  },

  searchInputend(e) {
    var _this = this;
    var value = e.detail.value
    if (value) {
      qqmapsdk.getSuggestion({
        keyword: value,
        region: _this.data.destinationCity,
        success: function (res) {
          console.log(res)
          let data = res.data
          _this.setData({
            address: data,
          })
        }
      })
    } else {
      this.setData({
        address: this.data.allAddress,
        value: ''
      })
    }
  },

  //切换城市
  chooseCity() {
    wx.navigateTo({
      url: "/pages/searchCity/searchCity?urlFrom=2",
    })
  },

  clearHistory() {
    let _this = this;
    wx.showModal({
      content: "确定清空历史记录？",
      success(res) {
        if (res.confirm) {
          _this.setData({
            historyLocation: false,
            address: []
          })
          wx.removeStorageSync('historyLocation')
        }
      }
    })
  },

})