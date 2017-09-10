'use strict';

exports.formatName = function (str) {
    return str.replace(/\w\S*/g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
};

exports.countWords = function (str) {
    if (str) {
        return str.split(/\s+/).length;
    }
    return 0;
};


exports.buildUrl = function (url, paramsMap, append) {
    var returnUrl = url + (append ? '&' : '?');
    Object.keys(paramsMap).forEach(function (param, idx) {
        returnUrl += param + '=' + encodeURIComponent(paramsMap[param]);
        if (idx < (Object.keys(paramsMap).length - 1)) {
            returnUrl += '&';
        }

    });
    return returnUrl;
};

exports.getOrdinalSuffix = function (i) {
    var j = i % 10,
        k = i % 100;
    if (j == 1 && k != 11) {
        return "st";
    }
    if (j == 2 && k != 12) {
        return "nd";
    }
    if (j == 3 && k != 13) {
        return "rd";
    }
    return "th";
};

exports.yearsBetween = function (d1, d2) {
    return (d2 - d1) / (1000 * 365 * 30 * 24 * 3600);
};

exports.isNotEmpty = function (arr) {
    return arr && arr.length > 0;
};

exports.isEmpty = function (arr) {
    return !this.isNotEmpty(arr);
};

exports.isBetween = function (val, l, h) {
    return val >= l && val <= h;
};

exports.limitSet = function (temp_docs, limit) {
    for (let i = 0; i < temp_docs.length; i++) {
        temp_docs[i].company_trim = temp_docs[i].company;
        temp_docs[i].designation_trim = temp_docs[i].designation_visible;
        if (temp_docs[i].company.length > limit) {
            temp_docs[i].company_title = temp_docs[i].company;
            temp_docs[i].company_trim = temp_docs[i].company.substring(0, limit) + '...';
        }
        if (temp_docs[i].designation_visible.length > limit) {
            temp_docs[i].designation_visible_title = temp_docs[i].designation_visible;
            temp_docs[i].designation_trim = temp_docs[i].designation_visible.substring(0, limit) + '...';
        }
    }
    return temp_docs;
};

exports.truncate = function (s, l, trail) {
    let r = s ? s.substring(0, l) : s;
    if (r !== s && trail) {
        r += '..';
    }
    return r;
};

exports.DelayPromise = function (delay) {
    //return a function that accepts a single variable
    return function (data) {
        //this function returns a promise.
        return new Promise(function (resolve, reject) {
            setTimeout(function () {
                //a promise that is resolved after "delay" milliseconds with the data provided
                resolve(data);
            }, delay);
        });
    };
};
