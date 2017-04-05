// Generate a chart and set it to the given div
function generateChart(data_type, data, chart_options) {
    // Elements ID
    var chartId = 'chart-' + data_type;
    var chartIdStatus = chartId + '-status';
    var cidr = cidr;

    // Hide status element
    $('#' + chartIdStatus).hide();
    // Show chart element
    $('#' + chartId).show();

    // A hack to only draw one graph per tab - IMPORTANT
    d3.select("#graphContainer-" + chart_options.settings.parentElement.substring(1)).remove();

    // Draw the graph
    initHeatmap(data, chart_options.data, chart_options.settings);

    // Fix the scrolling
    // Save the original values
    var mainScrollStep = $("html").getNiceScroll()[0].opt.mousescrollstep;
    var sideScrollStep = $(".scrollbar1").getNiceScroll()[0].opt.mousescrollstep;


    // Disable the scrollbar when the mouse enters the chart area
    $( chart_options.settings.parentElement ).mouseenter(function() {
        mainScrollStep = $("html").getNiceScroll()[0].opt.mousescrollstep;
        sideScrollStep = $(".scrollbar1").getNiceScroll()[0].opt.mousescrollstep;

        $("html").getNiceScroll()[0].opt.mousescrollstep = 0;
        $(".scrollbar1").getNiceScroll()[0].opt.mousescrollstep = 0;

        // $("html").getNiceScroll().hide();
        // $(".scrollbar1").getNiceScroll().hide();
    });

    // Enable the scrolling when the mouse leaves the chart area
    $( chart_options.settings.parentElement ).mouseleave(function() {
        $("html").getNiceScroll()[0].opt.mousescrollstep = mainScrollStep;
        $(".scrollbar1").getNiceScroll()[0].opt.mousescrollstep = sideScrollStep;

        // $("html").getNiceScroll().show();
        // $(".scrollbar1").getNiceScroll().show();
    });
};


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

    // Set data request
    var data_request = encodeURI( './get-statistics' + '?beginning=' + beginning + '&end=' + end + '&aggregation=' + $('#aggregation').val() + '&type=' + data_type);
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
                    cidr: response.cidr
                };

                // Merge the manually set options with parsed values
                var chartOptions = {
                    data: options_data,
                    settings: Object.assign(settings, options_settings)
                };

                generateChart(data_type, response.data, chartOptions);
            } else {
                // Show error message
                $(chartIdStatus).html(
                    '<i class="fa fa-exclamation-circle fa-2x"></i>\
                     <span>' + response.status + ': ' + response.data + '</span>'
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
$(window).load(loadAllCharts());
