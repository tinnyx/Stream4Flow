//MIT License
//Copyright (c) 2013, Max Irwin

//Parses a CIDR Range into beginning and ending IPv4 Addresses
//For example: '10.0.0.0/24'
//Returns     ['10.0.0.0', '10.0.0.255']
var parseCIDR = function(CIDR) {
	
	//Beginning IP address
	var beg = CIDR.substr(CIDR,CIDR.indexOf('/'));
	var end = beg;
	var off = (1<<(32-parseInt(CIDR.substr(CIDR.indexOf('/')+1))))-1; 
	var sub = beg.split('.').map(function(a){return parseInt(a)});
	
	//An IPv4 address is just an UInt32...
	var buf = new ArrayBuffer(4); //4 octets 
	var i32 = new Uint32Array(buf);
	
	//Get the UInt32, and add the bit difference
	i32[0]  = (sub[0]<<24) + (sub[1]<<16) + (sub[2]<<8) + (sub[3]) + off;
	
	//Recombine into an IPv4 string:
	var end = Array.apply([],new Uint8Array(buf)).reverse().join('.');
	
	return [beg,end];
}