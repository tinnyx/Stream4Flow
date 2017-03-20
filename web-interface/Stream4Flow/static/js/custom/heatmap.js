// Generate a chart and set it to the given div
function generateChart(data_type, data) {
    // Elements ID
    var chartId = 'chart-' + data_type;
    var chartIdStatus = chartId + '-status';

    // Hide status element
    $('#' + chartIdStatus).hide();
    // Show chart element
    $('#' + chartId).show();

    var chartOptions = {
        data: {
            xColumn: "fourthBlock",
            yColumn: "thirdBlock",
            value: "sumOfFlows"
        },
        settings: {
            parentElement: "#" + chartId,
            scaleType: SCALE_TYPES.log
        }
    };

    initHeatmap(data, chartOptions.data, chartOptions.settings);
};


// Obtain chart data and generate chart
function loadChart(data_type) {
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
                generateChart(data_type, response.data);
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
    loadChart("flows");
};

// Load all charts when page loaded
$(window).load(loadAllCharts());
