//const router = new (require('koa-router'))()
const Oauth = require('../../controller/wechatPay/wechatOauth')
const router = new (require('koa-router'))()

//红包节获取用户头像，openId
router.get('/api/test/customer/wechatInfo', Oauth.getWechatInfo)

router.get('/api/test/customer/deal/wechatpay/redirectUrl', Oauth.userDealRedirect)
// router.get('/api/v2/oauth/getUser', Oauth.getUser)
router.get('/api/test/customer/eshop/wechatpay/redirectUrl', Oauth.userEshopRedirect)

router.get('/api/test/customer/eshop/fetch-openid/redirectUrl', Oauth.userEshopOpenIdRedirect);

router.get('/api/test/customer/deal/wechatpay/wap', Oauth.getUserDealWechatPayParams)

router.get('/api/test/customer/eshop/wechatpay/wap', Oauth.getUserEshopWechatPayParams)


//获取openid
router.get('/api/test/customer/eshop/fetch-openid/wap', Oauth.getOpenId)

router.post('/api/test/wechatPayNotify', Oauth.wechatPayNotify)

//router.get('/api/v3/transfers', Oauth.transfers)

//router.get('/api/v3/queryTransferInfo', Oauth.queryTransferInfo)

module.exports = router