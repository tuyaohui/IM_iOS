//
//  TYHSocketManager.m
//  CocoaSyncSocket
//
//  Created by 涂耀辉 on 16/12/28.
//  Copyright © 2016年 涂耀辉. All rights reserved.
//

#import "TYHSocketManager.h"

#import <sys/types.h>
#import <sys/socket.h>
#import <netinet/in.h>
#import <arpa/inet.h>



@interface TYHSocketManager()

@property (nonatomic,assign)int clientScoket;

@end

@implementation TYHSocketManager

+ (instancetype)share
{
    static dispatch_once_t onceToken;
    static TYHSocketManager *instance = nil;
    dispatch_once(&onceToken, ^{
        instance = [[self alloc]init];
        [instance initScoket];
        [instance pullMsg];
    });
    return instance;
}



- (void)initScoket
{
    //每次连接前，先断开连接
    if (_clientScoket != 0) {
        [self disConnect];
        _clientScoket = 0;
    }
   
    //创建客户端socket
    _clientScoket = CreateClinetSocket();
  
    //服务器Ip
    const char * server_ip="127.0.0.1";
    //服务器端口
    short server_port=6969;
    //等于0说明连接失败
    if (ConnectionToServer(_clientScoket,server_ip, server_port)==0) {
        printf("Connect to server error\n");
        return ;
    }
    //走到这说明连接成功
    printf("Connect to server ok\n");
}

static int CreateClinetSocket()
{
    int ClinetSocket = 0;
    //创建一个socket,返回值为Int。（注scoket其实就是Int类型）
    //第一个参数addressFamily IPv4(AF_INET) 或 IPv6(AF_INET6)。
    //第二个参数 type 表示 socket 的类型，通常是流stream(SOCK_STREAM) 或数据报文datagram(SOCK_DGRAM)
    //第三个参数 protocol 参数通常设置为0，以便让系统自动为选择我们合适的协议，对于 stream socket 来说会是 TCP 协议(IPPROTO_TCP)，而对于 datagram来说会是 UDP 协议(IPPROTO_UDP)。
    ClinetSocket = socket(AF_INET, SOCK_STREAM, 0);
    return ClinetSocket;
}
static int ConnectionToServer(int client_socket,const char * server_ip,unsigned short port)
{
    
    //生成一个sockaddr_in类型结构体
    struct sockaddr_in sAddr={0};
    sAddr.sin_len=sizeof(sAddr);
    //设置IPv4
    sAddr.sin_family=AF_INET;
    
    //inet_aton是一个改进的方法来将一个字符串IP地址转换为一个32位的网络序列IP地址
    //如果这个函数成功，函数的返回值非零，如果输入地址不正确则会返回零。
    inet_aton(server_ip, &sAddr.sin_addr);
    
    //htons是将整型变量从主机字节顺序转变成网络字节顺序，赋值端口号
    sAddr.sin_port=htons(port);
    
    //用scoket和服务端地址，发起连接。
    //客户端向特定网络地址的服务器发送连接请求，连接成功返回0，失败返回 -1。
    //注意：该接口调用会阻塞当前线程，直到服务器返回。
    if (connect(client_socket, (struct sockaddr *)&sAddr, sizeof(sAddr))==0) {
        return client_socket;
    }
    return 0;
}

#pragma mark - 新线程来接收消息

- (void)pullMsg
{
    NSThread *thread = [[NSThread alloc]initWithTarget:self selector:@selector(recieveAction) object:nil];
    [thread start];
}


#pragma mark - 对外逻辑

- (void)connect
{
    [self initScoket];
}
- (void)disConnect
{
    //关闭连接
    close(self.clientScoket);
}

//发送消息
- (void)sendMsg:(NSString *)msg
{
    
    const char *send_Message = [msg UTF8String];
    send(self.clientScoket,send_Message,strlen(send_Message)+1,0);
    
}


//收取服务端发送的消息
- (void)recieveAction{

    while (1) {
        char recv_Message[1024] = {0};
        recv(self.clientScoket, recv_Message, sizeof(recv_Message), 0);
        printf("%s\n",recv_Message);
    }
}


@end
