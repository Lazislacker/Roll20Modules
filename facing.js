facingPlugin = facingPlugin || function(){
	//Versioning Information
	var name 	= "Facing Plugin";
	var version	= "0.1";
	
	//Globals
	var ENABLED		 = "_facingEnabled";
	var FTOKENID	 = "_facingTokenID";
	var VISIONRANGE	 = 280;
}
facingPlugin.prototype.messageSplit(msg){
	var broken = msg.content.split(" ");
	var command = broken[0];
	var character = msg.join(" ");
	return [command, character];
}
facingPlugin.prototype.enable = function(character){
	//Make sure they gave us a character
	if (character == undefined)
		return;
	//Check to see if already have variables
	var facing = getAttrByName(character.get("_id"), this.ENABLED, "current");
	var tokenID = getAttrByName(character.get("_id"), this.FTOKENID, "current");
	if (facing != undefined || tokenID != undefined){
		sendChat(this.name, "/w "+this.DMNAME+" this plugin is already active for "+character.get("name"));
		return;
	}
	//Get the token for the character
	var charToken = findObjs({
		_type:			"graphic",
		_subtype:		"token",
		represents:	character.get("_id"),	
	})[0];
	//Create the token for our character
	var facingToken = createObject("graphic",{
		name:			"FACING"+character.get("name"),
		_subtype:		"token",
		_pageid:		Campaign().get("playerpageid"),
		left:			charToken.get("left"),
		top:			charToken.get("top"),
		layer:			"maplayer",
		width:			charToken.get("width"),
		height:			charToken.get("heiht"),
		imgsrc:			//TODO: Upload image to use
		controlledby:	character.get("_id"),
		rotation:		charToken.get("rotation")
		/*visionfield*/	this.VISIONRANGE
	});
	
	//Remove vision from character Token
	charToken.set(/*vision field*/, 0)
	
	//reset character's rotation
	charToken.set("rotation", 0);
	//Okay, we need to create our attributes
	var facing = createObject("attribute",{
		current: 		"1",
		_characterid:	character.get("_id"),
		name:			this.ENABLED
	});
	var tokenID = createObject("attribute", {
		current:		facingToken.get("_id"),
		_characterid:	character.get("_id"),
		name:			this.FTOKENID
	});	
}

facingPlugin.prototype.disable = function(character){
	//Make sure they gave us a character
	if (character == undefined)
		return;
	//Check to make sure attributes exist
	var facing = getAttrByName(character.get("_id"), this.ENABLED, "current");
	var tokenID = getAttrByName(character.get("_id"), this.FTOKENID, "current");
	if (facing == undefined || tokenID == undefined){
		sendChat(this.name, "/w "+this.DMNAME+" this plugin is not active for "+character.get("name"));
		return;
	}
	//Get the token for the character
	var charToken = findObjs({
		_type:			"graphic",
		_subtype:		"token",
		represents:	character.get("_id"),	
	})[0];
	//Get token for the facing
	var facingToken = getObj("graphic", tokenID);
	
	//reset our character's vision and rotation
	charToken.set(/*vision range*/, this.VISIONRANGE);
	charToken.set("rotation", facingToken.get("rotation"));
	
	//delete the facing token
	facingToken.remove();
	
	//delete the attributes
	facing.remove();
	tokenID.remove();	
};

facingPlugin.prototype.moveOrRotate = function(charToken, bMove){
	var character = getObj("character", charToken.get("represnts"));
	
	var facing = getAttrByName(character.get("_id"), this.ENABLED, "current");
	if (facing == undefined || facing == 0)
		return;
	
	var fTokenID = getAttrByName(character.get("_id"), this.FTOKENID, "current");
	
	//Make sure we have a token id
	if (fTokenID == undefined)
		return;
	
	//Get our token
	var facingToken = getObj("graphic", fTokenID);
	
	if (bMove){
		//Move our facing Token to match the move made by the real token
		facingToken.set("left", charToken.get("left"));
		facingToken.set("top", charToken.get("top"));
	}
	else{
		//Rotate our facing token to match the new rotation on the normal token
		facingToken.set("rotation", charToken.get("rotation"));
		charToken.set("rotation", 0);
	}
}

facingInit = function(facingInstance){
	on("change:graphic:lastmove", function(charToken){
		facingInstance.moveOrRotate(charToken, true);
	});
	on("change:graphic:rotation", function(charToken){
		facingInstance.moveOrRotate(charToken, false);
	});
	on("chat:message", function(msg){
		var message = facingInstance.messageSplit(msg);
		switch(message[0]){
			case "!facing-enable":
				facingInstance.enable(message[1]);
				break;
			case "!facing-disable":
				facingInstance.disable(message[1]);
				break;
			case "!facing":
				sendChat(facingInstance.name, "/w "+facingInstance.DMNAME+" Error: incorrect facing command entered! Valid commands are: \"!facing-enable\" and \"!facing-disable\"");
			default:
				break;
		}
		return;
	})
}

on("ready", function(){
	var facingInstance = new facingPlugin();
	facingInit(facingInstance);
})