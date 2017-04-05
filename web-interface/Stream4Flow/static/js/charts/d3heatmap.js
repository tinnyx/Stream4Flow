const SCALE_TYPES = {
    linear: d3.scale.linear(),
    log: d3.scale.log()
};

const DEFAULT_VALUES = {
    marginTop: 70,
    marginRight: 20,
    marginBottom: 20,
    marginLeft: 70,
    showLegend: true,
    showGrid: true,
    legendSteps: 12,
    cellSize: 5,
    colorMinimum: "#0f0",
    colorMaximum: "#f00",
    parentElement: "#chart",
    scaleType: SCALE_TYPES.linear,
    tooltipText: {
        format: "",
        values: []
    },
    axisRange: { //only works if the axis labels are whole numbers, use with precaution
        x: [-Infinity, Infinity],
        y: [-Infinity, Infinity]
    },
    cellRange: { //only works if the axis labels are whole numbers, use with precaution
        x: [-Infinity, Infinity],
        y: [-Infinity, Infinity]
    },
    cidr: ""
};

const DEFAULT_STYLE = {
    TEXT: {
        "font-family": "Consolas, courier",
        "fill": "#aaa"
    },
    LEGEND: {
        border: {
            "stroke": "#000",
            "stroke-width": "1px"
        },
        text: {
            "font-size": "10pt",
            "fill": "#000"
        }
    },
    GRID: {
        "fill": "none",
        "shape-rendering": "crispEdges",
        "stroke": "#eee",
        "stroke-width": "1px"
    },
    AXIS: {
        text: {
            "font-size": "4pt",
            "fill": "#aaa"
        },
        textHover: {
            "fill": "#00C"
        },
        textHighlight: {
            "fill": "#c00"
        }
    },
    TOOLTIP: {
        "position": "absolute",
        "width": "150px",
        "height": "auto",
        "padding": "10px",
        "background-color": "rgba(255, 255, 255, 0.8)",
        "border": "2px solid rgba(204, 0, 0, 0.8)",
        "-webkit-border-radius": "10px",
        "-moz-border-radius": "10px",
        "border-radius": "10px",
        "-webkit-box-shadow": "4px 4px 10px rgba(0, 0, 0, 0.4)",
        "-moz-box-shadow": "4px 4px 10px rgba(0, 0, 0, 0.4)",
        "box-shadow": "4px 4px 10px rgba(0, 0, 0, 0.4)",
        "pointer-events": "none",
        "margin": "0",
        "font-family": "Consolas, courier",
        "font-size": "14px",
        "line-height": "20px",
        "display": "none"
    },
    HIGHLIGHT: {
        "fill": "none",
        "shape-rendering": "crispEdges",
        "stroke": "#c00",
        "stroke-width": "1px",
        "display": "none"
    }
};

var data;
var xColumn, yColumn, value;

var parentElement;

var margin;
var showLegend, showGrid;
var cellSize;
var legendSteps, legendElementSize, legendOffset, legendTextOffset;
var width, height;
var yAxisLabelStrings, xAxisLabelStrings, originalYAxisLabelStrings, originalXAxisLabelStrings, yAxisCount, xAxisCount;
var sortOrder;
var colors;
var scaleType;
var tooltipText;
var axisRange, cellRange;
var cidr;
var zoom;

var style;

var initHeatmap = function(json, fields, options, styles) {
    const defaultOptions = Object.assign({}, DEFAULT_VALUES);

    //TODO: check option corectness

    const parameters = Object.assign(defaultOptions, options);

    const defaultStyle = Object.assign({}, DEFAULT_STYLE);
    style = Object.assign(defaultStyle, styles);

    parentElement = addHash(parameters.parentElement);

    margin = {
        top: parameters.marginTop,
        right: parameters.marginRight,
        bottom: parameters.marginBottom,
        left: parameters.marginLeft
    };
    showLegend = parameters.showLegend;
    showGrid = parameters.showGrid;
    legendSteps = parameters.legendSteps;
    cellSize = parameters.cellSize;
    legendElementSize = {width: cellSize * 10, height: cellSize * 3};
    legendOffset = cellSize * 2.5;
    legendTextOffset = legendOffset * 2 + legendElementSize.height;
    sortOrder = {xAxis: -1, yAxis: -1};
    colors = {min: addHash(parameters.colorMinimum), max: addHash(parameters.colorMaximum)};
    scaleType = parameters.scaleType;
    tooltipText = {format: parameters.tooltipText.format, values: parameters.tooltipText.values};
    axisRange = {x: parameters.axisRange.x, y: parameters.axisRange.y};
    cellRange = {x: parameters.cellRange.x, y: parameters.cellRange.y};
    cidr = parameters.cidr;
    zoom = d3.behavior.zoom();

    margin.bottom += (showLegend ? (legendElementSize.height + legendOffset + cellSize) : 0);

    xColumn = fields.xColumn;
    yColumn = fields.yColumn;
    value = fields.value;

    //data = loadData(json);
    data = json;

    draw(data, parentElement);
}

var loadData = function(json) {
    return JSON.parse(json);
}

var redraw = function() {
    d3.select("#graphContainer-" + parentElement.substring(1)).remove();
    draw(data, parentElement);
}

var getOtherFields = function() {
    return arrayDifference(Object.getOwnPropertyNames(data[0]), [xColumn, yColumn, value]);
}

var setValueField = function(valueField) {
    value = valueField;
    redraw();
}

var toggleGrid = function() {
    showGrid = !showGrid;
    redraw();
}

var toggleLegend = function() {
    showLegend = !showLegend;
    redraw();
}

var setColorScheme = function(minColor, maxColor) {
    colors.min = minColor;
    colors.max = maxColor;
    redraw();
}

var draw = function(data, parentElement) {
    if(!(cidr.length === 0)) {
        var c = parseCIDR(cidr);
        var c0 = c[0].split(".");
        var c1 = c[1].split(".");

        cellRange.x = [c0[2], c1[2]];
        cellRange.y = [c0[3], c1[3]];
    }

    if(axisRange.y[0] === -Infinity && axisRange.y[1] === Infinity) {
        yAxisLabelStrings = d3.map(data, function (d) {
            return d[yColumn];
        }).keys();
    } else {
        yAxisLabelStrings = [];
        for (var i = axisRange.y[0]; i <= axisRange.y[1]; i++) {
            yAxisLabelStrings.push("" + i);
        }
    }

    if(axisRange.x[0] === -Infinity && axisRange.x[1] === Infinity) {
        xAxisLabelStrings = d3.map(data, function (d) {
            return d[xColumn];
        }).keys();
    } else {
        xAxisLabelStrings = [];
        for (var i = axisRange.x[0]; i <= axisRange.x[1]; i++) {
            xAxisLabelStrings.push("" + i);
        }
    }

    originalYAxisLabelStrings = yAxisLabelStrings;
    originalXAxisLabelStrings = xAxisLabelStrings;

    yAxisCount = yAxisLabelStrings.length;
    xAxisCount = xAxisLabelStrings.length;

    width = cellSize * xAxisCount;
    height = cellSize * yAxisCount;

    var tooltip = d3.select("body")
            .append("div")
            .attr("id", "tooltip")
            .style(style.TOOLTIP)
            .append("p")
            .append("span")
            .attr("id", "value")
        ;

    var colorScale = scaleType
            .domain(d3.extent(data.filter(function(x) {
                return isInRange(x);
            }), function (d) {
                return d[value];
            }))
            .interpolate(d3.interpolateHcl)
            .range([colors.min, colors.max])
        ;

    var svg = d3.select(parentElement)
            .append("svg")
            .attr("id", "graphContainer-" + parentElement.substring(1))
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
        ;

    var graph = svg
            .append("g")
            .attr("id", "graph")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        ;

    //clip paths
    var clippingPaths = graph.append("g")
            .attr("id", "clippingPaths")
        ;

    clippingPaths.append("clipPath")
        .attr("id", "yAxisClip")
        .append("rect")
        .attr("x", -margin.left)
        .attr("y", "0")
        .attr("width", margin.left)
        .attr("height", height)
    ;

    clippingPaths.append("clipPath")
        .attr("id", "xAxisClip")
        .append("rect")
        .attr("x", "0")
        .attr("y", -margin.top)
        .attr("width", width)
        .attr("height", margin.top)
    ;

    clippingPaths.append("clipPath")
        .attr("id", "graphRect")
        .append("rect")
        .attr("x", "0")
        .attr("y", "0")
        .attr("width", width + 1)
        .attr("height", height + 1)
    ;

    //y axis
    var yAxis = graph.append("g")
            .attr("clip-path", "url(#yAxisClip)")
            .append("g")
            .attr("id", "yAxisGroup")
            .attr("transform", "translate(-6, " + cellSize + ")")
        ;

    var yAxisLabels = yAxis.append("g")
        .attr("id", "yAxisLabels")
        .selectAll(".yAxisLabel")
        .data(yAxisLabelStrings)
        .enter()
        .append("text")
        .style(style.TEXT)
        .style(style.AXIS.text)
        .text(function (d) {
            return d;
        })
        .attr("x", 0)
        .attr("y", function (d, i) {
            return i * cellSize;
        })
        .style("text-anchor", "end")
        .attr("class", function (d, i) {
            return "yAxisLabel y" + i;
        })
        .on("mouseover", function (d) {
            d3.select(this).style(style.AXIS.textHover);
        })
        .on("mouseout", function (d) {
            d3.select(this).style(style.AXIS.text);
        })
        .on("click", function (d) {
            var index = originalYAxisLabelStrings.indexOf("" + d);
            sortByLabel(true, index, (sortOrder.yAxis != index));
            if (sortOrder.yAxis == index) {
                sortOrder.yAxis = -1;
            } else {
                sortOrder.yAxis = index;
                sortOrder.xAxis = -1;
            }
        });

    //x axis
    var xAxis = graph.append("g")
            .attr("clip-path", "url(#xAxisClip)")
            .append("g")
            .attr("id", "xAxisGroup")
            .attr("transform", "translate(" + cellSize + ", -6) rotate (-90)")
        ;

    var xAxisLabels = xAxis.append("g")
        .attr("id", "xAxisLabels")
        .selectAll(".xAxisLabel")
        .data(xAxisLabelStrings)
        .enter()
        .append("text")
        .style(style.TEXT)
        .style(style.AXIS.text)
        .text(function (d) {
            return d;
        })
        .attr("x", 0)
        .attr("y", function (d, i) {
            return i * cellSize;
        })
        .style("text-anchor", "left")
        .attr("class", function (d, i) {
            return "xAxisLabel x" + i;
        })
        .on("mouseover", function (d) {
            d3.select(this).style(style.AXIS.textHover);
        })
        .on("mouseout", function (d) {
            d3.select(this).style(style.AXIS.text);
        })
        .on("click", function (d) {
            var index = originalXAxisLabelStrings.indexOf("" + d);
            sortByLabel(false, index, (sortOrder.xAxis != index));
            if(sortOrder.xAxis == index) {
                sortOrder.xAxis = -1;
            } else {
                sortOrder.xAxis = index;
                sortOrder.yAxis = -1;
            }
        });

    //heatmap
    var heatmap = graph.append("g")
            .attr("clip-path", "url(#graphRect)")
            .append("g")
            .attr("id", "heatmap")
        ;

    heatmap.append("g")
        .attr("id", "cells")
        .selectAll(".cell")
        .data(data.filter(function(x) {
            return isInRange(x);
        }))
        .enter()
        .append("rect")
        .attr("x", function (d) {
            return xAxisLabelStrings.indexOf("" + d[xColumn]) * cellSize;
        })
        .attr("y", function (d) {
            return yAxisLabelStrings.indexOf("" + d[yColumn]) * cellSize;
        })
        .attr("class", function (d) {
            return "cell cellX" + xAxisLabelStrings.indexOf("" + d[xColumn]) + " cellY" + yAxisLabelStrings.indexOf("" + d[yColumn]);
        })
        .attr("width", cellSize)
        .attr("height", cellSize)
        .style("fill", function (d) {
            return colorScale(d[value]);
        })
        .on("mouseover", function (d) {
            //highlight text
            d3.select(".x" + originalXAxisLabelStrings.indexOf("" + d[xColumn])).style(style.AXIS.textHighlight);
            d3.select(".y" + originalYAxisLabelStrings.indexOf("" + d[yColumn])).style(style.AXIS.textHighlight);

            //highlight cell
            d3.select("#highlight")
                .attr("transform", "translate(" + (xAxisLabelStrings.indexOf("" + d[xColumn]) * cellSize) + ", " + (yAxisLabelStrings.indexOf("" + d[yColumn]) * cellSize) + ")")
                .style("display", "initial")
            ;

            //update the tooltip position and value
            d3.select("#tooltip")
                .style("left", (d3.event.pageX + 10) + "px")
                .style("top", (d3.event.pageY - 10) + "px")
                .select("#value")
                .text(generateTooltip(d));

            //show the tooltip
            d3.select("#tooltip").style("display", "initial");
        })
        .on("mouseout", function () {
            d3.selectAll(".yAxisLabel").style(style.AXIS.text);
            d3.selectAll(".xAxisLabel").style(style.AXIS.text);

            d3.select("#tooltip").style("display", "none");

            d3.select("#highlight").style("display", "none");
        })
    ;

    //grid
    if (showGrid) {
        var grid = heatmap.append("g")
                .attr("id", "grid")
                .style(style.GRID);
            ;

        grid.selectAll(".gridx")
            .data(xAxisLabelStrings)
            .enter()
            .append("line")
            .attr("x1", function (d, i) {
                return i * cellSize;
            })
            .attr("y1", "0")
            .attr("x2", function (d, i) {
                return i * cellSize;
            })
            .attr("y2", height)
            .attr("vector-effect", "non-scaling-stroke")
        ;

        grid.append("line")
            .attr("x1", width)
            .attr("y1", "0")
            .attr("x2", width)
            .attr("y2", height)
            .attr("vector-effect", "non-scaling-stroke")
        ;

        grid.selectAll(".gridy")
            .data(yAxisLabelStrings)
            .enter()
            .append("line")
            .attr("x1", "0")
            .attr("y1", function (d, i) {
                return i * cellSize;
            })
            .attr("x2", width)
            .attr("y2", function (d, i) {
                return i * cellSize;
            })
            .attr("vector-effect", "non-scaling-stroke")
        ;

        grid.append("line")
            .attr("x1", "0")
            .attr("y1", height)
            .attr("x2", width)
            .attr("y2", height)
            .attr("vector-effect", "non-scaling-stroke")
        ;
    }

    //cell highlight element
    var highlight = heatmap.append("g")
            .attr("id", "highlight")
            .style(style.HIGHLIGHT)
        ;

    highlight.append("line")
        .attr("x1", "0")
        .attr("y1", "0")
        .attr("x2", cellSize)
        .attr("y2", "0")
        .attr("vector-effect", "non-scaling-stroke")
    ;

    highlight.append("line")
        .attr("x1", cellSize)
        .attr("y1", "0")
        .attr("x2", cellSize)
        .attr("y2", cellSize)
        .attr("vector-effect", "non-scaling-stroke")
    ;

    highlight.append("line")
        .attr("x1", cellSize)
        .attr("y1", cellSize)
        .attr("x2", "0")
        .attr("y2", cellSize)
        .attr("vector-effect", "non-scaling-stroke")
    ;

    highlight.append("line")
        .attr("x1", "0")
        .attr("y1", cellSize)
        .attr("x2", "0")
        .attr("y2", "0")
        .attr("vector-effect", "non-scaling-stroke")
    ;

    //legend
    if (showLegend) {
        var legend = graph.append("g")
            .attr("id", "legend")
            .selectAll(".legend")
            .data(range(colorScale.domain()[0], colorScale.domain()[1], legendSteps))
            .enter().append("g")
        ;

        legend.append("rect")
            .attr("x", function (d, i) {
                return legendElementSize.width * i;
            })
            .attr("y", height + legendOffset)
            .attr("width", legendElementSize.width)
            .attr("height", legendElementSize.height)
            .style(style.LEGEND.border)
            .style("fill", colorScale)
        ;

        legend.append("text")
            .style(style.TEXT)
            .style(style.LEGEND.text)
            .text(function (d) {
                return d;
            })
            .attr("width", legendElementSize.width)
            .attr("x", function (d, i) {
                return legendElementSize.width * i;
            })
            .attr("y", height + legendTextOffset)
        ;
    }

    //attach zoom to the canvas
    zoom.scaleExtent([1, 7]).on("zoom", zoomed);
    svg.call(zoom);

    //zoom handler
    function zoomed() {
        var e = d3.event,
            tx = Math.min(0, Math.max(e.translate[0], width - width * e.scale)),
            ty = Math.min(0, Math.max(e.translate[1], height - height * e.scale));

        zoom.translate([tx, ty]);

        heatmap.attr("transform", "translate(" + [tx, ty] + ") scale(" + zoom.scale() + ")");
        yAxisLabels.attr("transform", "translate(0, " + ty + ") scale(" + zoom.scale() + ")");
        xAxisLabels.attr("transform", "translate(0, " + tx + ") scale(" + zoom.scale() + ")");
        yAxis.attr("transform", "translate(-6, " + cellSize * zoom.scale() + ")");
        xAxis.attr("transform", "translate(" + cellSize * zoom.scale() + ", -6) rotate (-90)");

        // d3.select(".grid").style("stroke-width", 1/zoom.scale() + "px");
        // d3.select(".highlight").style("stroke-width", 1/zoom.scale() + "px");
    }

    //sort
    function sortByLabel(isYAxis, index, sortOrder) {
        var t = svg.transition().duration(0);
        var byValue = [];
        for(var i = 0; i < (isYAxis ? xAxisCount : yAxisCount); i++) {
            byValue.push((sortOrder ? -Infinity : Infinity));
        }
        var sorted;
        d3.selectAll(".cell" + (isYAxis ? "Y" : "X") + index)
            .filter(isYAxis
                ? function (ce) {
                    byValue[xAxisLabelStrings.indexOf("" + ce[xColumn])] = ce[value];
                }
                : function (ce) {
                    byValue[yAxisLabelStrings.indexOf("" + ce[yColumn])] = ce[value];
                }
            )
        ;
        if(isYAxis) {
            sorted = d3.range(xAxisCount).sort(function (a, b) {
                if(sortOrder) {
                    return byValue[b] - byValue[a];
                } else {
                    return byValue[a] - byValue[b];
                }
            });
            t.selectAll(".cell")
                .attr("x", function (d) {
                    return sorted.indexOf(xAxisLabelStrings.indexOf("" + d[xColumn])) * cellSize;
                })
            ;
            t.selectAll(".xAxisLabel")
                .attr("y", function (d) {
                    return sorted.indexOf(xAxisLabelStrings.indexOf(d)) * cellSize;
                })
            ;
            var newXAxisLabelStrings = [];
            for(var i = 0; i < sorted.length; i++) {
                newXAxisLabelStrings.push(xAxisLabelStrings[sorted[i]]);
            }
            xAxisLabelStrings = newXAxisLabelStrings;
        } else {
            sorted = d3.range(yAxisCount).sort(function (a, b) {
                if(sortOrder) {
                    return byValue[b] - byValue[a];
                } else {
                    return byValue[a] - byValue[b];
                }
            });
            t.selectAll(".cell")
                .attr("y", function (d) {
                    return sorted.indexOf(yAxisLabelStrings.indexOf("" + d[yColumn])) * cellSize;
                })
            ;
            t.selectAll(".yAxisLabel")
                .attr("y", function (d) {
                    return sorted.indexOf(yAxisLabelStrings.indexOf(d)) * cellSize;
                })
            ;
            var newYAxisLabelStrings = [];
            for(var i = 0; i < sorted.length; i++) {
                newYAxisLabelStrings.push(yAxisLabelStrings[sorted[i]]);
            }
            yAxisLabelStrings = newYAxisLabelStrings;
        }
    }
}

var arrayDifference = function(a1, a2) {
    return a1.filter(function(x) { return a2.indexOf(x) < 0 });
}

//helper function for the legend
var range = function(start, end, steps) {
    var a = [];
    a.push(start);

    if(scaleType === SCALE_TYPES.linear) {
        var s = Math.trunc((end - start) / steps);

        for(var i = 2; i < steps; i++) {
            a.push(start + (i - 1) * s);
        }
    }

    if(scaleType === SCALE_TYPES.log) {
        var startLog = Math.log(start);
        var endLog = Math.log(end);

        s = (endLog - startLog) / (steps - 1);

        for(var i = 2; i < steps; i++) {
            a.push(Math.trunc(Math.pow(Math.E, (i - 1) * s)));
        }
    }

    a.push(end);
    return a;
}

var generateTooltip = function(d) {
    var s = "";

    if(tooltipText.values.length <= 0) {
        var headers = arrayDifference(Object.getOwnPropertyNames(data[0]), [xColumn, yColumn, value]);
        s += format("x: {0}, y: {1}\n{2}: {3}", d[xColumn], d[yColumn], value, d[value]);

        for(var i = 0; i < headers.length; i++) {
            s += format("\n{0}: {1}", headers[i], d[headers[i]]);
        }
    } else {
        var v = tooltipText.values.map(function(x) {return d[x]});
        v.unshift(tooltipText.format);
        s += format.apply(null, v);
    }

    return s;
}

var addHash = function(d) {
    return (d.lastIndexOf("#", 0) === 0) ? d : ("#" + d);
}

Number.prototype.between = function(a, b, inclusive) {
    var min = Math.min(a, b),
        max = Math.max(a, b);

    return inclusive ? this >= min && this <= max : this > min && this < max;
}

var isInRange = function(x) {
    return  (+x[xColumn]).between(axisRange.x[0], axisRange.x[1], true) &&
            (+x[xColumn]).between(cellRange.x[0], cellRange.x[1], true) &&
            (+x[yColumn]).between(axisRange.y[0], axisRange.y[1], true) &&
            (+x[yColumn]).between(cellRange.y[0], cellRange.y[1], true);
}