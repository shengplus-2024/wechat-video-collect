/*
 * @Author: HuangSheng
 * @Description: 
 * @Date: 2024-03-01 15:33:23
 * @LastEditors: huangsheng
 * @LastEditTime: 2024-07-02 17:17:59
 * @FilePath: \微信视频号新架构\read.js
 */
const fs = require('fs');
const xlsx = require('xlsx');
const axios = require('axios');
const uuid = require('uuid');
const ora = require('ora');

const filePath = './read_data/微信视频号.xlsx';
const config = require('./config.js');
let { apiUrl } = config


// 读取Excel文件
const workbook = xlsx.readFile(filePath);

// 获取第一个工作表
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

// 将工作表数据转换为 JSON
const accountData = xlsx.utils.sheet_to_json(sheet);



// 打印读取到的数据
// console.log(accountData);

// 参数
const postData = {
  "data": {
    "query": "",
    "last_buff": "",
    "scene": 0
  },
  "client_id": 1,
  "is_sync": 1,
  "type": "MT_FINDER_SEARCH_MSG"
};

// 创建一个数组用于存储所有调用的结果
const results = [];

// 遍历accountData数组并发起POST请求
const spinner = ora('开始解析账号...').start();
async function postDataForAccounts() {
  for (const accountObj of accountData) {
    // 设置POST请求参数中的query值为当前账户的值
    postData.data.query = accountObj.account;
    console.log(" 🥝 当前查找的视频号", postData.data.query);

    try {
      // 发起POST请求
      const response = await axios.post(apiUrl, postData);

      let objectList = response.data.data.objectList
      let infoList = response.data.data.infoList;

      fs.writeFileSync('test.json', JSON.stringify(objectList, null, 2));

      // 遍历 objectList每一项
      const foundInObjectList = objectList.some(item => {
        if (item.nickname === accountObj.account) {
          results.push({ account_name: accountObj.account, nickname: item.nickname, username: item.username, id: accountObj.id });
          return true; // 停止遍历
        }
        return false;
      });

      // 如果在objectList中没有找到，再遍历infoList
      if (!foundInObjectList) {
        const foundInInfoList = infoList.some(item => {
          if (item.contact.nickname === accountObj.account) {
            results.push({ account_name: accountObj.account, nickname: item.contact.nickname, username: item.contact.username, id: accountObj.id });
            return true; // 停止遍历
          }
          return false;
        });

        // 如果在infoList中也没有找到，返回false
        if (!foundInInfoList) {
          console.log('未找到匹配项');
        }
      }



    }
    catch (error) {
      // 将错误信息添加到数组中
      results.push({ account_name: accountObj.account, error: error.message });
    }
  }
}

// 执行POST请求
postDataForAccounts().then(() => {
  // 打印所有结果
  console.log('All results:', results);
  // 将结果写入account.json文件
  const jsonResults = JSON.stringify(results, null, 2); // 格式化JSON字符串，缩进为2个空格
  fs.writeFileSync('account.json', jsonResults);
  spinner.succeed('解析写入account.json成功!')
  console.log('account.json成功')
});