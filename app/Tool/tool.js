class Tool {
    constructor(){
    }
}
Date.prototype.format = function (fmt) {
    var o = {
        "M+": this.getMonth() + 1, //月份
        "d+": this.getDate(), //日
        "h+": this.getHours(), //小时
        "m+": this.getMinutes(), //分
        "s+": this.getSeconds(), //秒
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度
        "S": this.getMilliseconds() //毫秒
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}
Array.prototype.contains = function (obj) {
    var i = this.length;
    while (i--) {
        if (this[i] === obj) {
            return true;
        }
    }
    return false;
}


Tool.uuid = function () {
    var s = [];
    var hexDigits = "0123456789abcdef";
    for (var i = 0; i < 36; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
    s[8] = s[13] = s[18] = s[23] = "-";

    var uuid = s.join("");
    return uuid;

}

Tool.isEmptyObject = function(obj) {
    for (var key in obj) {
        return false;
    }
    return true;
}

Tool.allocTenantId = function(){
    var S4 = function(){
        return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    };
    return (S4()+S4()+S4()+S4()+S4()+S4()+S4()+S4());
};

Tool.isObj = function (object) {
    return object && typeof (object) == 'object' && Object.prototype.toString.call(object).toLowerCase() == "[object object]";
}

Tool.isArray = function (object) {
    return object && typeof (object) == 'object' && object.constructor == Array;
}

Tool.getLength = function (object) {
    var count = 0;
    for (var i in object) count++;
    return count;
}

Tool.jsonCompare = function(objA,objB){
    var flag = true;
    for (var key in objA) {
        if (!flag) //跳出整个循环
            break;
        if (!objB.hasOwnProperty(key)) { flag = false; break; }
        if (!Tool.isArray(objA[key])) { //子级不是数组时,比较属性值
            if (objB[key] != objA[key]) { flag = false; break; }
        } else {
            if (!Tool.isArray(objB[key])) { flag = false; break; }
            var oA = objA[key], oB = objB[key];
            if (oA.length != oB.length) { flag = false; break; }
            for (var k in oA) {
                if (!flag) //这里跳出循环是为了不让递归继续
                    break;
                flag = Tool.jsonCompare(oA[k], oB[k], flag);
            }
        }
    }
    return flag;
}

Tool.jsonIsInArray = function (arr,obj) {
    for(var i = 0;i<arr.length;i++) {
        if (Tool.jsonCompare(arr[i],obj)) {
            return true;
        }
    }
    return false
}

module.exports = Tool;