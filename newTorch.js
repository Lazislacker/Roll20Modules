torchPlugin = function(){
    // Versioning Info//
    this.name             = "torchPlugin";
    this.version 		= "0.1";
	
	// Globals//
	this.HASTORCH 		= "hasTorch";
	this.TORCHCNT 		= "torchCount";
	this.DMNAME 		= "DM";
	state.torchPlugin 	= {
		activePairs: undefined,
	};
};

// Deletes active torch for given character name, if they have one
torchPlugin.prototype.snuff = function(characterName){
    // Iterate through our active pairs to find the one we need
	_.each(state.torchPlugin.activePairs, function(pair){
		if (pair[0].get("name") == characterName)
		{
			pair[0].set(this.HASTORCH, "0");
			pair[1].remove();
			sendChat(this.name, "/w "+this.DMNAME+" Snuffed torch for "+pair[0].get("name")+".");
			return;
		}
	});
};

// Get token based on character ID
torchPlugin.prototype.getToken = function(charID){
    var Token = findObjs({
		_type: "graphic",
		_subtype: "token",
		_pageid: Campaign.get("playerpageid"),
		represents: charID
		},{caseInsensitive: true});
	return Token;
};

// Get Character based on character name
torchPlugin.prototype.getChar = function(charName){
    var Character = findObjs({
		_type:"character",
		name: charName
	});
	return Character;
};

// Gets the character name out of a message
torchPlugin.prototype.getName = function(msg, extra){
    if (extra == undefined)
		extra = 0;
	var name = msg.content.split(" ");
	if (name.length <= 1)
		return "";
	name.splice(0,1);
	var extraRet = "";
	if (extra > 0)
	    extraRet = name.splice(-1);
	name = name.join(" ");
	
	// Should just have character name at this point...
	if (extra > 0)
		return [name, extraRet];
	return name;
};

// Callback to make torch follow character
torchPlugin.prototype.follow = function(token){
    var character = getObj("character", token.get("represents"));
	
	// Token might not represent a character, if it doesn't just return
	if (character == undefined)
		return;
	
	_.each(state.torchPlugin.activePairs, function(pair){
		if (pair[0].get("_id") == token.get("_id"))
			if (this.move(pair))
				log("Successfully moved torch to follow "+character.get("name"));
			else
				sendChat(this.name, "/w "+DMNAME+" Failed to move torch to follow "+character.get("name"));
	})
	sendChat(this.name, "Failed to move torch to follow "+character.get("name"));
}

// Moves the given torch with the given character
torchPlugin.prototype.move = function(pair){
	if (pair[0] == undefined || pair[1] == undefined)
		return false;
	var torch = pair[1];
	var token = pair[0];
	
	torch.set("left", token.get("left"));
	torch.set("top", token.get("top"));
	return true;
}

// Activates a Torch for a character
torchPlugin.prototype.use = function(charName){
	var character = this.getChar(charName);
	var token = character.get("_id");
	
	if (character == undefined || token == undefined)
		return false;
	// If character doesn't have a torch, or they already have one active, do nothing
	if (getAttrByName(character.get("_id"), this.TORCHCNT, "current") == "0")
		return false;
	if (getAttrByName(character.get("_id"), this.HASTORCH, "current") == "1")
		return false;
	
	// Create a torch for the character
	var torch = createObj("graphic", {
		name:				"TORCH",
		_subtype:			"token",
		_pageid:			Campaign.get("playerpageid"),
		left: 				token.get("left"),
		top: 				token.get("top"),
		width:				token.get("width"),
		height:				token.get("height"),
		light_radius:		"40",
		light_dimradius:	"20",
		light_otherplayers:	true,
		light_angle:		"360"
	});
	if (torch == undefined)
		return false;
	// Change attributes
	character.set(HASTORCH, "1");
	character.set(TORCHCNT, character.get(TORCHCNT, "current")-1)
	
	
	state.torchPlugin.activePairs.push([token, torch]);
	return true;
}

// Create required variables on the character to enable the plugin
torchPlugin.prototype.activateFor = function(name, amount){
	var character = this.getChar(name);
	// Check to see if we already have the attributes
    log(character)
	var hasTorch = getAttrByName(character.id, this.HASTORCH, "current");
	var torchCnt = getAttrByName(character.id, this.TORCHCNT, "current");
	var test = [
		hasTorch,
		torchCnt
	]
	if (test[0] != undefined)
		return;
	if (test[1] != undefined)
		return;
	
	// Create Attributes
	var hasTorch = createObj("attribute",{
		current:		 "1",
		name: 			this.HASTORCH,
		_characterid: 	character.id
	});
	var torchCnt = createObj("attribute",{
		current:		amount,
		name:			this.TORCHCNT,
		_characterid:	character.id
	});
	
	if (hasTorch == undefined || torchCnt == undefined)
		return;
	sendChat(this.name, "\w "+this.DMNAME+" successfully activated the plugin for "+name);
}

// Change the character's total torch count
torchPlugin.prototype.setAmount = function(name, amount){
	var character = this.getChar(name);
	var test = getAttrByName(character.get("_id"), this.TORCHCNT, "current");
	if (test == undefined)
		return;
	
	test.set(amount);
	sendChat(this.name, "/w "+this.DMNAME+" Set the torch count for "+name);
}

// Initialization Function
Torchinit = function(torchInstance){
	on("chat:message", function(msg){
		// Only care about API messages
		if (msg.type != "api")
			return;
		
		var content = msg.content;
		
		// Only care about "!torch" messages
		if (content.toLowerCase().indexOf("!torch") == -1)
			return;
		
		// Now we do our actual callbacks
		if (content.toLowerCase().indexOf("!torch-use") != -1)
		{
			var name = torchInstance.getName(msg);
			if (torchInstance.use(name))
				log("Successfully activated a torch for "+name)
			else
				sendChat(torchInstance.name, "/w "+torchInstance.DMNAME+" failed to activate torch for "+name);
		}
		if (content.toLowerCase().indexOf("!torch-snuff") != -1)
		{
			var name = torchInstance.getName(msg);
			torchInstance.snuff(name);
		}
		if (content.toLowerCase().indexOf("!torch-activate") != -1)
		{
            log("Attempting to activate torch plugin.");
			var ret = torchInstance.getName(msg, 1);
			torchInstance.activateFor(ret[0], ret[1]);
		}
		if (content.toLowerCase().indexOf("!torch-set") != -1){
			var ret = torchInstance.getName(msg, 1);
			torchInstance.setAmount(ret[0], ret[1]);
		}
	});
	on("change:graphic:lastmove", function(Obj){
		_.each(state.torchPlugin.activePairs, function(pair){
			if (pair[0].get("_id") == Obj.get("_id"))
			{
				torchInstance.move(pair);
				return;
			}
		});
		return;
	});
	log("Loading "+torchInstance.name+" v"+torchInstance.version+" ...");
};

on("ready", function(){
	var tPlugin = new torchPlugin();
	Torchinit(tPlugin);
});
