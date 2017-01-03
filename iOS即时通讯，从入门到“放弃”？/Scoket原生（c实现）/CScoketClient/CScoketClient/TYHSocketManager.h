//
//  TYHSocketManager.h
//  CocoaSyncSocket
//
//  Created by 涂耀辉 on 16/12/28.
//  Copyright © 2016年 涂耀辉. All rights reserved.
//



#import <Foundation/Foundation.h>

@interface TYHSocketManager : NSObject

+ (instancetype)share;

- (void)connect;
- (void)disConnect;

- (void)sendMsg:(NSString *)msg;


- (void)pullMsg;

@end
