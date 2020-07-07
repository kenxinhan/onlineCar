var QQMapWX = require('../../libs/qqmap-wx-jssdk.js');
var qqmapsdk;
qqmapsdk = new QQMapWX({
  key: 'ACZBZ-XOJRU-AKQVD-BDUEX-2WJSZ-Y4BNN'
});

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
    address: [{
        adcode: 411203,
        address: "河南省三门峡市陕州区",
        category: "基础设施:火车站附属",
        city: "三门峡市",
        district: "陕州区",
        id: "9449809779579101684",
        location: {
          lat: 34.748610899,
          lng: 111.16022045
        },
        province: "河南省",
        title: "三门峡南站-进站口",
        type: 0,
        img:'../../assets/images/dingwei.png'
      },
      {
        adcode: 411202,
        address: "河南省三门峡市湖滨区和平西路与大岭北路交汇处",
        category: "购物:综合商场:购物中心",
        city: "三门峡市",
        district: "湖滨区",
        id: "3417830413000889406",
        location: {
          lat: 34.78433,
          lng: 111.19025
        },
        province: "河南省",
        title: "三门峡万达广场",
        type: 0,
        img:'../../assets/images/dingwei.png'
      },
      {
        adcode: 411202,
        address: "河南省三门峡市湖滨区和平路239号",
        category: "购物:综合商场",
        city: "三门峡市",
        district: "湖滨区",
        id: "1742355367357985032",
        location: {
          lat: 34.778393,
          lng: 111.200885
        },
        province: "河南省",
        title: "梦之城购物中心",
        type: 0,
        img:'../../assets/images/dingwei.png'
      },
      {
        adcode: 411202,
        address: "河南省三门峡市湖滨区崤山路西段",
        category: "旅游景点:风景名胜",
        city: "三门峡市",
        district: "湖滨区",
        id: "14228323721537341047",
        location: {
          lat: 34.794892698,
          lng: 111.153574349
        },
        province: "河南省",
        title: "陕州风景区",
        type: 0,
        img:'../../assets/images/dingwei.png'
      },
      {
        adcode: 411202,
        address: "河南省三门峡市湖滨区大岭南路与召公路交汇处西侧",
        category: "购物:综合商场",
        city: "三门峡市",
        district: "湖滨区",
        id: "13047429064180720083",
        location: {
          lat: 34.766831373,
          lng: 111.173852271
        },
        province: "河南省",
        title: "三门峡义乌国际商贸城",
        type: 0,
        img:'../../assets/images/dingwei.png'
      },
      {
        adcode: 411202,
        address: "河南省三门峡市湖滨区步行街与黄河东路交叉口西南100米",
        category: "旅游景点:城市广场",
        city: "三门峡市",
        district: "湖滨区",
        id: "18212032671329799258",
        location: {
          lat: 34.780391349,
          lng: 111.200320674
        },
        province: "河南省",
        title: "湖滨广场",
        type: 0,
        img:'../../assets/images/dingwei.png'
      }
    ],
    allAddress:null
  },
  onLoad(opt) {
    if (opt.from === 'scan') {
      this.setData({
        clickToIndex: true
      })
    }

    let historyLocation = wx.getStorageSync('historyLocation');
    if (historyLocation) {
      this.setData({
        historyLocation:true,
        address: historyLocation.concat(this.data.address),
        allAddress: historyLocation.concat(this.data.address),
      })
    }
    // let usedLocation = wx.getStorageSync('usedLocation');
    // if (usedLocation) {
    //   this.setData({
    //     usedLocation
    //   })
    // }
    this.setData({
      destinationCity: app.globalData.destinationCity || app.globalData.originCity
    })
  },
  onShow() {
    // let home = wx.getStorageSync('home') || '去设置';
    // let company = wx.getStorageSync('company') || '去设置';
    // if (home) {
    //   this.setData({
    //     home
    //   })
    // }
    // if (company) {
    //   this.setData({
    //     company
    //   })
    // }
  },

  clickAddress(e) {
    var data = e.currentTarget.dataset.item
    app.globalData.destinationProvince = data.province; //终点  省
    app.globalData.destinationCity = data.city; //市
    app.globalData.destinationDistrict = data.district; //区 县
    app.globalData.endLatitude = data.location.lat;
    app.globalData.endLongitude = data.location.lng;
    app.globalData.destination = data.title;

    let historyLocation = wx.getStorageSync('historyLocation') || [];
    if (historyLocation) {
      if (historyLocation.length >= 4) {
        historyLocation.pop()
      }
      // 历史记录相同情况下判断，把该地址移动到首位
      historyLocation.forEach((val, index) => {
        if (val.id === data.id) {
          historyLocation.splice(index, 1);
        }
      })
    }
    historyLocation.unshift(data);
    historyLocation.forEach(val=>{
      val.img = '../../assets/images/clock.png';
    })
    wx.setStorageSync('historyLocation', historyLocation)
    if (this.data.clickToIndex) {
      wx.redirectTo({
        url: '/pages/index/index?des=scan',
      })
    }else{
      wx.redirectTo({
        url: "/pages/confirmCall/confirmCall",
      })
    }
    

    //如果切换到城际 需要判断是否跨市  再请求后台是否有开通城际
    // if (app.globalData.tabName == '城际' && app.globalData.tabId == 2) {
    //   let sCity = app.globalData.startCity
    //   let eCity = data.city
    //   console.log(sCity +'-------'+eCity);
    //   if(sCity == eCity){
    //     wx.showModal({
    //       content: '市内暂无城际，请选择其他出行方式',
    //       showCancel: false
    //     })
    //     return
    //   } else {
    //     // 请求后台是否有开通城际

    //     wx.navigateTo({
    //       url: '/pages/intercity/intercity',
    //     })
    //   }


    // }
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
        value:''
      })
    }
  },

  //切换城市
  chooseCity() {
    wx.redirectTo({
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
            address: [{
              adcode: 411203,
              address: "河南省三门峡市陕州区",
              category: "基础设施:火车站附属",
              city: "三门峡市",
              district: "陕州区",
              id: "9449809779579101684",
              location: {
                lat: 34.748610899,
                lng: 111.16022045
              },
              province: "河南省",
              title: "三门峡南站-进站口",
              type: 0,
              img:'../../assets/images/dingwei.png'
            },
            {
              adcode: 411202,
              address: "河南省三门峡市湖滨区和平西路与大岭北路交汇处",
              category: "购物:综合商场:购物中心",
              city: "三门峡市",
              district: "湖滨区",
              id: "3417830413000889406",
              location: {
                lat: 34.78433,
                lng: 111.19025
              },
              province: "河南省",
              title: "三门峡万达广场",
              type: 0,
              img:'../../assets/images/dingwei.png'
            },
            {
              adcode: 411202,
              address: "河南省三门峡市湖滨区和平路239号",
              category: "购物:综合商场",
              city: "三门峡市",
              district: "湖滨区",
              id: "1742355367357985032",
              location: {
                lat: 34.778393,
                lng: 111.200885
              },
              province: "河南省",
              title: "梦之城购物中心",
              type: 0,
              img:'../../assets/images/dingwei.png'
            },
            {
              adcode: 411202,
              address: "河南省三门峡市湖滨区崤山路西段",
              category: "旅游景点:风景名胜",
              city: "三门峡市",
              district: "湖滨区",
              id: "14228323721537341047",
              location: {
                lat: 34.794892698,
                lng: 111.153574349
              },
              province: "河南省",
              title: "陕州风景区",
              type: 0,
              img:'../../assets/images/dingwei.png'
            },
            {
              adcode: 411202,
              address: "河南省三门峡市湖滨区大岭南路与召公路交汇处西侧",
              category: "购物:综合商场",
              city: "三门峡市",
              district: "湖滨区",
              id: "13047429064180720083",
              location: {
                lat: 34.766831373,
                lng: 111.173852271
              },
              province: "河南省",
              title: "三门峡义乌国际商贸城",
              type: 0,
              img:'../../assets/images/dingwei.png'
            },
            {
              adcode: 411202,
              address: "河南省三门峡市湖滨区步行街与黄河东路交叉口西南100米",
              category: "旅游景点:城市广场",
              city: "三门峡市",
              district: "湖滨区",
              id: "18212032671329799258",
              location: {
                lat: 34.780391349,
                lng: 111.200320674
              },
              province: "河南省",
              title: "湖滨广场",
              type: 0,
              img:'../../assets/images/dingwei.png'
            }
          ]
          })
          wx.removeStorageSync('historyLocation')
        }
      }
    })
  },

  // searchHome(e) {
  //   let item = e.currentTarget.dataset.item
  //   if (item.title) {
  //     app.globalData.destinationProvince = item.province; //终点  省
  //     app.globalData.destinationCity = item.city; //市
  //     app.globalData.destinationDistrict = item.district; //区 县
  //     app.globalData.endLatitude = item.location.lat;
  //     app.globalData.endLongitude = item.location.lng;
  //     app.globalData.destination = item.title;
  //     if (this.data.clickToIndex) {
  //       wx.redirectTo({
  //         url: '/pages/index/index?des=scan',
  //       })
  //     }
  //     wx.redirectTo({
  //       url: "/pages/confirmCall/confirmCall",
  //     })
  //   } else {
  //     wx.navigateTo({
  //       url: "/user_center/pages/searchUsedAddress/searchUsedAddress?getWhich=home",
  //     })
  //   }
  // },

  // searchCompany(e) {
  //   let item = e.currentTarget.dataset.item
  //   if (item.title) {
  //     app.globalData.destinationProvince = item.province; //终点  省
  //     app.globalData.destinationCity = item.city; //市
  //     app.globalData.destinationDistrict = item.district; //区 县
  //     app.globalData.endLatitude = item.location.lat;
  //     app.globalData.endLongitude = item.location.lng;
  //     app.globalData.destination = item.title;
  //     if (this.data.clickToIndex) {
  //       wx.redirectTo({
  //         url: '/pages/index/index?des=scan',
  //       })
  //     }
  //     wx.redirectTo({
  //       url: "/pages/confirmCall/confirmCall",
  //     })
  //   } else {
  //     wx.navigateTo({
  //       url: "/user_center/pages/searchUsedAddress/searchUsedAddress?getWhich=company",
  //     })
  //   }
  // },

  // searchUsed(e) {
  //   let item = e.currentTarget.dataset.item
  //   app.globalData.destinationProvince = item.province; //终点  省
  //   app.globalData.destinationCity = item.city; //市
  //   app.globalData.destinationDistrict = item.district; //区 县
  //   app.globalData.endLatitude = item.location.lat;
  //   app.globalData.endLongitude = item.location.lng;
  //   app.globalData.destination = item.title;
  //   if (this.data.clickToIndex) {
  //     wx.redirectTo({
  //       url: '/pages/index/index?des=scan',
  //     })
  //   }
  //   wx.redirectTo({
  //     url: "/pages/confirmCall/confirmCall",
  //   })
  // },


  // searchHistory(e) {
  //   let item = e.currentTarget.dataset.item
  //   app.globalData.destinationProvince = item.province; //终点  省
  //   app.globalData.destinationCity = item.city; //市
  //   app.globalData.destinationDistrict = item.district; //区 县
  //   app.globalData.endLatitude = item.location.lat;
  //   app.globalData.endLongitude = item.location.lng;
  //   app.globalData.destination = item.title;
  //   if (this.data.clickToIndex) {
  //     wx.redirectTo({
  //       url: '/pages/index/index?des=scan',
  //     })
  //   }
  //   wx.redirectTo({
  //     url: "/pages/confirmCall/confirmCall",
  //   })
  // },

})