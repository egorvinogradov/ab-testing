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

ab.prototype.getUserData = function(experimentName){
    
    // parse cookies

    /*

    var mock = {
        red_button_vs_blue_button: {
            id: 1,
            group: 'test',
            targets: [
                'index'
            ]
        },
        left_sidebar_vs_right_sidebar: {
            id: 2,
            group: 'control',
            targets: [
                'hotelpage'
            ]
        }
    };
    return mock[experimentName] || {};

    */
    
    var str = localStorage.getItem('ab_' + experimentName);
    var json;

    try {
        json = JSON.parse(str);
    }
    catch (e) {};
    return json || {};
};

ab.prototype.setUserData = function(experimentName, experimentData){
    
    // save to cookie
    
    localStorage.setItem('ab_' + experimentName, JSON.stringify(experimentData));
};

ab.prototype.saveUserData = function(experimentName, params, callback){
    // send history and group to server
    callback && callback();
};

ab.prototype.log = function(){
    if ( typeof console !== 'undefined' ) {
        Array.prototype.unshift.call(arguments, '[' + new Date() + ']');
        console.log.apply(console, arguments);
    }
};

ab.prototype.each = function(arr, func, context){
    if ( !arr || !func ) {
        return;
    }
    if ( Array.prototype.forEach ) {
        Array.prototype.forEach.call(arr, func, context);
    }
    else {
        for ( var i = 0, l = arr.length; i < l; i++ ) {
            func.call(context || window, arr[i], i, arr);
        }
    }
};

ab.prototype.filter = function(arr, func, context){
    if ( !arr ) {
        return;
    }
    if ( !func ) {
        return arr;
    }
    if ( Array.prototype.filter ) {
        return Array.prototype.filter.call(arr, func, context);
    }
    else {
        var result;
        for ( var i = 0, l = arr.length; i < l; i++ ) {
            var element = arr[i];
            if ( func.call(context || window, element, i, arr) ) {
                result.push(element);
            }
        }
        return result;
    }
};

ab.prototype.proxy = function(func, context){
    return function(){
        func.apply(context || window, arguments);
    };
};

ab.prototype.inArray = function(arr, element){
    if ( arr && element ) {
        return !!this.filter(arr, function(el){
            return el === element;
        }).length;
    }
    return false;
};

ab.prototype.isGoalAdded = function(target, userData){
    return !!this.inArray(userData.targets, target);
};

ab.prototype.isStartedTracking = function(userData){
    return !!( userData.id && userData.group && userData.targets.length );
};

ab.prototype.isExperimentFinished = function(experiment, userData){
    var finished = experiment.targets.length === userData.targets.length;
    if ( !finished ) {
        for ( var i = 0, l = experiment.targets.length; i < l; i++ ) {
            if ( !this.inArray(userData.targets, experiment.targets[i]) ) {
                return false;
            }
        }
        return true;
    }
    else {
        return false;
    }
};

ab.prototype.goal = function(target){

    this.each(this.experiments, function(experiment){

        var userData = this.getUserData(experiment.name);

        this.log('>>>', experiment.name, experiment, userData);

        // первое посещение
        // повторное посещение
        // первое посещение не стартовой цели
        // посещение последней страницы


        this.log(
            '>>> first coming',
            !this.isGoalAdded(target, userData) && experiment.targets[0] === target
                ? 'TRUE'
                : 'FALSE',
            !this.isGoalAdded(target, userData),
            experiment.targets[0] === target,
            '----',
            experiment.name,
            experiment,
            userData
        );

        if ( !this.isGoalAdded(target, userData) && experiment.targets[0] === target ) {
            
            // first coming

            this.startTracking(experiment, this.proxy(function(){
                this.log('Started tracking:', experiment.name, experiment);
            }, this));
        }
        else if ( !this.isGoalAdded(target, userData) && this.isStartedTracking(userData) && this.inArray(experiment.targets, target) ) {
            
            // first coming to second part goal
            
            userData.targets.push(target);

            this.log('>>> first coming to second part goal', experiment.name, experiment, userData);

            if ( this.isExperimentFinished(experiment, userData) ) {
                this.log('Experiment is finished:', experiment.name, userData, experiment);
            }

            this.setUserData(experiment.name, userData);

            this.saveUserData(experiment.name, userData, this.proxy(function(){
                this.log('Saved user data:', experiment.name, userData, experiment);
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
    this.getGroup(experiment.name, this.proxy(function(data){
        var userData = {
            id: data.id,
            group: data.group,
            targets: [experiment.targets[0]]
        };
        this.setUserData(experiment.name, userData);
        this.saveUserData(experiment.name, userData, callback);
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
    return JSON.parse(localStorage.getItem('_ab'));
};


/* / remove */


