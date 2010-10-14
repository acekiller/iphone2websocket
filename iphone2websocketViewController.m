//
//  iphone2websocketViewController.m
//  iphone2websocket
//
//  Created by Manuel Gottstein and Dominik Guzei on 06.10.10.
//  Copyright FH SAlzburg, MMT2010. All rights reserved.
//

#import "iphone2websocketViewController.h"

@implementation iphone2websocketViewController


// Implement viewDidLoad to do additional setup after loading the view, typically from a nib.
- (void)viewDidLoad {
	
    [super viewDidLoad];
	
	webSocket = [[ZTWebSocket alloc] initWithURLString:@"ws://localhost:10000/" delegate:self];
	
}


-(void)webSocketDidClose:(ZTWebSocket *)webSocket {
	
    [connectButton setTitle:@"Connect" forState:UIControlStateNormal];
	
}

-(void)webSocket:(ZTWebSocket *)webSocket didFailWithError:(NSError *)error {
    if (error.code == ZTWebSocketErrorConnectionFailed) {
        [connectButton setTitle:@"Connection failed" forState:UIControlStateNormal];
    } else if (error.code == ZTWebSocketErrorHandshakeFailed) {
        [connectButton setTitle:@"Handshake failed" forState:UIControlStateNormal];
    } else {
        [connectButton setTitle:@"Error" forState:UIControlStateNormal];
    }
}

-(void)webSocket:(ZTWebSocket *)webSocket didReceiveMessage:(NSString*)message {
    //[cLabel setText:message];
}

-(void)webSocketDidOpen:(ZTWebSocket *)aWebSocket {
	[webSocket send:@"Iphone connected"];
	connectButton.hidden = YES;
}

-(void)webSocketDidSendMessage:(ZTWebSocket *)webSocket {
	
}

-(void) connect {
	if (!webSocket.connected) {
        [webSocket open];
	}
	else {
		[connectButton setTitle:@"Connect" forState:UIControlStateNormal];
		connectButton.enabled = YES;
	}
}

- (void)didReceiveMemoryWarning {
	// Releases the view if it doesn't have a superview.
    [super didReceiveMemoryWarning];
	
	// Release any cached data, images, etc that aren't in use.
}

/*
// Override to allow orientations other than the default portrait orientation.
- (BOOL)shouldAutorotateToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation {
    // Return YES for supported orientations
    return (interfaceOrientation == UIInterfaceOrientationPortrait);
}
*/

- (void)viewDidUnload {
	// Release any retained subviews of the main view.
	// e.g. self.myOutlet = nil;
}

-(void)dealloc {
    [webSocket release];
    [super dealloc];
}

@end
