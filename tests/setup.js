// 测试前的全局设置
// 例如：设置环境变量、初始化测试数据库等

// 设置测试环境变量
process.env.NODE_ENV = 'test';
process.env.LINK_SPACE_PORT = '3000';

// 清除可能的ngrok环境变量
delete process.env.NGROK_AUTHTOKEN;

