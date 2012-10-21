AB = (function(){
	
	var AB = function(){
		/** @constructor */
	};

	AB.prototype.getCookie = function(cookieName){

	};

	AB.prototype.control = function(experiment) {
		return this.getCookie(experiment) === 'control';
	};

	AB.prototype.test = function(experiment) {
		return this.getCookie(experiment) === 'test';
	};

	return new AB();

}());
