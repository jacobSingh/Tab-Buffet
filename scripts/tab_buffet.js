var logging = false;

TabBuffet = {};
TabBuffet.API = {};

TabBuffet.UI = function () {
  this.d = TabBuffet.UI.getAPI().getData();
  if (this.d.length == 0) {
    this.minTime = this.maxTime = new Date().getTime();
    return;
  }
  this.minTime = this.d[0][0];
  this.maxTime = this.d[(this.d.length-1)][0];
};

TabBuffet.UI.prototype = {
  d: new Array(),
  minTime: null,
  maxTime: null,
};

TabBuffet.UI.getAPI = function() {
  return chrome.extension.getBackgroundPage().TabBuffet.API 
}

TabBuffet.UI.resetData = function() {
  TabBuffet.UI.getAPI().resetData();
}

TabBuffet.UI.plotChart = function(d, start, end) {
  console.log(arguments)
  console.log(d)
  console.log(start - d[0][0]);
  var data = d.filter(function(a) {
    return (a[0] > start) && (a[0] < end);
  });
  
  $.plot($("#placeholder"), [data], { xaxis: { mode: "time" } });
}

TabBuffet.UI.prototype.refreshChart = function () {
  if (this.d.length == 0) {
    return;
  }
  var start_time, end_time, refresh;
  var start = $('#dateRangeForm #start').val()
  var end = $('#dateRangeForm #end').val();
  end_time = $.datepicker.parseDate('mm/dd/yy', end).getTime() + 24*60*60*1000;
  start_time = $.datepicker.parseDate('mm/dd/yy', start).getTime();  
  TabBuffet.UI.plotChart(this.d, start_time, end_time);
}

TabBuffet.UI.prototype.initializeDatePicker = function() {
  var minDate = $.datepicker.parseDate('@', this.minTime);
  var maxDate = $.datepicker.parseDate('@', this.maxTime);
  $('#dateRangeForm #start').val($.datepicker.formatDate('mm/dd/yy', minDate)).datepicker({ minDate: minDate, maxDate: maxDate});
  $('#dateRangeForm #end').val($.datepicker.formatDate('mm/dd/yy', maxDate)).datepicker({ minDate: minDate, maxDate: maxDate});
}

/**
 * Records the number of open tabs in localstorage.
 */
TabBuffet.API.recordTabCount = function () {
  chrome.windows.getAll({ populate: true }, function(windowList) {
    var tabCount = 0;
    var d = new Date()
    var localOffset = d.getTimezoneOffset() * 60000;
    var utcTime = d.getTime() + localOffset
    for (var i = 0; i < windowList.length; i++) {
      tabCount += windowList[i].tabs.length
    }
    TabBuffet.API.setItem('tabCount::' + utcTime, tabCount);
  });
};

/**
 * Returns a filtered dataset of all records.  Each element in the array
 * contains an array where the first element it the timestamp it was recorded (in UTC)
 * and the second element is the # of tabs open at that time.
 */
TabBuffet.API.getData = function () {
  var records = new Array();
  var r = /^tabCount::([0-9]+)/g;
  for (i in window.localStorage) {
    if (m = r.exec(i)) {
      records.push([parseFloat(m[1]), parseFloat(window.localStorage[i])]);
    }
  }
  records.sort(TabBuffet.API.sortByTime);
  return records;
}

TabBuffet.API.sortByTime = function (a,b) {
  if (a[0] > b[0]) {
    return 1;
  } else {
    return -1;
  }
  return 0;
}

/**
 * Deletes all local storage.
 */
TabBuffet.API.resetData = function () {
  window.localStorage.clear();
}

TabBuffet.API.generateFakeData = function () {
  // Let's build a month of data
  var startTime = new Date().getTime() - (24 * 60 * 60 * 7 * 1000);
  var endTime = new Date().getTime();
  var i = startTime;
  while (i < endTime) {
    // setItem
    // Enter data every 10 minutes or so.
    i += (Math.floor(Math.random() * 60) * 10 * 1000);
    
    // Also simulate breaks, take 8 hours off every 1000th loop.
    if (Math.random() > .999) {
      i += (Math.floor(Math.random() * 60 * 60 * 8) * 1000);
    }
    
    TabBuffet.API.setItem('tabCount::' + i, Math.floor(Math.random() * 15));
  }
}

//sets the item in the localstorage
TabBuffet.API.setItem = function (key, value) {
  try {
    log("Inside setItem:" + key + ":" + value);
    window.localStorage.removeItem(key);
    window.localStorage.setItem(key, value);
  } catch(e) {
    log("Error inside setItem");
    log(e);
  }
  log("Return from setItem" + key + ":" +  value);
}

//Gets the item from local storage with the specified key
TabBuffet.API.getItem = function(key) {
  var value;
  log('Get Item:' + key);
  try {
    value = window.localStorage.getItem(key);
  } catch(e) {
    log("Error inside getItem() for key:" + key);
    log(e);
    value = "null";
  }
  log("Returning value: " + value);
  return value;
}

log = function(txt) {
  if (logging) {
    console.log(txt);
  }
}