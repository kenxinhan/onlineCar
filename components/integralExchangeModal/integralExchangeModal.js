// components/integralExchangeModal/integralExchangeModal.js
import http from '../../utils/http';
let clickTimer = null;
Component({
  properties:{
    modalData:{
      type:Object,
      value:null
    },
    showCover:{
      type:Boolean,
      value:true
    },
    abnormalData:{
      type:String,
      value:""
    },
    isBack:{
      type:Boolean,
      value:false
    }
  },

  data:{
    spliceNum:'',
    isPrice:true,
  },

  lifetimes:{
    attached(){
      console.log('modalData',this.data.modalData);
      let spliceNum , isPrice;
      if(this.data.modalData){
        if(this.data.modalData.couponDescribe.indexOf('¥') !== -1){
          spliceNum = this.data.modalData.couponDescribe.substr(1);
          isPrice = true;
        }else{
          spliceNum = this.data.modalData.couponDescribe;
          isPrice = false;
        }
        this.setData({
          spliceNum,
          isPrice
        })
      }else if(this.data.abnormalData){
        
      }
    },
  },


  methods:{
    exchangeConfirm(e){
      let item = e.currentTarget.dataset.item;
      if(item && item.isExchange != 0){
        if(clickTimer) clearTimeout(clickTimer);
        clickTimer = setTimeout(() => {
          let url = "/v2/passenger/integral/exchangeCoupon?couponId="+item.couponId;
          http.postRequest(url,'',wx.getStorageSync('header'),res=>{
            if(res.code === '1'){
              this.setData({
                modalData:null,
                showCover:false,
              })
              this.triggerEvent('CoverState',false);
              wx.showToast({
                title: '兑换成功',
                icon:'none',
                duration:3000
              })
            }
          },err=>{
            console.log(err)
          })
        }, 500);
      }
    },

    close(){
      this.setData({
        modalData:null,
      })
      this.triggerEvent('CoverState',false);
      if(this.data.isBack){
        wx.navigateBack({
          delta: 1,
        })
      }
    },
  },
})