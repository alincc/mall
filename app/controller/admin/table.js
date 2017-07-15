const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const logger = require('koa-log4').getLogger('AddressController')
let db = require('../../db/mysql/index');
let Tables = db.models.Tables;
const ShoppingCarts = db.models.ShoppingCarts;
const Orders = db.models.Orders;
const Consignees = db.models.Consignees;
const Merchant = db.models.Merchants;

module.exports = {
    //获取租户下桌状态
    async getAdminTableByTableName (ctx, next) {
        ctx.checkQuery('tenantId').notEmpty();
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors );
        }
        let table = await Tables.findAll({
            where: {
                tenantId: ctx.query.tenantId,
                consigneeId:null
            },
            attributes: {
                exclude: ['createdAt', 'updatedAt']
            }
        })



        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, table);
    },
    //获取租户下 代售点下桌状态
    async getAdminTableByConsigneeId (ctx, next) {
        ctx.checkQuery('tenantId').notEmpty();
        // ctx.checkQuery('tableName').notEmpty();
        //ctx.checkQuery('consigneeId').notEmpty();
        //ctx.checkQuery('phoneNumber').notEmpty();

        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors)
            return;
        }
        //根据tenantId查询consigneeId
        let consignee = [];
        let json={}
        let tables;
        let merchants;
        let shoppingCart=[];
        let shop = [];

        let table = await Tables.findAll({
            where:{
                tenantId: ctx.query.tenantId
            },

        })

        if(table.length<=0){
            ctx.body=new ApiResult(ApiResult.Result.NOT_FOUND,"没有该租户");
        }

        for(let i = 0; i<table.length;i++){
            merchants =  await Merchant.findOne({
                tenantId:table[i].tenantId
            })
            if(table[i].tenantId!=null){
                table[i].tenantId=merchants.name;
            }
            tables = await Consignees.findOne({
                consigneeId:table[i].consigneeId
            })
            if(table[i].consigneeId!=null){
                table[i].consigneeId=tables.name
            }
            console.log(tables);
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, table)
    },
    //新增租户下桌状态
    async saveAdminTableByTableName (ctx, next) {
        ctx.checkBody('/table/name',true).first().notEmpty();
        ctx.checkBody('/table/status',true).first().notEmpty();
        ctx.checkBody('/table/info',true).first().notEmpty();
        ctx.checkBody('tenantId').notEmpty();

        let body = ctx.request.body;

        if (ctx.errors) {
            ctx.body = ctx.errors;
            return;
        }
        let tables = await Tables.findAll({
            where: {
                name: body.table.name,
                tenantId:body.tenantId,
                consigneeId:null
            }
        })
        if (tables.length > 0) {
            ctx.body = {
                resCode: -1,
                result: "桌号已存在！"
            }
            return;
        }
        await Tables.create({
            name: body.table.name,
            status: 0,
            info: body.table.info,
            tenantId: body.tenantId
                // todo: ok?
                //deletedAt: Date.now()
        });
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    },
    //新增租户下 代售点下桌号(即代售 桌号)
    async saveAdminTableByConsigneeId(ctx,next){
        ctx.checkBody('/table/name',true).first().notEmpty();
        ctx.checkBody('/table/status',true).first().notEmpty();
        ctx.checkBody('/table/info',true).first().notEmpty();
        ctx.checkBody('consigneeId').notEmpty();

        ctx.checkBody('tenantId').notEmpty();

        let body = ctx.request.body;

        if (ctx.errors) {
            ctx.body = ctx.errors;
            return;
        }
        let tables = await Tables.findAll({
            where: {
                name: body.table.name,
                tenantId:body.tenantId,
                consigneeId:body.consigneeId
            }
        })
        if (tables.length > 0) {
            ctx.body = {
                resCode: -1,
                result: "桌号已存在！"
            }
            return;
        }
        await Tables.create({
            name: body.table.name,
            status: 0,
            info: body.table.info,
            tenantId: body.tenantId,
            consigneeId:body.consigneeId
            // todo: ok?
            //deletedAt: Date.now()
        });
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    },
    //修改租户下桌状态
    async updateAdminTableByTableName (ctx, next) {
        ctx.checkBody('/table/name',true).first().notEmpty();
        //ctx.checkBody('/table/status',true).first().notEmpty();
        ctx.checkBody('/table/info',true).first().notEmpty();
        // ctx.checkBody('/condition/consigneeId').first().notEmpty();
        ctx.checkBody('/condition/id',true).first().notEmpty();
        ctx.checkBody('/condition/tenantId',true).first().notEmpty();

        let body = ctx.request.body;

        if (ctx.errors) {
            ctx.body = ctx.errors;
            return;
        }

        let table;
        let tables
        tables = await Tables.findAll({
            where:{
                info:body.table.info,
                name:body.table.name,
                tenantId:body.condition.tenantId,
                consigneeId:null
            }
        });
        if(tables.length>0){
            ctx.body = new ApiResult(ApiResult.Result.EXISTED, "已有此名请重新定义名字");
            return;
        }
        table = await Tables.findOne({
            where:{
                id:body.condition.id,
                tenantId:body.condition.tenantId,
                consigneeId:null
            }
        });
        if (table != null) {
            table.name = body.table.name;
            table.status = 0;
            table.info = body.table.info;
            table.tenantId=body.condition.tenantId;

            await table.save();
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    },
    //修改租户下 代售点下桌号(即代售 桌号)
    async updateAdminTableByConsigneeId (ctx, next) {
        ctx.checkBody('/table/name',true).first().notEmpty();
        //ctx.checkBody('/table/status',true).first().notEmpty();
        ctx.checkBody('/table/info',true).first().notEmpty();
        // ctx.checkBody('/condition/consigneeId').first().notEmpty();
        ctx.checkBody('/condition/id',true).first().notEmpty();
        ctx.checkBody('/condition/tenantId',true).first().notEmpty();
        ctx.checkBody('/condition/consigneeId',true).first().notEmpty();

        let body = ctx.request.body;

        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors)
            return;
        }

        let table;
        let tables
        tables = await Tables.findAll({
            where:{
                info:body.table.info,
                name:body.table.name,
                tenantId:body.condition.tenantId,
                consigneeId:body.condition.consigneeId
            }
        });
        if(tables.length>0){
            ctx.body = new ApiResult(ApiResult.Result.EXISTED, "已有此名请重新定义名字");
            return;
        }
        table = await Tables.findOne({
            where:{
                id:body.condition.id,
                tenantId:body.condition.tenantId,
                consigneeId:body.condition.consigneeId
            }
        });
        if (table != null) {
            table.name = body.table.name;
            table.status = 0;
            table.info = body.table.info;
            table.tenantId=body.condition.tenantId;

            await table.save();
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    },
    //删除租户下桌状态
    async deleteAdminTable(ctx, next){
        ctx.checkQuery('tableId').notEmpty();
        ctx.checkQuery('tenantId').notEmpty();
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors)
            return;
        }
        let table = await Tables.findOne({
            where:{
                id:ctx.query.tableId,
                tenantId:ctx.query.tenantId,
                consigneeId:null
            }
        })
        if(table==null){
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, "没有该记录")
            return;
        }
        await table.destroy();
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS);
    },
    //删除租户下 代售点下桌号(即代售 桌号)
    async deleteAdminByConsigneeId(ctx, next){
        ctx.checkQuery('tableId').notEmpty();
        ctx.checkQuery('tenantId').notEmpty();
        ctx.checkQuery('consigneeId').notEmpty();

        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors)
            return;
        }
        let table = await Tables.findOne({
            where:{
                id:ctx.query.tableId,
                tenantId:ctx.query.tenantId,
                consigneeId:ctx.query.consigneeId
            }
        })
        if(table==null){
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, "没有该记录")
            return;
        }
        await table.destroy();
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS);
    }

}