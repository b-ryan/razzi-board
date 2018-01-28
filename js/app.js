function makeid() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i < 5; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

function getNewPhoto(path = "/") {
  var url = SERVER_URL + path + "?x=" + makeid();
  // var url = "http://127.0.0.1:5000" + path + "?x=" + makeid();
  var image = new Image();
  image.onload = function() {
    $("#photos")[0].style.backgroundImage = "url('" + url + "')";
  };
  image.src = url;
}

KEY_LEFT = 37;
KEY_RIGHT = 39;

document.addEventListener("keydown", function(event) {
  if (event.keyCode == KEY_LEFT) {
    getNewPhoto("/rewind");
  }
  if (event.keyCode == KEY_RIGHT) {
    getNewPhoto();
  }
});

function darkSky() {
  var url = "https://api.darksky.net/forecast/" + DARK_SKY_TOKEN
    + "/" + LATITUDE + "," + LONGITUDE;
  $.ajax({
    type: 'GET',
    url: url,
    dataType: 'jsonp',
    crossDomain: true,
  }).done(function (result) {
    var summary = result.minutely.summary;
    $("#darksky").html(summary);
  });
}

function setCurrentDateTime() {
  if ($('#time').length) {
    $('#time').html(moment().format(TIME_FORMAT));
  }
  if ($('#date').length) {
    $('#date').html(moment().format(DATE_FORMAT));
  }
}

function resolveTemp(temp) {
  if (TEMPERATURE_UNIT.toLowerCase() === 'c') {
    temp = '' + Math.round((parseInt(temp) - 32) / 1.8);
  }
  temp += '&deg;'
  return temp;
}

function fillCurrently(currently) {
  var icon = $('#currently .icon');
  var desc = $('#currently .desc');
  var temp = $('#currently .temp');
  if (icon.length) {
    icon.html(icons[currently.code]);
  }
  if (desc.length) {
    desc.html(currently.text);
  }
  if (temp.length) {
    temp.html(resolveTemp(currently.temp));
  }
}

function fillForecast(day, forecast) {
  var forecastCell = '#forecast' + day + ' ';
  var day = $(forecastCell + '.day');
  var icon = $(forecastCell + '.icon');
  var desc = $(forecastCell + '.desc');
  var high = $(forecastCell + '.high');
  var low = $(forecastCell + '.low');
  if (day.length) {
    if (day === 1) {
      day.html('Today');
    } else {
      day.html(forecast.day);
    }
  }
  if (icon.length) {
    icon.html(icons[forecast.code]);
  }
  if (desc.length) {
    desc.html(forecast.text);
  }
  if (high.length) {
    high.html(resolveTemp(forecast.high));
  }
  if (low.length) {
    low.html(resolveTemp(forecast.low));
  }
}

function fillLinks(link) {
  if ($('.yahooLink').length) {
    $('.yahooLink').attr('href', link);
  }
}

function queryYahoo() {
  $.ajax({
    type: 'GET',
    url: 'https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20weather.forecast%20where%20woeid%3D' + WOEID + '&format=json',
    dataType: 'json'
  }).done(function (result) {
    // Drill down into the returned data to find the relevant weather information
    result = result.query.results.channel.item;
    fillCurrently(result.condition);
    fillForecast(1, result.forecast[0]);
    fillForecast(2, result.forecast[1]);
    fillForecast(3, result.forecast[2]);
    fillForecast(4, result.forecast[3]);
    fillForecast(5, result.forecast[4]);
    fillLinks(result.link);
  });
}

// Fallback icons - Do not edit. Icons should be edited in your current skin.
// Fallback icons are from the weather icons pack on github at https://github.com/erikflowers/weather-icons
// Position in array corresponds to Yahoo! Weather's condition code, which are commented below in plain English
if (!icons) {
  $(document).ready(function() {
    $('head').append('<link rel="stylesheet" type="text/css" href="./css/weather-icons.css" />');
  });
  var icons = [
    '<i class="wi wi-tornado"></i>',         //tornado
    '<i class="wi wi-rain-wind"></i>',       //tropical storm
    '<i class="wi wi-tornado"></i>',         //hurricane
    '<i class="wi wi-thunderstorm"></i>',    //severe thunderstorms
    '<i class="wi wi-thunderstorm"></i>',    //thunderstorms
    '<i class="wi wi-rain-mix"></i>',        //mixed rain and snow
    '<i class="wi wi-rain-mix"></i>',        //mixed rain and sleet
    '<i class="wi wi-rain-mix"></i>',        //mixed snow and sleet
    '<i class="wi wi-rain-mix"></i>',        //freezing drizzle
    '<i class="wi wi-cloudy"></i>',          //drizzle
    '<i class="wi wi-rain"></i>',            //freezing rain
    '<i class="wi wi-rain"></i>',            //showers
    '<i class="wi wi-rain"></i>',            //showers
    '<i class="wi wi-snow"></i>',            //snow flurries
    '<i class="wi wi-snow"></i>',            //light snow showers
    '<i class="wi wi-showers"></i>',         //blowing snow
    '<i class="wi wi-snow"></i>',            //snow
    '<i class="wi wi-hail"></i>',            //hail
    '<i class="wi wi-rain-mix"></i>',        //sleet
    '<i class="wi wi-dust"></i>',            //dust
    '<i class="wi wi-fog"></i>',             //foggy
    '<i class="wi wi-day-haze"></i>',        //haze
    '<i class="wi wi-smoke"></i>',           //smoky
    '<i class="wi wi-strong-wind"></i>',     //blustery
    '<i class="wi wi-strong-wind"></i>',     //windy
    '<i class="wi wi-snowflake-cold"></i>',  //cold
    '<i class="wi wi-cloudy"></i>',          //cloudy
    '<i class="wi wi-night-cloudy"></i>',    //mostly cloudy (night)
    '<i class="wi wi-day-cloudy"></i>',      //mostly cloudy (day)
    '<i class="wi wi-night-cloudy"></i>',    //partly cloudy (night)
    '<i class="wi wi-day-cloudy"></i>',      //partly cloudy (day)
    '<i class="wi wi-night-clear"></i>',     //clear (night)
    '<i class="wi wi-day-sunny"></i>',       //sunny
    '<i class="wi wi-night-clear"></i>',     //fair (night)
    '<i class="wi wi-day-sunny"></i>',       //fair (day)
    '<i class="wi wi-hail"></i>',            //mixed rain and hail
    '<i class="wi wi-hot"></i>',             //hot
    '<i class="wi wi-storm-showers"></i>',   //isolated thunderstorms
    '<i class="wi wi-storm-showers"></i>',   //scattered thunderstorms
    '<i class="wi wi-storm-showers"></i>',   //scattered thunderstorms
    '<i class="wi wi-showers"></i>',         //scattered showers
    '<i class="wi wi-sleet"></i>',           //heavy snow
    '<i class="wi wi-snow"></i>',            //scattered snow showers
    '<i class="wi wi-sleet"></i>',           //heavy snow
    '<i class="wi wi-cloudy"></i>',          //partly cloudy
    '<i class="wi wi-storm-showers"></i>',   //thundershowers
    '<i class="wi wi-snow"></i>',            //snow showers
    '<i class="wi wi-storm-showers"></i>'    //isolated thundershowers
  ];
}

function fetchYnabBalances() {
  var url = SERVER_URL + "/ynab";
  $.ajax({
    type: 'GET',
    url: url,
  }).done(function (result) {
    var elem = $("#ynab");
    elem.html("");
    var balances = result.balances;
    for (var i = 0; i < balances.length; i++) {
      var balance = balances[i];
      var extraClass = "";
      if (balance.balance <= 0) {
        extraClass = "text-danger";
      }
      elem.append(
        '<div class="ynab-balance">' +
        '<span class="category">' + balance.category + "</span>" +
        '<span class="balance ' + extraClass + '">' + balance.balance_str + "</span>" +
        "</div>"
      );

    }
  });
}

$(window).on("load", function() {
  queryYahoo();
  setInterval(queryYahoo, 1000 * 60 * 15);

  setCurrentDateTime();
  setInterval(setCurrentDateTime, 1000);

  getNewPhoto();
  setInterval(getNewPhoto, 1000 * 60);

  darkSky();
  setInterval(darkSky, 1000 * 60 * 10);

  fetchYnabBalances();
});
