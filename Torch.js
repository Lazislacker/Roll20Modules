torchPlugin = function(){
	//Globals
	this.name = "torchPlugin";
	this.version = "0.1";
	this.hasTorch = "_torch";
	this.torchCount = "tCount";
}

//Init function, do any initialization here
torchPlugin.prototype.init = function(){
	on('chat:message', function(msg){
		//If the message doesn't have "!torch", we don't care about it.
		if (msg.content.indexOf('!torch') == -1)
			return;
		if (msg.content.indexOf('!torch-use') != -1)
			this.use(msg);
		if (msg.content.indexOf("!torch-snuff") != -1)
			this.snuff(msg)
		if (msg.content.indexOf("!torch-add") != -1)
			this.add(msg);
		if (msg.content.indexOf("!torch-set") != -1)
			this.set(msg);
	})
}

//Use a torch
torchPlugin.prototype.use = function(msg){}

//Put out a torch
torchPlugin.prototype.snuff = function(msg){}

//Add a torch to inventory
torchPlugin.prototype.add = function(msg){}

//Set torch count
torchPlugin.prototype.set = function(msg){}

on('ready', function(){
	var torch = new torchPlugin();
	torch.init();
})