//
//  ViewController.m
//  MQTTDemo
//
//  Created by 涂耀辉 on 17/1/3.
//  Copyright © 2017年 涂耀辉. All rights reserved.
//

#import "ViewController.h"
#import "MQTTManager.h"

@interface ViewController ()

@property (weak, nonatomic) IBOutlet UITextField *sendFiled;

@property (weak, nonatomic) IBOutlet UIButton *sendBtn;


@property (weak, nonatomic) IBOutlet UIButton *connectBtn;

@property (weak, nonatomic) IBOutlet UIButton *disConnectBtn;

@end

@implementation ViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    
    
    [_connectBtn addTarget:self action:@selector(connectAction) forControlEvents:UIControlEventTouchUpInside];
    
    [_disConnectBtn addTarget:self action:@selector(disConnectAction) forControlEvents:UIControlEventTouchUpInside];
    
    [_sendBtn addTarget:self action:@selector(sendAction) forControlEvents:UIControlEventTouchUpInside];

}

//连接
- (void)connectAction
{
    [[MQTTManager share] connect];
    
}
//断开连接
- (void)disConnectAction
{
    [[MQTTManager share] disConnect];
}

//发送消息
- (void)sendAction
{
    if (_sendFiled.text.length == 0) {
        return;
    }
    [[MQTTManager share]sendMsg:_sendFiled.text];
}



- (void)didReceiveMemoryWarning {
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}


@end
