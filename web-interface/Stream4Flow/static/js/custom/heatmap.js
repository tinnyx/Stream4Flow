window.D3Heatmaps = {};
window.D3HeatmapTimeouts = {};

// Generate a chart and set it to the given div
function generateChart(data_type, data, chart_options) {
    $("#chart-" + data_type).empty();

    // Elements ID
    var chartId = 'chart-' + data_type;
    var chartIdStatus = chartId + '-status';

    // Hide status element
    $('#' + chartIdStatus).hide();
    // Show chart element
    $('#' + chartId).show();

    // Draw the graph
    window.D3Heatmaps[data_type] = new D3heatmap(data, chart_options.data, chart_options.settings);

    // Fix the scrolling
    // Save the original values
    var niceScrolls = [$("html").getNiceScroll()[0].opt, $(".scrollbar1").getNiceScroll()[0].opt];
    var originalSteps = [];
    for (var i = 0; i < niceScrolls.length; i++) {
        originalSteps.push(niceScrolls[i].mousescrollstep);
    }

    // Disable the scrollbar when the mouse enters the chart area
    $( chart_options.settings.parentElement ).mouseenter(function() {
        for (var i = 0; i < niceScrolls.length; i++) {
            if (niceScrolls[i].mousescrollstep > 0) {
                originalSteps[i] = niceScrolls[i].mousescrollstep;
            }

            niceScrolls[i].mousescrollstep = 0;
        }
    });

    // Enable the scrolling when the mouse leaves the chart area
    $( chart_options.settings.parentElement ).mouseleave(function() {
        for (var i = 0; i < niceScrolls.length; i++) {
            niceScrolls[i].mousescrollstep = originalSteps[i];
        }
    });
};

/*
function renderSlider(data_type, range) {
    console.log(data_type);

    var slider;

    if(data_type === "flows") {
        slider = document.getElementById("flows" + '_slider');
        document.getElementById("doccount" + '_slider').style.display="none";
    } else {
        slider = document.getElementById("doccount" + '_slider');
    }
    noUiSlider.create(slider, {
        start: [range[0], range[1]],
        connect: true,
        range: {
            'min': range[0],
            'max': range[1]
        }
    });
    document.getElementsByClassName('noUi-horizontal')[0].style.width = '250px';
    document.getElementsByClassName('noUi-handle')[0].style.position = 'relative';
    document.getElementsByClassName('noUi-connect')[0].style.background = '#668586';
}
*/

// Obtain chart data and generate chart
function loadChart(data_type, options_data, options_settings) {
    // Elements ID
    var chartId = '#chart-' + data_type;
    var chartIdStatus = chartId + '-status';

    // Hide chart element
    $(chartId).hide();
    // Show status element
    $(chartIdStatus).show();

    // Set loading status
    $(chartIdStatus).html(
        '<i class="fa fa-refresh fa-spin fa-2x fa-fw"></i>\
         <span>Loading...</span>'
    )

    // Convert times to UTC in ISO format
    var beginning = new Date( $('#datetime-beginning').val()).toISOString();
    var end = new Date( $('#datetime-end').val()).toISOString();
    var cidr = $('#cidr').val();
    var sliderValues = $("#slider")[0].noUiSlider.get();

    // Set data request
    var data_request = encodeURI(
        './get-statistics'
        + '?beginning=' + beginning
        + '&sliderBegin=' + sliderValues[0]
        + '&sliderEnd=' + sliderValues[1]
        + '&end=' + end
        + '&cidr=' + cidr
        + '&aggregation=' + $('#aggregation').val()
        + '&type=' + data_type);
    // Get Elasticsearch data
    $.ajax({
        async: true,
        type: 'GET',
        url: data_request,
        success: function(raw) {
            var response = jQuery.parseJSON(raw);
            if (response.status == "Ok") {
                // Replace separator ';' to new line to create a CSV string and generate a chart

                var settings = {
                    parentElement: chartId,
                    cidr: response.cidr,
                    sliderValues: [response.sliderBegin, response.sliderEnd]
                };

                // Merge the manually set options with parsed values
                var chartOptions = {
                    data: options_data,
                    settings: Object.assign(settings, options_settings)
                };

                generateChart(data_type, response.data[0], chartOptions);

                var checkedAnimate = $("#anim").is(":checked");
                if(checkedAnimate) {
                    var speed = $("#spf").val() * 1000;

                    var iterateFunction = function iterate(index, max, timeOut, key) {
                        if(key in window.D3HeatmapTimeouts) {
                            window.clearTimeout(window.D3HeatmapTimeouts[key]);
                        }

                        window.D3HeatmapTimeouts[key] = setTimeout(function() {
                            var heatmap = window.D3Heatmaps[data_type];
                            heatmap.setData(response.data[index]);
                            if (index + 1 < max) {
                                iterate(index + 1, max, timeOut, key);
                            } else {
                                iterate(0, max, timeOut, key);
                            }
                        }, timeOut)
                    };

                    iterateFunction(1, response.data.length, speed, data_type);
                } else {
                    if(data_type in window.D3HeatmapTimeouts) {
                        window.clearTimeout(window.D3HeatmapTimeouts[data_type]);
                    }
                }
            } else {
                // Show error message
                $(chartIdStatus).html(
                    '<i class="fa fa-exclamation-circle fa-2x"></i>\
                     <span>' + response.status + ': ' + response.data[0] + '</span>'
                )
            }
        }
    });
};

// Load flows, packets, and bytes chart
function loadAllCharts() {
    // Pass mandatory values for the graph and any other optional settings
    loadChart("flows", {xColumn: "fourthBlock", yColumn: "thirdBlock", value: "sumOfFlows"}, {scaleType: SCALE_TYPES.log});
    loadChart("doccount", {xColumn: "fourthBlock", yColumn: "thirdBlock", value: "docCount"}, {scaleType: SCALE_TYPES.linear});
};

// Load all charts when page loaded
$(window).load(function() {
    var slider = document.getElementById('slider');

    noUiSlider.create(slider, {
        start: [0, 100],
        connect: true,
        tooltips: true,
        range: {
            'min': 0,
            'max': 100
        }
    });

    loadAllCharts();
});


