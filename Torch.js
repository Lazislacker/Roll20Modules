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
		log("Detected a message for TorchPlugin")
		if (msg.content.indexOf('!torch-use') != -1)
			this.use(msg);
		if (msg.content.indexOf("!torch-snuff") != -1)
			this.snuff(msg)
		if (msg.content.indexOf("!torch-add") != -1)
			this.add(msg);
		if (msg.content.indexOf("!torch-set") != -1)
			this.set(msg);
	});
	on("graphic:move", function(Obj){
		//Check to see if one of our torch carriers moved
		var torchID = "";
		for token in state.TorchPlugin.activeTorches{
			if (token.Token == Obj.get("_id"))
				torchID = token.Torch;
		}
		//If not a carrier, do nothing
		if (torchID == "")
			return;
		
		//Otherwise we need to move their torch
		var torch = getObj("graphic", torchID);
		
		//Move our torch
		torch.left = Obj.get("left");
		torch.top = Obj.get("top");
	})
}
//Get the character and token for a message
torchPlugin.prototype.getTokenData = function(msg, extra = 0){
	//Get the character we want to use a torch for
	var sections = msg.content.split(" ");
	sections = sections.slice(0,2);
	if (extra != 0)
		sections = sections.slice(sections.length, -extra);
	var charName = sections.join(" ");
	
	//Get the character's data
	var character = findObjs({
		_type:"character",
		name:charName,
	}, {caseInsensitive: true})[0];
	if (character == undefined)
	{
		sendChat("Torch Plugin", "Error! Character: "+charName+" could not be found!");
		return;
	}
	//Get the token tied to this character
	var token = findObjs({
		type:"graphic",
		_pageid: Campaign().get("playerpageid"),
		represents: character.get("_id"),
	})[0];
	return {character: character, token: token};
}
//Create a torch
torchPlugin.prototype.createTorch = function(left, top){
	//Create torch object
	var torch = createObj("graphic",{
		left:left,
		top:top,
		light_radius:"40",
		light_dimradius:"20",
		light_otherplayers:true});
	if (torch == undefined)
	{
		sendChat("Torch Plugin", "Failed to create torch at ("+left+","+top+").");
	}
	return torch.get("_id");
}
//Use a torch
torchPlugin.prototype.use = function(msg){
	var res = torchPlugin.getTokenData(msg);
	var token = res.token;
	var character = res.character;
	//Make sure character has a torch and doesn't already have an active one
	var torchCount = getAttrByName(character.get("_Id"), torchPlugin.torchCount);
	var activeTorch = getAttrByName(character.get("_Id"), torchPlugin.hasTorch)
	if (activeTorch){
		sendChat("Torch Plugin",charName+" already has a torch active!");
		return;
	}
	if (torchCount == 0){
		sendChat("Torch Plugin",charName+" has no torches to use.");
		return;
	}
	//Take away a torch and set an active torch
	torchCount.current--;
	activeTorch.current = 1;
	
	//Create a torch light source
	var torchID = createTorch(token.get("left"), token.get("top"));
	
	//Tie token and torch together
	state.TorchPlugin.activeTorches.push({Token: token.get("_id"), Torch: torchID})
	sendChat("Torch Plugin", "Created a torch for "+charName)
}

//Put out a torch
torchPlugin.prototype.snuff = function(msg){
	var res = torchPlugin.getTokenData(msg);
	var token = res.token;
	var character = res.character;
	
	//Make sure the character has a torch currently
	var hasTorch = getAttrByName(character.get("_id"), torchPlugin.hasTorch);
	if (!hasTorch.current){
		sendChat("Torch Plugin", "Can't snuff a torch for "+charName+". This character has no torch.");
		return;
	}
	hasTorch.current = 0;
	for (t in state.torchPlugin.activeTorches){
		if (t.Token == token.get("_id")){
			//remove from array
			//TODO
			//delete torch token
			getObj("graphic", t.Torch).delete()
			return;
		}
	}
	sendChat("Torch Plugin", "Error! Failed to destroy torch for "+charName);
}

//Add a torch to inventory
torchPlugin.prototype.add = function(msg){
	var res = torchPlugin.getTokenData(msg);
	var token = res.token;
	var character = res.character;
	
	var torches = getAttrByName(character.get("_id"), torchPlugin.torchCount);
	torches++;
	sendChat("Torch Plugin", "Added a torch to "+character.get("name")+"'s torches.");
}

//Set torch count
torchPlugin.prototype.set = function(msg){
	var res = torchPlugin.getTokenData(msg, 1);
	var token = res.token;
	var character = res.character;
	
	var torches = getAttrByName(character.get("_id"), torchPlugin.torchCount);
	var num = msg.content.split(" ");
	num = num[num.length - 1];
	torches.current = num;
	sendChat("Torch Plugin", "Set the torch count for "+character.get("name")+" to "+num+".");
}

on('ready', function(){
	var torch = new torchPlugin();
	torch.init();
})