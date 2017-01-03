//
//  ViewController.m
//  CScoketClient
//
//  Created by 涂耀辉 on 16/12/30.
//  Copyright © 2016年 涂耀辉. All rights reserved.
//

#import "ViewController.h"
#import "TYHSocketManager.h"

@interface ViewController ()

@property (weak, nonatomic) IBOutlet UITextField *sendFiled;

@property (weak, nonatomic) IBOutlet UIButton *sendBtn;


@property (weak, nonatomic) IBOutlet UIButton *connectBtn;

@property (weak, nonatomic) IBOutlet UIButton *disConnectBtn;



@end

@implementation ViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    
    
    [TYHSocketManager share];

    [_connectBtn addTarget:self action:@selector(connectAction) forControlEvents:UIControlEventTouchUpInside];
    
    [_disConnectBtn addTarget:self action:@selector(disConnectAction) forControlEvents:UIControlEventTouchUpInside];
    
    [_sendBtn addTarget:self action:@selector(sendAction) forControlEvents:UIControlEventTouchUpInside];
    
}


//连接
- (void)connectAction
{
    [[TYHSocketManager share] connect];
    
}
//断开连接
- (void)disConnectAction
{
    [[TYHSocketManager share] disConnect];
}

//发送消息
- (void)sendAction
{
    if (_sendFiled.text.length == 0) {
        return;
    }
    [[TYHSocketManager share]sendMsg:_sendFiled.text];
}



@end
