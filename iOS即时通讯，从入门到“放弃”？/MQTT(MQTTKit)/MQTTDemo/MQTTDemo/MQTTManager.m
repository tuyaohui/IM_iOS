//
//  TYHSocketManager.m
//  CocoaSyncSocket
//
//  Created by 涂耀辉 on 16/12/28.
//  Copyright © 2016年 涂耀辉. All rights reserved.
//

#import "MQTTManager.h"
#import "MQTTKit.h"



static  NSString * Khost = @"127.0.0.1";
static const uint16_t Kport = 6969;
static  NSString * KClientID = @"tuyaohui";


@interface MQTTManager()
{
    MQTTClient *client;
    
}

@end

@implementation MQTTManager

+ (instancetype)share
{
    static dispatch_once_t onceToken;
    static MQTTManager *instance = nil;
    dispatch_once(&onceToken, ^{
        instance = [[self alloc]init];
    });
    return instance;
}

//初始化连接
- (void)initSocket
{
    if (client) {
        [self disConnect];
    }
    
    
    client = [[MQTTClient alloc] initWithClientId:KClientID];
    client.port = Kport;
    
    [client setMessageHandler:^(MQTTMessage *message)
     {
         //收到消息的回调，前提是得先订阅
         
         NSString *msg = [[NSString alloc]initWithData:message.payload encoding:NSUTF8StringEncoding];
         
         NSLog(@"收到服务端消息：%@",msg);
         
     }];
    
    [client connectToHost:Khost completionHandler:^(MQTTConnectionReturnCode code) {
        
        switch (code) {
            case ConnectionAccepted:
                NSLog(@"MQTT连接成功");
                //订阅自己ID的消息，这样收到消息就能回调
                [client subscribe:client.clientID withCompletionHandler:^(NSArray *grantedQos) {
                    
                    NSLog(@"订阅tuyaohui成功");
                }];

                break;
                
            case ConnectionRefusedBadUserNameOrPassword:
                
                NSLog(@"错误的用户名密码");

            //....
            default:
                NSLog(@"MQTT连接失败");

                break;
        }
        
    }];
}

#pragma mark - 对外的一些接口

//建立连接
- (void)connect
{
    [self initSocket];
}

//断开连接
- (void)disConnect
{
    if (client) {
        //取消订阅
        [client unsubscribe:client.clientID withCompletionHandler:^{
            NSLog(@"取消订阅tuyaohui成功");

        }];
        //断开连接
        [client disconnectWithCompletionHandler:^(NSUInteger code) {
            
            NSLog(@"断开MQTT成功");

        }];
        
        client = nil;
    }
}

//发送消息
- (void)sendMsg:(NSString *)msg
{
    //发送一条消息，发送给自己订阅的主题
    [client publishString:msg toTopic:KClientID withQos:ExactlyOnce retain:YES completionHandler:^(int mid) {
        
    }];
}

@end
