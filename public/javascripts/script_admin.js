var parking_areas = new Array();
var parking_area_cost = new Array();
var width = 460, height = 230;

// Parking areas visited
$.ajax({
    url: "visitedareas",
    dataType: "json",
    success: function (data, textStatus, jqXHR) {
        $.each(data, function (index, obj) {
            parking_areas.push({"x": obj.name, "y":obj.parking_areas});
        });
        var data_a = {
          "xScale": "ordinal",
          "yScale": "linear",
          "label": "Parking Areas Visited",
          "main": [
            {
              "className": ".chart",
              "data": parking_areas
            }
          ]
        };
        console.log(parking_areas);
        var myChart = new xChart('bar', data_a, '#chart-1')
    }
});

// Transactions per parking
$.ajax({
    url: "transpark",
    dataType: "json",
    success: function (data, textStatus, jqXHR) {
        $.each(data, function (index, obj) {
            parking_area_cost.push({"x": obj.name, "y": parseFloat(obj.total_per_area)});
        });

        var data_b = {
            "xScale": "ordinal",
            "yScale": "linear",
            "label": "Revenue per Parking",
            "main": [
                {
                  "className": ".chart2",
                  "data": parking_area_cost
                }
            ]
        };
        var myChart2 = new xChart('bar', data_b, '#chart-2');
        console.log(myChart2);
    } 
});


// Total in minutes spent in parking area
var total_daily_revenue = new Array();
$.ajax({
    url: "getdailyrevenue",
    dataType: "json",
    success: function (data, textStatus, jqXHR) {
        $.each(data, function (index, obj) {
            var dt = new Date(obj.dayp)
            var dt_d = dt.getDate();
            var dt_m = dt.getMonth() + 1;
            var dt_y = dt.getFullYear();
            date = dt_m + "/"+ dt_d +"/"+ dt_y;
            total_daily_revenue.push({"x":  date, "y":obj.dayc});
        });
        var data_c = {
          "xScale": "ordinal",
          "yScale": "linear",
          "main": [
            {
              "className": ".chart3",
              "data": total_daily_revenue
            }
          ]
        };
        var myChart3 = new xChart('bar', data_c, '#chart-3')
    }
});
