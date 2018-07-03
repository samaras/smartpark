var parking_areas = new Array();
var parking_area_cost = new Array();
var width = 460, height = 230;

// Parking areas visited
$.ajax({
    url: "gettranspark",
    dataType: "json",
    success: function (data, textStatus, jqXHR) {
        $.each(data, function (index, obj) {
            parking_areas.push({"x": obj.name, "y":obj.parking_areas});
        });
        var data_a = {
          "xScale": "ordinal",
          "yScale": "linear",
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


$.ajax({
    url: "getcostperarea",
    dataType: "json",
    success: function (data, textStatus, jqXHR) {
        $.each(data, function (index, obj) {
            parking_area_cost.push({"x": obj.name, "y": parseFloat(obj.total_per_area) });
        });

        console.log("Cost Per Area");
        console.log(parking_area_cost);
        
        var data_b = {
            "xScale": "ordinal",
            "yScale": "linear",
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


/*/ My Cost per Parking Area per min
$.ajax({
    url: "getcostperareainmin",
    dataType: "json",
    success: function (data, textStatus, jqXHR) {
        $.each(data, function (index, obj) {
            data_cost.push({"name": obj.name, "parked":obj.parking_areas});
        });
        costPerAreaInMin(data_cost);
    }
});
function costPerAreaInMin(data) {
    // body...
}
*/

// Total in minutes spent in parking area
var total_min_per_area = new Array();
$.ajax({
    url: "getminperparkingarea",
    dataType: "json",
    success: function (data, textStatus, jqXHR) {
        $.each(data, function (index, obj) {
            total_min_per_area.push({"x": obj.name, "y":obj.total_time});
        });
        var data_c = {
          "xScale": "ordinal",
          "yScale": "linear",
          "main": [
            {
              "className": ".chart3",
              "data": total_min_per_area
            }
          ]
        };
        var myChart3 = new xChart('bar', data_c, '#chart-3')
    }
});

// My Cost by days
var day_cost = new Array();
$.ajax({
    url: "getcostbyday",
    dataType: "json",
    success: function (data, textStatus, jqXHR) {
        $.each(data, function (index, obj) {
            var dt = new Date(obj.dayp)
            console.log(typeof(dt));
            var dt_d = dt.getDate();
            var dt_m = dt.getMonth() + 1;
            var dt_y = dt.getFullYear();
            date = dt_m + "/"+ dt_d +"/"+ dt_y;
            day_cost.push({"x":  date, "y":obj.dayc});
        });
        var data_d = {
          "xScale": "ordinal",
          "yScale": "linear",
          "main": [
            {
              "className": ".chart4",
              "data": day_cost
            }
          ]
        };
        var myChart4 = new xChart('line', data_d, '#chart-4')
    }
});
