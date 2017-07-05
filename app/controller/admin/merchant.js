const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const logger = require('koa-log4').getLogger('AddressController')
let db = require('../../db/mysql/index');
let Merchants = db.models.Merchants;
let ProfitSharings = db.models.ProfitSharings;
let Consignees =db.models.Consignees;

module.exports = {
    async saveAdminMerchant (ctx, next) {
        ctx.checkBody('/merchant/name',true).first().notEmpty();
        ctx.checkBody('/merchant/phone',true).first().notEmpty();
        ctx.checkBody('/merchant/industry',true).first().notEmpty();
        ctx.checkBody('/merchant/tenantId',true).first().notEmpty();

        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors)
            return;
        }

        let body = ctx.request.body;
        let merchant = await Merchants.findAll({
            where: {
                tenantId : body.merchant.tenantId,
            }
        });
        if (merchant.length > 0) {
            ctx.body = new ApiResult(ApiResult.Result.EXISTED, "菜品已存在，请重新定义")
            return;
        }
        merchant[0] = await Merchants.create({
            name: body.merchant.name,
            phone: body.merchant.phone,
            industry:body.merchant.industry,
            tenantId: body.merchant.tenantId
            // todo: ok?
            //deletedAt: Date.now()
        });
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    },

    async updateAdminMerchantById (ctx, next) {
        ctx.checkBody('/merchant/name',true).first().notEmpty();
        ctx.checkBody('/merchant/phone',true).first().notEmpty();
        ctx.checkBody('/merchant/industry',true).first().notEmpty();
        ctx.checkBody('/condition/tenantId',true).first().notEmpty();

        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors)
            return;
        }
        let body = ctx.request.body;
        let merchantResult = await Merchants.findAll({
            where: {
                tenantId:body.condition.tenantId
            }
        });
        if (merchantResult.length <= 0) {
            ctx.body = new ApiResult(ApiResult.Result.EXISTED, "菜品不存在，请重新定义")
            return;
        }
        let id = merchantResult[0].id
        let merchants;
        merchants = await Merchants.findById(id);
        if (merchants != null) {
            merchants.name = body.merchant.name;
            merchants.phone = body.merchant.phone;
            merchants.industry = body.merchant.industry;
            merchants.tenantId = body.condition.tenantId;
            //menus.type = body.type;
            await merchants.save();
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    },

    async getAdminMerchant (ctx, next) {
        if(ctx.query.tenantId!=null&&ctx.query.consigneeId==null){
            let merchant = await Merchants.findAll({
                where: {
                    tenantId: ctx.query.tenantId
                },
                attributes: {
                    exclude: ['createdAt', 'updatedAt']
                },
            });
            ctx.body = new ApiResult(ApiResult.Result.SUCCESS, merchant);
            return;
        }
        if(ctx.query.tenantId==null&&ctx.query.consigneeId!=null){
            let Profitsharings = await ProfitSharings.findAll({
                where: {
                    consigneeId: ctx.query.consigneeId
                },

            });
            let merchantId;
            let merchant;
            let merchants = [];
            for(let i = 0; i < Profitsharings.length;i++) {
                merchantId = Profitsharings[i].tenantId;
                merchant = await Merchants.findOne({
                    where: {
                        tenantId: merchantId
                    },

                });
                merchants.push(merchant)
            }
            ctx.body = new ApiResult(ApiResult.Result.SUCCESS, merchants);
        }
    },

    async deleteAdminMerchant(ctx, next){
        ctx.checkParam('tenantId').notEmpty();

        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors );
            return;
        }
        let tenantId = ctx.query.tenantId;
        let merchant = await Merchants.findAll({
            where : {
                tenantId : tenantId
            }
        });
        if(merchant.length<=0){
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"你所要删除的商户不存在" );
            return;
        }
        merchant.forEach(async function(e){
            await e.destroy();
        })
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS);
    },

    async getAdminConsignee(ctx, next){
        ctx.checkQuery('tenantId').notEmpty();
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors );
            return;
        }
        let tenantId = ctx.query.tenantId;
        let profitSharings = await ProfitSharings.findAll({
            where : {
                tenantId : tenantId
            }
        });
        if(profitSharings.length<=0){
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"你所要查询的商户不存在" );
            return;
        }
        let profitSharingId;
        let consignee;
        let consignees = [];
        for(let i = 0 ; i <profitSharings.length;i++ ){
            profitSharingId=profitSharings[i].consigneeId;
            consignee = await Consignees.findOne({
                where : {
                    consigneeId:profitSharingId
                }
            })
            consignees.push(consignee);
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, consignees);
    }

}
