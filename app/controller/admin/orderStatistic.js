const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const logger = require('koa-log4').getLogger('AddressController')
let db = require('../../db/statisticsMySql/index');
let dbv3 = require('../../db/Mysql/index')
let orderStatistic = require('../statistics/orderStatistic')

module.exports = {
    async getOrderStatistic (ctx, next) {
        ctx.checkBody('tenantId').notEmpty()
        ctx.checkBody('startTime').notEmpty()
        ctx.checkBody('endTime').notEmpty()
        ctx.checkBody('type').notEmpty()
        ctx.checkBody('status').notEmpty()
        let body = ctx.request.body
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.DB_ERROR,ctx.errors)
            return;
        }
        let orderStatistic=[];
        //平均消费
        if(body.status==1){
            orderStatistic = orderStatistic.getAvgConsumption(body.tenantId,body.startTime,body.endTime,body.type)
        }
        //vip平均消费
        if(body.status==2){
            orderStatistic = orderStatistic.getVipAvgConsumption(body.tenantId,body.startTime,body.endTime,body.type)
        }
        if(body.status==3){
            orderStatistic = orderStatistic.getOrder(body.tenantId,body.startTime,body.endTime,body.type)
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS,orderStatistic)
    }

}
