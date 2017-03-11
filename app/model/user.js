'use strict';
/**
 * <plusmancn@gmail.com> created at 2017.02.10 13:56:21
 *
 * Copyright (c) 2017 Souche.com, all rights
 * reserved.
 *
 * 用户信息维护-模型
 */

const cloverx = require('cloverx');
const schemaUser = cloverx.mysql.get('im/user');
const pinyin = require('pinyin');

const RANDOM_AVATAR = [
    'http://image-2.plusman.cn/app/im-client/avatar/tuzki_01.jpg',
    'http://image-2.plusman.cn/app/im-client/avatar/tuzki_02.png',
    'http://image-2.plusman.cn/app/im-client/avatar/tuzki_03.jpg',
    'http://image-2.plusman.cn/app/im-client/avatar/tuzki_04.png',
    'http://image-2.plusman.cn/app/im-client/avatar/tuzki_05.jpeg',
    'http://image-2.plusman.cn/app/im-client/avatar/tuzki_06.jpg',
    'http://image-2.plusman.cn/app/im-client/avatar/tuzki_07.jpg',
    'http://image-2.plusman.cn/app/im-client/avatar/tuzki_08.png'
];

/**
 * 用户注册
 */
async function login (name, phone, socketId = '') {
    let user = await schemaUser.findOne({
        where: {
            phone: phone
        }
    });

    if(user && user.status === 'online') {
        throw cloverx.Error.badParameter(`手机用户 ${phone} 已经在线`);
    }

    // 随机头像
    let avatar = RANDOM_AVATAR[Math.floor((Math.random() * RANDOM_AVATAR.length))];
    // 姓名首字母
    let firstLetter = getNameFirstLetter(name);

    let result;
    if(user) {
        result = await user.update({
            name,
            socketId,
            firstLetter,
            status: 'online'
        });
    } else {
        result = await schemaUser
        .build({
            name,
            phone,
            avatar,
            socketId,
            firstLetter,
            status: 'online'
        })
        .save();
    }

    return result;
}

/**
 * 修改用户属性
 */
async function modifyUserInfo (userId, field, value) {
    if (!~['name'].indexOf(field)) {
        throw cloverx.Error.badParameter(`字段 ${field} 不可更改`);
    }

    let user = await schemaUser
        .findOne({
            where: {
                userId: userId
            }
        });

    if(!user) {
        throw cloverx.Error.badParameter(`用户ID ${userId} 不存在`);
    }

    if (field === 'name') {
        return await user.update({
            [field]: value,
            firstLetter: getNameFirstLetter(value)
        });
    } else {
        return await user.update({
            [field]: value,
        });
    }
}

/**
 * 用户登出
 */
async function logout(userId) {
    let user = await schemaUser.findOne({
        where: {
            userId: userId
        }
    });

    if(!user) {
        throw cloverx.Error.badParameter(`用户ID ${userId} 不存在`);
    }

    return await user.update({
        status: 'offline'
    });
}

/**
 * 拉取在线用户列表
 */
async function list(status) {
    let where = {};
    if(status) {
        where.status = status;
    }

    let result = await schemaUser.findAll({
        attributes: ['userId', 'avatar', 'name', 'phone', 'socketId', 'status', 'firstLetter'],
        where,
        order: [
            ['firstLetter', 'asc'],
            ['updatedAt', 'desc']
        ],
        raw: true
    });

    let sectionSort = {};
    for(let i = 0; i< result.length; i++) {
        let {firstLetter } = result[i];
        if( !sectionSort[firstLetter] ) {
            sectionSort[firstLetter] = [result[i]];
        } else {
            sectionSort[firstLetter].push(result[i]);
        }
    }

    return sectionSort;
}

/**
 * 获取用户首字母
 */
function getNameFirstLetter(name) {
    let result = pinyin(name[0]);
    return result[0][0][0];
}

module.exports = {
    login,
    logout,
    list,
    modifyUserInfo
};
