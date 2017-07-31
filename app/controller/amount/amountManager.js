const request = require('request');

const path = require('path');
const db = require('../../db/mysql/index');

const Orders = db.models.Orders;
const Foods = db.models.Foods;
const Vips = db.models.Vips;
const ProfitSharings = db.models.ProfitSharings;
const Coupons = db.models.Coupons;
const DeliveryFees = db.models.DeliveryFees;
const DistanceAndPrices = db.models.DistanceAndPrices;
const TenantConfigs = db.models.TenantConfigs;
const Consignees = db.models.Consignees;

const amountManger = (function () {

    //根据tenantId，consigneeId，订单号获取分成转账金额
    //原则：不管在哪个代售点领优惠券，在哪消费就算哪个代售点，优惠券只针对租户，优惠券表中consigneeId只看在哪领的
    //totalPrice 订单价格
    //merchantAmount 转给商户的钱
    //consigneeAmount 转给代售的钱
    //platformAmount  转给平台的钱 ---------totalPrice-merchantAmount-consigneeAmount
    //deliveryFee     配送费
    //refund_amount   退款
    //platformCouponFee                平台优惠
    //merchantCouponFee                商家优惠
    let getTransAccountAmount = async function (tenantId, consigneeId, trade_no, paymentMethod, refund_amount) {
        let amountJson = await this.getAmountByTradeNo(tenantId, consigneeId, trade_no);

        let totalAmount = 0;

        let platformAmount = 0;
        let platformCouponFee = 0;
        let merchantCouponFee = 0;
        let couponType = null;
        let couponValue = null;

        let retJson = {};
        let orders = await Orders.findAll({
            where: {
                trade_no: trade_no,
                tenantId: tenantId,
                consigneeId: consigneeId
            }
        })

        //异常情况不转账
        if (orders.length == 0) {
            retJson.totalAmount = 0;
            retJson.merchantAmount = 0;
            retJson.consigneeAmount = 0;
            retJson.totalPrice = 0;
            return retJson;
        }

        //查询代售和租户是否相同
        let isSame = await this.isTenantIdAndConsigneeIdSame(tenantId, consigneeId);

        let phone = orders[0].phone;

        //通过订单号获取优惠券
        let coupon = await Coupons.findOne({
            where: {
                trade_no: trade_no,
                phone: phone,
                tenantId: tenantId,
                //status: 0
            }
        })

        if (coupon != null) {
            totalAmount = amountJson.totalPrice;
        } else {
            //获取会员信息算会员价
            let vip = await Vips.findOne({
                where: {
                    phone: phone,
                    tenantId: tenantId
                }
            })

            if (vip != null) {
                totalAmount = amountJson.totalVipPrice;
            } else {
                totalAmount = amountJson.totalPrice;
            }
        }

        // //couponRate 平台出优惠券比率 比如0.6 商家0.4
        // if (coupon != null) {
        //     switch (coupon.couponType) {
        //         case 'amount':
        //             //totalAmount = ((totalAmount - coupon.value * (1 - coupon.couponRate)) <= 0) ? 0.01 : (totalAmount - coupon.value * (1 - coupon.couponRate));
        //             totalAmount = ((totalAmount - coupon.value * (coupon.couponRate)) <= 0) ? 0.01 : (totalAmount - coupon.value * (coupon.couponRate));
        //             break;
        //         case 'discount':
        //             //totalAmount = totalAmount - totalAmount * (1 - coupon.value) * (1 - coupon.couponRate);
        //             totalAmount = totalAmount - totalAmount * (1 - coupon.value) * (coupon.couponRate);
        //             break;
        //         case 'reduce':
        //             if (totalAmount >= coupon.value.split('-')[0]) {
        //                 //totalAmount = totalAmount - coupon.value.split('-')[1] * (1 - coupon.couponRate);
        //                 totalAmount = totalAmount - coupon.value.split('-')[1] * (coupon.couponRate);
        //             }
        //             break;
        //         default:
        //             totalAmount = totalAmount;
        //     }
        //     // if (coupon.couponRate == '1') {
        //     //     //平台付
        //     //     console.log('平台付：' + totalAmount)
        //     // } else if (coupon.couponRate == '0') {
        //     //     //商家付
        //     //     switch (coupon.couponType) {
        //     //         case 'amount':
        //     //             totalAmount = ((totalAmount - coupon.value) <= 0) ? 0.01 : (totalAmount - coupon.value);
        //     //             break;
        //     //         case 'discount':
        //     //             totalAmount = totalAmount * coupon.value;
        //     //             break;
        //     //         case 'reduce':
        //     //             if (coupon.value.split('-')[0] >= total_amount) {
        //     //                 totalAmount = totalAmount - coupon.value.split('-')[1];
        //     //             }
        //     //             break;
        //     //         default:
        //     //             totalAmount = totalAmount;
        //     //     }
        //     //     console.log('商家付：' + totalAmount)
        //     // } else {
        //     //     switch (coupon.couponType) {
        //     //         case 'amount':
        //     //             totalAmount = ((totalAmount - coupon.value * (1 - coupon.couponRate)) <= 0) ? 0.01 : (totalAmount - coupon.value * (1 - coupon.couponRate));
        //     //             break;
        //     //         case 'discount':
        //     //             totalAmount = totalAmount - totalAmount * (1 - coupon.value) * (1 - coupon.couponRate);
        //     //             break;
        //     //         case 'reduce':
        //     //             if (coupon.value.split('-')[0] >= total_amount) {
        //     //                 totalAmount = totalAmount - coupon.value.split('-')[1] * (1 - coupon.couponRate);
        //     //             }
        //     //             break;
        //     //         default:
        //     //             totalAmount = totalAmount;
        //     //     }
        //     //     console.log('平台商家共付：' + totalAmount)
        //     // }
        // }

        //加上配送费
        let dbDeliveryFee = await DeliveryFees.findOne({
            where: {
                trade_no: trade_no,
                tenantId: tenantId,
            }
        })

        let deliveryFee = 0;
        if (dbDeliveryFee != null) {
            let distanceAndPrice = await DistanceAndPrices.findOne({
                where: {
                    deliveryFeeId: dbDeliveryFee.deliveryFeeId,
                    tenantId: tenantId,
                }
            })
            if (distanceAndPrice != null) {
                deliveryFee = distanceAndPrice.deliveryFee;
            }
        }

        if (paymentMethod == '支付宝') {
            //暂时我们出手续费
            // //四舍五入 千分之0.994转账
            // totalAmount = Math.round(totalAmount * 99.4) / 100 - Math.round(deliveryFee * 0.6) / 100;//减去配送费的支付宝手续费
            totalAmount = totalAmount - refund_amount; //减去退款
        } else {
            totalAmount = totalAmount - refund_amount; //减去退款
        }

        let profitsharing = await ProfitSharings.findOne({
            where: {
                tenantId: tenantId,
                consigneeId: consigneeId
            }
        });


        if (profitsharing == null) {
            // retJson.totalPrice = amountJson.totalPrice;
            // retJson.totalAmount = parseFloat(totalAmount) + parseFloat(deliveryFee);//加配送费
            // retJson.totalAmount = Math.round(retJson.totalAmount * 100) / 100;
            //
            // retJson.merchantAmount = parseFloat(totalAmount) + parseFloat(deliveryFee);//加配送费
            // retJson.merchantAmount = Math.round(retJson.merchantAmount * 100) / 100;
            //
            // retJson.consigneeAmount = 0;

            retJson.totalPrice = 0;
            retJson.totalAmount = 0;
            retJson.totalAmount = 0;

            retJson.merchantAmount = 0;
            retJson.consigneeAmount = 0;

            console.log('没找到分润关系')
            return retJson;
        } else {
            let merchantAmount = 0;
            let consigneeAmount = 0;
            if (coupon != null) {
                // //优惠券，给代售商的分成减少一半
                // merchantAmount = totalAmount * (1 - profitsharing.rate - profitsharing.ownRate); //主商户提成+配送费
                // merchantAmount = Math.round(merchantAmount * 100) / 100;
                //
                // consigneeAmount = totalAmount * profitsharing.rate * 0.5;//代售商户提成
                // consigneeAmount = Math.round(consigneeAmount * 100) / 100;

                //总金额*自己分润 - 商家承担优惠
                switch (coupon.couponType) {
                    case 'amount':
                        merchantAmount = ((totalAmount * (1 - profitsharing.rate - profitsharing.ownRate) - coupon.value * (1 - coupon.couponRate)) <= 0) ? 0.01 : (totalAmount * (1 - profitsharing.rate - profitsharing.ownRate) - coupon.value * (1 - coupon.couponRate));
                        merchantAmount = Math.round(merchantAmount * 100) / 100;

                        consigneeAmount = ((totalAmount * profitsharing.rate - coupon.value) <= 0) ? 0 : (totalAmount * profitsharing.rate - coupon.value);
                        consigneeAmount = Math.round(consigneeAmount * 100) / 100;

                        platformCouponFee = coupon.value * coupon.couponRate;
                        merchantCouponFee = coupon.value * (1 - coupon.couponRate);

                        break;
                    case 'discount':
                        merchantAmount = totalAmount * (1 - profitsharing.rate - profitsharing.ownRate) - totalAmount * (1 - coupon.value) * (1 - coupon.couponRate);
                        merchantAmount = Math.round(merchantAmount * 100) / 100;

                        consigneeAmount = ((totalAmount * profitsharing.rate - totalAmount * (1 - coupon.value)) <= 0) ? 0 : (totalAmount * profitsharing.rate - totalAmount * (1 - coupon.value));
                        consigneeAmount = Math.round(consigneeAmount * 100) / 100;

                        platformCouponFee = totalAmount * coupon.couponRate;
                        merchantCouponFee = totalAmount * (1 - coupon.couponRate);

                        break;
                    case 'reduce':
                        if (totalAmount >= coupon.value.split('-')[0]) {
                            merchantAmount = ((totalAmount * (1 - profitsharing.rate - profitsharing.ownRate) - coupon.value.split('-')[1] * (1 - coupon.couponRate)) <= 0) ? 0.01 : (totalAmount * (1 - profitsharing.rate - profitsharing.ownRate) - coupon.value.split('-')[1] * (1 - coupon.couponRate));
                            console.log("TTTTTTTTTTTTTTTTTTTTT1==" + merchantAmount);
                            merchantAmount = Math.round(merchantAmount * 100) / 100;
                            console.log("TTTTTTTTTTTTTTTTTTTTT2==" + merchantAmount);

                            platformCouponFee = coupon.value.split('-')[1] * coupon.couponRate;
                            merchantCouponFee = coupon.value.split('-')[1] * (1 - coupon.couponRate);

                            // consigneeAmount = ((totalAmount * profitsharing.rate - coupon.value.split('-')[1]) <= 0) ? 0 : (totalAmount * profitsharing.rate - coupon.value.split('-')[1]);
                            // consigneeAmount = Math.round(consigneeAmount * 100) / 100;

                            consigneeAmount = ((totalAmount * profitsharing.rate - platformCouponFee) <= 0) ? 0 : (totalAmount * profitsharing.rate - platformCouponFee);
                            consigneeAmount = Math.round(consigneeAmount * 100) / 100;



                            if (tenantId  == '18d473e77f459833bb06c60f9a8f0000') {
                                merchantAmount = (totalAmount - coupon.value.split('-')[1]) * (1 - profitsharing.rate - profitsharing.ownRate) + platformCouponFee;
                                console.log("青豆家转账===" + merchantAmount);
                                
                            }
                        }
                        break;
                    default:
                        totalAmount = totalAmount;
                        return retJson;
                }
                couponType = coupon.couponType;
                couponValue = coupon.value;

                // //平台付
                // if (coupon.couponRate == '1') {
                //     //代售比率一半给商家
                //     merchantAmount = totalAmount * (1 - profitsharing.rate * 0.5 - profitsharing.ownRate); //主商户提成
                //     merchantAmount = Math.round(merchantAmount * 100) / 100;
                //
                //     consigneeAmount = total_amount * profitsharing.rate * 0.5;//代售商户提成
                //     consigneeAmount = Math.round(consigneeAmount * 100) / 100;
                // } else if (coupon.couponRate == '0') {
                //     merchantAmount = totalAmount * (1 - profitsharing.rate - profitsharing.ownRate); //主商户提成
                //     merchantAmount = Math.round(merchantAmount * 100) / 100;
                //
                //     consigneeAmount = total_amount * profitsharing.rate;//代售商户提成
                //     consigneeAmount = Math.round(consigneeAmount * 100) / 100;
                // } else {
                //
                // }
            } else {
                if (isSame == false) {
                    merchantAmount = totalAmount * (1 - profitsharing.rate - profitsharing.ownRate);
                    merchantAmount = Math.round(merchantAmount * 100) / 100;

                    consigneeAmount = totalAmount * profitsharing.rate;//代售商户提成
                    consigneeAmount = Math.round(consigneeAmount * 100) / 100;
                } else {
                    merchantAmount = totalAmount;
                    consigneeAmount = 0;
                }
            }

            platformAmount = amountJson.totalPrice - (platformCouponFee + merchantCouponFee) - merchantAmount - consigneeAmount;
            platformAmount = Math.round(platformAmount * 100) / 100;

            platformCouponFee = Math.round(platformCouponFee * 100) / 100;
            merchantCouponFee = Math.round(merchantCouponFee * 100) / 100;

            let totalPrice = Math.round(amountJson.totalPrice * 100) / 100;

            retJson.totalAmount = parseFloat(totalAmount) + parseFloat(deliveryFee);//加配送费
            retJson.totalAmount = Math.round(retJson.totalAmount * 100) / 100;

            retJson.merchantAmount = parseFloat(merchantAmount) + parseFloat(deliveryFee);//加配送费
            retJson.merchantAmount = Math.round(retJson.merchantAmount * 100) / 100;

            retJson.consigneeAmount = consigneeAmount;
            retJson.consigneeAmount = Math.round(retJson.consigneeAmount * 100) / 100;

            retJson.totalPrice = totalPrice;
            retJson.platformCouponFee = platformCouponFee;
            retJson.merchantCouponFee = merchantCouponFee;
            retJson.deliveryFee = deliveryFee;
            retJson.refund_amount = refund_amount;
            retJson.platformAmount = platformAmount;
            retJson.couponType = couponType;
            retJson.couponValue = couponValue;

            // console.log("返回给订单的所有金额:")
            // console.log("totalPrice====" + totalPrice);
            // console.log("merchantAmount====" + merchantAmount);
            // console.log("consigneeAmount====" + consigneeAmount);
            // console.log("platformCouponFee====" + platformCouponFee);
            // console.log("merchantCouponFee====" + merchantCouponFee);
            // console.log("deliveryFee====" + deliveryFee);
            // console.log("refund_amount====" + refund_amount);
            // console.log("platformAmount====" + platformAmount);
            // console.log("couponType===" + couponType);
            // console.log("couponValue===" + couponValue);
            return retJson;
        }
    }

    //通过订单号获取总金额
    let getAmountByTradeNo = async function (tenantId, consigneeId, trade_no) {
        let orders = await Orders.findAll({
            where: {
                trade_no: trade_no,
                tenantId: tenantId,
                consigneeId: consigneeId
            }
        })

        let food;
        let totalPrice = 0;
        let totalVipPrice = 0;
        for (let i = 0; i < orders.length; i++) {
            food = await Foods.findOne({
                where: {
                    id: orders[i].FoodId,
                    tenantId: tenantId
                }
            })

            totalPrice += food.price * orders[i].num;//原价
            totalVipPrice += food.vipPrice * orders[i].num;//会员价
        }


        let json = {};
        json.totalPrice = Math.round(totalPrice * 100) / 100;
        json.totalVipPrice = Math.round(totalVipPrice * 100) / 100;
        return json;
    }

    //通过订单号获取总金额
    let isTenantIdAndConsigneeIdSame = async function (tenantId, consigneeId) {
        let tenantConfig = await TenantConfigs.findOne({
            where: {
                tenantId: tenantId,
            }
        })

        let consignee = await Consignees.findOne({
            where: {
                consigneeId: consigneeId,
            }
        })

        if (tenantConfig.name == consignee.name) {
            return true;
        } else {
            return false;
        }

    }

    let instance = {
        getTransAccountAmount: getTransAccountAmount,
        getAmountByTradeNo: getAmountByTradeNo,
        isTenantIdAndConsigneeIdSame: isTenantIdAndConsigneeIdSame
    }

    return instance;
})();

module.exports = amountManger;