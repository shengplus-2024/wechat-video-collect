/*
 * @Date: 2024-07-02 16:05:45
 * @LastEditors: huangsheng
 * @LastEditTime: 2024-07-30 14:52:17
 * @FilePath: \微信视频号新架构-徐良杰\config.js
 * @Description: 
 */


const dayjs = require('dayjs')

// 近多少天
let num = 7

// 视频号采集开始时间
let yesterday = dayjs().subtract(num, 'day').format('YYYY-MM-DD 00:00:00')
let monthStr = dayjs().subtract(num, 'day').format('YYYY_MM_DD_00点')

// 视频号采集截止时间(此处加1，是为了让截止时间处于今天晚上凌晨，保持数据最新)
let tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD 00:00:00')


// 开始和结束时间 unix 时间
let startTime = dayjs(yesterday).unix();
let endTime = dayjs(tomorrow).unix();

// api服务器地址，非本机启动，联系他人启动服务
let apiUrl = 'http://localhost:4567/'
let directoryPath = __dirname


module.exports = {
    month: `${monthStr}__此刻`,
    // month: `微信视频号`,
    startTime: startTime,
    endTime: endTime,
	apiUrl,
    directoryPath
}; 
