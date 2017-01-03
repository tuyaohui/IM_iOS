//
//  TYHSocketManager.m
//  CocoaSyncSocket
//
//  Created by 涂耀辉 on 16/12/28.
//  Copyright © 2016年 涂耀辉. All rights reserved.
//

#import "TYHSocketManager.h"
#import "GCDAsyncSocket.h" // for TCP


static  NSString * Khost = @"127.0.0.1";
static const uint16_t Kport = 6969;


@interface TYHSocketManager()<GCDAsyncSocketDelegate>
{
    GCDAsyncSocket *gcdSocket;
}

@end

@implementation TYHSocketManager

+ (instancetype)share
{
    static dispatch_once_t onceToken;
    static TYHSocketManager *instance = nil;
    dispatch_once(&onceToken, ^{
        instance = [[self alloc]init];
        [instance initSocket];
    });
    return instance;
}

- (void)initSocket
{
    gcdSocket = [[GCDAsyncSocket alloc] initWithDelegate:self delegateQueue:dispatch_get_main_queue()];
    
}

#pragma mark - 对外的一些接口

//建立连接
- (BOOL)connect
{
    return  [gcdSocket connectToHost:Khost onPort:Kport error:nil];
}

//断开连接
- (void)disConnect
{
    [gcdSocket disconnect];
}


//发送消息
- (void)sendMsg:(NSString *)msg

{
    
    NSData *data  = [msg dataUsingEncoding:NSUTF8StringEncoding];
    

    //第二个参数，请求超时时间
    [gcdSocket writeData:data withTimeout:-1 tag:110];
    
 

}

//监听最新的消息
- (void)pullTheMsg
{
    //貌似是分段读数据的方法
//    [gcdSocket readDataToData:[GCDAsyncSocket CRLFData] withTimeout:10 maxLength:50000 tag:110];
   
    //监听读数据的代理，只能监听10秒，10秒过后调用代理方法  -1永远监听，不超时，但是只收一次消息，
    //所以每次接受到消息还得调用一次
    [gcdSocket readDataWithTimeout:-1 tag:110];

}

//用Pingpong机制来看是否有反馈
- (void)checkPingPong
{
    //pingpong设置为3秒，如果3秒内没得到反馈就会自动断开连接
    [gcdSocket readDataWithTimeout:3 tag:110];

}



#pragma mark - GCDAsyncSocketDelegate
//连接成功调用
- (void)socket:(GCDAsyncSocket *)sock didConnectToHost:(NSString *)host port:(uint16_t)port
{
    NSLog(@"连接成功,host:%@,port:%d",host,port);
    
    [self checkPingPong];

    //心跳写在这...
}

//断开连接的时候调用
- (void)socketDidDisconnect:(GCDAsyncSocket *)sock withError:(nullable NSError *)err
{
    NSLog(@"断开连接,host:%@,port:%d",sock.localHost,sock.localPort);
    
    //断线重连写在这...

}

//写的回调
- (void)socket:(GCDAsyncSocket*)sock didWriteDataWithTag:(long)tag
{
    NSLog(@"写的回调,tag:%ld",tag);
    //判断是否成功发送，如果没收到响应，则说明连接断了，则想办法重连
    [self checkPingPong];
}


- (void)socket:(GCDAsyncSocket *)sock didReadData:(NSData *)data withTag:(long)tag
{

    NSString *msg = [[NSString alloc]initWithData:data encoding:NSUTF8StringEncoding];
    NSLog(@"收到消息：%@",msg);
    
    [self pullTheMsg];
}


//    //看能不能读到这条消息发送成功的回调消息，如果2秒内没收到，则断开连接
//    [gcdSocket readDataToData:[GCDAsyncSocket CRLFData] withTimeout:2 maxLength:50000 tag:110];

//貌似触发点
//- (void)socket:(GCDAsyncSocket *)sock didReadPartialDataOfLength:(NSUInteger)partialLength tag:(long)tag
//{
//    
//    NSLog(@"读的回调,length:%ld,tag:%ld",partialLength,tag);
//
//}


//为上一次设置的读取数据代理续时 (如果设置超时为-1，则永远不会调用到)
//-(NSTimeInterval)socket:(GCDAsyncSocket *)sock shouldTimeoutReadWithTag:(long)tag elapsed:(NSTimeInterval)elapsed bytesDone:(NSUInteger)length
//{
//    NSLog(@"来延时，tag:%ld,elapsed:%f,length:%ld",tag,elapsed,length);
//    return 10;
//}





@end
