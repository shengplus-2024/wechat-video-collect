const axios = require('axios');
const fs = require('fs');
const path = require('path');
const dayjs = require('dayjs');
const fsExtra = require('fs-extra');
const cheerio = require('cheerio');
const json2xls = require('json2xls');
var log4js = require("log4js");
const config = require('./config.js');
const notifier = require('node-notifier');

let { apiUrl, startTime, endTime, month } = config;
var logger = log4js.getLogger();
logger.level = "info";

// 读取待采集队列
const taskQueue = require("./account.json");

// 清空output_data目录
async function emptyDirectory() {
    const directoryPath = path.join(__dirname, 'output_data');
    try {
        await fsExtra.emptyDir(directoryPath);
        console.log(`成功清空目录: ${directoryPath}`);
        await fsExtra.ensureDir(directoryPath);
        console.log(`成功创建目录: ${directoryPath}`);
        await new Promise(resolve => setTimeout(resolve, 500));
    } catch (err) {
        console.error('操作失败: ', err);
    }
}

/** 处理数据写入 */
function handleAndWriteData(handleData, accountName, id) {
    const result = handleData.map(item => {
        const regex = /<!\[CDATA\[(.*?)\]\]>/gs;
        const matches = item.objectDesc.topic.finderTopicInfo && item.objectDesc.topic.finderTopicInfo.match(regex);
        let combinedText = '';

        if (matches) {
            const pureText = matches.map(match => {
                const innerMatch = /<!\[CDATA\[(.*?)\]\]>/.exec(match);
                return innerMatch && innerMatch[1] ? innerMatch[1] : '';
            });
            combinedText = pureText.length > 0 ? pureText.join('') : '';
        }

        const myTitle = combinedText ? extractPlainTextFromHtml(combinedText) : extractPlainTextFromHtml(item.objectDesc.description);

        return {
            id: id,
            title: myTitle,
            cover_url: item.objectDesc.media[0].thumbUrl,
            vedio_link: item.objectDesc.media[0].url,
            read_count: item.readCount,
            like_count: item.likeCount,
            comment_count: item.commentCount,
            collection_count: 0,
            share_count: item.forwardCount,
            create_time: dayjs.unix(item.createtime).format('YYYY-MM-DD HH:mm:ss')
        };
    });

    const xls = json2xls(result);
    const excelFilePath = `./output_data/${accountName}_${month}.xlsx`;
    fs.writeFileSync(excelFilePath, xls, 'binary');
    logger.info(`-----${accountName}-----写入excel成功`);
}

/** 处理html */
function extractPlainTextFromHtml(htmlString) {
    const $ = cheerio.load(htmlString);
    return $('body').text();
}

/** 执行数据采集 */
const startTimestamp = process.hrtime();
async function fetchData(task, lastBuff = "") {
    logger.info("当前任务", task);
    const allData = [];
   
    let loopCount = 0;

    try {
        while (true) {
            // 等待5秒
       
            

            const requestData = {
                data: {
                    username: task.username,
                    last_buff: lastBuff,
                },
                client_id: 1,
                "is_sync": 1,
                type: "MT_FINDER_AUTHOR_MSG"
            };
            const response = await axios.post(apiUrl, requestData);
            const responseData = response.data.data;

            fs.writeFileSync(`./test.json`, JSON.stringify(responseData, null, 2));

            if (responseData.object && responseData.object.length > 0) {
                const allDataOutsideTimeInterval = responseData.object.every(item =>
                    item.createtime < startTime || item.createtime > endTime
                );

                if (responseData.object.length === 0 || allDataOutsideTimeInterval) {
                    logger.info(`-----${task.nickname}-----本次请求返回数据量`, responseData.object.length);
                    logger.info(`-----${task.nickname}-----采集总条数`, allData.length);
                    logger.info(`-----${task.nickname}-----本次采集结束,均不在区间内`, allDataOutsideTimeInterval);
                    handleAndWriteData(allData, task.account_name, task.id);

                    const endTimestamp = process.hrtime();
                    const elapsedTime = (endTimestamp[0] - startTimestamp[0]) + (endTimestamp[1] - startTimestamp[1]) / 1e9;
                    logger.info(`-----${task.nickname}-----循环执行耗时：${elapsedTime.toFixed(2)} 秒`);
                    break;
                } else {
                    let filterData = responseData.object.filter(item =>
                        item.createtime >= startTime &&
                        item.createtime <= endTime &&
                        item.nickname === task.nickname
                    );

                    logger.info(`-----${task.nickname}-----本次查询到`, responseData.object.length);
                    logger.info(`-----${task.nickname}-----在时间区间内 且 有标题 条数`, filterData.length);
                    allData.push(...filterData);

                    logger.info(`-----${task.nickname}-----Loop ${loopCount + 1}: 现在数据量 ${allData.length}`);
                    lastBuff = responseData.lastBuffer;
                    loopCount++;
                    handleAndWriteData(allData, task.account_name, task.id);
                }
            } else {
                logger.info(`-----${task.nickname}-----无数据`);
                break;
            }
        }
    } catch (error) {
        logger.error(`Error fetching data for task ${task.id}:接口服务异常`, error);
    }
}

async function runTasks() {
    for (const task of taskQueue) {
        await fetchData(task);
    }

    notifier.notify({
        title: '采集结果',
        message: '微信视频号采集成功!',
        sound: true // Will only work on macOS and Windows, unless a path is provided to a sound file.
    }, function (err, response) {
    });
}

// 运行任务
runTasks().catch(err => console.error(err));
