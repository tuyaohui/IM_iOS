var mosca = require('mosca');  

var MqttServer = new mosca.Server({  
    port: 6969  
});  
  
MqttServer.on('clientConnected', function(client){  
    console.log('收到客户端连接，连接ID：', client.id);  
});  
  
/** 
 * 监听MQTT主题消息 
 **/  
MqttServer.on('published', function(packet, client) {  
    var topic = packet.topic;  
    console.log('有消息来了','topic为：'+topic+',message为：'+ packet.payload.toString());  
  
});  
  
MqttServer.on('ready', function(){  
    console.log('mqtt服务器开启，监听6969端口');  
});  