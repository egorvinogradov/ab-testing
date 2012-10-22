//
// Ситуации:
// 1. первое посещение сайта
// 2. первое посещение любой страницы из checkpoints
// 3. первое посещение определенной страницы из checkpoints
// 4. первое посещение target
// 5. повторное посещение определенной страницы из checkpoints
// 6. повторное посещение target
//
// На бэкенде:
// pages = [
//   'index',
//   'catalog',
//   'product_page',
//   'order',
//   'order_success',
//   'order_error',
//   'langing',
//   'seo_catalog'
// ];
//
// experiments = {
//   'blue_button_vs_red_button': {
//     checkpoints: [
//       'index',
//       'catalog'
//       'product_page'
//     ],
//     target: 'order_success'
//   },
//   'show_message': {
//     checkpoints: [
//       'langing',
//       'catalog'
//       'product_page'
//     ],
//     target: 'order_success'
//   }
// };
//
// В cookie
// 'AB_blue_button_vs_red_button=test|index,catalog,product_page'
// 'AB_show_message=control|index,catalog,product_page'

// TODO: get via ajax
var experiments = [
  {
    name: 'blue_button_vs_red_button',
    checkpoints: [
      'index',
      'catalog',
      'product_page'
    ],
    target: 'order_success'
  },
  {
    name: 'show_message',
    checkpoints: [
      'langing',
      'catalog',
      'product_page'
    ],
    target: 'order_success'
  }
];


/****************/

var providers = [
  {
    name: 'cookie',
    get: function(name){
      var cookiesArr = document.cookie.split(';'),
        cookiesObj = {};
      each(cookies, function(cookie){
        cookie = cookie.split('=');
        cookiesObj[cookie[0]] = cookie[1];
      });
      return cookiesObj[name];
    },
    set: function(name, value){
      
    },
    isSupported: function(){
      return false;
    }
  },
  {
    name: 'localStorage',
    get: function(name){
      return localStorage.getItem(name);
    },
    set: function(name, value){
      value === null
        ? localStorage.removeItem(name)
        : localStorage.setItem(name, value);
    },
    isSupported: function(){
      return !!window.localStorage;
    }
  },
  {
    name: 'localSharedObject',
    get: function(name){

    },
    set: function(name, value){
      
    },
    isSupported: function(){
      return false;
    }
  }
];

function defineProviders(){
  each(providers, function(provider, i){
    if ( !provider.isSupported() ) {
      providers.splice(i, 1);
    }
  });
};

function getState(experiment){
  var result;
  each(providers, function(provider){
    result = !result && provider.get(experiment);
  });
  return result;
};

function setState(experiment, value){
  each(providers, function(provider){
    provider.set(experiment, value);
  });
};

function updateState(experiment){
  var state = getState(experiment);
  each(providers, function(provider){
    if ( !provider.get(experiment) ) {
      provider.set(experiment, state);
    }
  });
};

function clearState(experiment){
  setState(experiment, null);
};

function loadGroup(experiment, callback){
  // get via ajax
  // TODO: replace example below
  if ( experiment === 'blue_button_vs_red_button' ) {
    return 'control';
  }
  else if ( experiment === 'show_message' ) {
    return 'test';
  };
};

function getGroup(experiment){
  var state = getState(experiment);
  return state && state.split('|')[0];
};

function setGroup(experiment, group){
  setState(experiment, group + '|');
};

function getVisitedPages(experiment){
  var state = getState(experiment);
  return state && state.split('|')[1].split(',');
};

function setVisitedPage(experiment, page){
  var pages = getVisitedPages(),
    divider = pages.length ? ',' : '|';
  if ( indexOf(page, pages) < 0 ) {
    setState(getState(experiment) + divider + page);
  }
};

function getAllExperiments(callback){
  // TODO: get via ajax
  // TODO: remove example below
  return experiments;
};

function reportSuccess(experiment){
  // TODO: send report via ajax
  alert('success: ' + experiment + getGroup(experiment));
};

function compareArrays(arr1, arr2){
  var matches = arr1.length === arr2.length;
  each(arr1, function(value){
    if ( indexOf(value, arr2 < 0 ) ) {
      matches = false;
    }
  });
  return matches;
};

function each(collection, callback, context){
  if ( collection instanceof Array ) {
    if ( Array.prototype.forEach ) {
      collection.forEach(callback, context);
    }
    else {
      for ( var i = 0, l = collection.length; i < l; i++ ) {
        callback.call(context, collection[i], i);
      }
    }
  }
  else {
    for ( var key in collection ) {
      callback.call(context, collection[key], key);
    }
  }
};

function indexOf(value, array){
  if ( Array.prototype.indexOf ) {
    return array.indexOf(value);
  }
  else {
    for ( var i = 0, l = array.length; i < l; i++ ) {
      if ( array[i] === value ) {
        return i;
      }
    }
    return -1;
  }
};

function proxy(func, context){
  return function(){
    func.apply(context, arguments);
  };
};

var Testing = function(){
  /** @constructor */
};

Testing.prototype.initialize = function(){
  this.queue = [];
  defineProviders();
  getAllExperiments(proxy(function(experiments){
    this.experiments = experiments;
    each(this.experiments, function(experiment){
      if ( !getGroup(experiment.name) ) {
        loadGroup(experiment.name, function(group){
          setGroup(experiment.name, group);
        });
      }
    });
    each(this.queue, function(func){
      func();
    }, this);
  }, this));
};

Testing.prototype.control = function(experiment) {
  return !this.test();
};

Testing.prototype.test = function(experiment) {
  return getGroup(experiment) === 'test';
};

Testing.prototype.write = function(experiment, params) {
  document.write(params[getGroup(experiment)] || '');
};

Testing.prototype.specifyPage = function(page) {
  if ( !this.experiments.length ) {
    this.queue.push(proxy(function(){
      this.specifyPage(page);
    }, this));
  }
  each(this.experiments, function(experiment){
    var pages = getVisitedPages(experiment.name);
    if ( page === experiment.target && compareArrays(experiment.checkpoints, pages) ) {
      reportSuccess(experiment.name);
    } else if ( indexOf(page, experiment.checkpoints) > -1 ) {
      setVisitedPage(experiment.name, page);
    }
  }, this);
  this.page = page;
};

var AB = new Testing();
AB.initialize();
