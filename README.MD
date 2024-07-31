

# 微信视频号采集流程

## 提供账号模板

- 按照如下格式，提供要采集的微信视频号账号列表

  ![image-20240702163759157](https://shengoos.oss-cn-beijing.aliyuncs.com/markdown%E7%AC%94%E8%AE%B0%E6%88%AA%E5%9B%BE/202407021637202.png)

- 表行首行`id`和`account`两列，这两列的值不要有空格

- 命名为`微信视频号.xlsx`

## 安装依赖

```shell
# 执行npm install或者cnpm install安装依赖
npm install
```

## 放入账号模板解析账号

- 将`微信视频号.xlsx`放入`read_data`目录下，替换原有xlsx

- 执行`npm run read-excel`，读取excel，读取成功后把会excel中的数据，生成到当前目录的`account.json`中，自行验证

  ![image-20240702165551697](https://shengoos.oss-cn-beijing.aliyuncs.com/markdown%E7%AC%94%E8%AE%B0%E6%88%AA%E5%9B%BE/202407021655719.png)

- 终端出现`解析写入account.json成功!`代表账号解析完成

## 设定采集时间

- 查看`config.js`
- 修改`num`的值，默认为7，表示采集近7天的数据

## 执行采集

- 运行`npm run start-collect`
- 等待采集完成

## 查看采集结果日志

- 执行`npm run count-analysis` 
![image-20240702165442921](https://shengoos.oss-cn-beijing.aliyuncs.com/markdown%E7%AC%94%E8%AE%B0%E6%88%AA%E5%9B%BE/202407021654948.png)

## 查看结果文件

- `output_data`中存放的就是采集的数据文件