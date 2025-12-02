export const endpoints = {
  categories: 'Category/GetAll',
  banner: 'Banner/GetAll',
  country: 'Country/GetAll',
  district: 'District/GetAllByCityId',
  subDistrict: 'SubDistrict/GetAllByDistrictId',
  Favorite: 'AdLoger/AddAdToFavorite',
  ticketing: 'SupportTicket/Add',
  
  ads: {
    ads: 'Ads',
    topCatAds: 'GetTopCatAds',
    adyId: 'GetAdByIdLite' ,//GetAdById',
    allAds: 'GetAdsLite',//'GetAds',
     TheAds: 'GetAds',
    favAds: 'GetUserFavAds',
    add: 'Add'
  },

 filters:"Filter/GetSearchSuggession",
  Notification:"Notification/GetUserNotifications",
  saveuser :"Auth/UpdateUserProfile",
 getchat:"Chat/GetChatMessagesAsync",
 chat:  "Chat/startOrSend",
 userchat:  "Chat/GetUserChats",
  getphone:  "AdLoger/LogContact",
  logads: "AdLoger/Log",
  activeCategories: 'Category/ActiveCategorys',
  advertiserByUserId: 'Advertiser/GetAdvertiserByUserId',
  flatField: "FlatField/GetByCategoryId",
  filterflatField: "FlatField/GetFilterFieldByCategoryId",
  uploadFormFile: "Attachment/uploadFormFile",
  auth: {
    auth: 'Auth',
    login: 'login',
    register: "Register",
    verifyOtp: "VerifyOtp",
    reSendOtp: "ReSendOtp",
    requestPasswordReset: "RequestPasswordReset",
     ChangePassword: "ChangePassword",
    resetPassword: "ResetPassword"
  }
}
