let vipConsumptionEchats = require('../../controller/admin/vipConsumptionEchats');

const router = new (require('koa-router'))()

router.post('/api/test/admin/vipConsumptionEchats', vipConsumptionEchats.saveAdminVipConsumptionEchats);
module.exports = router
