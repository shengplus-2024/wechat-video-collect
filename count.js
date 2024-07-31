const path = require("path")
const fs = require("fs")
const XLSX = require('xlsx');
const json2xls = require('json2xls');
var log4js = require("log4js");
var logger = log4js.getLogger();
logger.level = "info";

const directoryPath = path.join(__dirname, 'output_data');

//计算所有excel的总条数
async function updateTotalExcelRowNum() {
  return new Promise((resolve, reject) => {
    countTotalRowsInExcelDirectory(directoryPath, (totalRowCount) => {
      totalExcelRowNum = totalRowCount;
      logger.info('本次采集的所有excel合计总条数', totalExcelRowNum);
      resolve();
    });
  });
}

/** 统计excel行数 */
function countTotalRowsInExcelDirectory(directoryPath, callback) {
  let totalRowCount = 0;

  // 读取目录中的文件列表
  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      logger.info('Error reading directory:', err);
      return;
    }

    // 遍历文件列表
    files.forEach(file => {
      const filePath = path.join(directoryPath, file);

      // 仅处理 .xlsx 文件
      if (path.extname(file) === '.xlsx') {
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // 将工作表转换为 JSON 格式
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        // 去除标题行，计算数据行数
        const dataRows = data.slice(1);
        const rowCount = dataRows.length;

        totalRowCount += rowCount; // 累加数据行数
      }
    });

    callback(totalRowCount); // 调用回调传递结果
  });
}

/** 统计账号 */

function countAccount() {
  /** 查看不存在的视频号 */
  const filePath = './read_data/微信视频号.xlsx'; // 请替换为实际的文件路径
  // 读取Excel文件
  const workbook = XLSX.readFile(filePath);
  // 获取第一个工作表
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  // 将工作表数据转换为 JSON
  const allData = XLSX.utils.sheet_to_json(sheet);
  logger.info(`excel中视频号数量：${allData.length} 个  \r\n`)

  // 使用 Set 去重
  const uniqueAccounts = [];
  const seenAccounts = new Set();

  allData.map(item => {
    if (!seenAccounts.has(item.account)) {
      seenAccounts.add(item.account);
      uniqueAccounts.push(item);
    }
  });

  logger.info(`excel中视频号数量去重之后：${uniqueAccounts.length} 个 \r\n`);

  const canReadData = require("./account.json")
  logger.info(`可以正常读取或搜索到的账号：${canReadData.length} 个`)

  // 提取所有可读数据的昵称
  const canReadNicknames = canReadData.map(item => item.nickname);
  // // 找出所有数据中不在可读数据昵称中的account
  const diffAccounts = uniqueAccounts.filter(item => !canReadNicknames.includes(item.account)).map(item => item.account);



  fs.writeFile('./不能正常读取(视频号不存在)的账号.txt', diffAccounts.join('\n'), err => {
    if (err) {
      logger.info('写入文件时出错:', err);
    } else {
      logger.info(`不能正常读取(视频号不存在)的账号：${diffAccounts.length}个 \r\n`,);

    }
  });


  /** 读取output_data中的文件名 */
  // 读取目录中的所有文件
  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      return console.error('无法读取目录: ', err);
    }

    // 提取文件名数组
    const collectFileNames = files.map(file => {
      const parts = file.split('_');
      return parts[0];
    });

    const diffCanReadNicknames = canReadNicknames.filter(name => !collectFileNames.includes(name));

    fs.writeFile('./已读取，没有进行采集的账号(日期内无发布).txt', diffCanReadNicknames.join('\n'), err => {
      if (err) {
        logger.info('写入文件时出错:', err);
      } else {
        logger.info(`已读取，成功采集的账号：${canReadData.length - diffCanReadNicknames.length}个，`);
        logger.info(`已读取，没有进行采集的账号(可能是日期内无发布，可能是其他原因)的账号：${diffCanReadNicknames.length}个， \r\n`);
      }
    });

  });
}





async function run() {
  await countAccount()
  setTimeout(async()=>{
    await updateTotalExcelRowNum();
  },1000)
  
}
run()

