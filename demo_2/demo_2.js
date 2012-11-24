function ab(){
    /** @constructor */
};

ab.prototype.getGroup = function(experimentName, callback){

    // get from server

    if ( experimentName === 'red_button_vs_blue_button' ) {
        // callback('test');
        callback({
            id: 1,
            group: 'test'
        });
    }
    else if ( experimentName === 'left_sidebar_vs_right_sidebar' ) {
        // callback('control');
        callback({
            id: 2,
            group: 'control'
        });
    }

};

ab.prototype.getUserData = function(experimentName, param){
    
    // parse cookies

    if ( experimentName === 'red_button_vs_blue_button' ) {
        return {
            group: 'test',
            targets: [
                'index'
            ]
        };
    }
    else if ( experimentName === 'left_sidebar_vs_right_sidebar' ) {
        return {
            group: 'control',
            targets: [
                'hotelpage'
            ]
        };
    };
};

ab.prototype.setUserData = function(params){
    // save to cookie
    localStorage.setItem('_ab', params);
};

ab.prototype.saveUserData = function(params, callback){
    // send history and group to server
};

ab.prototype.log = function(){
    if ( typeof console !== 'undefined' ) {
        Array.prototype.unshift.call(arguments, '[' + new Date() + ']');
        console.log.apply(console, arguments);
    }
};

ab.prototype.each = function(arr, func, context){
    if ( Array.prototype.forEach ) {
        Array.prototype.forEach.call(arr, func, context);
    }
    else {
        for ( var i = 0, l = arr.length; i < l; i++ ) {
            func.call(context, arr[i], i, arr);
        }
    }
};

ab.prototype.filter = function(arr, func, context){
    if ( Array.prototype.filter ) {
        return Array.prototype.filter.call(arr, func, context);
    }
    else {
        var result;
        for ( var i = 0, l = arr.length; i < l; i++ ) {
            var element = arr[i];
            if ( func.call(context, element, i, arr) ) {
                result.push(element);
            }
        }
        return result;
    }
};

ab.prototype.proxy = function(func, context){
    return function(){
        func.apply(context, arguments);
    };
};

ab.prototype.inArray = function(arr, element){
    return !!this.filter(arr, function(el){
        return el === element;
    }).length;
};

ab.prototype.add = function(target){

    this.each(this.experiments, function(experiment){

        var userData = this.getUserData(experiment.name);
        
        if ( !userData.id && target === experiment.targets[0] ) {
            this.startTracking(experiment.name, this.proxy(function(){
                this.log('Started tracking:', experiment.name, experiment);
            }, this));
        }
        else if (
            userData.targets.length &&
            this.inArray(experiment.targets, target) &&
            !this.inArray(userData.targets, target)
        ) {
            this.setUserData({
                targets: userData.targets.push(target)
            });
            this.saveUserData(this.getUserData(), this.proxy(function(){
                this.log('Saved data:', experiment.name, experiment);
            }, this));
        }

    }, this);
};

ab.prototype.getExperiment = function(experimentName){
    this.filter(this.experiments, function(experiment){
        return experiment.name === experimentName;
    });
};

ab.prototype.test = function(experimentName){
    return this.getExperiment(experimentName).group === 'test';
};

ab.prototype.control = function(experimentName){
    return !this.test(experimentName);
};

ab.prototype.write = function(experimentName, params){
    document.write(
        this.control(experimentName)
            ? params.control
            : params.test
    );
};

ab.prototype.startTracking = function(experiment, callback){
    this.getGroup(this.proxy(function(data){
        this.setUserData({
            id: data.id,
            group: data.group,
            targets: [experiment.targets[0]]
        });
        callback();
    }, this));
};

ab.prototype.getExperiments = function(callback){
    callback({
        status: 'OK',
        experiments: [
            {
                name: 'red_button_vs_blue_button',
                targets: [
                    'index',
                    'catalog',
                    'promo'
                ]
            },
            {
                name: 'left_sidebar_vs_right_sidebar',
                targets: [
                    'hotelpage',
                    'catalog',
                    'payment'
                ]
            }
        ]
    });
};

ab.prototype.initialize = function(){
    this.getExperiments(this.proxy(function(data){
        if ( data && data.status === 'OK' ) {
            this.experiments = data.experiments;
        }
    }, this));
};




/* remove */

var go = function(){
    window.AB = new ab();
    AB.initialize();
};

var nn = function(){}

var ll = function(a){
    console.log('ll >>', a);
}

var ls = function(){
    return localStorage.getItem();
};


/* / remove */


