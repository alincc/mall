const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const logger = require('koa-log4').getLogger('AddressController')
const db = require('../../db/mysql/index');
const OrderGoods = db.models.OrderGoods
let TenantInfo = db.models.TenantConfigs;
const Merchants = db.models.Merchants;
const amountManager = require('../amount/amountManager')

module.exports = {

    async getTenantInfoByTenantId (ctx, next) {
        ctx.checkQuery('tenantId').notEmpty();
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.DB_ERROR, ctx.errors)
            return;
        }

        let tenantInfo = await TenantInfo.findOne({
            where: {
                tenantId: ctx.query.tenantId,
            }
        })

        let result = {};
        if (tenantInfo != null) {
            let merchant = await Merchants.findOne({
                where: {
                    tenantId: ctx.query.tenantId,
                }
            })
            result.name = tenantInfo.name;
            result.payee_account = tenantInfo.payee_account;
            result.wecharPayee_account = tenantInfo.wecharPayee_account;
            result.needVip = tenantInfo.needVip;
            result.vipFee = tenantInfo.vipFee;
            result.vipRemindFee = tenantInfo.vipRemindFee;
            result.homeImage = tenantInfo.homeImage;
            result.isRealTime = tenantInfo.isRealTime;
            result.invaildTime = tenantInfo.invaildTime;
            result.longitude = tenantInfo.longitude;
            result.latitude = tenantInfo.latitude;
            result.phone = merchant.phone;
            result.needChoosePeopleNumberPage = tenantInfo.needChoosePeopleNumberPage;
            result.openFlag = tenantInfo.openFlag;
            result.officialNews = tenantInfo.officialNews;
            result.firstDiscount = tenantInfo.firstDiscount;
            result.startTime = tenantInfo.startTime;
            result.endTime = tenantInfo.endTime;
            result.needOrderConfirmPage = merchant.needOrderConfirmPage;
            ctx.body = new ApiResult(ApiResult.Result.SUCCESS, result);
        } else {
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, '没有该租户的基本信息！');
        }

    },

    //新增租户信息
    async saveTenantInfo(ctx, next){
        ctx.checkBody('/tenantConfig/name', true).first().notEmpty();
        ctx.checkBody('tenantId').notEmpty();
        ctx.checkBody('/tenantConfig/wecharPayee_account', true).first().notEmpty();
        ctx.checkBody('/tenantConfig/payee_account', true).first().notEmpty();
        ctx.checkBody('/tenantConfig/isRealTime', true).first().notEmpty();
        ctx.checkBody('/tenantConfig/vipFee', true).first().notEmpty();
        ctx.checkBody('/tenantConfig/vipRemindFee', true).first().notEmpty();
        ctx.checkBody('/tenantConfig/homeImage', true).first().notEmpty();
        ctx.checkBody('/tenantConfig/startTime', true).first().notEmpty();
        ctx.checkBody('/tenantConfig/endTime', true).first().notEmpty();
        ctx.checkBody('/tenantConfig/needVip', true).first().notEmpty();

        ctx.checkBody('/tenantConfig/longitude', true).first().notEmpty();
        ctx.checkBody('/tenantConfig/latitude', true).first().notEmpty();
        ctx.checkBody('/tenantConfig/officialNews', true).first().notEmpty();
        ctx.checkBody('/tenantConfig/needChoosePeopleNumberPage', true).first().notEmpty();
        ctx.checkBody('/tenantConfig/openFlag', true).first().notEmpty();
        ctx.checkBody('/tenantConfig/firstDiscount', true).first().notEmpty();
        ctx.checkBody('/tenantConfig/invaildTime', true).first().notEmpty();

        let body = ctx.request.body;
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors)
            return;
        }
        let tenantInfo = await TenantInfo.findAll({
            where: {
                tenantId: body.tenantId
            }
        })
        if (tenantInfo.length > 0) {
            ctx.body = new ApiResult(ApiResult.Result.EXISTED, "已有租户信息");
            return;
        }

        await TenantInfo.create({
            name: body.tenantConfig.name,
            wecharPayee_account: body.tenantConfig.wecharPayee_account,
            payee_account: body.tenantConfig.payee_account,
            isRealTime: body.tenantConfig.isRealTime,
            needVip: body.tenantConfig.needVip,
            vipFee: body.tenantConfig.vipFee,
            vipRemindFee: body.tenantConfig.vipRemindFee,
            homeImage: body.tenantConfig.homeImage,
            startTime: body.tenantConfig.startTime,
            endTime: body.tenantConfig.endTime,
            tenantId: body.tenantId,
            longitude: body.tenantConfig.longitude,
            latitude: body.tenantConfig.latitude,
            officialNews: body.tenantConfig.officialNews,
            needChoosePeopleNumberPage: body.tenantConfig.needChoosePeopleNumberPage,
            openFlag: body.tenantConfig.openFlag,
            firstDiscount: body.tenantConfig.firstDiscount,
            invaildTime: body.tenantConfig.invaildTime,

        })
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    },

    //编辑租户信息
    async updateTenantInfoByTenantId(ctx, next){
        ctx.checkBody('/tenantConfig/wecharPayee_account', true).first().notEmpty();
        ctx.checkBody('/tenantConfig/payee_account', true).first().notEmpty();
        ctx.checkBody('/tenantConfig/isRealTime', true).first().notEmpty();
        ctx.checkBody('/tenantConfig/vipFee', true).first().notEmpty();
        ctx.checkBody('/tenantConfig/vipRemindFee', true).first().notEmpty();
        ctx.checkBody('/tenantConfig/homeImage', true).first().notEmpty();
        ctx.checkBody('/tenantConfig/startTime', true).first().notEmpty()
        ctx.checkBody('/tenantConfig/name', true).first().notEmpty();
        ctx.checkBody('/tenantConfig/endTime', true).first().notEmpty();
        ctx.checkBody('/tenantConfig/needVip', true).first().notEmpty();
        ctx.checkBody('/condition/tenantId', true).first().notEmpty();

        ctx.checkBody('/tenantConfig/longitude', true).first().notEmpty();
        ctx.checkBody('/tenantConfig/latitude', true).first().notEmpty();
        ctx.checkBody('/tenantConfig/officialNews', true).first().notEmpty();
        ctx.checkBody('/tenantConfig/needChoosePeopleNumberPage', true).first().notEmpty();
        ctx.checkBody('/tenantConfig/openFlag', true).first().notEmpty();
        ctx.checkBody('/tenantConfig/firstDiscount', true).first().notEmpty();
        ctx.checkBody('/tenantConfig/invaildTime', true).first().notEmpty();

        let body = ctx.request.body;
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors)
            return;
        }

        let TenantConfig = await TenantInfo.findOne({
            where: {
                tenantId: body.condition.tenantId,
            }
        })

        if (TenantConfig == null) {
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, "未找到租户信息")
            return;
        }
        TenantConfig.wecharPayee_account = body.tenantConfig.wecharPayee_account;
        TenantConfig.payee_account = body.tenantConfig.payee_account;
        TenantConfig.isRealTime = body.tenantConfig.isRealTime;
        TenantConfig.vipFee = body.tenantConfig.vipFee;
        TenantConfig.vipRemindFee = body.tenantConfig.vipRemindFee;
        TenantConfig.homeImage = body.tenantConfig.homeImage;
        TenantConfig.startTime = body.tenantConfig.startTime;
        TenantConfig.endTime = body.tenantConfig.endTime;
        TenantConfig.needVip = body.tenantConfig.needVip;
        TenantConfig.name = body.tenantConfig.name;
        TenantConfig.tenantId = body.condition.tenantId;
        TenantConfig.longitude = body.tenantConfig.longitude;
        TenantConfig.latitude = body.tenantConfig.latitude;
        TenantConfig.officialNews = body.tenantConfig.officialNews;
        TenantConfig.needChoosePeopleNumberPage = body.tenantConfig.needChoosePeopleNumberPage;
        TenantConfig.openFlag = body.tenantConfig.openFlag;
        TenantConfig.firstDiscount = body.tenantConfig.firstDiscount;
        TenantConfig.invaildTime = body.tenantConfig.invaildTime;
        await TenantConfig.save();
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    },

    //查询账单信息
    async getTenantInfoByBill(ctx,next){
        ctx.checkQuery('tenantId').notEmpty()
        // ctx.checkQuery('trade_no').notEmpty()
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR.errors)
            return
        }
        let ordersJson = await amountManager.getBill(ctx.query.tenantId)


        // let ordersJson = {}
        // let totalPrice = 0
        // let saleGoodsTotalPrices = 0
        // let profitPrice = 0
        // let merchantTotalPrice = 0
        // let terracePrice = 0
        // let orderArray = []
        //
        // let order = await amountManager.getNewOrder(ctx.query.tenantId)
        // let staticDate = new Date().getTime()
        //
        // const promises = Array.from({length:200}, (_) => createPromise())
        // await Promise.all(promises)
        //
        // function createPromise(){
        //     return new Promise((res, rej) => {
        //         setTimeout(() => {
        //             res('done')
        //         },3e2)
        //     })
        // }
        //
        // // for(let i = 0; i < 200; i++){
        //
        //     // let orderJson = {}
        //     // let orderGoods = await createPromise();
        //     // totalPrice += orderGoods.totalPrices
        //     // saleGoodsTotalPrices += orderGoods.saleGoodsTotalPrices
        //     // profitPrice += orderGoods.profitPrice
        //     // merchantTotalPrice += orderGoods.merchantTotalPrice
        //     // terracePrice += orderGoods.terracePrice
        //     // // orderJson.phone = order[i].phone
        //     // // orderJson.status = order[i].status
        //     // orderJson.orderGoods = orderGoods
        //     // orderArray.push(orderJson)
        // // }
        // let endDate = new Date().getTime()
        // console.log(endDate-staticDate)
        // // ordersJson.totalPrice = totalPrice
        // // ordersJson.saleGoodsTotalPrices = saleGoodsTotalPrices
        // // ordersJson.profitPrice = profitPrice
        // // ordersJson.merchantTotalPrice = merchantTotalPrice
        // // ordersJson.terracePrice = terracePrice
        // // // ordersJson.orderArray = orderArray
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS,ordersJson)

    },

    //
    async saveorderGood(ctx,next){
        let body = ctx.request.body;
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors)
            return;
        }

        for(let i =0;i<200;i++){
            let date = new Date().getTime()
            await OrderGoods.create({
                num : 1,
                unit : "袋",
                trade_no : date,
                consigneeId : "07e15af0db11ddb1919c5c1376f4e2c7",
                tenantId : "33333ce0f7e31d8b92c4472a8ad3eeb3",
                FoodId : 1095,
                price : 2,
                vipPrice :2,
                activityPrice : -1,
                purchaseLimit : -1,
                constPrice : 1
            })
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    }

}