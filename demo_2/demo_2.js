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
    console.log(new Date(), arguments);
};

ab.prototype.each = function(arr, func, context){
    return $.each(arr, this.proxy(func, context));
};

ab.prototype.proxy = function(func, context){
    return $.proxy(func, context);
};

ab.prototype.inArray = function(arr, element){
    return $.inArray(arr, element);
};

ab.prototype.add = function(target){

    this.each(this.experiments, function(i, experiment){

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
                targets: userData.targets.push(target);
            });
            this.saveUserData(this.getUserData(), this.proxy(function(){
                this.log('Saved data:', experiment.name, experiment);
            }, this));
        }

    }, this);
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
